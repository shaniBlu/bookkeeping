const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { connectWithRetry } = require('./connectToServer');
const incomeRoutes = require('./routes/income.routes');
const clientRoutes = require('./routes/client.routes');

const PORT = process.env.PORT || 5000;
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// Routes
app.get('/health', (req, res) => res.json({ ok: true }));
app.use('/api/incomes', incomeRoutes);
app.use('/api/clients', clientRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Server error' });
});

// Connect to MongoDB & start server
connectWithRetry()
  .then(() => {
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('❌ Failed to start server because MongoDB connection failed.', err);
    process.exit(1);
  });
