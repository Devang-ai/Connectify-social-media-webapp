import { create } from 'zustand';
import axios from 'axios';

const useFriendStore = create((set, get) => ({
  friends: [],
  searchResults: [],
  requests: { incoming: [], sent: [] },
  isLoading: false,

  fetchFriends: async () => {
    try {
      const res = await axios.get((import.meta.env.VITE_API_URL || 'http://localhost:5001') + '/api/users/friends');
      set({ friends: res.data });
    } catch (error) {
      console.error('Failed to fetch friends', error);
    }
  },

  getUserProfile: async (userId) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/users/${userId}/profile`);
      return res.data;
    } catch (error) {
      console.error('Failed to fetch user profile', error);
      return null;
    }
  },

  searchUsers: async (query) => {
    set({ isLoading: true });
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/users/search?query=${query}`);
      set({ searchResults: res.data, isLoading: false });
    } catch (error) {
      console.error('Failed to search users', error);
      set({ isLoading: false });
    }
  },

  sendRequest: async (recipientId) => {
    try {
      await axios.post((import.meta.env.VITE_API_URL || 'http://localhost:5001') + '/api/users/friends/request', { recipientId });
      return { success: true };
    } catch (error) {
      console.error('Failed to send request', error);
      return { success: false, error: error.response?.data?.error || 'Failed to send request' };
    }
  },

  fetchRequests: async () => {
    try {
      const res = await axios.get((import.meta.env.VITE_API_URL || 'http://localhost:5001') + '/api/users/friends/request');
      set({ requests: res.data });
    } catch (error) {
      console.error('Failed to fetch requests', error);
    }
  },

  respondRequest: async (requestId, status) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/users/friends/request/${requestId}`, { status });
      // Refresh requests and friends
      get().fetchRequests();
      get().fetchFriends();
    } catch (error) {
      console.error('Failed to respond to request', error);
    }
  },

  clearStore: () => {
    set({
      friends: [],
      searchResults: [],
      requests: { incoming: [], sent: [] },
      isLoading: false
    });
  }
}));

export default useFriendStore;
