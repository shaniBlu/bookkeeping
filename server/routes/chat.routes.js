const express = require('express');
const router = express.Router();
const Chat = require('../models/chat.model');
const Message = require('../models/message.model');
const OpenAI = require('openai');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// יצירת שיחה חדשה
router.post('/new', async (req, res) => {
  const chat = await Chat.create({
    title: 'שיחה חדשה'
  });

  res.json(chat);
});

// טעינת כל השיחות
router.get('/', async (req, res) => {
  const chats = await Chat.find().sort({ updatedAt: -1 });
  res.json(chats);
});

// מחיקת שיחה
router.delete('/:id', async (req, res) => {
  await Chat.findByIdAndDelete(req.params.id);
  await Message.deleteMany({ chatId: req.params.id });
  res.json({ ok: true });
});

// טעינת הודעות של שיחה
router.get('/messages/:chatId', async (req, res) => {
  const messages = await Message.find({ chatId: req.params.chatId });
  res.json(messages);
});

// שליחת הודעה
router.post('/send', upload.single('file'), async (req, res) => {
  const { chatId, message } = req.body;
  const safeMessage = typeof message === 'string' ? message : '';

  let chat = chatId ? await Chat.findById(chatId) : await Chat.create({ title: 'שיחה חדשה' });

  if (chat.title === 'שיחה חדשה') {
    chat.title = safeMessage.substring(0, 40);
    await chat.save();
  }

  let file_id = null;

  // אם יש קובץ – מעלים אותו ל־OpenAI
  if (req.file) {
    const fileUpload = await client.files.create({
      purpose: "assistants",
      file: fs.createReadStream(req.file.path)
    });

    file_id = fileUpload.id;
  }

  await Message.create({
    chatId: chat._id,
    from: 'user',
    text: safeMessage
  });

  const messages = [
    { role: 'system', content: 'Assistant restricted to accounting-related content only.' },
    { role: 'user', content: safeMessage }
  ];

  // אם יש קובץ – מוסיפים אותו לשיחה
  if (file_id) {
    messages.push({
      role: "user",
      content: [
        { type: "input_text", text: safeMessage },
        { type: "input_file", file_id: file_id }
      ]
    });
  }

  const ai = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages
  });

  const reply = ai.choices[0].message.content || '';

  await Message.create({
    chatId: chat._id,
    from: 'bot',
    text: reply
  });

  chat.updatedAt = new Date();
  await chat.save();

  res.json({
    chatId: chat._id,
    reply
  });
});

module.exports = router;
