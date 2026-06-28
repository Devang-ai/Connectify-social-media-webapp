import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import useMessageStore from '../store/useMessageStore';
import useFriendStore from '../store/useFriendStore';
import { Search, MoreVertical, Phone, Video, Image as ImageIcon, Smile, Send, Paperclip, MessageCircle, Users, X } from 'lucide-react';
import { motion } from 'framer-motion';
import EmojiPicker from 'emoji-picker-react';
import { formatDistanceToNow } from 'date-fns';

const Messages = () => {
  const { user } = useAuth();
  const { conversations, messages, currentChat, fetchConversations, fetchMessages, sendMessage, setActiveCallTarget, setIsVideoCall, clearChat } = useMessageStore();
  const { friends, fetchFriends } = useFriendStore();
  const [activeChatId, setActiveChatId] = useState(null);
  const [activeFriend, setActiveFriend] = useState(null);
  const [text, setText] = useState('');
  
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchConversations();
    fetchFriends();
  }, [fetchConversations, fetchFriends]);

  useEffect(() => {
    if (activeChatId) {
      fetchMessages(activeChatId);
    }
  }, [activeChatId, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
      setShowEmojiPicker(false);
    }
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = () => {
    if (!text.trim() && !mediaFile) return;
    sendMessage(text, activeChatId, activeFriend?._id, mediaFile); 
    setText('');
    removeMedia();
    setShowEmojiPicker(false);
  };

  const onEmojiClick = (emojiObject) => {
    setText(prev => prev + emojiObject.emoji);
  };

  const getOtherParticipant = (chat) => {
    return chat.participants.find(p => p._id !== (user?._id || user?.id)) || chat.participants[0];
  };

  const activeConversation = conversations.find(c => c._id === activeChatId);
  const activeUser = activeConversation ? getOtherParticipant(activeConversation) : activeFriend;

  const handleFriendSelect = (friend) => {
    // Check if conversation already exists
    const existingChat = conversations.find(c => c.participants.some(p => p._id === friend._id));
    if (existingChat) {
      setActiveChatId(existingChat._id);
      setActiveFriend(null);
    } else {
      setActiveChatId(null);
      setActiveFriend(friend);
      // Clear messages for new chat
      useMessageStore.setState({ messages: [] });
    }
  };

  const startCall = (isVideo) => {
    if (!activeUser) return;
    setIsVideoCall(isVideo);
    setActiveCallTarget(activeUser);
  };

  const handleClearChat = () => {
    if (activeChatId) {
      clearChat(activeChatId);
    }
    setShowMenu(false);
  };

  return (
    <div className="h-[100dvh] flex overflow-hidden bg-surface dark:bg-surface-dark pt-4">
      {/* Sidebar Chat List */}
      <div className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-surface dark:bg-slate-900 overflow-hidden transition-all duration-300 ${activeChatId || activeFriend ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 flex flex-col gap-4">
          <h2 className="text-xl font-bold gradient-text">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search friends..." 
              className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all text-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide pb-24 md:pb-0">
          {friends.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No friends to message yet.</div>
          ) : (
            friends.map((friend) => {
              const chat = conversations.find(c => c.participants.some(p => p._id === friend._id));
              const isActive = activeFriend?._id === friend._id || activeChatId === chat?._id;

              return (
                <div 
                  key={friend._id} 
                  onClick={() => handleFriendSelect(friend)}
                  className={`p-4 flex items-center gap-4 cursor-pointer transition-colors ${isActive ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-primary' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                  <div className="relative flex-shrink-0">
                    <img src={friend.profileImage || `https://ui-avatars.com/api/?name=${friend.name}`} alt={friend.name} className="w-12 h-12 rounded-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-semibold text-sm truncate dark:text-slate-200">{friend.name}</h3>
                      {chat?.lastMessage && (
                        <span className={`text-[10px] ${isActive ? 'text-primary font-bold' : 'text-slate-500'}`}>
                          {formatDistanceToNow(new Date(chat.lastMessage.createdAt))} ago
                        </span>
                      )}
                    </div>
                    {chat?.lastMessage ? (
                      <p className={`text-xs truncate ${isActive ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-500'}`}>
                        {chat.lastMessage.text}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500">{friend.handle}</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Active Chat Window */}
      {activeChatId || activeFriend ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-950 md:relative md:z-auto md:inset-auto md:flex-1">
          {/* Chat Header */}
          <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 glass z-10">
            <div className="flex items-center gap-4">
              <button className="md:hidden text-slate-500" onClick={() => { setActiveChatId(null); setActiveFriend(null); }}>←</button>
              <div className="relative">
                <img src={activeUser?.profileImage || `https://ui-avatars.com/api/?name=${activeUser?.name}`} alt={activeUser?.name} className="w-10 h-10 rounded-full object-cover" />
              </div>
              <div>
                <h2 className="font-bold text-slate-800 dark:text-slate-100">{activeUser?.name}</h2>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <button onClick={() => startCall(true)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><Video className="w-5 h-5" /></button>
              <button onClick={() => startCall(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><Phone className="w-5 h-5" /></button>
              <div className="relative">
                <button onClick={() => setShowMenu(!showMenu)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)}></div>
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl py-1 z-50 border border-slate-100 dark:border-slate-700">
                      <button 
                        onClick={handleClearChat}
                        className="w-full text-left px-4 py-2 text-sm text-rose-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
                      >
                        Clear Chat
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Messages Content */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 scrollbar-hide">
            {messages.map((msg, i) => {
              const isMe = msg.sender?._id === (user?._id || user?.id);
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={msg._id} 
                  className={`flex gap-3 max-w-[80%] ${isMe ? 'self-end flex-row-reverse' : ''}`}
                >
                  {!isMe && <img src={msg.sender?.profileImage || `https://ui-avatars.com/api/?name=${msg.sender?.name}`} alt="Avatar" className="w-8 h-8 rounded-full object-cover shrink-0 self-end mb-1" />}
                  <div className={`flex flex-col gap-1 ${isMe ? 'items-end' : ''}`}>
                    <div className={`p-3 md:p-4 shadow-sm ${isMe ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl rounded-br-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl rounded-bl-sm'}`}>
                      {msg.mediaUrl && <img src={msg.mediaUrl} alt="Attachment" className="w-full max-w-xs rounded-xl object-cover mb-2" />}
                      <p className="text-sm">{msg.text}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 px-2">{formatDistanceToNow(new Date(msg.createdAt))} ago</span>
                  </div>
                </motion.div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="relative p-4 border-t border-slate-200 dark:border-slate-800 glass pb-[env(safe-area-inset-bottom,16px)] shrink-0">
            
            {showEmojiPicker && (
              <div className="absolute bottom-[calc(100%+8px)] left-4 z-50">
                <EmojiPicker onEmojiClick={onEmojiClick} theme="auto" />
              </div>
            )}

            {mediaPreview && (
              <div className="absolute bottom-[calc(100%+8px)] left-4 z-40 bg-slate-100 dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg">
                <div className="relative">
                  <button onClick={removeMedia} className="absolute -top-2 -right-2 bg-slate-900/50 hover:bg-slate-900/80 text-white p-1 rounded-full backdrop-blur-md transition-colors z-10">
                    <X className="w-4 h-4" />
                  </button>
                  <img src={mediaPreview} alt="Attachment Preview" className="h-32 rounded-xl object-contain" />
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-2 focus-within:ring-2 focus-within:ring-primary transition-all">
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
              <button onClick={() => fileInputRef.current?.click()} className="text-slate-400 hover:text-primary transition-colors"><Paperclip className="w-5 h-5" /></button>
              <input 
                type="text" 
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                onFocus={() => setShowEmojiPicker(false)}
                placeholder="Type a message..." 
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 px-2 outline-none dark:text-white min-w-0"
              />
              <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`transition-colors ${showEmojiPicker ? 'text-primary' : 'text-slate-400 hover:text-primary'}`}><Smile className="w-5 h-5" /></button>
              <button onClick={handleSend} disabled={!text.trim() && !mediaFile} className="bg-primary text-white p-2 rounded-xl hover:bg-indigo-600 transition-colors shadow-lg shadow-primary/30 active:scale-95 disabled:opacity-50 flex-shrink-0">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-slate-50 dark:bg-slate-900/50">
           <p className="text-slate-500">Select a conversation to start messaging</p>
        </div>
      )}
    </div>
  );
};

export default Messages;
