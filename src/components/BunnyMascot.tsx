import React from 'react';
import type { TimerMode, ThemeMode } from '../types';

interface BunnyMascotProps {
  mode: TimerMode;
  isRunning: boolean;
  theme: ThemeMode;
  onDismiss?: () => void;
}

export const BunnyMascot: React.FC<BunnyMascotProps> = ({
  mode,
  isRunning,
  theme
}) => {
  const isDark = theme === 'dark-mesh';

  const getStatusText = () => {
    if (mode === 'focus') {
      return isRunning ? 'Quietly focusing with you' : 'Ready when you are';
    }
    if (mode === 'shortBreak') {
      return isRunning ? 'Take a slow sip of water' : 'Ready for a short rest';
    }
    return isRunning ? 'Deep breath, long pause' : 'Time for a gentle recharge';
  };

  return (
    <div className="flex flex-col items-center select-none pointer-events-auto transition-all duration-300">
      {/* Speech bubble */}
      <div
        className={`mb-2 px-3 py-1 rounded-full text-xs font-medium tracking-wide shadow-sm transition-all duration-300 ${
          isDark
            ? 'bg-[#15141b]/90 text-pink-200 border border-pink-500/35 shadow-pink-950/40'
            : 'bg-white/90 text-pink-800 border border-pink-200/60 shadow-pink-100'
        }`}
      >
        <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 bg-pink-400 animate-pulse" />
        {getStatusText()}
      </div>

      {/* Bunny Vector Illustration - ALWAYS pure White & Pink as requested! */}
      <div className={`relative w-20 h-20 transition-transform duration-700 ${isRunning ? 'animate-float' : ''}`}>
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-md"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Soft ambient pink glow circle behind bunny */}
          <circle
            cx="50"
            cy="55"
            r="38"
            className={isDark ? "fill-pink-500/20" : "fill-pink-200/40"}
          />

          {/* Left Ear - White with Pink outline */}
          <path
            d="M36 45 C30 24 32 4 41 3 C49 2 47 24 43 45"
            className="fill-white stroke-pink-400"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Left Inner Ear - Pastel Pink */}
          <path
            d="M37 36 C34 26 35 12 40 10 C44 9 43 24 41 36"
            className="fill-pink-300"
          />

          {/* Right Ear - White with Pink outline */}
          <path
            d="M64 45 C70 24 68 4 59 3 C51 2 53 24 57 45"
            className="fill-white stroke-pink-400"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Right Inner Ear - Pastel Pink */}
          <path
            d="M63 36 C66 26 65 12 60 10 C56 9 57 24 59 36"
            className="fill-pink-300"
          />

          {/* Body - Pure White */}
          <ellipse
            cx="50"
            cy="70"
            rx="28"
            ry="22"
            className="fill-white stroke-pink-400"
            strokeWidth="3.5"
          />

          {/* Head - Pure White */}
          <circle
            cx="50"
            cy="52"
            r="22"
            className="fill-white stroke-pink-400"
            strokeWidth="3.5"
          />

          {/* Cheeks - Sweet Rosy Pink */}
          <ellipse
            cx="37"
            cy="56"
            rx="3.2"
            ry="2"
            className="fill-pink-400/80"
          />
          <ellipse
            cx="63"
            cy="56"
            rx="3.2"
            ry="2"
            className="fill-pink-400/80"
          />

          {/* Eyes: calm closed curved eyes when focusing, gentle open eyes when resting */}
          {mode === 'focus' ? (
            <>
              {/* Quiet focusing eyes */}
              <path
                d="M40 50 Q43 53 46 50"
                stroke="#831433"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M54 50 Q57 53 60 50"
                stroke="#831433"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
            </>
          ) : (
            <>
              {/* Gentle open eyes */}
              <circle cx="43" cy="49" r="2.2" fill="#831433" />
              <circle cx="57" cy="49" r="2.2" fill="#831433" />
              <circle cx="44" cy="48" r="0.8" fill="#ffffff" />
              <circle cx="58" cy="48" r="0.8" fill="#ffffff" />
            </>
          )}

          {/* Nose and Mouth - Pink */}
          <polygon
            points="48.5,54 51.5,54 50,56"
            fill="#f43f5e"
          />
          <path
            d="M47 57.5 Q50 59.5 50 56 Q50 59.5 53 57.5"
            stroke="#9f1239"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />

          {/* Cute Tiny Paws - White */}
          <ellipse
            cx="42"
            cy="70"
            rx="4.5"
            ry="3.5"
            className="fill-white stroke-pink-400"
            strokeWidth="2"
          />
          <ellipse
            cx="58"
            cy="70"
            rx="4.5"
            ry="3.5"
            className="fill-white stroke-pink-400"
            strokeWidth="2"
          />

          {/* Mode specific accessory */}
          {mode === 'focus' ? (
            /* Minimalist Pink Headband / Headphone band */
            <path
              d="M32 46 C32 30 68 30 68 46"
              stroke="#fb7185"
              strokeWidth="2.2"
              strokeDasharray="2 1"
              strokeLinecap="round"
              fill="none"
            />
          ) : (
            /* Tea cup during break */
            <g transform="translate(46, 64) scale(0.65)">
              <rect x="0" y="3" width="12" height="9" rx="2" fill="#ffe4ea" stroke="#fb7185" strokeWidth="1.5" />
              <path d="M12 5 Q15 7.5 12 10" stroke="#fb7185" strokeWidth="1.5" fill="none" />
              {/* Steam */}
              <path d="M4 1 Q6 -1 5 -3" stroke="#f472b6" strokeWidth="1" strokeLinecap="round" fill="none" />
              <path d="M8 1 Q10 -1 9 -3" stroke="#f472b6" strokeWidth="1" strokeLinecap="round" fill="none" />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};
