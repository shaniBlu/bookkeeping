const express = require('express');
const router = express.Router();
const Client = require('../models/client.model');

// קבלת כל הלקוחות
router.get('/', async (req, res) => {
  try {
    const clients = await Client.find().sort({ name: 1 });
    res.json(clients);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאה בשליפת לקוחות' });
  }
});

// יצירת לקוח חדש
router.post('/', async (req, res) => {
  try {
    const client = new Client(req.body);
    const savedClient = await client.save();
    res.json(savedClient);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'שגיאה בהוספת לקוח חדש' });
  }
});

module.exports = router;
