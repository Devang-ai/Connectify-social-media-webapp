import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import usePostStore from '../store/usePostStore';
import useFriendStore from '../store/useFriendStore';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Briefcase, Calendar, Edit3, Image as ImageIcon, Users, LayoutGrid, UserPlus, Settings, Check, Clock } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import EditProfileModal from '../components/EditProfileModal';
import PostCard from '../components/PostCard';

const Profile = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  
  const isMyProfile = !id || id === currentUser?._id || id === currentUser?.id;
  
  const { posts: feedPosts, fetchFeed, getUserPosts } = usePostStore();
  const { friends: myFriends, fetchFriends, getUserProfile, sendRequest, requests } = useFriendStore();
  
  const [profileData, setProfileData] = useState(null);
  const [profilePosts, setProfilePosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('posts');
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      if (isMyProfile) {
        setProfileData(currentUser);
        setProfilePosts(feedPosts.filter(p => p.author?._id === (currentUser?._id || currentUser?.id)));
        await fetchFriends();
      } else {
        const data = await getUserProfile(id);
        setProfileData(data);
        const posts = await getUserPosts(id);
        setProfilePosts(posts);
      }
      setIsLoading(false);
    };
    
    loadProfile();
  }, [id, isMyProfile, currentUser, feedPosts, fetchFriends, getUserProfile, getUserPosts]);

  // If feed updates (e.g. we delete a post), re-sync profilePosts if it's my profile
  useEffect(() => {
    if (isMyProfile) {
      setProfilePosts(feedPosts.filter(p => p.author?._id === (currentUser?._id || currentUser?.id)));
    }
  }, [feedPosts, isMyProfile, currentUser]);

  const tabs = [
    { id: 'posts', label: 'Posts', icon: LayoutGrid },
    { id: 'photos', label: 'Photos', icon: ImageIcon },
    { id: 'friends', label: 'Friends', icon: Users },
  ];

  const userPhotos = profilePosts.filter(p => p.mediaUrl);
  const profileFriends = isMyProfile ? myFriends : (profileData?.friends || []);

  const isFriend = myFriends.some(f => f._id === id);
  const isRequestSent = requests?.sent?.some(r => r.recipient?._id === id);

  const handleFollow = async () => {
    if (!isFriend && !isRequestSent) {
      try {
        await sendRequest(id);
        toast.success('Friend request sent!');
      } catch (error) {
        toast.error('Failed to send friend request');
      }
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!profileData) {
    return <div className="text-center py-20 text-slate-500">User not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <EditProfileModal isOpen={isEditProfileOpen} onClose={() => setIsEditProfileOpen(false)} />
      
      {/* Hero Section */}
      <section className="relative">
        {/* Settings Icon Top Right */}
        {isMyProfile && (
          <div className="absolute top-4 right-4 z-20">
            <Link to="/settings" className="bg-black/20 hover:bg-black/40 backdrop-blur-md p-2 rounded-full text-white transition-colors block">
              <Settings className="w-5 h-5" />
            </Link>
          </div>
        )}

        {/* Cover Photo */}
        <div className="h-48 md:h-64 w-full overflow-hidden bg-slate-200 dark:bg-slate-800">
          <img 
            src={profileData?.coverImage || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809'} 
            alt="Cover" 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Profile Info Overlap */}
        <div className="px-4 -mt-16 flex flex-col md:flex-row items-start md:items-end relative z-10 gap-4">
          <div className="relative">
            <div className="w-32 h-32 rounded-full border-4 border-surface dark:border-surface-dark overflow-hidden bg-white shadow-lg shadow-indigo-500/20">
              <img 
                src={profileData?.profileImage || `https://ui-avatars.com/api/?name=${profileData?.name || 'User'}&background=6366f1&color=fff&size=200`} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="flex-1 w-full pt-2 flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{profileData?.name}</h2>
              <p className="text-slate-500 font-medium">{profileData?.handle}</p>
            </div>
            
            {isMyProfile ? (
              <button onClick={() => setIsEditProfileOpen(true)} className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg shadow-primary/30 active:scale-95 transition-all flex items-center gap-2">
                <Edit3 className="w-4 h-4" /> Edit Profile
              </button>
            ) : (
              <button 
                onClick={handleFollow}
                disabled={isRequestSent || isFriend}
                className={`px-4 py-2 rounded-xl text-sm font-medium shadow-lg transition-all flex items-center gap-2 ${
                  isFriend ? 'bg-emerald-500 text-white' : 
                  isRequestSent ? 'bg-slate-200 text-slate-500 dark:bg-slate-800' : 
                  'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-primary/30 hover:scale-105 active:scale-95'
                }`}
              >
                {isFriend ? <><Check className="w-4 h-4" /> Friends</> : 
                 isRequestSent ? <><Clock className="w-4 h-4" /> Requested</> : 
                 <><UserPlus className="w-4 h-4" /> Follow</>}
              </button>
            )}
          </div>
        </div>

        {/* Bio & Details */}
        <div className="px-4 mt-6 max-w-2xl">
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
            {profileData?.bio || 'No bio provided yet.'}
          </p>
          
          <div className="flex flex-wrap gap-4 text-slate-500 text-sm font-medium">
            {profileData?.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> {profileData.location}
              </div>
            )}
            {profileData?.education && (
              <div className="flex items-center gap-1.5">
                <Briefcase className="w-4 h-4" /> {profileData.education}
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" /> Joined recently
            </div>
          </div>

          <div className="flex gap-6 mt-4">
            <div><span className="font-bold text-slate-900 dark:text-white">{profileFriends.length}</span> <span className="text-slate-500 text-sm">Friends</span></div>
            <div><span className="font-bold text-slate-900 dark:text-white">{profilePosts.length}</span> <span className="text-slate-500 text-sm">Posts</span></div>
            {!isMyProfile && profileData?.mutualFriendsCount > 0 && (
              <div><span className="font-bold text-slate-900 dark:text-white">{profileData.mutualFriendsCount}</span> <span className="text-slate-500 text-sm">Mutual Friends</span></div>
            )}
          </div>
        </div>
      </section>

      {/* Tab Navigation */}
      <nav className="mt-8 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-surface/80 dark:bg-surface-dark/80 backdrop-blur-md z-40">
        <div className="flex justify-around max-w-xl mx-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 pb-4 flex flex-col items-center gap-1 relative text-sm font-medium transition-colors ${activeTab === tab.id ? 'text-primary' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <div className="flex items-center gap-2">
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </div>
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="tab-indicator"
                  className="absolute bottom-0 w-12 h-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-t-full"
                />
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Content Area */}
      <section className="mt-6 px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'posts' && (
              <div className="space-y-4">
                {profilePosts.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">No posts yet.</p>
                ) : (
                  profilePosts.map((post, index) => (
                    <PostCard key={post._id} post={post} index={index} />
                  ))
                )}
              </div>
            )}
            
            {activeTab === 'photos' && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {userPhotos.length === 0 ? (
                   <div className="col-span-3 text-center py-12 text-slate-500">
                     <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                     <p>No photos uploaded yet.</p>
                   </div>
                ) : (
                  userPhotos.map(post => (
                    <div key={post._id} className="aspect-square rounded-2xl overflow-hidden relative group bg-slate-900 flex items-center justify-center">
                      {post.mediaType === 'video' ? (
                        <video 
                          src={post.mediaUrl} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                          muted 
                          playsInline 
                        />
                      ) : (
                        <img 
                          src={post.mediaUrl} 
                          alt="Post" 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                        />
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'friends' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {profileFriends.length === 0 ? (
                  <div className="col-span-2 text-center py-12 text-slate-500">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No friends yet.</p>
                  </div>
                ) : (
                  profileFriends.map(friend => (
                    <Link to={`/profile/${friend._id}`} key={friend._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <img src={friend.profileImage || `https://ui-avatars.com/api/?name=${friend.name}`} className="w-12 h-12 rounded-full" />
                      <div>
                        <h4 className="font-bold text-sm dark:text-white hover:underline">{friend.name}</h4>
                        <p className="text-xs text-slate-500">{friend.handle}</p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </section>
    </div>
  );
};

export default Profile;
