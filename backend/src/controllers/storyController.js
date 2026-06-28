const Story = require('../models/Story');
const User = require('../models/User');
const uploadToCloudinary = require('../utils/cloudinary');

const createStory = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Media file is required' });
    }

    const mediaUrl = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
    const mediaType = req.file.mimetype.startsWith('video') ? 'video' : 'image';

    let textOverlays = [];
    if (req.body.textOverlays) {
      try {
        textOverlays = JSON.parse(req.body.textOverlays);
      } catch (err) {
        console.error('Failed to parse textOverlays', err);
      }
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const story = await Story.create({
      author: req.user.id,
      mediaUrl,
      mediaType,
      textOverlays,
      expiresAt
    });

    await story.populate('author', 'name handle profileImage');

    res.status(201).json(story);
  } catch (error) {
    console.error('Error creating story:', error);
    res.status(500).json({ error: 'Failed to create story' });
  }
};

const getFeedStories = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('friends');
    const friendIds = user.friends.map(f => f._id);
    
    // We want to fetch stories from the user AND their friends
    const authorIds = [...friendIds, req.user.id];

    // Fetch active stories (ttl index will auto delete, but just in case we filter by expiresAt)
    const stories = await Story.find({
      author: { $in: authorIds },
      expiresAt: { $gt: new Date() }
    })
    .populate('author', 'name handle profileImage')
    .sort({ createdAt: -1 });

    res.json(stories);
  } catch (error) {
    console.error('Error fetching stories:', error);
    res.status(500).json({ error: 'Failed to fetch stories' });
  }
};

module.exports = {
  createStory,
  getFeedStories
};
