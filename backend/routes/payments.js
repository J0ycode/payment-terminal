/* =====================================================================
   ROUTES/PAYMENTS.JS — REST API for payment operations
   -------------------------------------------------------------------
   POST   /api/payments          — add a payment to the queue
   GET    /api/payments/queue    — get all PENDING payments
   POST   /api/payments/process  — process all queued payments
   GET    /api/payments/history  — get processed payments (newest first)
   GET    /api/payments/totals   — aggregated totals for SUCCESS payments
   ===================================================================== */

const express = require("express");
const router  = express.Router();

const {
  Payment,
  CreditCardPayment,
  PayPalPayment,
  BankTransferPayment,
  nextPaymentId,
} = require("../models/Payment");


/* -----------------------------------------------------------------
   POST /api/payments — Add a new payment to the queue
   ----------------------------------------------------------------- */
router.post("/", async (req, res) => {
  try {
    const { paymentType, amount, currency, ...details } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Payment amount must be positive." });
    }

    const paymentId = await nextPaymentId();
    let payment;

    switch (paymentType) {
      case "CreditCard":
        if (!details.cardNumber || !details.cardHolderName || !details.expiry || !details.cvv) {
          return res.status(400).json({ error: "Missing credit card details." });
        }
        payment = new CreditCardPayment({
          paymentId, amount, currency,
          cardNumber:     details.cardNumber,
          cardHolderName: details.cardHolderName,
          expiry:         details.expiry,
          cvv:            details.cvv,
        });
        break;

      case "PayPal":
        if (!details.email || !details.password) {
          return res.status(400).json({ error: "Missing PayPal credentials." });
        }
        payment = new PayPalPayment({
          paymentId, amount, currency,
          email:    details.email,
          password: details.password,
        });
        break;

      case "BankTransfer":
        if (!details.bankName || !details.accountNumber || !details.routingCode) {
          return res.status(400).json({ error: "Missing bank transfer details." });
        }
        payment = new BankTransferPayment({
          paymentId, amount, currency,
          bankName:      details.bankName,
          accountNumber: details.accountNumber,
          routingCode:   details.routingCode,
        });
        break;

      default:
        return res.status(400).json({ error: `Unknown payment type: ${paymentType}` });
    }

    await payment.save();
    res.status(201).json({ payment });
  } catch (err) {
    console.error("Error adding payment:", err);
    res.status(500).json({ error: err.message });
  }
});


/* -----------------------------------------------------------------
   GET /api/payments/queue — Fetch all PENDING payments
   ----------------------------------------------------------------- */
router.get("/queue", async (req, res) => {
  try {
    const queue = await Payment.find({ status: "PENDING" }).sort({ createdAt: 1 });
    res.json({ queue });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/* -----------------------------------------------------------------
   POST /api/payments/process — Process all queued payments
   -------------------------------------------------------------------
   This is where the polymorphism-equivalent logic runs on the server.
   Each payment type has its own validation and processing rules,
   exactly mirroring the original JS class overrides.
   ----------------------------------------------------------------- */
router.post("/process", async (req, res) => {
  try {
    const pending = await Payment.find({ status: "PENDING" }).sort({ createdAt: 1 });

    if (pending.length === 0) {
      return res.json({ results: [] });
    }

    const results = [];

    for (const payment of pending) {
      const lines = [];
      const log = (text, kind) => lines.push({ text, kind: kind || "info" });

      let success = false;

      // ---- Polymorphic processing: different logic per payment type ----
      switch (payment.paymentType) {
        case "CreditCard":
          success = processCreditCard(payment, log);
          break;
        case "PayPal":
          success = processPayPal(payment, log);
          break;
        case "BankTransfer":
          success = processBankTransfer(payment, log);
          break;
        default:
          log("Unknown payment type", "fail");
          payment.status = "FAILED";
      }

      // Save log lines and status to the DB
      payment.logLines = lines;
      await payment.save();

      results.push({ payment, lines, success });
    }

    res.json({ results });
  } catch (err) {
    console.error("Error processing payments:", err);
    res.status(500).json({ error: err.message });
  }
});


/* -----------------------------------------------------------------
   Processing functions — mirror the original class overrides
   ----------------------------------------------------------------- */

function processCreditCard(payment, log) {
  log(`Cardholder  ${payment.cardHolderName}`);
  const digits = payment.cardNumber.replace(/\s/g, "");
  log(`Card number •••• •••• •••• ${digits.slice(-4)}`);

  const validCard = digits.length >= 12 && /^\d{3}$/.test(payment.cvv);
  if (!validCard) {
    payment.status = "FAILED";
    log("Declined — invalid card details.", "fail");
    return false;
  }

  log("Contacting card network for authorization…");
  const authorized = payment.amount <= 500000;
  if (authorized) {
    payment.status = "SUCCESS";
    log(`Authorized — ${payment.amount.toFixed(2)} ${payment.currency} charged.`, "ok");
    return true;
  }
  payment.status = "FAILED";
  log("Declined by issuer.", "fail");
  return false;
}

function processPayPal(payment, log) {
  log(`PayPal account  ${payment.email}`);

  const validAccount = payment.email.includes("@") && payment.password.length >= 4;
  if (!validAccount) {
    payment.status = "FAILED";
    log("Declined — invalid PayPal credentials.", "fail");
    return false;
  }

  log("Redirecting to PayPal for authentication…");
  const confirmed = payment.amount <= 250000;
  if (confirmed) {
    payment.status = "SUCCESS";
    log(`Confirmed — ${payment.amount.toFixed(2)} ${payment.currency} sent via PayPal.`, "ok");
    return true;
  }
  payment.status = "FAILED";
  log("Declined — insufficient PayPal balance.", "fail");
  return false;
}

function processBankTransfer(payment, log) {
  log(`Bank        ${payment.bankName}`);
  log(`Account     XXXX${payment.accountNumber.slice(-4)}`);
  log(`Routing     ${payment.routingCode}`);

  const validDetails = payment.accountNumber.length >= 6 && payment.routingCode.length > 0;
  if (!validDetails) {
    payment.status = "FAILED";
    log("Declined — invalid bank details.", "fail");
    return false;
  }

  log("Initiating interbank settlement…");
  const settled = payment.amount <= 1000000;
  if (settled) {
    payment.status = "SUCCESS";
    log(`Settled — ${payment.amount.toFixed(2)} ${payment.currency} transferred.`, "ok");
    return true;
  }
  payment.status = "FAILED";
  log("Rejected by receiving bank.", "fail");
  return false;
}


/* -----------------------------------------------------------------
   GET /api/payments/history — Processed payments (newest first)
   ----------------------------------------------------------------- */
router.get("/history", async (req, res) => {
  try {
    const history = await Payment.find({ status: { $ne: "PENDING" } })
      .sort({ updatedAt: -1 })
      .limit(50);
    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/* -----------------------------------------------------------------
   GET /api/payments/totals — Aggregated success totals
   ----------------------------------------------------------------- */
router.get("/totals", async (req, res) => {
  try {
    const result = await Payment.aggregate([
      { $match: { status: "SUCCESS" } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          count:       { $sum: 1 },
        },
      },
    ]);
    const totals = result[0] || { totalAmount: 0, count: 0 };
    res.json({ totalAmount: totals.totalAmount, count: totals.count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
