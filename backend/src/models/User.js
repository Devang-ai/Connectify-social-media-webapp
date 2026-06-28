const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  handle: { type: String, unique: true },
  bio: { type: String, default: '' },
  location: { type: String, default: '' },
  education: { type: String, default: '' },
  profileImage: { type: String, default: '' },
  coverImage: { type: String, default: '' },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
