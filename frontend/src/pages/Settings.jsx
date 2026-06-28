import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, User, Lock, Shield, Bell, Moon, Sun, LogOut, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import EditProfileModal from '../components/EditProfileModal';

const SettingsModal = ({ title, isOpen, onClose, children }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100]"
        />
        <motion.div 
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          className="fixed inset-x-4 bottom-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl z-[101] overflow-hidden flex flex-col"
        >
          <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
            <h2 className="font-bold text-slate-800 dark:text-white">{title}</h2>
            <div className="w-9" /> {/* Spacer */}
          </div>
          <div className="p-6 overflow-y-auto max-h-[70vh]">
            {children}
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

const Toggle = ({ label, defaultChecked = true }) => {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</span>
      <button 
        onClick={() => setChecked(!checked)} 
        className={`w-11 h-6 rounded-full transition-colors relative ${checked ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`}
      >
        <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
};

const Settings = () => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const accountSettings = [
    { id: 'account', icon: User, label: 'Account Settings', desc: 'Personal info, email, phone' },
    { id: 'privacy', icon: Lock, label: 'Privacy', desc: 'Control who sees your content' },
    { id: 'security', icon: Shield, label: 'Security', desc: 'Password and authentication' },
  ];

  const preferenceSettings = [
    { id: 'notifications', icon: Bell, label: 'Notifications', desc: 'Push, email, and SMS alerts' },
  ];

  const handleSettingClick = (id) => {
    if (id === 'account') setIsEditProfileOpen(true);
    else {
      setActiveModal(id);
      // Reset password form on modal open
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error("New passwords don't match");
    }
    if (newPassword.length < 6) {
      return toast.error("New password must be at least 6 characters");
    }

    setIsChangingPassword(true);
    try {
      const res = await axios.put((import.meta.env.VITE_API_URL || 'http://localhost:5001') + '/api/users/password', {
        currentPassword,
        newPassword
      });
      toast.success(res.data.message || 'Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setActiveModal(null);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 pb-24 h-screen overflow-y-auto">
      {/* Header */}
      <header className="flex items-center gap-4 mb-8 glass-card p-4 sticky top-4 z-50">
        <Link to="/profile" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6 text-slate-700 dark:text-slate-300" />
        </Link>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Settings</h1>
      </header>

      {/* Profile Card */}
      <div className="flex flex-col items-center mb-8">
        <img 
          src={user?.profileImage || `https://ui-avatars.com/api/?name=${user?.name || 'User'}`} 
          alt="Profile" 
          className="w-24 h-24 rounded-full object-cover shadow-lg mb-4"
        />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{user?.name || 'Alex Rivers'}</h2>
        <p className="text-slate-500 font-medium">{user?.handle || '@arivers_creative'}</p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-8">
        
        {/* Account & Security */}
        <section>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">Account & Security</h3>
          <div className="glass-card overflow-hidden">
            {accountSettings.map((item, index) => (
              <button 
                key={item.id}
                onClick={() => handleSettingClick(item.id)}
                className={`w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left ${index !== accountSettings.length - 1 ? 'border-b border-slate-100 dark:border-slate-800' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-primary">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">{item.label}</h4>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                </div>
                <ChevronLeft className="w-5 h-5 text-slate-400 rotate-180" />
              </button>
            ))}
          </div>
        </section>

        {/* Preferences */}
        <section>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">Preferences</h3>
          <div className="glass-card overflow-hidden">
            {preferenceSettings.map((item) => (
              <button 
                key={item.id}
                onClick={() => handleSettingClick(item.id)}
                className="w-full flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-primary">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">{item.label}</h4>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                </div>
                <ChevronLeft className="w-5 h-5 text-slate-400 rotate-180" />
              </button>
            ))}

            {/* Display / Theme Toggle */}
            <div className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-primary">
                  {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">Display and appearance</h4>
                  <p className="text-xs text-slate-500">Theme customization</p>
                </div>
              </div>
              
              <div className="flex bg-slate-200 dark:bg-slate-700 rounded-lg p-1">
                <button 
                  onClick={() => !isDarkMode ? null : toggleTheme()}
                  className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-2 transition-all ${!isDarkMode ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <Sun className="w-3 h-3" /> Light
                </button>
                <button 
                  onClick={() => isDarkMode ? null : toggleTheme()}
                  className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-2 transition-all ${isDarkMode ? 'bg-slate-900 text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Moon className="w-3 h-3" /> Dark
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          className="w-full glass-card p-4 flex items-center justify-center gap-2 text-rose-500 font-bold hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-colors"
        >
          <LogOut className="w-5 h-5" /> Logout
        </button>

        <div className="text-center pb-8">
           <p className="text-xs text-slate-400">Connectify iOS v1.4.0 (Build 3022)</p>
        </div>

      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal 
        isOpen={isEditProfileOpen} 
        onClose={() => setIsEditProfileOpen(false)} 
      />

      {/* Privacy Settings Modal */}
      <SettingsModal title="Privacy" isOpen={activeModal === 'privacy'} onClose={() => setActiveModal(null)}>
        <div className="space-y-2">
          <Toggle label="Private Account" defaultChecked={false} />
          <Toggle label="Show Activity Status" defaultChecked={true} />
          <Toggle label="Allow Story Sharing" defaultChecked={true} />
          <Toggle label="Allow Message Requests" defaultChecked={true} />
        </div>
      </SettingsModal>

      {/* Security Settings Modal */}
      <SettingsModal title="Security" isOpen={activeModal === 'security'} onClose={() => setActiveModal(null)}>
        <div className="space-y-4">
          <Toggle label="Two-Factor Authentication" defaultChecked={false} />
          <Toggle label="Save Login Info" defaultChecked={true} />
          <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Change Password</h4>
            <form onSubmit={handleChangePassword} className="space-y-3">
              <input 
                type="password" 
                placeholder="Current Password" 
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:text-white border border-slate-200 dark:border-slate-700"
              />
              <input 
                type="password" 
                placeholder="New Password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:text-white border border-slate-200 dark:border-slate-700"
              />
              <input 
                type="password" 
                placeholder="Confirm New Password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:text-white border border-slate-200 dark:border-slate-700"
              />
              <button 
                type="submit"
                disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                className="w-full mt-2 py-2.5 bg-primary text-white rounded-xl font-medium text-sm hover:bg-indigo-600 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {isChangingPassword ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</> : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </SettingsModal>

      {/* Notifications Settings Modal */}
      <SettingsModal title="Notifications" isOpen={activeModal === 'notifications'} onClose={() => setActiveModal(null)}>
        <div className="space-y-2">
          <Toggle label="Push Notifications" defaultChecked={true} />
          <Toggle label="Email Summaries" defaultChecked={false} />
          <Toggle label="New Follower Alerts" defaultChecked={true} />
          <Toggle label="Direct Messages" defaultChecked={true} />
        </div>
      </SettingsModal>

    </div>
  );
};

export default Settings;
