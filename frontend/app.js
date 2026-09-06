/* =====================================================================
   APP.JS — Client-side logic for the Payment Terminal
   -------------------------------------------------------------------
   This file handles:
   - Tab switching between payment types
   - Form data collection and sample autofill
   - REST API calls to the Express backend (fetch)
   - Queue rendering and receipt ticket building
   ===================================================================== */

const API = "";  // Same origin — Express serves both API and static files

// ---- DOM references ----
const tabs       = document.querySelectorAll(".tab");
const panels     = document.querySelectorAll(".form-panel");
const queueList  = document.getElementById("queue-list");
const queueEmpty = document.getElementById("queue-empty");
const processBtn = document.getElementById("process-btn");
const receiptFeed  = document.getElementById("receipt-feed");
const receiptEmpty = document.getElementById("receipt-empty");
const totalValue   = document.getElementById("total-value");
const historyCount = document.getElementById("history-count");
const errorBanner  = document.getElementById("error-banner");
const successBanner = document.getElementById("success-banner");
const dbDot    = document.getElementById("db-dot");
const dbStatus = document.getElementById("db-status");

// ---- Tab switching ----
tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    panels.forEach((p) => p.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById("panel-" + tab.dataset.type).classList.add("active");
  });
});

// ---- Banner helpers ----
function showError(message) {
  errorBanner.textContent = message;
  errorBanner.classList.add("visible");
  clearTimeout(showError._t);
  showError._t = setTimeout(() => errorBanner.classList.remove("visible"), 3200);
}

function showSuccess(message) {
  successBanner.textContent = message;
  successBanner.classList.add("visible");
  clearTimeout(showSuccess._t);
  showSuccess._t = setTimeout(() => successBanner.classList.remove("visible"), 2500);
}

// ---- Sample data autofill ----
const samples = {
  card:   { cardNumber: "4111 1111 1111 1234", cardHolderName: "Alex Rivera", expiry: "12/29", cvv: "123" },
  paypal: { email: "alex@example.com", password: "hunter22" },
  bank:   { bankName: "Northfield Union Bank", accountNumber: "123456789012", routingCode: "NFUB0004521" },
};

function fillSample(type) {
  const s = samples[type];
  Object.entries(s).forEach(([key, val]) => {
    const el = document.getElementById(type + "-" + key);
    if (el) el.value = val;
  });
}
document.querySelectorAll("[data-sample]").forEach((btn) => {
  btn.addEventListener("click", () => fillSample(btn.dataset.sample));
});


/* =====================================================================
   API HELPERS
   ===================================================================== */

async function apiPost(path, body) {
  const res = await fetch(API + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

async function apiGet(path) {
  const res = await fetch(API + path);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}


/* =====================================================================
   QUEUE RENDERING
   ===================================================================== */

function renderQueue(queue) {
  queueList.innerHTML = "";
  if (!queue || queue.length === 0) {
    queueEmpty.style.display = "block";
    processBtn.disabled = true;
  } else {
    queueEmpty.style.display = "none";
    processBtn.disabled = false;
    queue.forEach((p) => {
      const row = document.createElement("li");
      row.className = "queue-row type-" + p.paymentType.toLowerCase().replace(/\s/g, "-");
      row.innerHTML = `
        <span class="queue-type">${p.paymentType}</span>
        <span class="queue-id">${p.paymentId}</span>
        <span class="queue-amount">${p.amount.toFixed(2)} ${p.currency}</span>
      `;
      queueList.appendChild(row);
    });
  }
  processBtn.textContent = `Process all (${queue ? queue.length : 0})`;
}


/* =====================================================================
   RECEIPT / TICKET RENDERING
   ===================================================================== */

function buildTicket(payment, lines, success) {
  const ticket = document.createElement("div");
  ticket.className = "ticket " + (success ? "ticket-ok" : "ticket-fail");

  const logLines = lines
    .map((l) => `<div class="log-line log-${l.kind}">${l.text}</div>`)
    .join("");

  const time = new Date(payment.timestamp).toLocaleTimeString();

  ticket.innerHTML = `
    <div class="ticket-head">
      <span class="ticket-type">${payment.paymentType}</span>
      <span class="ticket-id">${payment.paymentId}</span>
    </div>
    <div class="ticket-time">${time}</div>
    <div class="ticket-log">${logLines}</div>
    <div class="ticket-stamp">${success ? "SUCCESS" : "DECLINED"}</div>
  `;
  return ticket;
}

function updateTotals(totals) {
  totalValue.textContent = totals.totalAmount.toFixed(2);
  historyCount.textContent = totals.count;
}


/* =====================================================================
   LOAD STATE FROM SERVER
   ===================================================================== */

async function loadQueue() {
  try {
    const data = await apiGet("/api/payments/queue");
    renderQueue(data.queue);
  } catch (e) {
    console.error("Failed to load queue:", e);
  }
}

async function loadHistory() {
  try {
    const data = await apiGet("/api/payments/history");
    receiptFeed.innerHTML = "";
    if (data.history.length === 0) {
      receiptEmpty.style.display = "block";
    } else {
      receiptEmpty.style.display = "none";
      data.history.forEach((entry) => {
        const ticket = buildTicket(entry, entry.logLines || [], entry.status === "SUCCESS");
        receiptFeed.appendChild(ticket);
      });
    }
  } catch (e) {
    console.error("Failed to load history:", e);
  }
}

async function loadTotals() {
  try {
    const data = await apiGet("/api/payments/totals");
    updateTotals(data);
  } catch (e) {
    console.error("Failed to load totals:", e);
  }
}

async function refreshAll() {
  await Promise.all([loadQueue(), loadHistory(), loadTotals()]);
}


/* =====================================================================
   CHECK DB CONNECTION
   ===================================================================== */

async function checkHealth() {
  try {
    const data = await apiGet("/api/health");
    if (data.db === "connected") {
      dbDot.className = "status-dot connected";
      dbStatus.textContent = "MongoDB connected";
    } else {
      dbDot.className = "status-dot disconnected";
      dbStatus.textContent = "MongoDB disconnected";
    }
  } catch {
    dbDot.className = "status-dot disconnected";
    dbStatus.textContent = "Server unreachable";
  }
}


/* =====================================================================
   ADD TO QUEUE HANDLERS
   ===================================================================== */

document.getElementById("add-card").addEventListener("click", async () => {
  try {
    const body = {
      paymentType: "CreditCard",
      amount: parseFloat(document.getElementById("card-amount").value),
      currency: document.getElementById("card-currency").value,
      cardNumber: document.getElementById("card-cardNumber").value,
      cardHolderName: document.getElementById("card-cardHolderName").value,
      expiry: document.getElementById("card-expiry").value,
      cvv: document.getElementById("card-cvv").value,
    };
    await apiPost("/api/payments", body);
    showSuccess("Credit card payment queued");
    await loadQueue();
  } catch (e) {
    showError(e.message);
  }
});

document.getElementById("add-paypal").addEventListener("click", async () => {
  try {
    const body = {
      paymentType: "PayPal",
      amount: parseFloat(document.getElementById("paypal-amount").value),
      currency: document.getElementById("paypal-currency").value,
      email: document.getElementById("paypal-email").value,
      password: document.getElementById("paypal-password").value,
    };
    await apiPost("/api/payments", body);
    showSuccess("PayPal payment queued");
    await loadQueue();
  } catch (e) {
    showError(e.message);
  }
});

document.getElementById("add-bank").addEventListener("click", async () => {
  try {
    const body = {
      paymentType: "BankTransfer",
      amount: parseFloat(document.getElementById("bank-amount").value),
      currency: document.getElementById("bank-currency").value,
      bankName: document.getElementById("bank-bankName").value,
      accountNumber: document.getElementById("bank-accountNumber").value,
      routingCode: document.getElementById("bank-routingCode").value,
    };
    await apiPost("/api/payments", body);
    showSuccess("Bank transfer payment queued");
    await loadQueue();
  } catch (e) {
    showError(e.message);
  }
});


/* =====================================================================
   PROCESS ALL
   ===================================================================== */

processBtn.onclick = async () => {
  if (processBtn.disabled) return;
  processBtn.disabled = true;
  processBtn.textContent = "Processing…";

  try {
    const data = await apiPost("/api/payments/process", {});
    receiptEmpty.style.display = "none";

    // Stagger the ticket reveals like a receipt printing
    data.results.forEach((entry, i) => {
      setTimeout(() => {
        const ticket = buildTicket(entry.payment, entry.lines, entry.success);
        receiptFeed.prepend(ticket);
        loadTotals();
        if (i === data.results.length - 1) {
          loadQueue();
        }
      }, i * 260);
    });

    if (data.results.length === 0) {
      showError("Queue was empty — nothing to process.");
      loadQueue();
    }
  } catch (e) {
    showError(e.message);
    loadQueue();
  }
};


/* =====================================================================
   STARTUP
   ===================================================================== */

checkHealth();
refreshAll();
