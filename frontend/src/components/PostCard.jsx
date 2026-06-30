import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import usePostStore from '../store/usePostStore';
import useFriendStore from '../store/useFriendStore';
import { Heart, MessageCircle, Share2, MoreVertical, Send, MapPin, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import SharePostModal from './SharePostModal';

const PostCard = ({ post, index = 0 }) => {
  const { user } = useAuth();
  const { likePost, addComment, deletePost } = usePostStore();
  const { friends, requests, fetchRequests, sendRequest } = useFriendStore();
  
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  const handleFollow = async (userId) => {
    try {
      await sendRequest(userId);
      fetchRequests();
    } catch (error) {
      toast.error('Failed to send request.');
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      await addComment(post._id, commentText);
      setCommentText('');
    } catch (error) {
      toast.error('Failed to add comment.');
    }
  };

  const hasLiked = post.likes.includes(user?._id || user?.id);
  const authorId = post.author?._id || post.author?.id;
  const isMe = authorId === (user?._id || user?.id);
  const isFriend = friends.some(f => f._id === authorId);
  const isRequestSent = requests?.sent?.some(r => r.recipient?._id === authorId);

  if (isHidden) return null;

  if (post.mediaType === 'video') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.1 }}
        className="relative w-full max-w-sm mx-auto h-[80vh] md:h-[85vh] rounded-3xl overflow-hidden bg-black shadow-2xl flex-shrink-0 snap-center mb-8 border border-slate-200 dark:border-slate-800"
      >
        <video 
          src={post.mediaUrl} 
          controls 
          autoPlay 
          muted 
          loop 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

        <div className="absolute top-4 right-4 z-10">
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="text-white drop-shadow-md bg-black/40 p-2 rounded-full hover:bg-black/60 transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)}></div>
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl py-1 z-50 border border-slate-100 dark:border-slate-700">
                  {isMe ? (
                    <button 
                      onClick={async () => {
                        try {
                          await deletePost(post._id);
                          toast.success('Post deleted');
                        } catch (error) {
                          toast.error('Failed to delete post');
                        }
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-rose-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" /> Delete Post
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={() => { setShowMenu(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
                      >
                        Report Post
                      </button>
                      <button 
                        onClick={() => { setIsHidden(true); setShowMenu(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
                      >
                        Hide Post
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="absolute right-4 bottom-20 flex flex-col items-center gap-6 z-10">
          <button onClick={() => likePost(post._id)} className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/10 hover:bg-black/60 transition transform active:scale-95">
              <Heart className={`w-6 h-6 ${hasLiked ? 'fill-rose-500 text-rose-500' : 'text-white'}`} />
            </div>
            <span className="text-white text-xs font-bold drop-shadow-md">{post.likes.length}</span>
          </button>

          <button onClick={() => setShowComments(!showComments)} className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/10 hover:bg-black/60 transition transform active:scale-95">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-xs font-bold drop-shadow-md">{post.comments?.length || 0}</span>
          </button>

          <button onClick={() => setIsShareModalOpen(true)} className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/10 hover:bg-black/60 transition transform active:scale-95">
              <Share2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-xs font-bold drop-shadow-md">Share</span>
          </button>
        </div>

        <div className="absolute bottom-4 left-4 right-20 z-10">
          <div className="flex items-center gap-3 mb-3">
            <img src={post.author?.profileImage || `https://ui-avatars.com/api/?name=${post.author?.name}`} alt="" className="w-10 h-10 rounded-full border-2 border-white/50 object-cover" />
            <div>
              <h3 className="text-white font-bold text-sm drop-shadow-md flex items-center gap-2">
                <Link to={`/profile/${authorId}`} className="hover:underline">{post.author?.name}</Link>
                {!isMe && !isFriend && (
                  <button 
                    onClick={() => !isRequestSent && handleFollow(authorId)}
                    disabled={isRequestSent}
                    className={`px-2 py-0.5 rounded-full border border-white/50 text-white text-[10px] font-bold backdrop-blur-sm transition ${isRequestSent ? 'opacity-70 cursor-not-allowed' : 'hover:bg-white/20'}`}
                  >
                    {isRequestSent ? 'Request Sent' : 'Follow'}
                  </button>
                )}
              </h3>
              <p className="text-white/80 text-xs drop-shadow-md">{post.author?.handle} • Original Audio</p>
            </div>
          </div>
          <p className="text-white text-sm line-clamp-2 drop-shadow-md">{post.content}</p>
          {post.location && (
            <p className="text-white/70 text-xs mt-1 flex items-center gap-1 drop-shadow-md">
              <MapPin className="w-3 h-3" /> {post.location}
            </p>
          )}
        </div>

        {showComments && (
          <div className="absolute inset-x-0 bottom-0 h-3/5 bg-white dark:bg-slate-900 rounded-t-3xl z-20 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.3)] transform transition-transform">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-6" />
              <h4 className="font-bold text-slate-800 dark:text-white">Comments</h4>
              <button onClick={() => setShowComments(false)} className="text-slate-500 w-6 font-bold hover:text-slate-800 dark:hover:text-white">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
              {post.comments?.length === 0 && <p className="text-center text-slate-500 text-sm mt-4">Be the first to comment.</p>}
              {post.comments?.map(comment => (
                <div key={comment._id} className="flex gap-3">
                  <img src={comment.author?.profileImage || `https://ui-avatars.com/api/?name=${comment.author?.name}`} alt="" className="w-8 h-8 rounded-full object-cover mt-1" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {comment.author?.name} 
                      <span className="text-slate-400 font-normal ml-2">{formatDistanceToNow(new Date(comment.createdAt))}</span>
                    </p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-0.5">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleCommentSubmit} className="p-3 border-t border-slate-100 dark:border-slate-800 flex gap-3 items-center bg-slate-50 dark:bg-slate-900 pb-[env(safe-area-inset-bottom,16px)]">
              <img src={user?.profileImage || `https://ui-avatars.com/api/?name=${user?.name}`} className="w-8 h-8 rounded-full object-cover" alt="Me" />
              <div className="flex-1 relative">
                <input 
                  type="text" 
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full bg-slate-200 dark:bg-slate-800 rounded-full pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary dark:text-slate-100"
                />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-primary p-1 rounded-full hover:bg-slate-300 dark:hover:bg-slate-700 transition">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}
        
        <SharePostModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} postId={post._id} />
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 rounded-2xl overflow-hidden mb-6"
    >
      <div className="p-4 flex justify-between items-start">
        <div className="flex gap-3">
          <img src={post.author?.profileImage || `https://ui-avatars.com/api/?name=${post.author?.name}`} alt={post.author?.name} className="w-10 h-10 rounded-full object-cover" />
          <div>
            <h3 className="font-semibold text-sm flex items-center flex-wrap gap-x-2">
              <Link to={`/profile/${authorId}`} className="hover:underline hover:text-primary transition-colors">{post.author?.name}</Link>
              {!isMe && !isFriend && (
                <button 
                  onClick={() => !isRequestSent && handleFollow(authorId)}
                  disabled={isRequestSent}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${isRequestSent ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95'}`}
                >
                  {isRequestSent ? 'Request Sent' : 'Follow'}
                </button>
              )}
            </h3>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              {post.author?.handle} • {formatDistanceToNow(new Date(post.createdAt))} ago
              {post.location && (
                <>
                  <span className="mx-1">•</span>
                  <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {post.location}</span>
                </>
              )}
            </p>
          </div>
        </div>
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)}></div>
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl py-1 z-50 border border-slate-100 dark:border-slate-700">
                {isMe ? (
                  <button 
                    onClick={async () => {
                      try {
                        await deletePost(post._id);
                      } catch (error) {
                        toast.error('Failed to delete post');
                      }
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-rose-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> Delete Post
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={() => { setShowMenu(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
                    >
                      Report Post
                    </button>
                    <button 
                      onClick={() => { setIsHidden(true); setShowMenu(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
                    >
                      Hide Post
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="px-4 pb-3 text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
        <p>{post.content}</p>
      </div>

      {post.mediaUrl && (
        <div className="w-full max-h-[500px] bg-slate-100 dark:bg-slate-900 flex justify-center">
          <img src={post.mediaUrl} alt="Post media" className="max-h-[500px] object-contain w-full" />
        </div>
      )}

      <div className="px-4 py-3 flex justify-between items-center border-t border-slate-100 dark:border-slate-800 text-slate-500">
        <button onClick={() => likePost(post._id)} className={`flex items-center gap-1.5 transition-colors ${hasLiked ? 'text-rose-500' : 'hover:text-rose-500'}`}>
          <Heart className={`w-5 h-5 ${hasLiked ? 'fill-current' : ''}`} /> 
          <span className="text-sm font-medium">{post.likes.length}</span>
        </button>
        <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5 hover:text-primary transition-colors">
          <MessageCircle className="w-5 h-5" /> <span className="text-sm font-medium">{post.comments?.length || 0}</span>
        </button>
        <button onClick={() => setIsShareModalOpen(true)} className="flex items-center gap-1.5 hover:text-primary transition-colors">
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      {showComments && (
        <div className="px-4 pb-4 bg-slate-50 dark:bg-slate-900/50">
          <div className="py-2 space-y-3 max-h-48 overflow-y-auto">
            {post.comments?.map(comment => (
              <div key={comment._id} className="flex gap-2">
                 <img src={comment.author?.profileImage || `https://ui-avatars.com/api/?name=${comment.author?.name}`} alt="" className="w-6 h-6 rounded-full" />
                 <div className="bg-slate-200 dark:bg-slate-800 rounded-lg p-2 text-xs text-slate-700 dark:text-slate-300">
                    <span className="font-semibold">{comment.author?.name}</span> {comment.content}
                 </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleCommentSubmit} className="mt-3 flex gap-2 items-center">
            <img src={user?.profileImage || `https://ui-avatars.com/api/?name=${user?.name}`} className="w-8 h-8 rounded-full" alt="Me" />
            <input 
              type="text" 
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 bg-slate-200 dark:bg-slate-800 rounded-full px-4 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary dark:text-slate-100"
            />
            <button type="submit" className="text-primary p-2 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-full">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
      
      <SharePostModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} postId={post._id} />
    </motion.div>
  );
};

export default PostCard;
