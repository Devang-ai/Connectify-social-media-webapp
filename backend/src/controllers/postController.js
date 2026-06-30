const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');
const Notification = require('../models/Notification');

const createPost = async (req, res) => {
  try {
    const { content, location, taggedUsers } = req.body;
    let mediaUrl = null;
    let mediaType = 'none';

    if (req.file) {
       mediaUrl = req.file.path; // cloudinary full url
       mediaType = req.file.mimetype.startsWith('video') ? 'video' : 'image';
    }

    // Parse taggedUsers if it's sent as a JSON string from FormData
    let parsedTags = [];
    if (taggedUsers) {
      try {
        parsedTags = JSON.parse(taggedUsers);
      } catch (e) {
        parsedTags = Array.isArray(taggedUsers) ? taggedUsers : [taggedUsers];
      }
    }

    const post = await Post.create({
      author: req.user.id,
      content,
      mediaUrl,
      mediaType,
      location: location || null,
      taggedUsers: parsedTags
    });

    if (parsedTags && parsedTags.length > 0) {
      const tagNotifications = parsedTags
        .filter(id => id.toString() !== req.user.id)
        .map(tagId => ({
          recipient: tagId,
          sender: req.user.id,
          type: 'tag',
          post: post._id
        }));
      if (tagNotifications.length > 0) {
        await Notification.insertMany(tagNotifications);
        const io = req.app.get('io');
        if (io) {
          tagNotifications.forEach(notif => {
            io.to(notif.recipient.toString()).emit('new_notification');
          });
        }
      }
    }

    await post.populate('author', 'name handle profileImage');
    await post.populate('taggedUsers', 'name handle profileImage');
    res.status(201).json(post);
  } catch (error) {
    console.error("Create post error:", error);
    res.status(500).json({ error: 'Failed to create post' });
  }
};

const getFeedPosts = async (req, res) => {
  try {
    // For demo purposes, we are fetching ALL posts in the database 
    // instead of just from friends, so new users can see the dummy data immediately.
    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .populate('author', 'name handle profileImage')
      .populate('taggedUsers', 'name handle profileImage')
      .populate({
        path: 'comments',
        populate: { path: 'author', select: 'name handle profileImage' }
      });

    res.json(posts);
  } catch (error) {
    console.error("Fetch feed error:", error);
    res.status(500).json({ error: 'Failed to fetch feed' });
  }
};

const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const isLiked = post.likes.includes(req.user.id);
    if (isLiked) {
      post.likes.pull(req.user.id);
    } else {
      post.likes.push(req.user.id);
      
      if (post.author.toString() !== req.user.id) {
        // Prevent duplicate like notifications if they like/unlike multiple times rapidly
        const existingNotif = await Notification.findOne({
          recipient: post.author,
          sender: req.user.id,
          type: 'like',
          post: post._id
        });
        if (!existingNotif) {
          await Notification.create({
            recipient: post.author,
            sender: req.user.id,
            type: 'like',
            post: post._id
          });
          const io = req.app.get('io');
          if (io) io.to(post.author.toString()).emit('new_notification');
        }
      }
    }

    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Failed to like post' });
  }
};

const addComment = async (req, res) => {
  try {
    const { content } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const comment = await Comment.create({
      author: req.user.id,
      post: req.params.id,
      content
    });

    post.comments.push(comment._id);
    await post.save();

    if (post.author.toString() !== req.user.id) {
      await Notification.create({
        recipient: post.author,
        sender: req.user.id,
        type: 'comment',
        post: post._id
      });
      const io = req.app.get('io');
      if (io) io.to(post.author.toString()).emit('new_notification');
    }

    await comment.populate('author', 'name handle profileImage');
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
};

const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const posts = await Post.find({ author: userId })
      .sort({ createdAt: -1 })
      .populate('author', 'name handle profileImage')
      .populate('taggedUsers', 'name handle profileImage')
      .populate({
        path: 'comments',
        populate: { path: 'author', select: 'name handle profileImage' }
      });
    res.json(posts);
  } catch (error) {
    console.error("Fetch user posts error:", error);
    res.status(500).json({ error: 'Failed to fetch user posts' });
  }
};

const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    // Delete associated comments
    if (post.comments && post.comments.length > 0) {
      await Comment.deleteMany({ _id: { $in: post.comments } });
    }

    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error("Delete post error:", error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
};

module.exports = {
  createPost,
  getFeedPosts,
  likePost,
  addComment,
  getUserPosts,
  deletePost
};
