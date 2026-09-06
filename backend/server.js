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

// ---- Connect to MongoDB, then start listening ----
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✓ Connected to MongoDB at", MONGO_URI);
    app.listen(PORT, () => {
      console.log(`✓ Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("✗ MongoDB connection failed:", err.message);
    console.error("  Make sure MongoDB is running on localhost:27017");
    console.error("  Or set MONGO_URI environment variable to your connection string.");
    process.exit(1);
  });
