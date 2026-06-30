import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { X, Camera, MapPin, Briefcase, User, AtSign, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const EditProfileModal = ({ isOpen, onClose }) => {
  const { user, updateUser, setIsNewUser } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [handle, setHandle] = useState(user?.handle || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [location, setLocation] = useState(user?.location || '');
  const [education, setEducation] = useState(user?.education || '');
  
  const [profileImage, setProfileImage] = useState(null);
  const [profilePreview, setProfilePreview] = useState(user?.profileImage || '');
  
  const [coverImage, setCoverImage] = useState(null);
  const [coverPreview, setCoverPreview] = useState(user?.coverImage || '');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const profileInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      setProfilePreview(URL.createObjectURL(file));
    }
  };

  const handleCoverImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverImage(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('handle', handle);
      formData.append('bio', bio);
      formData.append('location', location);
      formData.append('education', education);
      
      if (profileImage) formData.append('profileImage', profileImage);
      if (coverImage) formData.append('coverImage', coverImage);

      await updateUser(formData);
      setIsNewUser(false); // If they were a new user, they are now onboarded
      onClose();
      toast.success('Profile updated successfully!');
    } catch (err) {
      console.error('Failed to update profile', err);
      toast.error('Failed to update profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100]"
          />
          <motion.div 
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            className="fixed inset-x-4 bottom-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl z-[101] overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <button onClick={onClose} disabled={isSubmitting} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors disabled:opacity-50">
                <X className="w-5 h-5 text-slate-500" />
              </button>
              <h2 className="font-bold text-slate-800 dark:text-white">Edit Profile</h2>
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting || !name.trim()}
                className="bg-primary text-white px-5 py-1.5 rounded-full text-sm font-bold shadow-lg shadow-primary/30 disabled:opacity-50 transition-all hover:opacity-90 active:scale-95 flex items-center gap-2"
              >
                {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save'}
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto pb-8">
              {/* Cover Photo */}
              <div className="relative h-40 md:h-48 bg-slate-200 dark:bg-slate-800 w-full group">
                <img 
                  src={coverPreview || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809'} 
                  alt="Cover" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <button onClick={() => coverInputRef.current?.click()} className="bg-white/20 hover:bg-white/40 backdrop-blur-md p-3 rounded-full text-white transition-colors">
                    <Camera className="w-6 h-6" />
                  </button>
                </div>
                <input type="file" accept="image/*" className="hidden" ref={coverInputRef} onChange={handleCoverImageChange} />
              </div>

              {/* Profile Photo */}
              <div className="px-6 -mt-12 relative flex justify-between items-end mb-6">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full border-4 border-white dark:border-slate-900 overflow-hidden bg-slate-200 dark:bg-slate-800">
                    <img 
                      src={profilePreview || `https://ui-avatars.com/api/?name=${name || 'User'}`} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button onClick={() => profileInputRef.current?.click()} className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center rounded-full">
                    <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  <input type="file" accept="image/*" className="hidden" ref={profileInputRef} onChange={handleProfileImageChange} />
                </div>
              </div>

              {/* Form Fields */}
              <div className="px-6 space-y-5">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="text" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                      placeholder="Your full name"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Username Handle</label>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="text" 
                      value={handle} 
                      onChange={(e) => setHandle(e.target.value)} 
                      className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                      placeholder="johndoe123"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Bio</label>
                  <textarea 
                    value={bio} 
                    onChange={(e) => setBio(e.target.value)} 
                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary dark:text-white resize-none h-24"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        type="text" 
                        value={location} 
                        onChange={(e) => setLocation(e.target.value)} 
                        className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                        placeholder="San Francisco, CA"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Education/Work</label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        type="text" 
                        value={education} 
                        onChange={(e) => setEducation(e.target.value)} 
                        className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                        placeholder="Software Engineer at Acme Corp"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EditProfileModal;
