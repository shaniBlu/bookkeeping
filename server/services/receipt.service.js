const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");
require("dotenv").config();

const receiptsDir = path.join(__dirname, "../receipts");
if (!fs.existsSync(receiptsDir)) fs.mkdirSync(receiptsDir, { recursive: true });

async function createTransporter() {
  const transporterOptions = {};
  if (process.env.EMAIL_SERVICE || process.env.EMAIL_HOST) {
    if (process.env.EMAIL_HOST) {
      transporterOptions.host = process.env.EMAIL_HOST;
      transporterOptions.port = Number(process.env.EMAIL_PORT || 587);
      transporterOptions.secure = (process.env.EMAIL_SECURE === "true");
      transporterOptions.auth = { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS };
      transporterOptions.tls = { rejectUnauthorized: false };
    } else {
      transporterOptions.service = process.env.EMAIL_SERVICE;
      transporterOptions.auth = { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS };
      transporterOptions.tls = { rejectUnauthorized: false };
    }
  } else {
    const testAccount = await nodemailer.createTestAccount();
    transporterOptions.host = "smtp.ethereal.email";
    transporterOptions.port = 587;
    transporterOptions.secure = false;
    transporterOptions.auth = { user: testAccount.user, pass: testAccount.pass };
  }
  return nodemailer.createTransport(transporterOptions);
}

async function verifyTransporter(transporter) {
  try {
    await transporter.verify();
    console.log("✅ Mail transporter verified and ready");
  } catch (err) {
    console.error("⚠️ Mail transporter verification failed:", err && err.message ? err.message : err);
  }
}

async function generateReceiptPDFtoFile(income, client) {
  const filename = `receipt_${income._id}_${Date.now()}.pdf`;
  const filepath = path.join(receiptsDir, filename);

  // בנה HTML עם RTL/עברית נכונה
  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; direction: rtl; margin: 40px; }
        h1 { font-size: 28px; text-align: center; margin-bottom: 20px; }
        .section { margin-bottom: 20px; }
        .section-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #ccc; }
        .row { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .label { font-weight: bold; }
        .value { text-align: left; }
        .signature { margin-top: 40px; text-align: center; }
      </style>
    </head>
    <body>
      <h1>קבלה</h1>
      
      <div class="section">
        <div class="row">
          <span class="label">מספר קבלה:</span>
          <span class="value">${income._id}</span>
        </div>
        <div class="row">
          <span class="label">תאריך:</span>
          <span class="value">${new Date(income.date).toLocaleDateString("he-IL")}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">פרטי לקוח:</div>
        <div class="row">
          <span class="label">שם:</span>
          <span class="value">${client.name || "-"}</span>
        </div>
        <div class="row">
          <span class="label">שם עסק:</span>
          <span class="value">${client.businessName || "-"}</span>
        </div>
        <div class="row">
          <span class="label">אימייל:</span>
          <span class="value">${client.email || "-"}</span>
        </div>
        <div class="row">
          <span class="label">טלפון:</span>
          <span class="value">${client.phone || "-"}</span>
        </div>
        <div class="row">
          <span class="label">כתובת:</span>
          <span class="value">${client.address || "-"}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">פרטי ההכנסה:</div>
        <div class="row">
          <span class="label">תיאור:</span>
          <span class="value">${income.description || "-"}</span>
        </div>
        <div class="row">
          <span class="label">סכום:</span>
          <span class="value">${income.amount?.toLocaleString("he-IL")} ₪</span>
        </div>
        <div class="row">
          <span class="label">אמצעי תשלום:</span>
          <span class="value">${income.paymentMethod || "-"}</span>
        </div>
      </div>

      <div class="signature">
        <p>חתימה: ____________________</p>
      </div>
    </body>
    </html>
  `;

  // השתמש ב-Puppeteer (עם puppeteer-core + Chrome המקומי)
  let browser;
  try {
    const chromePath = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
    console.log("🔍 Using Chrome at:", chromePath);
    
    browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"]
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.pdf({ path: filepath, format: "A4", margin: { top: "20px", right: "20px", bottom: "20px", left: "20px" } });
    console.log("✅ PDF created with Puppeteer at:", filepath);
    return filepath;
  } catch (err) {
    console.error("❌ Error generating PDF:", err.message || err);
    throw err;
  } finally {
    if (browser) await browser.close();
  }
}

async function sendReceiptEmail(income, client, pdfPath) {
  try {
    const transporter = await createTransporter();
    await verifyTransporter(transporter);

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: client.email,
      replyTo: process.env.EMAIL_REPLY_TO || process.env.EMAIL_FROM || process.env.EMAIL_USER,
      subject: `קבלה מס' ${income._id}`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif;">
          <p>שלום ${client.name},</p>
          <p>מצורפת קבלה עבור תשלום בסך <strong>${income.amount}₪</strong>.</p>
          <p>תיאור: ${income.description}</p>
          <br/>
          <p>בברכה,<br/>מערכת הנהלת חשבונות</p>
        </div>
      `,
      attachments: [{ filename: path.basename(pdfPath), path: pdfPath }],
      headers: { "List-Unsubscribe": process.env.EMAIL_UNSUBSCRIBE || "" }
    };

    console.log("📧 Sending email to:", client.email);
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully:", info && (info.response || info.messageId) ? (info.response || info.messageId) : info);

    console.log("🔒 Receipt kept at:", pdfPath);

    return { success: true, info };
  } catch (err) {
    console.error("❌ Error sending email:", err && err.message ? err.message : err);
    return { success: false, error: err && (err.message || err.toString()) };
  }
}

module.exports = { generateReceiptPDFtoFile, sendReceiptEmail };