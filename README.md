# Connectify - Full Stack Social Media Web App

Connectify is a modern, fully-functional social media platform built using the MERN stack (MongoDB, Express, React, Node.js). It features real-time messaging, WebRTC video/voice calling, photo stories, dynamic activity feeds, and a beautiful responsive UI.

**Live Demo:** [https://connectify-social-media-webapp.vercel.app/](https://connectify-social-media-webapp.vercel.app/)

> **Note on Performance:** The backend is currently hosted on Render's free tier. If the server has been inactive, it will automatically spin down. When you visit the app for the first time, **it may take up to 30-50 seconds for the server to wake up**. Please be patient on the initial load!

## 🏗️ Application Architecture

Connectify follows a modern Client-Server architecture:
- **Frontend (Client):** Built with React (Vite) and TailwindCSS. It uses Zustand for global state management and Axios for RESTful API communication. Socket.io-client handles real-time bidirectional communication.
- **Backend (API Server):** A Node.js and Express.js server providing RESTful endpoints. It uses Mongoose to interact with the database. Socket.io runs alongside the HTTP server to handle real-time chat, notifications, and WebRTC signaling.
- **Database:** MongoDB Atlas is used for scalable document storage (Users, Posts, Messages, Stories, Notifications).
- **Media Storage:** Cloudinary is integrated on the backend to handle secure upload, processing, and delivery of images and videos (avatars, post media, stories, chat attachments).

## ✅ Required Features Implemented
1. **User Authentication:** JWT-based user registration and secure login functionality.
2. **Profile Pages:** Users can create and update profiles, and upload profile/cover pictures.
3. **Friend Connections:** Search for users globally, and send, accept, or reject friend requests.
4. **News Feed:** A dynamic home feed displaying chronological posts from friends and connections.
5. **Post Creation:** Users can create rich posts, upload images and videos, add locations, and tag other users.
6. **Messaging:** Real-time private direct messaging with friends.

## 🚀 Extra Features (Beyond Requirements)
We went above and beyond the basic requirements to build a highly competitive social platform:
- **Real-Time WebRTC Video & Voice Calling:** Call your friends directly in the browser with peer-to-peer WebRTC!
- **Instagram-Style Photo Stories:** 15-second ephemeral photo/video stories with an intuitive viewer.
- **Post Sharing to DMs:** "Share" any post directly into a private chat message (rendered as a rich embed in the chat window).
- **Multimedia Chat:** Send images, videos, and emojis seamlessly inside direct messages.
- **Activity Notifications:** A dedicated notification center tracking likes, comments, mentions, and friend requests.
- **Responsive "Glassmorphism" UI:** A stunning, ultra-modern user interface that automatically adapts to both mobile phones and desktop screens perfectly.

## 🛠️ Tech Stack
- **Frontend:** React, Zustand, TailwindCSS, Framer Motion, Socket.io-client
- **Backend:** Node.js, Express.js, Socket.io, JWT, WebRTC Signaling
- **Database & Storage:** MongoDB Atlas, Cloudinary
- **Deployment:** Vercel (Frontend) & Render (Backend)

