import React, { useState, useEffect } from 'react';
import { ChevronLeft, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useFriendStore from '../store/useFriendStore';

const FriendRequests = () => {
  const [activeTab, setActiveTab] = useState('incoming');
  const { requests, fetchRequests, respondRequest } = useFriendStore();

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const displayRequests = activeTab === 'incoming' ? requests.incoming : requests.sent;

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 pb-24 h-screen overflow-y-auto bg-surface dark:bg-surface-dark">
      {/* Header */}
      <header className="flex items-center gap-4 mb-6 sticky top-4 z-50 glass-card p-4">
        <Link to="/profile" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6 text-slate-700 dark:text-slate-300" />
        </Link>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          Friend Requests
          <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{displayRequests.length}</span>
        </h1>
      </header>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 px-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('incoming')}
          className={`pb-2 px-2 text-sm font-bold relative transition-colors ${activeTab === 'incoming' ? 'text-primary' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          Incoming
          {activeTab === 'incoming' && <motion.div layoutId="req-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`pb-2 px-2 text-sm font-bold relative transition-colors ${activeTab === 'sent' ? 'text-primary' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          Sent
          {activeTab === 'sent' && <motion.div layoutId="req-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
        </button>
      </div>

      {/* List */}
      <div className="space-y-4">
        <AnimatePresence>
          {displayRequests.length === 0 ? (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 text-slate-500">
               <Lock className="w-12 h-12 mx-auto mb-4 opacity-30" />
               <p>No {activeTab} friend requests.</p>
             </motion.div>
          ) : (
            displayRequests.map(req => {
              const user = activeTab === 'incoming' ? req.requester : req.recipient;
              return (
                <motion.div 
                  key={req._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass-card p-5 flex flex-col items-center text-center"
                >
                  <img src={user.profileImage || `https://ui-avatars.com/api/?name=${user.name}`} className="w-20 h-20 rounded-full object-cover shadow-md mb-3" alt={user.name} />
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg">{user.name}</h3>
                  <p className="text-xs text-slate-500 font-medium mb-1">{user.handle}</p>

                  <div className="flex w-full gap-3 mt-4">
                    {activeTab === 'incoming' ? (
                      <>
                        <button onClick={() => respondRequest(req._id, 'rejected')} className="flex-1 py-2 rounded-xl text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                          Reject
                        </button>
                        <button onClick={() => respondRequest(req._id, 'accepted')} className="flex-1 py-2 rounded-xl text-sm font-bold bg-primary text-white shadow-lg shadow-primary/30 hover:opacity-90 transition-opacity">
                          Accept
                        </button>
                      </>
                    ) : (
                      <button disabled className="w-full py-2 rounded-xl text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                        Request Pending...
                      </button>
                    )}
                  </div>
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </div>

    </div>
  );
};

export default FriendRequests;
