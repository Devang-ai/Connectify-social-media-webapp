const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.set('io', io);

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));

// Routes
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/userRoutes');
const postRoutes = require('./src/routes/postRoutes');
const messageRoutes = require('./src/routes/messageRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const storyRoutes = require('./src/routes/storyRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/stories', storyRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Connectify API is running' });
});

// Socket.io logic
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('setup', (userId) => {
    socket.join(userId);
    socket.emit('connected');
  });

  socket.on('join_chat', (room) => {
    socket.join(room);
  });

  socket.on('typing', (room) => socket.in(room).emit('typing'));
  socket.on('stop_typing', (room) => socket.in(room).emit('stop_typing'));

  socket.on('new_message', (newMessageRecieved) => {
    var chat = newMessageRecieved.conversation;
    if (!chat.participants) return console.log('chat.participants not defined');

    chat.participants.forEach(user => {
      if (user._id === newMessageRecieved.sender._id) return;
      socket.in(user._id).emit('message_received', newMessageRecieved);
    });
  });

  // WebRTC Signaling
  socket.on('call_user', (data) => {
    socket.in(data.userToCall).emit('call_incoming', { 
      signal: data.signalData, 
      from: data.from, 
      callerName: data.callerName,
      callerImage: data.callerImage,
      isVideo: data.isVideo
    });
    console.log(`Emitted call_incoming to room ${data.userToCall}`);
  });

  socket.on('answer_call', (data) => {
    console.log(`Emitting call_accepted to room: ${data.to}`);
    socket.in(data.to).emit('call_accepted', data.signal);
  });

  socket.on('ice_candidate', (data) => {
    console.log(`Emitting ice_candidate to room: ${data.to}`);
    socket.in(data.to).emit('ice_candidate', data.candidate);
  });

  socket.on('end_call', (data) => {
    socket.in(data.to).emit('call_ended');
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
