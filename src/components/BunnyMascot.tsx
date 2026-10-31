import React, { useState, useRef, useEffect } from 'react';
import type { TimerMode, ThemeMode } from '../types';

interface BunnyMascotProps {
  mode: TimerMode;
  isRunning: boolean;
  theme: ThemeMode;
  onDismiss?: () => void;
}

const MOTIVATION_QUOTES = [
  "can you lock the fuck in",
  "you got this",
  "go back to studying"
];

export const BunnyMascot: React.FC<BunnyMascotProps> = ({
  theme
}) => {
  const isDark = theme === 'dark-mesh';
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isBubbleVisible, setIsBubbleVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Click on bunny: alternates quote, triggers smooth speech bubble, disappears after 5 seconds
  const handleClick = () => {
    // If already showing, advance to the next quote; if not showing, show current quote
    if (isBubbleVisible) {
      setQuoteIndex((prev) => (prev + 1) % MOTIVATION_QUOTES.length);
    }

    setIsBubbleVisible(true);

    // Reset and start 5-second disappearance timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      setIsBubbleVisible(false);
      // Advance quote so next time clicked it's the next one
      setQuoteIndex((prev) => (prev + 1) % MOTIVATION_QUOTES.length);
    }, 5000);
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <div className="relative flex flex-col items-center select-none z-20">
      {/* Smooth Animated White Speech Bubble */}
      <div
        className={`absolute bottom-full mb-3 left-1/2 -translate-x-1/2 whitespace-nowrap transition-all duration-300 ease-out pointer-events-none z-30 ${
          isBubbleVisible
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-90 translate-y-2'
        }`}
      >
        <div className="relative bg-white text-neutral-800 text-xs sm:text-sm font-semibold px-4 py-2 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.18)] border border-pink-100/90 tracking-wide flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
          <span>{MOTIVATION_QUOTES[quoteIndex]}</span>

          {/* Speech bubble tail pointer pointing down to bunny */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45 border-r border-b border-pink-100/90" />
        </div>
      </div>

      {/* Miffy Bunny in Pink Dress - Completely still, no hover/float */}
      <div
        onClick={handleClick}
        title="Click me!"
        className="relative cursor-pointer select-none"
      >
        {/* Soft ambient aura glow behind Miffy */}
        <div
          className={`absolute inset-0 rounded-full blur-xl -z-10 ${
            isDark
              ? 'bg-pink-500/20'
              : 'bg-pink-300/35'
          }`}
        />

        <img
          src="/miffy.png"
          alt="Phokus Bunny"
          className="w-20 sm:w-24 h-auto drop-shadow-md select-none pointer-events-none object-contain"
          draggable={false}
        />
      </div>
    </div>
  );
};
