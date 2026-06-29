import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Search, PlusSquare, Bell, User, Settings as SettingsIcon } from 'lucide-react';

const Navbar = ({ onOpenCreatePost }) => {
  const { user } = useAuth();
  const location = useLocation();
  const isMessagesPage = location.pathname.startsWith('/messages');

  const navItems = [
    { id: 'home', icon: Home, path: '/', label: 'Home' },
    { id: 'search', icon: Search, path: '/search', label: 'Search' },
    { id: 'create', icon: PlusSquare, action: onOpenCreatePost, label: 'Create' },
    { id: 'notifications', icon: Bell, path: '/notifications', label: 'Notifications' },
    { id: 'profile', icon: User, path: '/profile', label: 'Profile' },
  ];

  return (
    <>
      {/* Mobile Bottom Nav */}
      {!isMessagesPage && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-slate-200 dark:border-slate-800 z-50 px-6 py-3 flex justify-between items-center pb-[env(safe-area-inset-bottom,16px)]">
          {navItems.map((item) => (
            item.path ? (
              <NavLink
                key={item.id}
                to={item.path}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-primary' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`
                }
              >
                <item.icon className="w-6 h-6" />
              </NavLink>
            ) : (
              <button
                key={item.id}
                onClick={item.action}
                className="flex flex-col items-center gap-1 text-slate-400 hover:text-primary transition-colors transform hover:scale-110 active:scale-95"
              >
                <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-primary/30">
                  <item.icon className="w-5 h-5" />
                </div>
              </button>
            )
          ))}
        </nav>
      )}

      {/* Desktop Sidebar / Topbar */}
      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 w-20 flex-col items-center py-8 glass border-r border-slate-200 dark:border-slate-800 z-50">
        <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl mb-12 shadow-lg shadow-primary/30">
          C
        </div>

        <div className="flex flex-col gap-8 flex-1">
          {navItems.map((item) => (
            item.path ? (
              <NavLink
                key={item.id}
                to={item.path}
                className={({ isActive }) =>
                  `p-3 rounded-2xl transition-all ${isActive ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'}`
                }
                title={item.label}
              >
                <item.icon className="w-6 h-6" />
              </NavLink>
            ) : (
              <button
                key={item.id}
                onClick={item.action}
                className="p-3 rounded-2xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary transition-all"
                title={item.label}
              >
                <item.icon className="w-6 h-6" />
              </button>
            )
          ))}
        </div>

      </nav>
    </>
  );
};

export default Navbar;
