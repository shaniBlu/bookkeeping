require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { connectWithRetry } = require("./connectToServer");

const incomeRoutes = require("./routes/income.routes");
const clientRoutes = require("./routes/client.routes");
const receiptRoutes = require("./routes/receipt.routes");

const PORT = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: "5mb" }));
app.use(bodyParser.urlencoded({ limit: "5mb", extended: true }));

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    environment: process.env.NODE_ENV,
    emailConfigured: !!process.env.EMAIL_USER,
    timestamp: new Date(),
  });
});

app.use("/api/incomes", incomeRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/receipts", receiptRoutes);

app.use((err, req, res, next) => {
  console.error("🚨 Unhandled error:", err.message);
  res.status(500).json({
    error: "Server error",
    details: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

connectWithRetry()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`📧 Email service configured for: ${process.env.EMAIL_USER || "לא הוגדר"}`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  });
