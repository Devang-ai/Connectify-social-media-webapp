import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  const [isNewUser, setIsNewUser] = useState(false);

  // Setup Axios interceptor
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get((import.meta.env.VITE_API_URL || 'http://localhost:5001') + '/api/auth/me');
        setUser(res.data.user);
      } catch (err) {
        console.error('Failed to fetch user', err);
        setToken(null);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await axios.post((import.meta.env.VITE_API_URL || 'http://localhost:5001') + '/api/auth/login', { email, password });
    setToken(res.data.token);
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    setIsNewUser(false);
  };

  const register = async (userData) => {
    const res = await axios.post((import.meta.env.VITE_API_URL || 'http://localhost:5001') + '/api/auth/register', userData);
    setToken(res.data.token);
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    setIsNewUser(true);
  };

  const updateUser = async (formData) => {
    const res = await axios.put((import.meta.env.VITE_API_URL || 'http://localhost:5001') + '/api/users/profile', formData);
    setUser(res.data);
    return res.data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setIsNewUser(false);
    localStorage.removeItem('token');
    
    // Clear global store data
    import('../store/useFriendStore').then(module => {
      module.default.getState().clearStore();
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, isNewUser, setIsNewUser, login, register, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
