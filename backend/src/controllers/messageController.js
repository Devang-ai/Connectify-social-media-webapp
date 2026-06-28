const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

const sendMessage = async (req, res) => {
  try {
    const { content, conversationId, recipientId } = req.body;
    let mediaUrl = null;

    if (req.file) {
      mediaUrl = req.file.path;
    }

    let conversation;

    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
    } else {
      // Find or create conversation
      conversation = await Conversation.findOne({
        participants: { $all: [req.user.id, recipientId] }
      });

      if (!conversation) {
        conversation = await Conversation.create({
          participants: [req.user.id, recipientId]
        });
      }
    }

    const newMessage = await Message.create({
      conversation: conversation._id,
      sender: req.user.id,
      text: content || '',
      mediaUrl
    });

    conversation.lastMessage = newMessage._id;
    await conversation.save();

    await newMessage.populate('sender', 'name handle profileImage');
    await newMessage.populate({
      path: 'conversation',
      populate: {
        path: 'participants',
        select: 'name handle profileImage email'
      }
    });

    res.json(newMessage);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
};

const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ 
      conversation: req.params.conversationId,
      deletedFor: { $ne: req.user.id }
    })
      .populate('sender', 'name profileImage handle')
      .populate('conversation');
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

const fetchConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: { $in: [req.user.id] } })
      .populate('participants', 'name handle profileImage')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });
    
    // Populate sender of lastMessage
    const populatedConvos = await User.populate(conversations, {
      path: 'lastMessage.sender',
      select: 'name profileImage handle'
    });

    res.json(populatedConvos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
};

const clearChat = async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    // Find all messages in the conversation and add the user's ID to deletedFor
    await Message.updateMany(
      { conversation: conversationId },
      { $addToSet: { deletedFor: req.user.id } }
    );

    res.json({ message: 'Chat cleared successfully' });
  } catch (error) {
    console.error("Clear chat error:", error);
    res.status(500).json({ error: 'Failed to clear chat' });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  fetchConversations,
  clearChat
};
