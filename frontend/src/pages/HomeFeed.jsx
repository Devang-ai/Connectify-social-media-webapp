import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Search, MessageCircle, PlusSquare } from 'lucide-react';
import usePostStore from '../store/usePostStore';
import useFriendStore from '../store/useFriendStore';
import useStoryStore from '../store/useStoryStore';
import PostCard from '../components/PostCard';
import StoryViewer from '../components/StoryViewer';
import CreateStoryModal from '../components/CreateStoryModal';
import CreatePostModal from '../components/CreatePostModal';

const HomeFeed = () => {
  const { user } = useAuth();
  const { posts, isLoading, fetchFeed } = usePostStore();
  const { fetchFriends, fetchRequests } = useFriendStore();

  const { stories, isLoading: isLoadingStories, fetchStories, createStory } = useStoryStore();
  const fileInputRef = React.useRef(null);
  const [activeStoryGroupIndex, setActiveStoryGroupIndex] = React.useState(null);
  const [selectedStoryFile, setSelectedStoryFile] = React.useState(null);
  const [showStoryOptions, setShowStoryOptions] = React.useState(false);
  
  // New Capture states
  const [capturedFile, setCapturedFile] = React.useState(null);
  const [showShareModal, setShowShareModal] = React.useState(false);
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = React.useState(false);

  useEffect(() => {
    fetchFeed();
    fetchFriends();
    fetchRequests();
    fetchStories();
  }, [fetchFeed, fetchFriends, fetchRequests, fetchStories]);

  const handleAddStoryClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCapturedFile(file);
      setShowShareModal(true);
    }
    // reset input so same file can be selected again
    e.target.value = '';
  };

  const handlePostStory = async (file, textOverlays) => {
    await createStory(file, textOverlays);
    setSelectedStoryFile(null);
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 pb-24">
      {/* Top Header */}
      <header className="flex items-center justify-between mb-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-4 sticky top-4 z-50">
        {/* Left: Plus Icon & Search */}
        <div className="flex items-center gap-4 flex-1">
          <button onClick={handleAddStoryClick} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors relative">
            <PlusSquare className="w-6 h-6 text-slate-700 dark:text-slate-300" />
          </button>
          <div className="hidden md:flex flex-1 max-w-xs relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full bg-slate-100 dark:bg-slate-800 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all text-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Center: Logo */}
        <div className="flex-1 flex justify-center">
          <h1 className="text-3xl tracking-wide font-logo font-medium text-slate-800 dark:text-white">Connectify</h1>
        </div>
        
        {/* Right: Chat */}
        <div className="flex items-center justify-end flex-1">
          <Link to="/messages" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors relative">
            <MessageCircle className="w-6 h-6 text-slate-700 dark:text-slate-300" />
          </Link>
        </div>
      </header>

      {/* Stories Section */}
      <div className="flex gap-4 overflow-x-auto pb-4 mb-6 scrollbar-hide -mx-4 px-4 relative">
        
        {/* Your Story Button */}
        {(() => {
          const userId = user?._id || user?.id;
          const currentUserStoryGroupIndex = stories.findIndex(g => g.user._id === userId);
          const hasUploadedStory = currentUserStoryGroupIndex !== -1;
          const otherStories = stories.filter(g => g.user._id !== userId);

          return (
            <>
              <div className="relative flex-shrink-0">
                <div 
                  className="flex flex-col items-center gap-1 cursor-pointer group" 
                  onClick={() => {
                    if (hasUploadedStory) {
                      setShowStoryOptions(true);
                    } else {
                      handleAddStoryClick();
                    }
                  }}
                >
                  <div className={`p-[2px] rounded-full relative ${hasUploadedStory ? 'bg-gradient-to-tr from-indigo-500 to-purple-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
                    <div className="bg-white dark:bg-slate-900 rounded-full p-[2px]">
                      <img src={user?.profileImage || `https://ui-avatars.com/api/?name=${user?.name}`} alt="Your Story" className="w-14 h-14 rounded-full object-cover group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="absolute bottom-0 right-0 bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center border-2 border-white dark:border-slate-900">
                      <span className="text-sm leading-none pb-0.5">+</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">Your Story</span>
                </div>
              </div>
              
              {/* User Stories */}
              {isLoadingStories ? (
                 <div className="w-14 h-14 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse flex-shrink-0 mt-[2px]" />
              ) : (
                otherStories.map((group) => {
                  const originalIndex = stories.findIndex(g => g === group);
                  return (
                    <div 
                      key={group.user._id} 
                      className="flex flex-col items-center gap-1 cursor-pointer group flex-shrink-0"
                      onClick={() => setActiveStoryGroupIndex(originalIndex)}
                    >
                      <div className="p-[2px] rounded-full relative bg-gradient-to-tr from-indigo-500 to-purple-600">
                        <div className="bg-white dark:bg-slate-900 rounded-full p-[2px]">
                          <img src={group.user.profileImage || `https://ui-avatars.com/api/?name=${group.user.name}`} alt={group.user.name} className="w-14 h-14 rounded-full object-cover group-hover:scale-110 transition-transform" />
                        </div>
                      </div>
                      <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">{group.user.name.split(' ')[0]}</span>
                    </div>
                  );
                })
              )}
            </>
          );
        })()}
        
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" capture="environment" onChange={handleFileChange} />
      </div>

      {/* Action Modal for Your Story */}
      {showStoryOptions && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 sm:px-4 pb-4 sm:pb-0">
          <div 
            className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl p-4 w-full max-w-sm flex flex-col gap-2 shadow-2xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-slate-300 dark:bg-slate-600 rounded-full mx-auto mb-2 sm:hidden" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 text-center">Your Story</h3>
            <button 
              onClick={() => {
                const userId = user?._id || user?.id;
                const idx = stories.findIndex(g => g.user._id === userId);
                setActiveStoryGroupIndex(idx);
                setShowStoryOptions(false);
              }}
              className="w-full bg-indigo-50 hover:bg-indigo-100 dark:bg-slate-700 dark:hover:bg-slate-600 text-indigo-600 dark:text-indigo-400 font-semibold py-3 rounded-xl transition"
            >
              View Story
            </button>
            <button 
              onClick={() => {
                handleAddStoryClick();
                setShowStoryOptions(false);
              }}
              className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-semibold py-3 rounded-xl transition"
            >
              Add New Story
            </button>
            <button 
              onClick={() => setShowStoryOptions(false)}
              className="w-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium py-3 mt-2 rounded-xl transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {activeStoryGroupIndex !== null && (
        <StoryViewer 
          allGroups={stories} 
          initialGroupIndex={activeStoryGroupIndex} 
          onClose={() => setActiveStoryGroupIndex(null)} 
        />
      )}

      {selectedStoryFile && (
        <CreateStoryModal 
          file={selectedStoryFile}
          onClose={() => setSelectedStoryFile(null)}
          onPost={handlePostStory}
        />
      )}

      {/* Share To Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 sm:px-4 pb-4 sm:pb-0">
          <div 
            className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl p-4 w-full max-w-sm flex flex-col gap-2 shadow-2xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-slate-300 dark:bg-slate-600 rounded-full mx-auto mb-2 sm:hidden" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 text-center">Share To</h3>
            <button 
              onClick={() => {
                setSelectedStoryFile(capturedFile);
                setShowShareModal(false);
              }}
              className="w-full bg-indigo-50 hover:bg-indigo-100 dark:bg-slate-700 dark:hover:bg-slate-600 text-indigo-600 dark:text-indigo-400 font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
            >
              Your Story
            </button>
            <button 
              onClick={() => {
                setIsCreatePostModalOpen(true);
                setShowShareModal(false);
              }}
              className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
            >
              Create Post
            </button>
            <button 
              onClick={() => {
                setShowShareModal(false);
                setCapturedFile(null);
              }}
              className="w-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium py-3 mt-2 rounded-xl transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <CreatePostModal 
        isOpen={isCreatePostModalOpen} 
        onClose={() => {
          setIsCreatePostModalOpen(false);
          setCapturedFile(null);
        }} 
        initialMedia={capturedFile}
      />



      {/* Feed */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          posts.map((post, index) => (
            <PostCard key={post._id} post={post} index={index} />
          ))
        )}
      </div>
    </div>
  );
};

export default HomeFeed;
