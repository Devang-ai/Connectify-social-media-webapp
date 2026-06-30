const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');
const Notification = require('../models/Notification');
const bcrypt = require('bcrypt');

const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.json([]);
    
    // Fetch the current user to get their friends list
    const currentUser = await User.findById(req.user.id);
    const currentUserFriends = currentUser.friends.map(id => id.toString());

    let users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { handle: { $regex: query, $options: 'i' } }
      ],
      _id: { $ne: req.user.id }
    }).select('-password').limit(10);
    
    users = users.map(user => {
      const userObj = user.toObject();
      const userFriends = userObj.friends.map(id => id.toString());
      const mutualFriends = userFriends.filter(id => currentUserFriends.includes(id));
      userObj.mutualFriendsCount = mutualFriends.length;
      return userObj;
    });

    res.json(users);
  } catch (error) {
    console.error("Search users error:", error);
    res.status(500).json({ error: 'Failed to search users' });
  }
};

const sendFriendRequest = async (req, res) => {
  try {
    const { recipientId } = req.body;
    if (recipientId === req.user.id) return res.status(400).json({ error: "Cannot add yourself" });

    let existingRequest = await FriendRequest.findOne({
      $or: [
        { requester: req.user.id, recipient: recipientId },
        { requester: recipientId, recipient: req.user.id }
      ]
    });

    if (existingRequest) {
      if (existingRequest.status === 'pending' || existingRequest.status === 'accepted') {
        return res.status(400).json({ error: "Friend request already exists or you are already friends" });
      } else {
        // If it was rejected, we can resend it by updating the existing one or creating a new one
        await FriendRequest.findByIdAndDelete(existingRequest._id);
      }
    }

    const request = await FriendRequest.create({
      requester: req.user.id,
      recipient: recipientId
    });

    // Notify user
    await Notification.create({
      recipient: recipientId,
      sender: req.user.id,
      type: 'friend_request'
    });

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send friend request' });
  }
};

const respondFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body; // 'accepted' or 'rejected'

    const request = await FriendRequest.findById(requestId);
    if (!request || request.recipient.toString() !== req.user.id) {
      return res.status(404).json({ error: "Request not found" });
    }

    request.status = status;
    await request.save();

    if (status === 'accepted') {
      await User.findByIdAndUpdate(request.requester, { $addToSet: { friends: request.recipient } });
      await User.findByIdAndUpdate(request.recipient, { $addToSet: { friends: request.requester } });

      // Notify the requester that their request was accepted
      await Notification.create({
        recipient: request.requester,
        sender: request.recipient,
        type: 'connected'
      });

      // Notify the recipient as well
      await Notification.create({
        recipient: request.recipient,
        sender: request.requester,
        type: 'connected'
      });
    }

    res.json({ message: `Friend request ${status}` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to respond to request' });
  }
};

const getFriendsList = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('friends', 'name handle profileImage');
    res.json(user.friends);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch friends' });
  }
};

const updateProfile = async (req, res) => {
  try {
        
    const { name, handle, bio, location, education } = req.body;
    let updateData = {};
    if (name) updateData.name = name;
    if (handle) updateData.handle = handle;
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    if (education !== undefined) updateData.education = education;
    
    if (req.files) {
       if (req.files.profileImage && req.files.profileImage[0]) {
           updateData.profileImage = req.files.profileImage[0].path;
       }
       if (req.files.coverImage && req.files.coverImage[0]) {
           updateData.coverImage = req.files.coverImage[0].path;
       }
    }

    const user = await User.findByIdAndUpdate(req.user.id, updateData, { returnDocument: 'after' }).select('-password');
    res.json(user);
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

const getFriendRequests = async (req, res) => {
  try {
        
    const incoming = await FriendRequest.find({ recipient: req.user.id, status: 'pending' })
      .populate('requester', 'name handle profileImage');
      
    const sent = await FriendRequest.find({ requester: req.user.id, status: 'pending' })
      .populate('recipient', 'name handle profileImage');
      
        
    res.json({ incoming, sent });
  } catch (error) {
    console.error("Error in getFriendRequests:", error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Validate request
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Please provide both current and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    // Get user from db (including password field which might be excluded by default depending on query, but we use findById)
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if current password is correct
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect current password' });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Save it
    user.password = hashedNewPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error("Password change error:", error);
    res.status(500).json({ error: 'Failed to update password' });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password').populate('friends', 'name handle profileImage');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userObj = user.toObject();
    if (id !== req.user.id) {
      const currentUser = await User.findById(req.user.id);
      const currentUserFriends = currentUser.friends.map(fid => fid.toString());
      const targetFriends = userObj.friends.map(f => f._id.toString());
      const mutualFriends = targetFriends.filter(fid => currentUserFriends.includes(fid));
      userObj.mutualFriendsCount = mutualFriends.length;
    } else {
      userObj.mutualFriendsCount = 0;
    }

    res.json(userObj);
  } catch (error) {
    console.error("Get user profile error:", error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
};

module.exports = {
  searchUsers,
  sendFriendRequest,
  respondFriendRequest,
  getFriendsList,
  updateProfile,
  getFriendRequests,
  changePassword,
  getUserProfile
};
