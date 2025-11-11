const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bookkeeping';
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
};

async function connectWithRetry(retries = 5, delayMs = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      await mongoose.connect(uri, options);
      console.log('✅ MongoDB connected:', uri);
      return;
    } catch (err) {
      console.error(`❌ MongoDB connect attempt ${i + 1} failed:`, err.message);
      if (i < retries - 1) {
        console.log(`Retrying in ${delayMs}ms...`);
        await new Promise(r => setTimeout(r, delayMs));
      } else {
        console.error('🚨 Could not connect to MongoDB after retries.');
        throw err;
      }
    }
  }
}

module.exports = { connectWithRetry };
