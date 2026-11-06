import React, { useState, useEffect, useRef } from 'react';
import type { ThemeMode, UserProfile, UserStats } from '../types';
import { CarrotIcon } from './CarrotIcon';
import { 
  ListTodo, 
  Headphones, 
  Flame, 
  Settings, 
  Maximize2, 
  Minimize2, 
  User, 
  Moon,
  Sparkles,
  MoonStar,
  Contrast,
  Gamepad2
} from 'lucide-react';

interface BottomBarProps {
  theme: ThemeMode;
  taskCount: number;
  stats: UserStats;
  currentUser: UserProfile | null;
  onToggleTasks: () => void;
  onToggleAmbient: () => void;
  onOpenBored: () => void;
  onToggleTheme: () => void;
  onSelectTheme?: (theme: ThemeMode) => void;
  onOpenStats: () => void;
  onOpenAuth: () => void;
  onOpenSettings: () => void;
}

interface ThemeOption {
  id: ThemeMode;
  name: string;
  icon: (isSelected: boolean) => React.ReactNode;
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'bunny-pink',
    name: 'Strawberry Silk',
    icon: (isSelected) => (
      <Moon size={18} className={`stroke-[2.2] transition-colors ${isSelected ? 'text-pink-600' : 'text-pink-400'}`} />
    ),
  },
  {
    id: 'light-aura',
    name: 'Light Aura',
    icon: (isSelected) => (
      <Sparkles size={18} className={`stroke-[2.2] transition-colors ${isSelected ? 'text-amber-500' : 'text-amber-400'}`} />
    ),
  },
  {
    id: 'dark-mesh',
    name: 'Dark Aura',
    icon: (isSelected) => (
      <MoonStar size={18} className={`stroke-[2.2] transition-colors ${isSelected ? 'text-purple-400' : 'text-purple-300'}`} />
    ),
  },
  {
    id: 'matte-black',
    name: 'Matte Black',
    icon: (isSelected) => (
      <Contrast size={18} className={`stroke-[2.2] transition-colors ${isSelected ? 'text-white' : 'text-neutral-400'}`} />
    ),
  },
];

export const BottomBar: React.FC<BottomBarProps> = React.memo(({
  theme,
  taskCount,
  stats,
  currentUser,
  onToggleTasks,
  onToggleAmbient,
  onOpenBored,
  onToggleTheme,
  onSelectTheme,
  onOpenStats,
  onOpenAuth,
  onOpenSettings,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  const isMatteBlack = theme === 'matte-black';
  const isDark = theme === 'dark-mesh' || isMatteBlack;
  const btnClass = isMatteBlack ? 'glass-btn-matte' : isDark ? 'glass-btn-dark' : 'glass-btn-pink';

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Close theme menu on outside click or Escape key
  useEffect(() => {
    if (!isThemeMenuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setIsThemeMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsThemeMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isThemeMenuOpen]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleThemeOptionClick = (themeId: ThemeMode) => {
    if (onSelectTheme) {
      onSelectTheme(themeId);
    } else {
      onToggleTheme();
    }
    setIsThemeMenuOpen(false);
  };

  const activeThemeOption = THEME_OPTIONS.find(t => t.id === theme) || THEME_OPTIONS[0];

  return (
    <footer className="w-full flex items-center justify-between px-6 md:px-12 py-6 select-none z-10 transition-colors duration-500">
      {/* Bottom Left Controls (Tasks drawer & Ambient audio) */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Tasks Toggle */}
        <button
          onClick={onToggleTasks}
          title="Toggle Tasks (To-Do List)"
          className={`relative p-3 rounded-2xl transition-all duration-200 ${btnClass}`}
        >
          <ListTodo size={20} className="stroke-[2.2]" />
          {taskCount > 0 && (
            <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${
              isMatteBlack ? 'bg-white text-black shadow-md' : 'bg-pink-600 text-white shadow-[0_0_8px_rgba(244,63,94,0.5)]'
            }`}>
              {taskCount}
            </span>
          )}
        </button>

        {/* Ambient Sounds Toggle */}
        <button
          onClick={onToggleAmbient}
          title="Ambient Nature & Focus Audio"
          className={`p-3 rounded-2xl transition-all duration-200 ${btnClass}`}
        >
          <Headphones size={20} className="stroke-[2.2]" />
        </button>

        {/* Bored? Games & Quizzes */}
        <button
          onClick={onOpenBored}
          title="Bored? Play mini-games & fun quizzes"
          className={`flex items-center space-x-1.5 px-3 sm:px-3.5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer active:scale-95 ${btnClass}`}
        >
          <Gamepad2 size={18} className="stroke-[2.2] shrink-0" />
          <span className="font-semibold text-xs">bored?</span>
        </button>
      </div>

      {/* Bottom Right Controls (Streak pill, theme menu, profile, settings, fullscreen) */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Streak & Carrot Graph Stats Pill */}
        <button
          onClick={onOpenStats}
          title="Open Focus Statistics & Carrot Graph"
          className={`flex items-center space-x-2 px-3 sm:px-3.5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
            isMatteBlack
              ? 'glass-btn-matte hover:text-neutral-200'
              : isDark
                ? 'glass-btn-dark hover:text-pink-300'
                : 'glass-btn-pink hover:text-orange-600'
          }`}
        >
          <div className="flex items-center space-x-1">
            <Flame size={16} className="text-orange-400 stroke-[2.5]" />
            <span>{stats.streakDays}</span>
          </div>
          <span className="opacity-25">|</span>
          <div className={`flex items-center space-x-1 ${isMatteBlack ? 'text-white' : 'text-pink-500'}`}>
            <CarrotIcon size={14} level={3} />
            <span className="font-semibold text-xs hidden sm:inline">Stats</span>
          </div>
        </button>

        {/* Theme Selector Popover */}
        <div className="relative" ref={themeMenuRef}>
          {isThemeMenuOpen && (
            <div className="absolute bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
              <div
                role="dialog"
                aria-label="Theme selector"
                className={`flex items-center p-1.5 rounded-2xl shadow-2xl backdrop-blur-xl border transition-all duration-200 whitespace-nowrap animate-fade-in ${
                  isMatteBlack
                    ? 'bg-[#151518]/95 border-neutral-700 shadow-black/80'
                    : isDark
                      ? 'bg-[#1a1324]/95 border-pink-500/30 shadow-black/80'
                      : 'bg-white/95 border-pink-200 shadow-pink-200/50'
                }`}
              >
                <div className="flex items-center space-x-1">
                  {THEME_OPTIONS.map((t) => {
                    const isSelected = theme === t.id;
                    return (
                      <div key={t.id} className="relative group">
                        <button
                          type="button"
                          onClick={() => handleThemeOptionClick(t.id)}
                          title={t.name}
                          className={`p-2.5 rounded-xl transition-all duration-150 flex items-center justify-center active:scale-95 ${
                            isSelected
                              ? isMatteBlack
                                ? 'bg-neutral-800 text-white shadow-sm ring-1 ring-white/40'
                                : isDark
                                  ? 'bg-pink-600/30 text-pink-200 shadow-sm ring-1 ring-pink-400/50'
                                  : 'bg-pink-100 text-pink-700 shadow-sm ring-1 ring-pink-400/50'
                              : isMatteBlack
                                ? 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                                : isDark
                                  ? 'text-pink-300/70 hover:text-pink-100 hover:bg-white/10'
                                  : 'text-pink-900/60 hover:text-pink-950 hover:bg-pink-100/60'
                          }`}
                        >
                          {t.icon(isSelected)}
                        </button>

                        {/* Tooltip on hover showing theme name */}
                        <div
                          className={`pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-150 transform translate-y-1 group-hover:translate-y-0 shadow-lg z-50 ${
                            isMatteBlack
                              ? 'bg-neutral-900 text-white border border-neutral-700 shadow-black'
                              : isDark
                                ? 'bg-[#150f1d] text-pink-100 border border-pink-500/30 shadow-black'
                                : 'bg-pink-950 text-white shadow-pink-950/20'
                          }`}
                        >
                          {t.name}
                          <div
                            className={`absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent ${
                              isMatteBlack
                                ? 'border-t-neutral-900'
                                : isDark
                                  ? 'border-t-[#150f1d]'
                                  : 'border-t-pink-950'
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Theme Trigger Button */}
          <button
            onClick={() => setIsThemeMenuOpen(prev => !prev)}
            title={`Current Theme: ${activeThemeOption.name} (Click to change)`}
            aria-expanded={isThemeMenuOpen}
            className={`p-3 rounded-2xl transition-all duration-200 ${btnClass} ${
              isThemeMenuOpen
                ? isMatteBlack
                  ? 'ring-2 ring-white/50 bg-neutral-800'
                  : isDark
                    ? 'ring-2 ring-pink-500/60 bg-pink-600/20'
                    : 'ring-2 ring-pink-400/60 bg-pink-100'
                : ''
            }`}
          >
            {theme === 'matte-black' ? (
              <Contrast size={20} className="stroke-[2.2] text-white" />
            ) : isDark ? (
              <MoonStar size={20} className="stroke-[2.2] text-pink-300 drop-shadow-[0_0_6px_rgba(244,63,94,0.5)]" />
            ) : theme === 'light-aura' ? (
              <Sparkles size={20} className="stroke-[2.2] text-pink-500" />
            ) : (
              <Moon size={20} className="stroke-[2.2] text-pink-700" />
            )}
          </button>
        </div>

        {/* User Account / Profile */}
        <button
          onClick={onOpenAuth}
          title={currentUser ? `Signed in as ${currentUser.name}` : "Sign in to sync focus stats"}
          className={`flex items-center space-x-1.5 px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 ${
            currentUser
              ? isMatteBlack
                ? 'bg-neutral-800 text-white border border-neutral-600 hover:bg-neutral-700 shadow-md'
                : isDark
                  ? 'bg-pink-950/50 text-pink-200 border border-pink-500/35 hover:bg-pink-900/40 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
                  : 'bg-pink-100 text-pink-700 border border-pink-300 hover:bg-pink-200'
              : btnClass
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
          className={`p-3 rounded-2xl transition-all duration-200 ${btnClass}`}
        >
          <Settings size={20} className="stroke-[2.2]" />
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          className={`p-3 rounded-2xl transition-all duration-200 ${btnClass}`}
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
});
