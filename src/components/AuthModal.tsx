import React, { useState } from 'react';
import type { UserProfile, ThemeMode } from '../types';
import { User, Lock, Mail, X, LogIn, UserPlus, LogOut } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  currentUser: UserProfile | null;
  theme: ThemeMode;
  onClose: () => void;
  onSignIn: (user: UserProfile) => void;
  onSignOut: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  currentUser,
  theme,
  onClose,
  onSignIn,
  onSignOut,
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const isMatteBlack = theme === 'matte-black';
  const isDark = theme === 'dark-mesh' || isMatteBlack;

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !password || (isSignUp && !name)) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    // Retrieve accounts from localStorage
    const savedAccountsStr = localStorage.getItem('phokus_accounts') || '[]';
    let savedAccounts: UserProfile[] = [];
    try {
      savedAccounts = JSON.parse(savedAccountsStr);
    } catch {
      savedAccounts = [];
    }

    if (isSignUp) {
      const existing = savedAccounts.find(a => a.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        setErrorMessage('An account with this email already exists.');
        return;
      }

      const newUser: UserProfile = {
        id: 'usr_' + Date.now(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        stats: {
          totalFocusMinutes: 0,
          completedFocusSessions: 0,
          completedShortBreaks: 0,
          completedLongBreaks: 0,
          completedTasksCount: 0,
          streakDays: 1,
          lastActiveDate: new Date().toISOString().split('T')[0],
          dailyActivity: {},
          history: []
        }
      };

      savedAccounts.push(newUser);
      localStorage.setItem('phokus_accounts', JSON.stringify(savedAccounts));
      onSignIn(newUser);
      onClose();
    } else {
      const found = savedAccounts.find(a => a.email.toLowerCase() === email.toLowerCase());
      if (found) {
        onSignIn(found);
        onClose();
      } else {
        // Create auto profile for frictionless sign-in
        const userName = email.split('@')[0] || 'Focus Enthusiast';
        const newUser: UserProfile = {
          id: 'usr_' + Date.now(),
          name: userName.charAt(0).toUpperCase() + userName.slice(1),
          email: email.trim().toLowerCase(),
          stats: {
            totalFocusMinutes: 0,
            completedFocusSessions: 0,
            completedShortBreaks: 0,
            completedLongBreaks: 0,
            completedTasksCount: 0,
            streakDays: 1,
            lastActiveDate: new Date().toISOString().split('T')[0],
            dailyActivity: {},
            history: []
          }
        };
        savedAccounts.push(newUser);
        localStorage.setItem('phokus_accounts', JSON.stringify(savedAccounts));
        onSignIn(newUser);
        onClose();
      }
    }
  };

  const handleDemoSignIn = () => {
    const demoUser: UserProfile = {
      id: 'demo_user_1',
      name: 'Bunny Learner',
      email: 'bunny@phokus.study',
      stats: {
        totalFocusMinutes: 240,
        completedFocusSessions: 6,
        completedShortBreaks: 5,
        completedLongBreaks: 1,
        completedTasksCount: 7,
        streakDays: 5,
        lastActiveDate: new Date().toISOString().split('T')[0],
        dailyActivity: {
          [new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0]]: 80,
          [new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0]]: 120,
          [new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0]]: 90,
          [new Date().toISOString().split('T')[0]]: 40,
        },
        history: [
          {
            id: 'h1',
            date: new Date(Date.now() - 2 * 3600000).toISOString(),
            mode: 'focus',
            durationMinutes: 40,
            taskTitle: 'Read documentation & take notes'
          },
          {
            id: 'h2',
            date: new Date(Date.now() - 1 * 3600000).toISOString(),
            mode: 'focus',
            durationMinutes: 40,
            taskTitle: 'Algorithm practice problems'
          }
        ]
      }
    };
    onSignIn(demoUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className={`relative w-full max-w-sm rounded-3xl p-6 shadow-2xl transition-all duration-300 ${
          isMatteBlack
            ? 'bg-[#0f0f12] border border-neutral-700/80 text-white shadow-2xl shadow-black/95'
            : isDark
              ? 'bg-[#140a12]/95 border border-pink-500/25 text-white shadow-2xl shadow-pink-950/60'
              : 'bg-white/95 border border-pink-200 text-pink-950 shadow-pink-200/50'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-pink-500/20 mb-4">
          <div className="flex items-center space-x-2.5">
            <div
              className={`p-2 rounded-xl ${
                isDark ? 'bg-pink-600/20 text-pink-400 border border-pink-500/30' : 'bg-pink-100 text-pink-600'
              }`}
            >
              <User size={20} />
            </div>
            <h3 className="text-lg font-bold">
              {currentUser ? 'Your Profile' : isSignUp ? 'Create Account' : 'Sign In'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? 'hover:bg-white/10 text-pink-200/70 hover:text-pink-100' : 'hover:bg-pink-100 text-pink-800'
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {currentUser ? (
          /* Profile view when already signed in */
          <div className="space-y-4">
            <div className={`p-4 rounded-2xl ${isDark ? 'bg-white/[0.04] border border-pink-500/15' : 'bg-pink-50 border border-pink-100'}`}>
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${
                  isDark ? 'bg-pink-600/25 text-pink-300 border border-pink-400/40 shadow-[0_0_10px_rgba(244,63,94,0.3)]' : 'bg-pink-200 text-pink-800'
                }`}>
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold truncate text-pink-100">{currentUser.name}</p>
                  <p className={`text-xs truncate ${isDark ? 'text-pink-300/60' : 'text-pink-900/60'}`}>{currentUser.email}</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-pink-500/15 grid grid-cols-2 gap-2 text-center">
                <div className="p-2 rounded-xl bg-white/5">
                  <p className={`text-xs ${isDark ? 'text-pink-300/50' : 'text-pink-900/50'}`}>Total Focus</p>
                  <p className="text-sm font-bold text-pink-300">{currentUser.stats.totalFocusMinutes}m</p>
                </div>
                <div className="p-2 rounded-xl bg-white/5">
                  <p className={`text-xs ${isDark ? 'text-pink-300/50' : 'text-pink-900/50'}`}>Streak</p>
                  <p className="text-sm font-bold text-pink-300">{currentUser.stats.streakDays} days</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                onSignOut();
                onClose();
              }}
              className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-2xl font-medium text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          /* Sign In / Sign Up Form */
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <p className={`text-xs leading-relaxed ${isDark ? 'text-pink-200/70' : 'text-pink-900/70'}`}>
              Sign in to save your focus sessions, track daily streaks, and sync your to-do lists across sessions.
            </p>

            {errorMessage && (
              <div className="p-2.5 rounded-xl text-xs bg-red-500/10 border border-red-500/30 text-red-400">
                {errorMessage}
              </div>
            )}

            {isSignUp && (
              <div className="space-y-1">
                <label className={`text-xs font-semibold ${isDark ? 'text-pink-200/80' : 'text-pink-950/70'}`}>
                  Your Name
                </label>
                <div className="relative">
                  <User size={16} className={`absolute left-3 top-3 ${isDark ? 'text-pink-300/50' : 'text-pink-900/40'}`} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Bunny Learner"
                    className={`w-full pl-9 pr-3 py-2 rounded-xl text-sm outline-none transition-all ${
                      isDark
                        ? 'bg-white/[0.06] text-pink-100 placeholder-pink-300/30 border border-pink-500/25 focus:border-pink-500'
                        : 'bg-pink-50 text-pink-950 placeholder-pink-900/40 border border-pink-200 focus:border-pink-500'
                    }`}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className={`text-xs font-semibold ${isDark ? 'text-pink-200/80' : 'text-pink-950/70'}`}>
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className={`absolute left-3 top-3 ${isDark ? 'text-pink-300/50' : 'text-pink-900/40'}`} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="focus@phokus.study"
                  className={`w-full pl-9 pr-3 py-2 rounded-xl text-sm outline-none transition-all ${
                    isDark
                      ? 'bg-white/[0.06] text-pink-100 placeholder-pink-300/30 border border-pink-500/25 focus:border-pink-500'
                      : 'bg-pink-50 text-pink-950 placeholder-pink-900/40 border border-pink-200 focus:border-pink-500'
                  }`}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className={`text-xs font-semibold ${isDark ? 'text-pink-200/80' : 'text-pink-950/70'}`}>
                Password
              </label>
              <div className="relative">
                <Lock size={16} className={`absolute left-3 top-3 ${isDark ? 'text-pink-300/50' : 'text-pink-900/40'}`} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-9 pr-3 py-2 rounded-xl text-sm outline-none transition-all ${
                    isDark
                      ? 'bg-white/[0.06] text-pink-100 placeholder-pink-300/30 border border-pink-500/25 focus:border-pink-500'
                      : 'bg-pink-50 text-pink-950 placeholder-pink-900/40 border border-pink-200 focus:border-pink-500'
                  }`}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center space-x-2 shadow-sm bg-pink-600 hover:bg-pink-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.35)]"
            >
              {isSignUp ? <UserPlus size={16} /> : <LogIn size={16} />}
              <span>{isSignUp ? 'Create Free Account' : 'Sign In'}</span>
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setErrorMessage('');
                }}
                className={`text-xs underline font-medium ${
                  isDark ? 'text-pink-300 hover:text-pink-100' : 'text-pink-700 hover:text-pink-950'
                }`}
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-pink-500/20"></div>
              <span className={`flex-shrink mx-2 text-[10px] uppercase tracking-widest ${isDark ? 'text-pink-400/40' : 'text-pink-900/40'}`}>
                or explore
              </span>
              <div className="flex-grow border-t border-pink-500/20"></div>
            </div>

            <button
              type="button"
              onClick={handleDemoSignIn}
              className={`w-full py-2 rounded-xl text-xs font-medium transition-colors ${
                isDark ? 'bg-white/[0.06] hover:bg-white/10 text-pink-200' : 'bg-pink-100/70 hover:bg-pink-100 text-pink-900'
              }`}
            >
              Load Demo Stats & Profile
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
