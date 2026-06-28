const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mediaUrl: { type: String, required: true },
  mediaType: { type: String, enum: ['image', 'video'], default: 'image' },
  textOverlays: [{
    text: String,
    color: String,
    x: Number,
    y: Number
  }],
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

// Index for TTL (Time To Live) to automatically delete expired stories
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Story', storySchema);
