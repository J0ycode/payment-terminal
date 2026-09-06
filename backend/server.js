/* =====================================================================
   SERVER.JS — Express server for the Payment Terminal
   -------------------------------------------------------------------
   - Connects to MongoDB via Mongoose
   - Serves the frontend as static files
   - Mounts the /api/payments router
   - Provides a /api/health endpoint for connection checking
   ===================================================================== */

require("dotenv").config();
const express  = require("express");
const mongoose = require("mongoose");
const cors     = require("cors");
const path     = require("path");

const paymentsRouter = require("./routes/payments");

const app  = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/payment_terminal";

// ---- Middleware ----
app.use(cors());
app.use(express.json());

// ---- Serve frontend static files ----
app.use(express.static(path.join(__dirname, "..", "frontend")));

// ---- API routes ----
app.use("/api/payments", paymentsRouter);

// ---- Health check ----
app.get("/api/health", (req, res) => {
  const state = mongoose.connection.readyState;
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const status = state === 1 ? "connected" : "disconnected";
  res.json({ db: status, uptime: process.uptime() });
});

// ---- Fallback: serve index.html for any non-API route ----
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "index.html"));
});

// ---- Connect to MongoDB ----
const mongooseOptions = {
  serverSelectionTimeoutMS: 5000, // Fail quickly if DB is unreachable
};

// Check if running on Vercel without a proper MongoDB URI
if (process.env.VERCEL && MONGO_URI.includes("localhost")) {
  console.error("CRITICAL ERROR: Running on Vercel but MONGO_URI is pointing to localhost!");
  console.error("Please add MONGO_URI to your Vercel Project Environment Variables.");
}

mongoose
  .connect(MONGO_URI, mongooseOptions)
  .then(() => console.log("✓ Connected to MongoDB"))
  .catch((err) => {
    console.error("✗ MongoDB connection failed:", err.message);
    if (!process.env.VERCEL) process.exit(1);
  });

// ---- Start listening (Local only) ----
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`✓ Server running at http://localhost:${PORT}`);
  });
}

// Export the Express API for Vercel
module.exports = app;
