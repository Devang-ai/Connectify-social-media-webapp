const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const { createStory, getFeedStories } = require('../controllers/storyController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  }
});

router.post('/', protect, upload.single('media'), createStory);
router.get('/', protect, getFeedStories);

module.exports = router;
