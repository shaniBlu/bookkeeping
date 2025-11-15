const express = require("express");
const router = express.Router();
const Income = require("../models/income.model");
const Client = require("../models/client.model");
const { generateReceiptPDFtoFile, sendReceiptEmail } = require("../services/receipt.service");
const fs = require("fs");
const path = require("path");

// יצירת קובץ PDF להצגה
router.get("/generate/:incomeId", async (req, res) => {
  try {
    const income = await Income.findById(req.params.incomeId).populate("clientId");
    if (!income) return res.status(404).json({ error: "הכנסה לא נמצאה" });

    const client = income.clientId;
    if (!client) return res.status(404).json({ error: "לקוח לא נמצא" });

    const pdfPath = await generateReceiptPDFtoFile(income, client);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${path.basename(pdfPath)}"`);
    const stream = fs.createReadStream(pdfPath);
    stream.pipe(res);

    stream.on("end", () => {
      setTimeout(() => {
        try { fs.unlinkSync(pdfPath); } catch {}
      }, 2000);
    });
  } catch (err) {
    console.error("Error generating receipt:", err);
    res.status(500).json({ error: "שגיאה בהפקת קבלה" });
  }
});

// שליחת קבלה למייל
router.post("/send/:incomeId", async (req, res) => {
  try {
    const income = await Income.findById(req.params.incomeId).populate("clientId");
    if (!income) return res.status(404).json({ error: "הכנסה לא נמצאה" });

    const client = income.clientId;
    if (!client || !client.email) return res.status(400).json({ error: "אין מייל ללקוח" });

    const pdfPath = await generateReceiptPDFtoFile(income, client);
    const result = await sendReceiptEmail(income, client, pdfPath);

    if (result.success) res.json({ success: true, message: "קבלה נשלחה" });
    else res.status(500).json({ success: false, error: result.error });
  } catch (err) {
    console.error("Error sending receipt:", err);
    res.status(500).json({ error: "שגיאה בשליחת קבלה" });
  }
});

module.exports = router;
