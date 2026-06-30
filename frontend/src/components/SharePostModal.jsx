import React, { useEffect, useState } from 'react';
import useFriendStore from '../store/useFriendStore';
import useMessageStore from '../store/useMessageStore';
import { Search, X, Send } from 'lucide-react';
import { toast } from 'react-hot-toast';

const SharePostModal = ({ isOpen, onClose, postId }) => {
  const { friends, fetchFriends } = useFriendStore();
  const { sendMessage } = useMessageStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [sentTo, setSentTo] = useState(new Set());

  useEffect(() => {
    if (isOpen) {
      fetchFriends();
      setSentTo(new Set());
      document.body.style.overflow = 'hidden';
      
      const handleEscape = (e) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.body.style.overflow = 'unset';
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, fetchFriends, onClose]);

  if (!isOpen) return null;

  const filteredFriends = friends.filter(f => 
    f.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.handle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleShare = async (friendId) => {
    if (sentTo.has(friendId)) return;
    
    // content, conversationId, recipientId, mediaFile, sharedPostId
    await sendMessage('Check out this post!', null, friendId, null, postId);
    
    setSentTo(prev => new Set(prev).add(friendId));
    toast.success('Post shared successfully!');
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div onClick={handleBackdropClick} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white">Share to...</h3>
          <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search friends..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredFriends.length === 0 ? (
            <p className="text-center text-slate-500 text-sm mt-4">No friends found.</p>
          ) : (
            filteredFriends.map(friend => (
              <div key={friend._id} className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition">
                <div className="flex items-center gap-3">
                  <img src={friend.profileImage || `https://ui-avatars.com/api/?name=${friend.name}`} alt={friend.name} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-100">{friend.name}</h4>
                    <p className="text-xs text-slate-500">{friend.handle}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleShare(friend._id)}
                  disabled={sentTo.has(friend._id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1 ${
                    sentTo.has(friend._id) 
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed' 
                      : 'bg-primary text-white hover:bg-indigo-600 active:scale-95'
                  }`}
                >
                  {sentTo.has(friend._id) ? 'Sent' : 'Send'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SharePostModal;
