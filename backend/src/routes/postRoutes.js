const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createPost, getFeedPosts, likePost, addComment, getUserPosts, deletePost } = require('../controllers/postController');
const upload = require('../config/cloudinary');

router.post('/', protect, upload.single('media'), createPost);
router.get('/feed', protect, getFeedPosts);
router.get('/user/:userId', protect, getUserPosts);
router.put('/:id/like', protect, likePost);
router.post('/:id/comment', protect, addComment);
router.delete('/:id', protect, deletePost);

module.exports = router;
