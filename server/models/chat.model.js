const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    group: { type: String, default: '' },
    messages: [
      {
        from: { type: String, enum: ['user', 'bot'], required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Chat', ChatSchema);
