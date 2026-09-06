/* =====================================================================
   MODELS/PAYMENT.JS — Mongoose schemas with discriminators
   -------------------------------------------------------------------
   Uses Mongoose's discriminator pattern to mirror the class hierarchy:
   - Payment (base schema) → shared fields
   - CreditCardPayment    → card-specific fields
   - PayPalPayment         → PayPal-specific fields
   - BankTransferPayment   → bank-specific fields
   
   Discriminators let all payment types live in a single MongoDB
   collection ("payments") while each sub-type has its own extra fields
   — the database equivalent of polymorphism.
   ===================================================================== */

const mongoose = require("mongoose");

// ---- Auto-incrementing payment ID counter ----
const counterSchema = new mongoose.Schema({
  _id:  String,
  seq:  { type: Number, default: 1000 },
});
const Counter = mongoose.model("Counter", counterSchema);

async function nextPaymentId() {
  const counter = await Counter.findByIdAndUpdate(
    "paymentId",
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return "TXN" + counter.seq;
}

// ---- Base Payment schema ----
const paymentSchema = new mongoose.Schema(
  {
    paymentId:   { type: String, unique: true },
    amount:      { type: Number, required: true, min: 0.01 },
    currency:    { type: String, required: true, enum: ["USD", "EUR", "INR"], default: "USD" },
    status:      { type: String, enum: ["PENDING", "SUCCESS", "FAILED"], default: "PENDING" },
    paymentType: { type: String, required: true },
    logLines:    [
      {
        text: String,
        kind: { type: String, default: "info" },
      },
    ],
  },
  {
    timestamps: true,                    // adds createdAt, updatedAt
    discriminatorKey: "paymentType",     // field that distinguishes sub-types
  }
);

const Payment = mongoose.model("Payment", paymentSchema);

// ---- CreditCard discriminator ----
const creditCardSchema = new mongoose.Schema({
  cardNumber:     { type: String, required: true },
  cardHolderName: { type: String, required: true },
  expiry:         { type: String, required: true },
  cvv:            { type: String, required: true },
});
const CreditCardPayment = Payment.discriminator("CreditCard", creditCardSchema);

// ---- PayPal discriminator ----
const paypalSchema = new mongoose.Schema({
  email:    { type: String, required: true },
  password: { type: String, required: true },
});
const PayPalPayment = Payment.discriminator("PayPal", paypalSchema);

// ---- BankTransfer discriminator ----
const bankTransferSchema = new mongoose.Schema({
  bankName:      { type: String, required: true },
  accountNumber: { type: String, required: true },
  routingCode:   { type: String, required: true },
});
const BankTransferPayment = Payment.discriminator("BankTransfer", bankTransferSchema);

module.exports = {
  Payment,
  CreditCardPayment,
  PayPalPayment,
  BankTransferPayment,
  nextPaymentId,
};
