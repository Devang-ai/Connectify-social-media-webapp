import React, { useState, useEffect, useRef } from 'react';
import { X, Type, Send, Crop as CropIcon, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/canvasUtils';

const CreateStoryModal = ({ file, onClose, onPost }) => {
  const [activeFile, setActiveFile] = useState(file);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  
  // Crop State
  const [isCropping, setIsCropping] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  
  // Text Overlay State
  const [texts, setTexts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  
  const containerRef = useRef(null);

  useEffect(() => {
    if (activeFile) {
      const url = URL.createObjectURL(activeFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [activeFile]);

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleApplyCrop = async () => {
    try {
      const croppedBlob = await getCroppedImg(previewUrl, croppedAreaPixels, 0);
      const newFile = new File([croppedBlob], file.name || 'story.jpg', { type: croppedBlob.type || 'image/jpeg' });
      setActiveFile(newFile);
      setIsCropping(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddText = () => {
    const newId = Date.now();
    setTexts([...texts, { id: newId, text: '', color: '#ffffff', x: 50, y: 50 }]);
    setEditingId(newId);
  };

  const updateText = (id, field, value) => {
    setTexts(texts.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const removeText = (id) => {
    setTexts(texts.filter(t => t.id !== id));
  };

  const handlePost = async () => {
    setIsPosting(true);
    // filter out empty texts
    const validTexts = texts.filter(t => t.text.trim().length > 0);
    await onPost(activeFile, validTexts);
    setIsPosting(false);
  };

  // Dragging logic for texts
  const [draggingId, setDraggingId] = useState(null);

  const handlePointerDown = (e, id) => {
    if (editingId === id) return; // Don't drag while editing
    e.preventDefault();
    setDraggingId(id);
  };

  const handlePointerMove = (e) => {
    if (!draggingId || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // clamp
    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));

    updateText(draggingId, 'x', clampedX);
    updateText(draggingId, 'y', clampedY);
  };

  const handlePointerUp = () => {
    setDraggingId(null);
  };

  if (!activeFile || !previewUrl) return null;
  
  const isVideo = activeFile.type.startsWith('video/');

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black flex justify-center items-center"
      >
        <div 
          ref={containerRef}
          className="relative w-full max-w-[500px] h-[100dvh] sm:h-[85vh] sm:rounded-2xl overflow-hidden bg-slate-900"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {/* Header */}
          {isCropping ? (
            <div className="absolute top-0 left-0 right-0 z-50 p-4 flex justify-between items-center bg-gradient-to-b from-black/70 to-transparent">
              <button onClick={() => setIsCropping(false)} className="text-white p-2 drop-shadow-md bg-black/20 rounded-full hover:bg-black/40 transition">
                <X className="w-6 h-6" />
              </button>
              <button onClick={handleApplyCrop} className="text-white p-2 drop-shadow-md bg-black/20 rounded-full hover:bg-black/40 transition flex items-center gap-2">
                <Check className="w-6 h-6" />
              </button>
            </div>
          ) : (
            <div className="absolute top-0 left-0 right-0 z-50 p-4 flex justify-between items-center bg-gradient-to-b from-black/70 to-transparent">
              <button onClick={onClose} className="text-white p-2 drop-shadow-md bg-black/20 rounded-full hover:bg-black/40 transition">
                <X className="w-6 h-6" />
              </button>
              <div className="flex gap-2">
                {!isVideo && (
                  <button onClick={() => setIsCropping(true)} className="text-white p-2 drop-shadow-md bg-black/20 rounded-full hover:bg-black/40 transition flex items-center gap-2">
                    <CropIcon className="w-5 h-5" />
                  </button>
                )}
                <button onClick={handleAddText} className="text-white p-2 drop-shadow-md bg-black/20 rounded-full hover:bg-black/40 transition flex items-center gap-2">
                  <Type className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Media Preview */}
          <div className="w-full h-full flex items-center justify-center bg-black relative" onClick={() => !isCropping && setEditingId(null)}>
            {isCropping ? (
              <div className="absolute inset-0">
                <Cropper
                  image={previewUrl}
                  crop={crop}
                  zoom={zoom}
                  aspect={9 / 16}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                  showGrid={true}
                />
              </div>
            ) : (
              isVideo ? (
                <video src={previewUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
              ) : (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              )
            )}
          </div>

          {/* Text Overlays */}
          {!isCropping && texts.map((t) => (
            <div 
              key={t.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing z-40"
              style={{ left: `${t.x}%`, top: `${t.y}%` }}
              onPointerDown={(e) => handlePointerDown(e, t.id)}
            >
              {editingId === t.id ? (
                <div className="flex flex-col items-center gap-2">
                  <input 
                    autoFocus
                    type="text"
                    value={t.text}
                    onChange={(e) => updateText(t.id, 'text', e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setEditingId(null);
                      if (e.key === 'Backspace' && t.text === '') removeText(t.id);
                    }}
                    onBlur={() => setEditingId(null)}
                    className="bg-transparent border-none text-center outline-none text-2xl font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                    style={{ color: t.color }}
                    placeholder="Type something..."
                  />
                  {/* Color Picker dots */}
                  <div className="flex gap-2 bg-black/50 p-2 rounded-full backdrop-blur-md">
                    {['#ffffff', '#000000', '#ef4444', '#3b82f6', '#10b981', '#f59e0b'].map(c => (
                      <button 
                        key={c}
                        onClick={(e) => { e.stopPropagation(); updateText(t.id, 'color', c); }}
                        className={`w-6 h-6 rounded-full border-2 ${t.color === c ? 'border-white' : 'border-transparent'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => setEditingId(t.id)}
                  className="text-2xl font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] whitespace-pre px-4 py-1"
                  style={{ color: t.color }}
                >
                  {t.text}
                </div>
              )}
            </div>
          ))}

          {/* Footer */}
          {!isCropping && (
            <div className="absolute bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-black/70 to-transparent flex justify-end">
            <button 
              onClick={handlePost}
              disabled={isPosting}
              className="bg-white text-black font-bold py-2.5 px-6 rounded-full flex items-center gap-2 hover:bg-slate-200 transition disabled:opacity-70"
            >
              {isPosting ? 'Posting...' : (
                <>
                  Your Story <Send className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
          )}

        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreateStoryModal;
