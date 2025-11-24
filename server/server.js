require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { connectWithRetry } = require("./connectToServer");
const mongoose = require("mongoose");

const incomeRoutes = require("./routes/income.routes");
const clientRoutes = require("./routes/client.routes");
const receiptRoutes = require("./routes/receipt.routes");
const chatRoutes = require("./routes/chat.routes"); // <-- חדש

const OpenAI = require("openai");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }); 
const PORT = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: "8mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

// בריאות מערכת
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    environment: process.env.NODE_ENV,
    emailConfigured: !!process.env.EMAIL_USER,
    timestamp: new Date(),
  });
});

// מסלולי API קיימים
app.use("/api/incomes", incomeRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/receipts", receiptRoutes);
app.use("/api/chat", chatRoutes); // <-- נתיב חדש לצ'אט + היסטוריה

// טיפול בשגיאות גלובליות
app.use((err, req, res, next) => {
  console.error("🚨 Unhandled error:", err?.message || err);
  res.status(500).json({
    error: "Server error",
    details: process.env.NODE_ENV === "development" ? err?.message || err : undefined,
  });
});

connectWithRetry()
  .then(async () => {
    if (!mongoose.connection.readyState) {
      const uri = process.env.MONGODB_URI;
      if (uri) {
        await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("MongoDB connected");
      } else {
        console.warn("MONGODB_URI not set; skipping mongoose connect here (connectWithRetry may handle it).");
      }
    }

    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`📧 Email service configured for: ${process.env.EMAIL_USER || "לא הוגדר"}`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  });
