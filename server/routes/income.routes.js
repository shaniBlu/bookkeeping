const express = require('express');
const router = express.Router();
const Income = require('../models/income.model');
const Client = require('../models/client.model');
const { generateReceiptPDFtoFile, sendReceiptEmail } = require('../services/receipt.service'); // ✅ עדכן את שם הפונקציה

const incomeRoutes = router;

// GET כל ההכנסות
router.get('/', async (req, res) => {
  try {
    const incomes = await Income.find().populate('clientId').sort({ date: -1 });
    res.json(incomes);
  } catch (err) {
    console.error('Error fetching incomes:', err);
    res.status(500).json({ error: 'שגיאה בשליפת הכנסות' });
  }
});

// POST הכנסה חדשה
router.post('/', async (req, res) => {
  try {
    const income = new Income(req.body);
    const saved = await income.save();

    const client = await Client.findById(req.body.clientId);
    if (!client) return res.status(404).json({ error: 'לקוח לא נמצא' });

    if (!client.email) {
      console.warn('Client has no email, skipping receipt');
      return res.json(saved);
    }

    // טקע נפרד: הפקה וקבלה (לא חוסם את התשובה)
    (async () => {
      try {
        console.log('Generating receipt for income:', saved._id);
        const pdfPath = await generateReceiptPDFtoFile(saved, client); // ✅ עדכן שם הפונקציה
        console.log('PDF created at:', pdfPath);
        console.log('Sending email to:', client.email);        
        console.log('Receipt process completed:', emailResult);
      } catch (err) {
        console.error('Error in receipt generation/sending:', err);
      }
    })();

    res.json(saved);
  } catch (err) {
    console.error('Error creating income:', err);
    res.status(400).json({ error: 'שגיאה בהוספת הכנסה' });
  }
});

// DELETE הכנסה
router.delete('/:id', async (req, res) => {
  try {
    await Income.findByIdAndDelete(req.params.id);
    res.json({ message: 'נמחק' });
  } catch (err) {
    console.error('Error deleting income:', err);
    res.status(500).json({ error: 'שגיאה במחיקה' });
  }
});

module.exports = router;