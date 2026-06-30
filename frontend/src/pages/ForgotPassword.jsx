import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCcw, ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate API call
    if (email) {
      setIsSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-surface dark:bg-surface-dark">
      {/* Animated Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/20 blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/20 blur-[100px] animate-pulse delay-1000"></div>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="inline-flex gradient-ring mb-4">
            <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center">
              <span className="font-bold text-xl gradient-text">C</span>
            </div>
          </div>
          <h1 className="text-4xl font-logo tracking-wide text-slate-800 dark:text-white mt-2">Connectify</h1>
        </div>

        <div className="glass-card p-8 shadow-2xl relative overflow-hidden">
          {/* Top glowing line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-600"></div>

          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4">
              <RefreshCcw className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Forgot Password?</h2>
            <p className="text-slate-500 text-sm text-center mt-2">
              No worries! Enter your email address below and we'll send you a link to reset your password.
            </p>
          </div>

          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@example.com"
                  className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all dark:text-white"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium py-3 rounded-xl shadow-lg shadow-primary/30 hover:opacity-90 active:scale-95 transition-all flex justify-center items-center gap-2"
              >
                Send Reset Link →
              </button>
            </form>
          ) : (
            <div className="text-center py-4">
              <p className="text-green-600 dark:text-green-400 font-medium mb-4">
                Recovery email sent! Please check your inbox.
              </p>
              <button 
                onClick={() => setIsSubmitted(false)}
                className="text-sm text-primary hover:underline"
              >
                Try another email
              </button>
            </div>
          )}

          <div className="mt-8 text-center border-t border-slate-200 dark:border-slate-800 pt-6">
            <Link to="/auth" className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-sm font-medium inline-flex items-center gap-2 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to login
            </Link>
          </div>
        </div>

        <p className="text-center text-slate-400 text-xs mt-8">
          Forgot your email or need more help? <br/>
          <a href="#" className="text-primary hover:underline">Contact Support</a>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
