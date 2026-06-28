const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { searchUsers, sendFriendRequest, respondFriendRequest, getFriendsList, updateProfile, getFriendRequests, changePassword, getUserProfile } = require('../controllers/userController');
const upload = require('../config/cloudinary');

router.get('/search', protect, searchUsers);
router.get('/:id/profile', protect, getUserProfile);
router.get('/friends/request', protect, getFriendRequests);
router.post('/friends/request', protect, sendFriendRequest);
router.put('/friends/request/:requestId', protect, respondFriendRequest);
router.get('/friends', protect, getFriendsList);
router.put('/profile', protect, upload.fields([{ name: 'profileImage', maxCount: 1 }, { name: 'coverImage', maxCount: 1 }]), updateProfile);
router.put('/password', protect, changePassword);

module.exports = router;
