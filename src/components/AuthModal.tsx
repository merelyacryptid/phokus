import React, { useState } from 'react';
import type { UserProfile, ThemeMode } from '../types';
import { 
  User, 
  Lock, 
  Mail, 
  X, 
  LogIn, 
  UserPlus, 
  LogOut, 
  Loader2, 
  Cloud, 
  AlertCircle,
  Eye,
  EyeOff,
  Pencil,
  Check
} from 'lucide-react';
import {
  isFirebaseConfigured,
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signOutUser,
  updateUserNickname,
  formatAuthError
} from '../utils/firebase';
import { formatLocalDate } from '../utils/stats';

interface AuthModalProps {
  isOpen: boolean;
  currentUser: UserProfile | null;
  theme: ThemeMode;
  onClose: () => void;
  onSignIn: (user: UserProfile) => void;
  onSignOut: () => void;
}

interface StoredAccount extends UserProfile {
  passwordHash?: string;
}

export const AuthModal: React.FC<AuthModalProps> = React.memo(({
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
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [editNickname, setEditNickname] = useState('');
  const [isSavingNickname, setIsSavingNickname] = useState(false);

  const isMatteBlack = theme === 'matte-black';
  const isDark = theme === 'dark-mesh' || isMatteBlack;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password.trim() || (isSignUp && !name.trim())) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);

    try {
      if (isFirebaseConfigured) {
        // Firebase Cloud Authentication
        if (isSignUp) {
          const user = await signUpWithEmail(name, email, password);
          onSignIn(user);
          onClose();
        } else {
          const user = await signInWithEmail(email, password);
          onSignIn(user);
          onClose();
        }
      } else {
        // Local Authentication with password validation
        const savedAccountsStr = localStorage.getItem('phokus_accounts') || '[]';
        let savedAccounts: StoredAccount[] = [];
        try {
          savedAccounts = JSON.parse(savedAccountsStr);
        } catch {
          savedAccounts = [];
        }

        const normalizedEmail = email.trim().toLowerCase();

        if (isSignUp) {
          const existing = savedAccounts.find(a => a.email.toLowerCase() === normalizedEmail);
          if (existing) {
            setErrorMessage('An account with this email already exists. Please sign in.');
            setIsLoading(false);
            return;
          }

          const newUser: StoredAccount = {
            id: 'local_usr_' + Date.now(),
            name: name.trim(),
            email: normalizedEmail,
            passwordHash: password.trim(),
            stats: {
              totalFocusMinutes: 0,
              completedFocusSessions: 0,
              completedShortBreaks: 0,
              completedLongBreaks: 0,
              completedTasksCount: 0,
              streakDays: 0,
              lastActiveDate: formatLocalDate(new Date()),
              dailyActivity: {},
              history: []
            }
          };

          savedAccounts.push(newUser);
          localStorage.setItem('phokus_accounts', JSON.stringify(savedAccounts));
          onSignIn(newUser);
          onClose();
        } else {
          const found = savedAccounts.find(a => a.email.toLowerCase() === normalizedEmail);
          if (!found) {
            setErrorMessage('No account found with this email. Click "Sign up" to create one.');
            setIsLoading(false);
            return;
          }

          if (found.passwordHash && found.passwordHash !== password.trim()) {
            setErrorMessage('Incorrect password. Please verify your credentials.');
            setIsLoading(false);
            return;
          }

          onSignIn(found);
          onClose();
        }
      }
    } catch (err: unknown) {
      setErrorMessage(formatAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    if (!isFirebaseConfigured) {
      setErrorMessage('Google Sign-In requires Firebase. Please configure your Firebase keys in .env.local (see .env.example).');
      return;
    }

    setIsLoading(true);
    try {
      const user = await signInWithGoogle();
      onSignIn(user);
      onClose();
    } catch (err: unknown) {
      setErrorMessage(formatAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOutClick = async () => {
    setIsLoading(true);
    try {
      await signOutUser();
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      setIsLoading(false);
      onSignOut();
      onClose();
    }
  };

  const handleDemoSignIn = () => {
    const now = new Date();
    const localDayKey = (daysAgo: number) =>
      formatLocalDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo));

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
        lastActiveDate: localDayKey(0),
        dailyActivity: {
          [localDayKey(3)]: 80,
          [localDayKey(2)]: 120,
          [localDayKey(1)]: 90,
          [localDayKey(0)]: 40,
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

  const handleStartEditNickname = () => {
    if (currentUser) {
      setEditNickname(currentUser.name);
      setIsEditingNickname(true);
      setErrorMessage('');
    }
  };

  const handleSaveNickname = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentUser) return;
    const trimmed = editNickname.trim();
    if (!trimmed) {
      setErrorMessage('Nickname cannot be empty.');
      return;
    }
    if (trimmed === currentUser.name) {
      setIsEditingNickname(false);
      return;
    }

    setIsSavingNickname(true);
    setErrorMessage('');
    try {
      // 1. Update in Firebase if authenticated
      await updateUserNickname(trimmed);

      // 2. Build updated user profile
      const updatedProfile: UserProfile = {
        ...currentUser,
        name: trimmed
      };

      // 3. Update localStorage accounts
      const savedAccountsStr = localStorage.getItem('phokus_accounts') || '[]';
      try {
        const accounts: StoredAccount[] = JSON.parse(savedAccountsStr);
        const idx = accounts.findIndex(a => a.id === updatedProfile.id || a.email.toLowerCase() === updatedProfile.email.toLowerCase());
        if (idx >= 0) {
          accounts[idx] = { ...accounts[idx], name: trimmed };
          localStorage.setItem('phokus_accounts', JSON.stringify(accounts));
        }
      } catch {
        // ignore
      }

      // 4. Update in parent state & active user localStorage
      onSignIn(updatedProfile);
      setIsEditingNickname(false);
    } catch (err) {
      console.error('Failed to update nickname:', err);
      setErrorMessage(formatAuthError(err));
    } finally {
      setIsSavingNickname(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
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
        <div className="flex items-center justify-between pb-3 border-b border-pink-500/20 mb-3">
          <div className="flex items-center space-x-2.5">
            <div
              className={`p-2 rounded-xl ${
                isMatteBlack
                  ? 'bg-neutral-800 text-neutral-200 border border-neutral-700'
                  : isDark
                    ? 'bg-pink-600/20 text-pink-400 border border-pink-500/30'
                    : 'bg-pink-100 text-pink-600'
              }`}
            >
              <User size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold leading-none">
                {currentUser ? 'Your Profile' : isSignUp ? 'Create Account' : 'Sign In'}
              </h3>
              <div className="flex items-center space-x-1 mt-1">
                <Cloud size={11} className={isFirebaseConfigured ? 'text-emerald-400' : 'text-neutral-400'} />
                <span className={`text-[10px] font-medium ${isFirebaseConfigured ? 'text-emerald-400' : 'text-neutral-400'}`}>
                  {isFirebaseConfigured ? 'Firebase Cloud Auth' : 'Local Auth Mode'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isMatteBlack
                ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white'
                : isDark
                  ? 'hover:bg-white/10 text-pink-200/70 hover:text-pink-100'
                  : 'hover:bg-pink-100 text-pink-800'
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {currentUser ? (
          /* Profile view when already signed in */
          <div className="space-y-4">
            <div className={`p-4 rounded-2xl ${
              isMatteBlack
                ? 'bg-neutral-900/60 border border-neutral-800'
                : isDark
                  ? 'bg-white/[0.04] border border-pink-500/15'
                  : 'bg-pink-50 border border-pink-100'
            }`}>
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shrink-0 ${
                  isMatteBlack
                    ? 'bg-neutral-800 text-white border border-neutral-700'
                    : isDark
                      ? 'bg-pink-600/25 text-pink-300 border border-pink-400/40 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                      : 'bg-pink-200 text-pink-800'
                }`}>
                  {(editNickname.trim() ? editNickname : currentUser.name).charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  {isEditingNickname ? (
                    <form onSubmit={handleSaveNickname} className="flex items-center space-x-1.5 my-0.5">
                      <input
                        type="text"
                        value={editNickname}
                        onChange={(e) => setEditNickname(e.target.value)}
                        placeholder="New nickname"
                        autoFocus
                        maxLength={25}
                        className={`w-full min-w-0 px-2 py-1 text-xs sm:text-sm font-semibold rounded-xl outline-none transition-all ${
                          isMatteBlack
                            ? 'bg-neutral-800 text-white border border-neutral-600 focus:border-white'
                            : isDark
                              ? 'bg-white/10 text-white border border-pink-500/40 focus:border-pink-400'
                              : 'bg-white text-pink-950 border border-pink-300 focus:border-pink-500'
                        }`}
                      />
                      <button
                        type="submit"
                        disabled={!editNickname.trim() || isSavingNickname}
                        title="Save nickname"
                        className={`p-1.5 rounded-xl transition-all active:scale-95 shrink-0 ${
                          isMatteBlack
                            ? 'bg-white text-black hover:bg-neutral-200'
                            : 'bg-pink-600 text-white hover:bg-pink-500 shadow-sm'
                        }`}
                      >
                        {isSavingNickname ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} className="stroke-[2.5]" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingNickname(false);
                          setEditNickname(currentUser.name);
                        }}
                        title="Cancel"
                        className={`p-1.5 rounded-xl transition-all active:scale-95 shrink-0 ${
                          isMatteBlack
                            ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white'
                            : 'hover:bg-pink-200/60 text-pink-700/70 hover:text-pink-950'
                        }`}
                      >
                        <X size={13} />
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-center space-x-1.5">
                      <p className={`font-bold truncate text-base ${isMatteBlack ? 'text-white' : isDark ? 'text-pink-100' : 'text-pink-950'}`}>
                        {currentUser.name}
                      </p>
                      <button
                        type="button"
                        onClick={handleStartEditNickname}
                        title="Edit Nickname"
                        className={`p-1 rounded-lg transition-colors ${
                          isMatteBlack
                            ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white'
                            : isDark
                              ? 'hover:bg-white/10 text-pink-300/70 hover:text-pink-100'
                              : 'hover:bg-pink-200/60 text-pink-700/70 hover:text-pink-950'
                        }`}
                      >
                        <Pencil size={13} />
                      </button>
                    </div>
                  )}
                  <p className={`text-xs truncate ${isMatteBlack ? 'text-neutral-400' : isDark ? 'text-pink-300/60' : 'text-pink-900/60'}`}>
                    {currentUser.email}
                  </p>
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
              onClick={handleSignOutClick}
              disabled={isLoading}
              className={`w-full flex items-center justify-center space-x-2 py-2.5 rounded-2xl font-medium text-sm transition-colors ${
                isMatteBlack
                  ? 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                  : 'text-rose-400 hover:bg-rose-500/10'
              }`}
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          /* Sign In / Sign Up Form */
          <div className="space-y-3.5">
            {!isFirebaseConfigured && (
              <div className={`p-2.5 rounded-xl text-xs flex items-start space-x-2 ${
                isMatteBlack
                  ? 'bg-neutral-800/80 text-neutral-300 border border-neutral-700'
                  : isDark
                    ? 'bg-pink-950/40 text-pink-300 border border-pink-500/25'
                    : 'bg-amber-50 text-amber-900 border border-amber-200'
              }`}>
                <AlertCircle size={15} className="shrink-0 mt-0.5 text-amber-400" />
                <p className="leading-tight">
                  Firebase keys not set in <code className="font-mono text-[11px]">.env.local</code>. Running in protected local mode with password verification.
                </p>
              </div>
            )}

            {errorMessage && (
              <div className="p-2.5 rounded-xl text-xs bg-red-500/10 border border-red-500/30 text-red-400 leading-snug">
                {errorMessage}
              </div>
            )}

            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className={`w-full py-2.5 px-3 rounded-2xl font-medium text-xs transition-all flex items-center justify-center space-x-2.5 border active:scale-95 ${
                isMatteBlack
                  ? 'bg-neutral-900 hover:bg-neutral-800 border-neutral-700 text-white'
                  : isDark
                    ? 'bg-white/10 hover:bg-white/15 border-white/20 text-white'
                    : 'bg-white hover:bg-neutral-50 border-neutral-200 text-neutral-800 shadow-sm'
              }`}
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative flex py-1 items-center">
              <div className={`flex-grow border-t ${isDark ? 'border-white/10' : 'border-neutral-200'}`}></div>
              <span className={`flex-shrink mx-2 text-[10px] uppercase tracking-wider ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                or email
              </span>
              <div className={`flex-grow border-t ${isDark ? 'border-white/10' : 'border-neutral-200'}`}></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {isSignUp && (
                <div className="space-y-1">
                  <label className={`text-xs font-semibold ${isDark ? 'text-pink-200/80' : 'text-pink-950/70'}`}>
                    Your Name
                  </label>
                  <div className="relative">
                    <User size={16} className={`absolute left-3 top-2.5 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`} />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Bunny Learner"
                      className={`w-full pl-9 pr-3 py-2 rounded-xl text-sm outline-none transition-all ${
                        isMatteBlack
                          ? 'bg-neutral-900 text-white placeholder-neutral-500 border border-neutral-700 focus:border-white'
                          : isDark
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
                  <Mail size={16} className={`absolute left-3 top-2.5 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="focus@phokus.study"
                    className={`w-full pl-9 pr-3 py-2 rounded-xl text-sm outline-none transition-all ${
                      isMatteBlack
                        ? 'bg-neutral-900 text-white placeholder-neutral-500 border border-neutral-700 focus:border-white'
                        : isDark
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
                  <Lock size={16} className={`absolute left-3 top-2.5 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full pl-9 pr-10 py-2 rounded-xl text-sm outline-none transition-all ${
                      isMatteBlack
                        ? 'bg-neutral-900 text-white placeholder-neutral-500 border border-neutral-700 focus:border-white'
                        : isDark
                          ? 'bg-white/[0.06] text-pink-100 placeholder-pink-300/30 border border-pink-500/25 focus:border-pink-500'
                          : 'bg-pink-50 text-pink-950 placeholder-pink-900/40 border border-pink-200 focus:border-pink-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-200"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-2.5 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center space-x-2 shadow-sm ${
                  isMatteBlack
                    ? 'bg-white hover:bg-neutral-200 text-black shadow-[0_0_12px_rgba(255,255,255,0.25)]'
                    : 'bg-pink-600 hover:bg-pink-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.35)]'
                }`}
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : isSignUp ? (
                  <UserPlus size={16} />
                ) : (
                  <LogIn size={16} />
                )}
                <span>{isLoading ? 'Authenticating...' : isSignUp ? 'Create Free Account' : 'Sign In'}</span>
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setErrorMessage('');
                  }}
                  className={`text-xs underline font-medium ${
                    isMatteBlack
                      ? 'text-neutral-300 hover:text-white'
                      : isDark
                        ? 'text-pink-300 hover:text-pink-100'
                        : 'text-pink-700 hover:text-pink-950'
                  }`}
                >
                  {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                </button>
              </div>

              <div className="relative flex py-1 items-center">
                <div className={`flex-grow border-t ${isDark ? 'border-white/10' : 'border-neutral-200'}`}></div>
                <span className={`flex-shrink mx-2 text-[10px] uppercase tracking-wider ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                  quick test
                </span>
                <div className={`flex-grow border-t ${isDark ? 'border-white/10' : 'border-neutral-200'}`}></div>
              </div>

              <button
                type="button"
                onClick={handleDemoSignIn}
                className={`w-full py-2 rounded-xl text-xs font-medium transition-colors ${
                  isMatteBlack
                    ? 'bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300'
                    : isDark
                      ? 'bg-white/[0.06] hover:bg-white/10 text-pink-200'
                      : 'bg-pink-100/70 hover:bg-pink-100 text-pink-900'
                }`}
              >
                Load Demo Stats & Profile
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
});
