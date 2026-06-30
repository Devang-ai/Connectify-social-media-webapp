import React, { useState, useEffect, useRef } from 'react';
import { X, RefreshCcw, Image as ImageIcon, Zap, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CameraModal = ({ isOpen, onClose, onCapture }) => {
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'user' or 'environment'
  const [mode, setMode] = useState('story'); // 'post' or 'story'
  const [hasFlash, setHasFlash] = useState(false);
  const [error, setError] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    stopCamera(); // Stop any existing stream
    setError('');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Could not access camera. Please allow camera permissions or use the gallery.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext('2d');
    
    // If front camera, flip the image horizontally so it acts like a mirror
    if (facingMode === 'user') {
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
    }
    
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas to Blob
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
        stopCamera();
        onCapture(file, mode);
      }
    }, 'image/jpeg', 0.9);
  };

  const handleGalleryClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = (e) => {
    const file = e.target.files[0];
    if (file) {
      stopCamera();
      onCapture(file, mode);
    }
    e.target.value = ''; // reset
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-between overflow-hidden"
      >
        {/* Top Header */}
        <div className="absolute top-0 w-full z-10 flex justify-between items-center p-4 pt-[max(env(safe-area-inset-top),16px)]">
          <button onClick={() => { stopCamera(); onClose(); }} className="p-2 bg-black/30 rounded-full text-white backdrop-blur-md">
            <X className="w-6 h-6" />
          </button>
          
          {/* Top Controls */}
          <div className="flex gap-4">
            <button className="p-2 text-white hover:opacity-70 transition">
              <Zap className="w-6 h-6" />
            </button>
            <button className="p-2 text-white hover:opacity-70 transition">
              <Settings className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Video Preview */}
        <div className="flex-1 w-full relative bg-zinc-900 rounded-b-3xl sm:rounded-none overflow-hidden">
          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-white/70">
              <ImageIcon className="w-12 h-12 mb-4 opacity-50" />
              <p>{error}</p>
              <button 
                onClick={handleGalleryClick}
                className="mt-6 px-6 py-2 bg-white text-black font-semibold rounded-full"
              >
                Open Gallery
              </button>
            </div>
          ) : (
            <video 
              ref={videoRef}
              autoPlay 
              playsInline 
              muted 
              className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            />
          )}
          
          {/* Hidden Canvas for capturing */}
          <canvas ref={canvasRef} className="hidden" />
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelected} 
            accept="image/*,video/*" 
            className="hidden" 
          />
        </div>

        {/* Bottom Controls */}
        <div className="w-full bg-black pb-[max(env(safe-area-inset-bottom),16px)]">
          
          {/* Mode Selector */}
          <div className="flex justify-center items-center py-4 text-xs font-bold tracking-widest text-white/60 space-x-6 relative">
            <button 
              onClick={() => setMode('post')}
              className={`transition-all px-2 ${mode === 'post' ? 'text-white scale-110' : 'hover:text-white/80'}`}
            >
              POST
            </button>
            <button 
              onClick={() => setMode('story')}
              className={`transition-all px-2 ${mode === 'story' ? 'text-white scale-110' : 'hover:text-white/80'}`}
            >
              STORY
            </button>
            {/* Tiny dot indicator */}
            <motion.div 
              className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-white"
              animate={{ x: mode === 'post' ? -42 : 44 }} // Approximate positions
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          </div>

          {/* Capture Area */}
          <div className="flex justify-between items-center px-8 py-6 pb-12">
            
            {/* Gallery Picker */}
            <button 
              onClick={handleGalleryClick}
              className="w-10 h-10 rounded-lg overflow-hidden border-2 border-white/50 hover:border-white transition-colors bg-zinc-800 flex items-center justify-center"
            >
              <ImageIcon className="w-5 h-5 text-white/70" />
            </button>

            {/* Shutter Button */}
            <button 
              onClick={handleCapture}
              disabled={!!error}
              className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50"
            >
              <div className="w-[66px] h-[66px] bg-white rounded-full"></div>
            </button>

            {/* Switch Camera */}
            <button 
              onClick={toggleCamera}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
            >
              <RefreshCcw className="w-5 h-5" />
            </button>

          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CameraModal;
