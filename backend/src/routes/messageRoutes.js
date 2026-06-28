const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { sendMessage, getMessages, fetchConversations, clearChat } = require('../controllers/messageController');
const upload = require('../config/cloudinary');

router.post('/', protect, upload.single('media'), sendMessage);
router.get('/:conversationId', protect, getMessages);
router.get('/', protect, fetchConversations);
router.delete('/:conversationId/clear', protect, clearChat);

module.exports = router;
