import React, { useState, useEffect } from 'react';
import type { ThemeMode, UserProfile, UserStats } from '../types';
import { 
  ListTodo, 
  Headphones, 
  Flame, 
  Settings, 
  Maximize2, 
  Minimize2, 
  User, 
  Sun, 
  Moon,
  Sparkles 
} from 'lucide-react';

interface BottomBarProps {
  theme: ThemeMode;
  taskCount: number;
  stats: UserStats;
  currentUser: UserProfile | null;
  onToggleTasks: () => void;
  onToggleAmbient: () => void;
  onToggleTheme: () => void;
  onOpenStats: () => void;
  onOpenAuth: () => void;
  onOpenSettings: () => void;
}

export const BottomBar: React.FC<BottomBarProps> = ({
  theme,
  taskCount,
  stats,
  currentUser,
  onToggleTasks,
  onToggleAmbient,
  onToggleTheme,
  onOpenStats,
  onOpenAuth,
  onOpenSettings,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isDark = theme === 'dark-mesh';

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <footer className="w-full flex items-center justify-between px-6 md:px-12 py-6 select-none z-10 transition-colors duration-500">
      {/* Bottom Left Controls (Matching Image 1: Tasks drawer & Ambient audio) */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Tasks Toggle */}
        <button
          onClick={onToggleTasks}
          title="Toggle Tasks (To-Do List)"
          className={`relative p-3 rounded-2xl transition-all duration-200 ${
            isDark ? 'glass-btn-dark' : 'glass-btn-pink'
          }`}
        >
          <ListTodo size={20} className="stroke-[2.2]" />
          {taskCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center bg-pink-600 text-white shadow-[0_0_8px_rgba(244,63,94,0.5)]">
              {taskCount}
            </span>
          )}
        </button>

        {/* Ambient Sounds Toggle */}
        <button
          onClick={onToggleAmbient}
          title="Ambient Nature & Focus Audio"
          className={`p-3 rounded-2xl transition-all duration-200 ${
            isDark ? 'glass-btn-dark' : 'glass-btn-pink'
          }`}
        >
          <Headphones size={20} className="stroke-[2.2]" />
        </button>
      </div>

      {/* Bottom Right Controls (Matching Image 1: Streak pill, theme, profile, settings, fullscreen) */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Streak Pill (Matching Image 1 bottom right flame icon with streak count) */}
        <button
          onClick={onOpenStats}
          title="View Focus Streak & Statistics"
          className={`flex items-center space-x-1.5 px-3.5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all duration-200 ${
            isDark
              ? 'glass-btn-dark hover:text-pink-300'
              : 'glass-btn-pink hover:text-orange-600'
          }`}
        >
          <Flame size={17} className="text-orange-400 stroke-[2.5]" />
          <span>{stats.streakDays}</span>
        </button>

        {/* Theme Switcher Toggle */}
        <button
          onClick={onToggleTheme}
          title={`Theme: ${
            theme === 'light-aura' 
              ? 'Light White & Pink Aura' 
              : theme === 'bunny-pink' 
                ? 'Strawberry Silk Aura' 
                : 'Pink & Dark Mode'
          } (Click to cycle)`}
          className={`p-3 rounded-2xl transition-all duration-200 ${
            isDark ? 'glass-btn-dark' : 'glass-btn-pink'
          }`}
        >
          {isDark ? (
            <Sun size={20} className="stroke-[2.2] text-pink-300 drop-shadow-[0_0_6px_rgba(244,63,94,0.5)]" />
          ) : theme === 'light-aura' ? (
            <Sparkles size={20} className="stroke-[2.2] text-pink-500" />
          ) : (
            <Moon size={20} className="stroke-[2.2] text-pink-700" />
          )}
        </button>

        {/* User Account / Profile */}
        <button
          onClick={onOpenAuth}
          title={currentUser ? `Signed in as ${currentUser.name}` : "Sign in to sync focus stats"}
          className={`flex items-center space-x-1.5 px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 ${
            currentUser
              ? isDark
                ? 'bg-pink-950/50 text-pink-200 border border-pink-500/35 hover:bg-pink-900/40 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
                : 'bg-pink-100 text-pink-700 border border-pink-300 hover:bg-pink-200'
              : isDark ? 'glass-btn-dark' : 'glass-btn-pink'
          }`}
        >
          <User size={18} className="stroke-[2.2]" />
          <span className="hidden sm:inline max-w-[80px] truncate">
            {currentUser ? currentUser.name : 'Sign In'}
          </span>
        </button>

        {/* Settings Toggle */}
        <button
          onClick={onOpenSettings}
          title="Preferences & Timer Durations"
          className={`p-3 rounded-2xl transition-all duration-200 ${
            isDark ? 'glass-btn-dark' : 'glass-btn-pink'
          }`}
        >
          <Settings size={20} className="stroke-[2.2]" />
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          className={`p-3 rounded-2xl transition-all duration-200 ${
            isDark ? 'glass-btn-dark' : 'glass-btn-pink'
          }`}
        >
          {isFullscreen ? (
            <Minimize2 size={20} className="stroke-[2.2]" />
          ) : (
            <Maximize2 size={20} className="stroke-[2.2]" />
          )}
        </button>
      </div>
    </footer>
  );
};
