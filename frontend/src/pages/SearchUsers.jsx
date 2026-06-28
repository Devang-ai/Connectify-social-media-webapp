import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import useFriendStore from '../store/useFriendStore';
import { Search, SlidersHorizontal, UserPlus, Check, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const SearchUsers = () => {
  const { user } = useAuth();
  const { searchResults, searchUsers, sendRequest, isLoading, fetchRequests, requests, fetchFriends, friends } = useFriendStore();
  const [query, setQuery] = useState('');
  const [localSent, setLocalSent] = useState({});

  useEffect(() => {
    // Fetch initial users and current friend requests
    searchUsers('');
    fetchRequests();
    fetchFriends();
  }, [searchUsers, fetchRequests, fetchFriends]);

  const handleSearch = (e) => {
    setQuery(e.target.value);
    searchUsers(e.target.value);
  };

  const handleSendRequest = async (id) => {
    // Optimistic UI update: immediately show "Request Sent"
    setLocalSent(prev => ({ ...prev, [id]: true }));
    await sendRequest(id);
    // Refresh backend state
    fetchRequests();
  };

  // Helper to check if request is sent from backend state
  const isUserSent = (userId) => {
    if (!requests || !requests.sent) return false;
    return requests.sent.some(req => {
      const recId = req.recipient?._id || req.recipient;
      return String(recId) === String(userId);
    });
  };

  // Helper to check if request is incoming from the user
  const isUserIncoming = (userId) => {
    if (!requests || !requests.incoming) return false;
    return requests.incoming.some(req => {
      const reqId = req.requester?._id || req.requester;
      return String(reqId) === String(userId);
    });
  };

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 pb-24 h-screen overflow-y-auto">
      {/* Header */}
      <header className="flex flex-col gap-4 mb-6 sticky top-0 z-50 bg-surface/90 dark:bg-surface-dark/90 backdrop-blur-md pt-4 pb-2">
        <div className="flex items-center gap-4">
          <Link to="/" className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6 text-slate-700 dark:text-slate-300" />
          </Link>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Search Users</h1>
            <p className="text-xs text-slate-500 mt-1 px-4 md:px-0">Find creatives, developers, and visionaries to expand your network.</p>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              value={query}
              onChange={handleSearch}
              placeholder="Designers in San Francisco..." 
              className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all text-slate-800 dark:text-slate-100 shadow-inner"
            />
          </div>
          <button className="bg-primary text-white px-4 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-primary/30">
            <span className="hidden sm:inline text-sm font-bold">Filter</span>
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Results */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="text-center text-slate-500 py-12">
             <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
             <p>No users found matching your search.</p>
          </div>
        ) : (
          searchResults.filter(u => u._id !== (user?._id || user?.id)).map((result) => {
            // Check if request is sent (optimistic OR backend confirmed)
            const isSent = localSent[result._id] || isUserSent(result._id);
            // Check if request is incoming
            const isIncoming = isUserIncoming(result._id);
            // Check if they are already friends
            const isFriend = friends.some(f => String(f._id) === String(result._id));
            
            return (
              <div key={result._id} className="glass-card p-5 flex flex-col items-center text-center">
                <Link to={`/profile/${result._id}`} className="flex flex-col items-center hover:opacity-80 transition-opacity">
                  <img 
                    src={result.profileImage || `https://ui-avatars.com/api/?name=${result.name}`} 
                    className="w-20 h-20 rounded-full object-cover shadow-md mb-3" 
                    alt={result.name}
                  />
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg">{result.name}</h3>
                  <p className="text-xs text-primary font-medium mb-1">{result.handle}</p>
                </Link>
                
                <div className="flex items-center justify-center gap-4 text-xs text-slate-500 mt-2 mb-4">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {result.mutualFriendsCount || 0} Mutual friends</span>
                </div>

                {isFriend ? (
                  <button 
                    disabled
                    className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                  >
                    <Check className="w-4 h-4" /> Friends
                  </button>
                ) : isIncoming ? (
                  <button 
                    disabled
                    className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                  >
                    <Check className="w-4 h-4" /> Request Received
                  </button>
                ) : isSent ? (
                  <button 
                    disabled
                    className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-500 transition-all"
                  >
                    <Check className="w-4 h-4" /> Request Sent
                  </button>
                ) : (
                  <button 
                    onClick={() => !isSent && handleSendRequest(result._id)}
                    disabled={isSent}
                    className={`w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${isSent ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : 'bg-primary text-white shadow-lg shadow-primary/30 hover:opacity-90 active:scale-95'}`}
                  >
                    {isSent ? (
                      <><Check className="w-4 h-4" /> Request Sent</>
                    ) : (
                      <><UserPlus className="w-4 h-4" /> Send Friend Request</>
                    )}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// Quick fix for missing Users icon in this file scope
import { Users } from 'lucide-react';
export default SearchUsers;
