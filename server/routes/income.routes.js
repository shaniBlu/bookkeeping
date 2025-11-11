const express = require('express');
const router = express.Router();
const Income = require('../models/income.model');

// קבלת כל ההכנסות
router.get('/', async (req, res) => {
  try {
    const incomes = await Income.find().populate('clientId').sort({ date: -1 });
    res.json(incomes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאה בשליפת הכנסות' });
  }
});

// יצירת הכנסה חדשה
router.post('/', async (req, res) => {
  try {
    const income = new Income(req.body);
    const savedIncome = await income.save();
    res.json(savedIncome);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'שגיאה בהוספת הכנסה' });
  }
});

// מחיקת הכנסה לפי ID
router.delete('/:id', async (req, res) => {
  try {
    await Income.findByIdAndDelete(req.params.id);
    res.sendStatus(204);
  } catch (error) {
    console.error('שגיאה במחיקה:', error);
    res.status(500).json({ message: 'שגיאה במחיקה', error });
  }
});

module.exports = router;
