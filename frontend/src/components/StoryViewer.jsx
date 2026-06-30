import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import useMessageStore from '../store/useMessageStore';
import toast from 'react-hot-toast';

const StoryViewer = ({ allGroups, initialGroupIndex = 0, onClose }) => {
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const videoRef = useRef(null);
  
  const { user } = useAuth();
  const { sendMessage } = useMessageStore();
  const [replyText, setReplyText] = useState('');

  const currentGroup = allGroups[groupIndex];
  const currentStory = currentGroup?.stories[storyIndex];

  const isMyStory = currentGroup?.user._id === (user?._id || user?.id);

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    
    await sendMessage(`Replying to story: ${replyText}`, null, currentGroup.user._id, null, null, currentStory._id);
    setReplyText('');
    onClose();
  };

  // Auto-advance logic
  useEffect(() => {
    if (!currentStory || isPaused) return;

    let timer;
    let animationFrame;
    const duration = currentStory.mediaType === 'video' ? 0 : 15000; // if video, duration handled by video elements timeupdate event

    if (currentStory.mediaType === 'image') {
      const startTime = Date.now();
      const updateProgress = () => {
        const elapsed = Date.now() - startTime;
        const newProgress = (elapsed / duration) * 100;
        
        if (newProgress >= 100) {
          handleNext();
        } else {
          setProgress(newProgress);
          animationFrame = requestAnimationFrame(updateProgress);
        }
      };
      animationFrame = requestAnimationFrame(updateProgress);
    }

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [groupIndex, storyIndex, currentStory, isPaused]);

  const handleNext = () => {
    setProgress(0);
    if (storyIndex < currentGroup.stories.length - 1) {
      setStoryIndex(prev => prev + 1);
    } else if (groupIndex < allGroups.length - 1) {
      setGroupIndex(prev => prev + 1);
      setStoryIndex(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    setProgress(0);
    if (storyIndex > 0) {
      setStoryIndex(prev => prev - 1);
    } else if (groupIndex > 0) {
      setGroupIndex(prev => prev - 1);
      setStoryIndex(allGroups[groupIndex - 1].stories.length - 1);
    }
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current && !isPaused) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(progress);
    }
  };

  const handleVideoEnded = () => {
    handleNext();
  };

  if (!currentStory) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black flex justify-center items-center backdrop-blur-sm"
      >
        <div className="relative w-full max-w-[500px] h-[100dvh] sm:h-[85vh] sm:rounded-2xl overflow-hidden bg-slate-900 flex flex-col">
          
          {/* Progress Bars */}
          <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2 pt-4 px-3 bg-gradient-to-b from-black/70 to-transparent">
            {currentGroup.stories.map((s, idx) => (
              <div key={s._id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-75 linear"
                  style={{ 
                    width: idx < storyIndex ? '100%' : idx === storyIndex ? `${progress}%` : '0%' 
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-6 left-0 right-0 z-20 flex justify-between items-center px-4">
            <div className="flex items-center gap-2 drop-shadow-md">
              <img 
                src={currentGroup.user.profileImage || `https://ui-avatars.com/api/?name=${currentGroup.user.name}`} 
                alt="Profile" 
                className="w-8 h-8 rounded-full border border-white/50 object-cover"
              />
              <div>
                <p className="text-white text-sm font-bold">{currentGroup.user.name}</p>
                <p className="text-white/80 text-[10px]">{formatDistanceToNow(new Date(currentStory.createdAt))} ago</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white drop-shadow-md p-1">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tap Zones */}
          <div className="absolute inset-0 z-10 flex">
            <div 
              className="w-1/3 h-full cursor-pointer"
              onClick={handlePrev}
            />
            <div 
              className="w-2/3 h-full cursor-pointer"
              onClick={handleNext}
              onPointerDown={() => setIsPaused(true)}
              onPointerUp={() => setIsPaused(false)}
              onPointerLeave={() => setIsPaused(false)}
            />
          </div>

          {/* Media Content */}
          <div className="w-full h-full flex items-center justify-center bg-black relative">
            {currentStory.mediaType === 'video' ? (
              <video 
                ref={videoRef}
                src={currentStory.mediaUrl}
                autoPlay
                playsInline
                onTimeUpdate={handleVideoTimeUpdate}
                onEnded={handleVideoEnded}
                className="w-full h-full object-cover"
              />
            ) : (
              <img 
                src={currentStory.mediaUrl}
                alt="Story"
                className="w-full h-full object-cover"
              />
            )}

            {/* Render Text Overlays */}
            {currentStory.textOverlays && currentStory.textOverlays.map((t, idx) => (
              <div 
                key={idx}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 text-2xl font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] whitespace-pre px-4 py-1 pointer-events-none"
                style={{ left: `${t.x}%`, top: `${t.y}%`, color: t.color || '#ffffff' }}
              >
                {t.text}
              </div>
            ))}
          </div>

          {/* Reply Section */}
          {!isMyStory && (
            <div className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/80 to-transparent pb-[env(safe-area-inset-bottom,16px)]" onClick={(e) => e.stopPropagation()}>
              <form onSubmit={handleReplySubmit} className="flex gap-2">
                <input 
                  type="text" 
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onFocus={() => setIsPaused(true)}
                  onBlur={() => setIsPaused(false)}
                  placeholder={`Reply to ${currentGroup.user.name}...`}
                  className="flex-1 bg-white/20 backdrop-blur-md border border-white/30 text-white placeholder-white/70 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:bg-white/30 transition-colors"
                />
              </form>
            </div>
          )}

        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StoryViewer;
