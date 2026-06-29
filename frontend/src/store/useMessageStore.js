import { create } from 'zustand';
import axios from 'axios';
import { io } from 'socket.io-client';
import { toast } from 'react-hot-toast';

let socket;

const useMessageStore = create((set, get) => ({
  conversations: [],
  currentChat: null,
  messages: [],
  isSocketConnected: false,
  incomingCall: null,
  activeCallTarget: null,
  isVideoCall: false,
  getSocket: () => socket,

  setIncomingCall: (call) => set({ incomingCall: call }),
  setActiveCallTarget: (target) => set({ activeCallTarget: target }),
  setIsVideoCall: (isVideo) => set({ isVideoCall: isVideo }),
  clearCall: () => set({ incomingCall: null, activeCallTarget: null, pendingIceCandidates: [] }),

  pendingIceCandidates: [],
  addPendingIceCandidate: (candidate) => set(state => ({ pendingIceCandidates: [...state.pendingIceCandidates, candidate] })),
  clearPendingIceCandidates: () => set({ pendingIceCandidates: [] }),

  initSocket: (userId) => {
    console.log('Initializing socket for user:', userId);
    
    if (socket) {
      socket.disconnect();
    }
    
    socket = io((import.meta.env.VITE_API_URL || 'http://localhost:5001') + '', {
      forceNew: true,
      reconnection: true
    });
    
    // Built-in socket.io event for connection AND reconnection
    socket.on('connect', () => {
      console.log('Socket connected! Emitting setup for user:', userId);
      socket.emit('setup', userId);
    });
    
    // Custom event from our backend confirming setup
    socket.on('connected', () => {
      console.log('Backend confirmed setup!');
      set({ isSocketConnected: true });
    });
    
    socket.on('message_received', (newMessage) => {
      const { currentChat, updateConversationInList } = get();
      updateConversationInList(newMessage);
      if (currentChat && currentChat._id === newMessage.conversation._id) {
         set((state) => ({ messages: [...state.messages, newMessage] }));
      }
    });

    socket.on('call_incoming', (data) => {
      set({ incomingCall: data, isVideoCall: data.isVideo });
    });

    socket.on('ice_candidate', (candidate) => {
      get().addPendingIceCandidate(candidate);
    });
  },

  updateConversationInList: (newMessage) => {
    set((state) => {
      const convos = [...state.conversations];
      const index = convos.findIndex(c => c._id === newMessage.conversation._id);
      if (index >= 0) {
        convos[index].lastMessage = newMessage;
        convos[index].updatedAt = newMessage.createdAt || new Date().toISOString();
        return { conversations: convos.sort((a,b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)) };
      } else {
        // If it's a completely new conversation we don't have in the list yet
        const newConvo = newMessage.conversation;
        newConvo.lastMessage = newMessage;
        newConvo.updatedAt = newMessage.createdAt || new Date().toISOString();
        return { conversations: [newConvo, ...convos] };
      }
    });
  },

  disconnectSocket: () => {
    if (socket) socket.disconnect();
    set({ isSocketConnected: false });
  },

  fetchConversations: async () => {
    try {
      const res = await axios.get((import.meta.env.VITE_API_URL || 'http://localhost:5001') + '/api/messages');
      const sortedConvos = res.data.sort((a,b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
      set({ conversations: sortedConvos });
    } catch (error) {
      console.error('Failed to fetch conversations', error);
    }
  },

  fetchMessages: async (conversationId) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/messages/${conversationId}`);
      // Set currentChat to the conversation object if available, otherwise we will set it from sendMessage later
      const conversationData = res.data.length > 0 ? res.data[0].conversation : null;
      set({ messages: res.data, currentChat: conversationData });
      if (socket && conversationId) socket.emit('join_chat', conversationId);
    } catch (error) {
      console.error('Failed to fetch messages', error);
    }
  },

  sendMessage: async (content, conversationId, recipientId, mediaFile = null, sharedPostId = null) => {
    try {
      let payload;
      let headers = {};

      if (mediaFile) {
        payload = new FormData();
        payload.append('content', content || '');
        if (conversationId) payload.append('conversationId', conversationId);
        if (recipientId) payload.append('recipientId', recipientId);
        if (sharedPostId) payload.append('sharedPostId', sharedPostId);
        payload.append('media', mediaFile);
        headers['Content-Type'] = 'multipart/form-data';
      } else {
        payload = { content, conversationId, recipientId, sharedPostId };
      }

      const res = await axios.post((import.meta.env.VITE_API_URL || 'http://localhost:5001') + '/api/messages', payload, { headers });
      const newMessage = res.data;
      if (socket) socket.emit('new_message', newMessage);
      
      set((state) => {
        const isNewChat = !state.currentChat && recipientId;
        return { 
          messages: [...state.messages, newMessage],
          currentChat: isNewChat ? newMessage.conversation : state.currentChat
        };
      });
      
      get().updateConversationInList(newMessage);
    } catch (error) {
      console.error('Failed to send message', error);
    }
  },

  clearChat: async (conversationId) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/messages/${conversationId}/clear`);
      set({ messages: [] });
      toast.success('Chat cleared successfully');
    } catch (error) {
      console.error('Failed to clear chat', error);
      toast.error('Failed to clear chat');
    }
  }
}));

export default useMessageStore;
