import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Heart, MessageCircle, UserPlus, Star, ChevronLeft, MoreHorizontal, AtSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import useFriendStore from '../store/useFriendStore';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';

const Notifications = () => {
  const [activeTab, setActiveTab] = useState('all');

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'likes', label: 'Likes' },
    { id: 'comments', label: 'Comments' },
    { id: 'mentions', label: 'Mentions' },
  ];

  const { requests, fetchRequests, respondRequest } = useFriendStore();
  const [realNotifications, setRealNotifications] = useState([]);

  useEffect(() => {
    fetchRequests();
    fetchRealNotifications();
  }, [fetchRequests]);

  const fetchRealNotifications = async () => {
    try {
      const res = await axios.get((import.meta.env.VITE_API_URL || 'http://localhost:5001') + '/api/notifications');
      setRealNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch real notifications', err);
    }
  };

  const markAsRead = async () => {
    try {
      await axios.put((import.meta.env.VITE_API_URL || 'http://localhost:5001') + '/api/notifications/read');
      fetchRealNotifications();
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const dummyNotifications = [];

  // Map incoming friend requests to notification format
  const mappedRequests = (requests?.incoming || []).map(req => ({
    id: req._id,
    type: 'request',
    user: { 
      name: req.requester?.name || 'Someone', 
      avatar: req.requester?.profileImage || `https://ui-avatars.com/api/?name=${req.requester?.name}` 
    },
    content: 'sent you a friend request.',
    time: formatDistanceToNow(new Date(req.createdAt), { addSuffix: true }),
    isNew: true,
    category: 'today',
    requestId: req._id
  }));

  // Map real backend notifications to UI format
  const mappedNotifications = realNotifications.map(notif => {
    let content = 'interacted with you.';
    let type = notif.type;
    
    if (notif.type === 'connected') {
      content = 'and you are connected now.';
      type = 'system'; // Or 'mention' to show a star icon
    } else if (notif.type === 'friend_request') {
      content = 'sent you a friend request.';
      type = 'request';
    } else if (notif.type === 'like') {
      content = 'liked your post.';
    } else if (notif.type === 'comment') {
      content = 'commented on your post.';
    } else if (notif.type === 'tag') {
      content = 'tagged you in a post.';
    }
    
    return {
      id: notif._id,
      type: type,
      user: {
        name: notif.sender?.name || 'Someone',
        avatar: notif.sender?.profileImage || `https://ui-avatars.com/api/?name=${notif.sender?.name}`
      },
      content: content,
      time: formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true }),
      isNew: !notif.isRead,
      category: 'today' // Ideally sort by date
    };
  });

  // Filter out any friend_request notifications that are ALSO in mappedRequests to avoid duplicates
  // Because mappedRequests are live 'pending' requests, while mappedNotifications are the Notification records
  const uniqueMappedNotifs = mappedNotifications.filter(mn => 
    !(mn.type === 'request' && mappedRequests.some(mr => mr.user.name === mn.user.name))
  );

  const notifications = [...mappedRequests, ...uniqueMappedNotifs, ...dummyNotifications];

  const getIcon = (type) => {
    switch (type) {
      case 'like': return <div className="w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center text-white absolute -bottom-1 -right-1 border-2 border-white dark:border-slate-900"><Heart className="w-3 h-3 fill-current" /></div>;
      case 'comment': return <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white absolute -bottom-1 -right-1 border-2 border-white dark:border-slate-900"><MessageCircle className="w-3 h-3 fill-current" /></div>;
      case 'tag': return <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white absolute -bottom-1 -right-1 border-2 border-white dark:border-slate-900"><AtSign className="w-3 h-3" /></div>;
      case 'mention': return <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white absolute -bottom-1 -right-1 border-2 border-white dark:border-slate-900"><Star className="w-3 h-3 fill-current" /></div>;
      case 'system': return <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white absolute -bottom-1 -right-1 border-2 border-white dark:border-slate-900"><Star className="w-3 h-3 fill-current" /></div>;
      case 'request': return <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white absolute -bottom-1 -right-1 border-2 border-white dark:border-slate-900"><UserPlus className="w-3 h-3" /></div>;
      default: return <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white absolute -bottom-1 -right-1 border-2 border-white dark:border-slate-900"><Bell className="w-3 h-3" /></div>;
    }
  };

  const filteredNotifs = notifications.filter(n => {
    if (activeTab === 'all') return true;
    if (activeTab === 'likes' && n.type === 'like') return true;
    if (activeTab === 'comments' && n.type === 'comment') return true;
    if (activeTab === 'mentions' && (n.type === 'mention' || n.type === 'tag')) return true;
    return false;
  });

  const todayNotifs = filteredNotifs.filter(n => n.category === 'today');
  const earlierNotifs = filteredNotifs.filter(n => n.category === 'earlier');

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 pb-24 h-screen overflow-y-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-6 glass-card p-4 sticky top-4 z-50">
        <div className="flex items-center gap-4">
          <Link to="/" className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6 text-slate-700 dark:text-slate-300" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Activity</h1>
            <p className="text-xs text-slate-500">Stay updated with your community.</p>
          </div>
        </div>
        <button onClick={markAsRead} className="text-xs font-bold text-primary hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-3 py-1.5 rounded-lg transition-colors">
          Mark All Read
        </button>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-6">
        
        {todayNotifs.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">Today</h3>
            <div className="glass-card overflow-hidden">
              {todayNotifs.map((notif, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={notif.id}
                  className={`p-4 flex gap-4 transition-colors ${notif.isNew ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'} ${i !== todayNotifs.length - 1 ? 'border-b border-slate-100 dark:border-slate-800' : ''}`}
                >
                  <div className="relative flex-shrink-0">
                    <img src={notif.user.avatar} alt="User" className="w-12 h-12 rounded-full object-cover" />
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      <span className="font-bold text-slate-900 dark:text-white mr-1">{notif.user.name}</span>
                      {notif.content}
                    </p>
                    <span className="text-xs text-slate-500 font-medium mt-1 block">{notif.time}</span>
                    
                    {/* Action buttons for requests */}
                    {notif.type === 'request' && notif.requestId && (
                      <div className="flex gap-2 mt-3">
                        <button 
                          onClick={() => {
                            respondRequest(notif.requestId, 'accepted');
                            fetchRequests();
                          }}
                          className="flex-1 bg-primary text-white py-1.5 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity"
                        >
                          Accept
                        </button>
                        <button 
                          onClick={() => {
                            respondRequest(notif.requestId, 'rejected');
                            fetchRequests();
                          }}
                          className="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                  {notif.isNew && <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {earlierNotifs.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-2 mt-2">Earlier</h3>
            <div className="glass-card overflow-hidden">
              {earlierNotifs.map((notif, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={notif.id}
                  className={`p-4 flex gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${i !== earlierNotifs.length - 1 ? 'border-b border-slate-100 dark:border-slate-800' : ''}`}
                >
                  <div className="relative flex-shrink-0 opacity-80">
                    <img src={notif.user.avatar} alt="User" className="w-12 h-12 rounded-full object-cover" />
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      <span className="font-bold text-slate-800 dark:text-slate-200 mr-1">{notif.user.name}</span>
                      {notif.content}
                    </p>
                    <span className="text-xs text-slate-500 font-medium mt-1 block">{notif.time}</span>
                  </div>
                  <button className="text-slate-400 hover:text-slate-600 self-start p-1"><MoreHorizontal className="w-4 h-4" /></button>
                </motion.div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Notifications;
