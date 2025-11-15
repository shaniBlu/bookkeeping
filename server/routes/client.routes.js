const express = require('express');
const router = express.Router();
const Client = require('../models/client.model'); // ← שנה ל-client.model (c קטן)

// GET כל הלקוחות
router.get('/', async (req, res) => {
  try {
    const clients = await Client.find().sort({ name: 1 });
    res.json(clients);
  } catch (err) {
    console.error('Error fetching clients:', err);
    res.status(500).json({ error: 'שגיאה בשליפת לקוחות' });
  }
});

// POST לקוח חדש
router.post('/', async (req, res) => {
  try {
    const client = new Client(req.body);
    const savedClient = await client.save();
    res.json(savedClient);
  } catch (err) {
    console.error('Error creating client:', err);
    res.status(400).json({ error: 'שגיאה בהוספת לקוח' });
  }
});

module.exports = router;