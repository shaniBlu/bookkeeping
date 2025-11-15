require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendReceipt(to, htmlContent) {
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: "קבלה על הזמנה",
    html: htmlContent,
  });
  console.log("Email sent:", info.messageId);
}

module.exports = sendReceipt;
