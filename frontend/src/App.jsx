import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';

import Auth from './pages/Auth';
import ForgotPassword from './pages/ForgotPassword';
import HomeFeed from './pages/HomeFeed';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import SearchUsers from './pages/SearchUsers';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import FriendRequests from './pages/FriendRequests';
import Navbar from './components/Navbar';
import CreatePostModal from './components/CreatePostModal';
import EditProfileModal from './components/EditProfileModal';
import CallModal from './components/CallModal';
import useMessageStore from './store/useMessageStore';

function App() {
  const { user, loading, isNewUser, setIsNewUser } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { initSocket, disconnectSocket, incomingCall, activeCallTarget, isVideoCall, clearCall } = useMessageStore();

  React.useEffect(() => {
    if (user?._id || user?.id) {
      initSocket(user?._id || user?.id);
    }
    return () => {
      disconnectSocket();
    };
  }, [user, initSocket, disconnectSocket]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-surface-dark"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="min-h-screen transition-colors duration-300 relative">
      {user && <Navbar onOpenCreatePost={() => setIsCreateModalOpen(true)} />}
      <main className={user ? "md:ml-20" : ""}>
        <Routes>
          <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/" />} />
          <Route path="/forgot-password" element={!user ? <ForgotPassword /> : <Navigate to="/" />} />
          <Route path="/" element={user ? <HomeFeed /> : <Navigate to="/auth" />} />
          <Route path="/profile" element={user ? <Profile /> : <Navigate to="/auth" />} />
          <Route path="/profile/:id" element={user ? <Profile /> : <Navigate to="/auth" />} />
          <Route path="/messages" element={user ? <Messages /> : <Navigate to="/auth" />} />
          <Route path="/search" element={user ? <SearchUsers /> : <Navigate to="/auth" />} />
          <Route path="/notifications" element={user ? <Notifications /> : <Navigate to="/auth" />} />
          <Route path="/settings" element={user ? <Settings /> : <Navigate to="/auth" />} />
          <Route path="/requests" element={user ? <FriendRequests /> : <Navigate to="/auth" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      
      {user && (
        <>
          <CreatePostModal 
            isOpen={isCreateModalOpen} 
            onClose={() => setIsCreateModalOpen(false)} 
          />
          <EditProfileModal 
            isOpen={isNewUser} 
            onClose={() => setIsNewUser(false)} 
          />
          {(activeCallTarget || incomingCall) && (
            <CallModal 
              callTarget={activeCallTarget}
              incomingCall={incomingCall}
              isVideo={isVideoCall}
              onEnd={() => clearCall()}
            />
          )}
        </>
      )}
      <Toaster 
        position="top-center"
        toastOptions={{
          className: 'dark:bg-slate-800 dark:text-slate-100 bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 font-medium px-5 py-3',
          success: {
            iconTheme: {
              primary: '#10b981', // emerald-500
              secondary: 'white',
            },
          },
          error: {
            iconTheme: {
              primary: '#f43f5e', // rose-500
              secondary: 'white',
            }
          },
          duration: 3000,
        }}
      />
    </div>
  );
}

export default App;
