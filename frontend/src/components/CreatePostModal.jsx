import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import usePostStore from '../store/usePostStore';
import useFriendStore from '../store/useFriendStore';
import { X, Image as ImageIcon, Video, MapPin, Users, Check } from 'lucide-react';

const CreatePostModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { createPost } = usePostStore();
  const { friends, fetchFriends } = useFriendStore();
  
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New States
  const [media, setMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [location, setLocation] = useState('');
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [taggedUsers, setTaggedUsers] = useState([]);
  const [showTagMenu, setShowTagMenu] = useState(false);

  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchFriends();
    }
  }, [isOpen, fetchFriends]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMedia(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const removeMedia = () => {
    setMedia(null);
    setMediaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const toggleTag = (friendId) => {
    setTaggedUsers(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleSubmit = async () => {
    if (!content.trim() && !media) return;
    setIsSubmitting(true);
    
    const formData = new FormData();
    formData.append('content', content);
    if (media) formData.append('media', media);
    if (location) formData.append('location', location);
    if (taggedUsers.length > 0) formData.append('taggedUsers', JSON.stringify(taggedUsers));

    const success = await createPost(formData);
    setIsSubmitting(false);
    if (success) {
      setContent('');
      removeMedia();
      setLocation('');
      setTaggedUsers([]);
      setShowLocationInput(false);
      setShowTagMenu(false);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
          />
          <motion.div 
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            className="fixed inset-x-4 bottom-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl z-[101] overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
              <h2 className="font-bold text-slate-800 dark:text-white">Create Post</h2>
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting || (!content.trim() && !media)}
                className="bg-primary text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg shadow-primary/30 disabled:opacity-50 transition-all hover:opacity-90 active:scale-95"
              >
                {isSubmitting ? 'Posting...' : 'Post'}
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto">
              <div className="flex gap-3 mb-4">
                <img src={user?.profileImage || `https://ui-avatars.com/api/?name=${user?.name}`} className="w-10 h-10 rounded-full object-cover" alt="User" />
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-sm">{user?.name}</h3>
                  <div className="bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 px-2 py-0.5 rounded-full inline-flex items-center gap-1 mt-0.5">
                    <Users className="w-3 h-3" /> Public
                  </div>
                </div>
              </div>

              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full bg-transparent resize-none focus:outline-none text-slate-800 dark:text-slate-100 text-lg md:text-xl min-h-[120px]"
              />

              {/* Media Preview */}
              {mediaPreview && (
                <div className="relative mt-4 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <button 
                    onClick={removeMedia}
                    className="absolute top-2 right-2 bg-slate-900/50 hover:bg-slate-900/80 text-white p-1.5 rounded-full backdrop-blur-md transition-colors z-10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  {media?.type?.startsWith('video') ? (
                    <video src={mediaPreview} controls className="w-full max-h-64 object-contain" />
                  ) : (
                    <img src={mediaPreview} alt="Preview" className="w-full max-h-64 object-contain" />
                  )}
                </div>
              )}

              {/* Location Input */}
              {showLocationInput && (
                <div className="mt-4 flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                  <MapPin className="w-5 h-5 text-slate-400" />
                  <input 
                    type="text" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Where are you?"
                    className="bg-transparent border-none focus:outline-none w-full text-sm text-slate-700 dark:text-slate-200"
                    autoFocus
                  />
                  <button onClick={() => { setLocation(''); setShowLocationInput(false); }} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg">
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              )}

              {/* Tagging Menu */}
              {showTagMenu && (
                <div className="mt-4 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 dark:bg-slate-800/80 p-2 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase">Tag Friends</span>
                    <button onClick={() => setShowTagMenu(false)}><X className="w-4 h-4 text-slate-400" /></button>
                  </div>
                  <div className="max-h-40 overflow-y-auto p-2 bg-white dark:bg-slate-900 flex flex-col gap-1">
                    {friends.length === 0 ? (
                      <div className="text-sm text-slate-500 p-2 text-center">No friends found</div>
                    ) : (
                      friends.map(friend => {
                        const isTagged = taggedUsers.includes(friend._id);
                        return (
                          <button 
                            key={friend._id}
                            onClick={() => toggleTag(friend._id)}
                            className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg w-full text-left transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <img src={friend.profileImage || `https://ui-avatars.com/api/?name=${friend.name}`} className="w-6 h-6 rounded-full" />
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{friend.name}</span>
                            </div>
                            {isTagged && <Check className="w-4 h-4 text-primary" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
              <input type="file" accept="video/*" className="hidden" ref={videoInputRef} onChange={handleFileChange} />
              
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 py-2 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:border-primary hover:text-primary transition-colors">
                  <ImageIcon className="w-4 h-4 text-indigo-500" /> Photo
                </button>
                <button onClick={() => videoInputRef.current?.click()} className="flex items-center justify-center gap-2 py-2 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:border-primary hover:text-primary transition-colors">
                  <Video className="w-4 h-4 text-rose-500" /> Video
                </button>
                <button onClick={() => { setShowTagMenu(!showTagMenu); setShowLocationInput(false); }} className={`flex items-center justify-center gap-2 py-2 px-4 bg-white dark:bg-slate-900 border ${showTagMenu || taggedUsers.length > 0 ? 'border-primary text-primary' : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'} rounded-xl text-sm font-medium hover:border-primary hover:text-primary transition-colors`}>
                  <Users className="w-4 h-4 text-blue-500" /> {taggedUsers.length > 0 ? `${taggedUsers.length} Tagged` : 'Tag'}
                </button>
                <button onClick={() => { setShowLocationInput(!showLocationInput); setShowTagMenu(false); }} className={`flex items-center justify-center gap-2 py-2 px-4 bg-white dark:bg-slate-900 border ${location || showLocationInput ? 'border-primary text-primary' : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'} rounded-xl text-sm font-medium hover:border-primary hover:text-primary transition-colors`}>
                  <MapPin className="w-4 h-4 text-green-500" /> Location
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CreatePostModal;
