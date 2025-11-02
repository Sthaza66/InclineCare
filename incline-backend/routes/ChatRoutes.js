const express = require('express');
const router = express.Router();
const ChatMessage = require('../models/ChatMessage');

// ✅ Send a message
router.post('/send', async (req, res) => {
  try {
    const { senderId, receiverId, message } = req.body;

    if (!senderId || !receiverId || !message) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    const chatMessage = new ChatMessage({ senderId, receiverId, message });
    await chatMessage.save();

    res.status(201).json(chatMessage);
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ message: 'Error sending message' });
  }
});

// ✅ Fetch chat between two users
router.get('/:user1Id/:user2Id', async (req, res) => {
  try {
    const { user1Id, user2Id } = req.params;

    const messages = await ChatMessage.find({
      $or: [
        { senderId: user1Id, receiverId: user2Id },
        { senderId: user2Id, receiverId: user1Id },
      ],
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

module.exports = router;
