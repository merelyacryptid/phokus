import React, { useState, useRef, useEffect } from 'react';
import type { TimerMode, ThemeMode } from '../types';

interface BunnyMascotProps {
  mode: TimerMode;
  isRunning: boolean;
  theme: ThemeMode;
  onDismiss?: () => void;
}

export const BunnyMascot: React.FC<BunnyMascotProps> = React.memo(({
  theme
}) => {
  const isMatteBlack = theme === 'matte-black';
  const isCleanGreen = theme === 'clean-green';
  const isDark = theme === 'dark-mesh' || isMatteBlack;

  const quotes = isMatteBlack 
    ? ["are ya studying son", "still, i survive"]
    : ["can u pls lock in", "you got this", "go back to studying", "nothing changes if nothing changes"];

  const [isBubbleVisible, setIsBubbleVisible] = useState(false);
  const [bubbleText, setBubbleText] = useState(quotes[0]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastQuoteRef = useRef<string>('');

  // Click on mascot:
  // - First tap: displays a random quote and starts 5s timer
  // - Tap again within 5s: changes to "shoo go study" and restarts 5s timer
  // - After 5s: bubble disappears cleanly
  const handleClick = () => {
    if (isBubbleVisible) {
      setBubbleText("shoo go study");

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        setIsBubbleVisible(false);
      }, 5000);
      return;
    }

    // Pick a random quote, preferring not to repeat the exact previous quote
    const candidates = quotes.filter(q => q !== lastQuoteRef.current);
    const chosenQuote = candidates.length > 0 
      ? candidates[Math.floor(Math.random() * candidates.length)]
      : quotes[Math.floor(Math.random() * quotes.length)];

    lastQuoteRef.current = chosenQuote;
    setBubbleText(chosenQuote);
    setIsBubbleVisible(true);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      setIsBubbleVisible(false);
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
      {/* Smooth Animated Speech Bubble */}
      <div
        className={`absolute bottom-full mb-3 left-1/2 -translate-x-1/2 whitespace-nowrap transition-all duration-300 ease-out pointer-events-none z-30 ${
          isBubbleVisible
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-90 translate-y-2'
        }`}
      >
        <div
          className={`relative text-xs sm:text-sm font-semibold px-4 py-2 rounded-2xl tracking-wide flex items-center gap-1.5 ${
            isMatteBlack
              ? 'bg-neutral-900 text-white border border-neutral-700 shadow-[0_8px_24px_rgba(0,0,0,0.7)]'
              : isCleanGreen
                ? 'bg-white text-emerald-950 border border-emerald-300/80 shadow-[0_8px_24px_rgba(20,47,16,0.18)]'
                : 'bg-white text-neutral-800 border border-pink-100/90 shadow-[0_8px_24px_rgba(0,0,0,0.18)]'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isMatteBlack ? 'bg-white animate-pulse' : isCleanGreen ? 'bg-emerald-600 animate-pulse' : 'bg-pink-500 animate-pulse'
            }`}
          />
          <span>{bubbleText}</span>

          {/* Speech bubble tail pointer pointing down to character */}
          <div
            className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 ${
              isMatteBlack
                ? 'bg-neutral-900 border-r border-b border-neutral-700'
                : isCleanGreen
                  ? 'bg-white border-r border-b border-emerald-300/80'
                  : 'bg-white border-r border-b border-pink-100/90'
            }`}
          />
        </div>
      </div>

      {/* Character Mascot - Stationary, completely still */}
      <div
        onClick={handleClick}
        title={isMatteBlack ? "The Knight" : "Click me!"}
        className="relative cursor-pointer select-none"
      >
        {/* Soft ambient aura glow behind character */}
        <div
          className={`absolute inset-0 rounded-full blur-xl -z-10 ${
            isMatteBlack
              ? 'bg-white/10'
              : isCleanGreen
                ? 'bg-emerald-300/40'
                : isDark
                  ? 'bg-pink-500/20'
                  : 'bg-pink-300/35'
          }`}
        />

        {isMatteBlack ? (
          /* Hollow Knight for Matte Black Theme */
          <img
            src="/hollow-knight.png"
            alt="Hollow Knight"
            className="w-16 sm:w-20 h-auto drop-shadow-[0_4px_16px_rgba(255,255,255,0.12)] select-none pointer-events-none object-contain"
            draggable={false}
          />
        ) : isCleanGreen ? (
          /* Green Sweater Miffy Bunny for Clean Green Theme */
          <img
            src="/miffy-green.png"
            alt="Phokus Clean Green Bunny"
            className="w-20 sm:w-24 h-auto drop-shadow-md select-none pointer-events-none object-contain"
            draggable={false}
          />
        ) : (
          /* Miffy Bunny for Pink Themes */
          <img
            src="/miffy.png"
            alt="Phokus Bunny"
            className="w-20 sm:w-24 h-auto drop-shadow-md select-none pointer-events-none object-contain"
            draggable={false}
          />
        )}
      </div>
    </div>
  );
});
