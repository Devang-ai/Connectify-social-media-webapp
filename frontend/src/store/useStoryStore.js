import { create } from 'zustand';
import axios from 'axios';
import toast from 'react-hot-toast';

const useStoryStore = create((set) => ({
  stories: [],
  isLoading: false,

  fetchStories: async () => {
    set({ isLoading: true });
    try {
      const response = await axios.get((import.meta.env.VITE_API_URL || 'http://localhost:5001') + '/api/stories');
      // Group stories by user for the UI
      const groupedStories = response.data.reduce((acc, story) => {
        const authorId = story.author._id;
        if (!acc[authorId]) {
          acc[authorId] = {
            user: story.author,
            stories: []
          };
        }
        // Since backend returns newest first, unshift to make the array oldest-first
        acc[authorId].stories.unshift(story);
        return acc;
      }, {});

      // Convert grouped object to array
      const storiesArray = Object.values(groupedStories);
      
      // Sort so the current user's stories (if any) are always first
      // Assuming we get currentUser id somehow, but for now we just keep the array
      set({ stories: storiesArray });
    } catch (error) {
      console.error('Error fetching stories:', error);
      toast.error('Failed to load stories');
    } finally {
      set({ isLoading: false });
    }
  },

  createStory: async (file, textOverlays = []) => {
    set({ isLoading: true });
    try {
      const formData = new FormData();
      formData.append('media', file);
      if (textOverlays.length > 0) {
        formData.append('textOverlays', JSON.stringify(textOverlays));
      }

      await axios.post((import.meta.env.VITE_API_URL || 'http://localhost:5001') + '/api/stories', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Re-fetch stories to update the UI
      useStoryStore.getState().fetchStories();
    } catch (error) {
      console.error('Error creating story:', error);
      toast.error('Failed to post story');
    } finally {
      set({ isLoading: false });
    }
  }
}));

export default useStoryStore;
