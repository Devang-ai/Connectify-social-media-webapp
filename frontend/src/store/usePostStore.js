import { create } from 'zustand';
import axios from 'axios';

const usePostStore = create((set, get) => ({
  posts: [],
  isLoading: false,
  error: null,

  fetchFeed: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.get((import.meta.env.VITE_API_URL || 'http://localhost:5001') + '/api/posts/feed');
      set({ posts: res.data, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.error || 'Failed to fetch posts', isLoading: false });
    }
  },

  createPost: async (postData) => {
    try {
      // postData could be a FormData object or a regular object
      const res = await axios.post((import.meta.env.VITE_API_URL || 'http://localhost:5001') + '/api/posts', postData);
      // We must re-fetch feed instead of just prepending res.data, 
      // because res.data might not be fully populated with all nested data just yet, 
      // but prepending it works for basic UI optimism.
      // Ideally, populate tags in backend returns them.
      set((state) => ({ posts: [res.data, ...state.posts] }));
      return true;
    } catch (error) {
      console.error('Failed to create post', error);
      return false;
    }
  },

  likePost: async (postId) => {
    try {
      const res = await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/posts/${postId}/like`);
      // Update local state immediately for fast UI
      set((state) => ({
        posts: state.posts.map((post) => 
          post._id === postId ? { ...post, likes: res.data.likes } : post
        )
      }));
    } catch (error) {
      console.error('Failed to like post', error);
    }
  },

  addComment: async (postId, content) => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/posts/${postId}/comment`, { content });
      // We will need to re-fetch feed or surgically update the comment
      // For simplicity, let's just append the comment to the local state
      set((state) => ({
        posts: state.posts.map((post) => {
          if (post._id === postId) {
             return { ...post, comments: [...post.comments, res.data] };
          }
          return post;
        })
      }));
      return true;
    } catch (error) {
      console.error('Failed to add comment', error);
      return false;
    }
  },

  getUserPosts: async (userId) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/posts/user/${userId}`);
      return res.data;
    } catch (error) {
      console.error('Failed to fetch user posts', error);
      return [];
    }
  },

  deletePost: async (postId) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/posts/${postId}`);
      set((state) => ({
        posts: state.posts.filter((post) => post._id !== postId)
      }));
      return true;
    } catch (error) {
      console.error('Failed to delete post', error);
      return false;
    }
  }
}));

export default usePostStore;
