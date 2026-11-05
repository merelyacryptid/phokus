import React, { useState } from 'react';
import { BunnyEarsLogo } from './BunnyIcon';
import type { ThemeMode } from '../types';
import { getRandomQuote } from '../utils/quotes';
import { RefreshCw } from 'lucide-react';

interface HeaderProps {
  theme: ThemeMode;
}

export const Header: React.FC<HeaderProps> = React.memo(({ theme }) => {
  const [quote, setQuote] = useState<string>("Success comes to those who never stop learning");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isMatteBlack = theme === 'matte-black';
  const isDark = theme === 'dark-mesh' || isMatteBlack;

  const handleNextQuote = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setQuote(prev => getRandomQuote(prev));
      setIsRefreshing(false);
    }, 150);
  };

  return (
    <header className="w-full flex items-center justify-between px-6 md:px-12 py-6 select-none z-10 transition-colors duration-500">
      {/* Brand Logo */}
      <div className="flex items-center space-x-2.5 group cursor-default">
        <div className={`p-1.5 rounded-xl transition-all duration-300 ${
          isMatteBlack
            ? 'text-white bg-neutral-900 border border-neutral-700 shadow-sm'
            : isDark 
              ? 'text-pink-400 bg-pink-500/15 group-hover:bg-pink-500/25 border border-pink-500/30 shadow-[0_0_12px_rgba(244,63,94,0.2)]' 
              : 'text-pink-600 bg-pink-100/70 group-hover:bg-pink-100'
        }`}>
          <BunnyEarsLogo className="w-6 h-6 transform transition-transform group-hover:scale-105" />
        </div>
        <span className={`text-2xl font-bold tracking-tight lowercase ${
          isMatteBlack
            ? 'text-white font-extrabold drop-shadow-[0_0_12px_rgba(255,255,255,0.25)]'
            : isDark ? 'text-pink-100 drop-shadow-[0_0_12px_rgba(244,63,94,0.3)]' : 'text-pink-950 font-extrabold'
        }`}>
          phokus
        </span>
      </div>

      {/* Encouraging Quote in top-right */}
      <div 
        onClick={handleNextQuote}
        title="Click to see another encouraging quote"
        className={`group flex items-center gap-2 max-w-sm sm:max-w-md text-right cursor-pointer transition-all duration-300 p-2 rounded-xl ${
          isMatteBlack ? 'hover:bg-white/5' : isDark ? 'hover:bg-pink-950/40' : 'hover:bg-white/40'
        }`}
      >
        <p className={`text-xs sm:text-sm font-medium tracking-wide italic transition-opacity duration-200 ${
          isRefreshing ? 'opacity-0' : 'opacity-100'
        } ${
          isMatteBlack 
            ? 'text-neutral-400 group-hover:text-white' 
            : isDark ? 'text-pink-200/80 group-hover:text-pink-100' : 'text-pink-900/80 group-hover:text-pink-950'
        }`}>
          &ldquo;{quote}&rdquo;
        </p>
        <RefreshCw 
          size={12} 
          className={`opacity-0 group-hover:opacity-75 transition-all duration-200 shrink-0 ${
            isRefreshing ? 'rotate-180' : ''
          } ${isMatteBlack ? 'text-neutral-400' : isDark ? 'text-pink-400' : 'text-pink-800'}`} 
        />
      </div>
    </header>
  );
});
