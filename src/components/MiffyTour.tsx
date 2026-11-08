import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { ThemeMode } from '../types';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface MiffyTourProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeMode;
}

interface TourStep {
  id: string;
  targetSelector: string;
  badge: string;
  title: string;
  content: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'timer-setup',
    targetSelector: '[data-tour="timer-setup"]',
    badge: 'Timer Setup',
    title: 'Pomodoro Timer Flow',
    content: 'Phokus follows the Pomodoro method with 40-minute focus sessions and refreshing breaks. You can customize all session lengths anytime in Settings!',
  },
  {
    id: 'pip-button',
    targetSelector: '[data-tour="pip-button"]',
    badge: 'Multitasking',
    title: 'Picture-in-Picture (PiP)',
    content: 'Pop out a mini floating timer with play & pause controls so you can work outside the app and stay on track in other windows!',
  },
  {
    id: 'task-setup',
    targetSelector: '[data-tour="task-setup"]',
    badge: 'Current Focus',
    title: 'Set Your Active Focus',
    content: 'Click here to type what you want to focus on or check it off when finished. Your primary task stays pinned right above the timer!',
  },
  {
    id: 'tasks-drawer',
    targetSelector: '[data-tour="tasks-drawer-toggle"]',
    badge: 'Tasks Drawer',
    title: 'Tasks Drawer & Reordering',
    content: 'Click this Tasks icon in the bottom-left to open your Tasks Drawer! Add all your to-dos, set estimated focus minutes, and drag tasks to reorder them.',
  },
  {
    id: 'theme-toggle',
    targetSelector: '[data-tour="theme-toggle"]',
    badge: 'Aesthetics',
    title: 'Change Your Theme',
    content: 'Personalize your workspace anytime! Switch between Strawberry Silk, Light Aura, Dark Aura, or Matte Black with Hollow Knight.',
  },
  {
    id: 'settings-toggle',
    targetSelector: '[data-tour="settings-toggle"]',
    badge: 'Sound & Durations',
    title: 'Settings & Audio',
    content: 'Use Settings to fine-tune your timer durations, pick completion alert chimes (Crystal, Bell, Marimba), and adjust volume.',
  },
  {
    id: 'stats-toggle',
    targetSelector: '[data-tour="stats-toggle"]',
    badge: 'Track Progress',
    title: 'View Stats & Focus Time',
    content: 'Keep an eye on your daily streak and total focus minutes. Click here to inspect your stats and watch your carrot garden grow!',
  },
  {
    id: 'auth-toggle',
    targetSelector: '[data-tour="auth-toggle"]',
    badge: 'Cloud Sync',
    title: 'Easy Sign In to Save Stats',
    content: 'Sign in with Google or email in seconds to automatically save and sync your focus stats, streaks, and tasks across all your devices!',
  },
];

export const MiffyTour: React.FC<MiffyTourProps> = ({ isOpen, onClose, theme }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isMatteBlack = theme === 'matte-black';
  const isDark = theme === 'dark-mesh' || isMatteBlack;

  const step = TOUR_STEPS[currentStep] || TOUR_STEPS[0];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  const handleClose = useCallback(() => {
    setCurrentStep(0);
    onClose();
  }, [onClose]);

  const handleFinish = useCallback(() => {
    try {
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#f43f5e', '#ec4899', '#fb7185', '#fda4af', '#ffffff'],
      });
    } catch {
      // Ignore if confetti fails
    }
    handleClose();
  }, [handleClose]);

  // Measure and position highlight around target element
  const updateTargetRect = useCallback(() => {
    if (!isOpen) return;
    const el = document.querySelector(step.targetSelector);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      setTargetRect(null);
    }
  }, [isOpen, step.targetSelector]);

  // Whenever step or open state changes, scroll target into view and update rect
  useEffect(() => {
    if (!isOpen) return;

    const el = document.querySelector(step.targetSelector);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }

    // Schedule calculation after scroll settles
    const rafId = requestAnimationFrame(() => {
      updateTargetRect();
    });
    const timer = setTimeout(updateTargetRect, 250);

    const handleResize = () => updateTargetRect();
    const handleScroll = () => updateTargetRect();

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen, step, updateTargetRect]);

  // Keyboard navigation: Escape to close, Left/Right arrows or Enter to navigate
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (currentStep < TOUR_STEPS.length - 1) {
          setCurrentStep((prev) => prev + 1);
        } else {
          handleFinish();
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentStep > 0) {
          setCurrentStep((prev) => prev - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep, handleClose, handleFinish]);

  const handleNext = () => {
    if (isLastStep) {
      handleFinish();
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, TOUR_STEPS.length - 1));
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  if (!isOpen) return null;

  // Calculate position coordinates for the Miffy + Speech Bubble container
  const padding = 8;
  const getContainerStyle = (): React.CSSProperties => {
    if (!targetRect) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const isMobile = viewportWidth < 640;
    const popupWidth = isMobile ? Math.min(viewportWidth - 32, 340) : 420;

    // Determine vertical placement: Above or Below
    const isNearBottom = targetRect.bottom > viewportHeight * 0.58;

    let top: number | undefined;
    let bottom: number | undefined;
    let left: number | undefined;
    let right: number | undefined;

    if (isNearBottom) {
      bottom = Math.max(16, viewportHeight - targetRect.top + 16);
    } else {
      top = Math.max(16, targetRect.bottom + 16);
    }

    // Determine horizontal placement
    const targetCenterX = targetRect.left + targetRect.width / 2;

    if (isMobile) {
      // Center horizontally on mobile within screen padding
      left = Math.max(16, Math.min(viewportWidth - popupWidth - 16, (viewportWidth - popupWidth) / 2));
    } else if (targetCenterX > viewportWidth * 0.65) {
      // Align toward right edge
      right = Math.max(20, viewportWidth - targetRect.right);
    } else if (targetCenterX < viewportWidth * 0.35) {
      // Align toward left edge
      left = Math.max(20, targetRect.left);
    } else {
      // Center relative to target
      left = Math.max(20, Math.min(viewportWidth - popupWidth - 20, targetCenterX - popupWidth / 2));
    }

    return {
      top,
      bottom,
      left,
      right,
      maxWidth: popupWidth,
    };
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-step-title"
      aria-describedby="tour-step-desc"
      className="fixed inset-0 z-50 overflow-hidden select-none pointer-events-auto"
    >
      {/* SVG Mask for Dark Backdrop & Spotlight Cutout */}
      <svg className="fixed inset-0 w-full h-full pointer-events-none z-10" aria-hidden="true">
        <defs>
          <mask id="miffy-spotlight-mask">
            {/* White reveals overlay */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Black cuts out window around target element */}
            {targetRect && (
              <rect
                x={targetRect.left - padding}
                y={targetRect.top - padding}
                width={targetRect.width + padding * 2}
                height={targetRect.height + padding * 2}
                rx="16"
                fill="black"
              />
            )}
          </mask>
        </defs>

        {/* Semi-transparent Backdrop */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.68)"
          mask="url(#miffy-spotlight-mask)"
          className="pointer-events-auto cursor-pointer"
          onClick={onClose}
        />
      </svg>

      {/* Glowing Spotlight Ring around Highlighted Target Feature */}
      {targetRect && (
        <div
          style={{
            position: 'fixed',
            left: targetRect.left - padding,
            top: targetRect.top - padding,
            width: targetRect.width + padding * 2,
            height: targetRect.height + padding * 2,
          }}
          className={`rounded-2xl pointer-events-none z-20 transition-all duration-300 ease-out ${
            isMatteBlack
              ? 'ring-4 ring-white shadow-[0_0_28px_rgba(255,255,255,0.7)] animate-pulse'
              : 'ring-4 ring-pink-400 shadow-[0_0_32px_rgba(244,63,94,0.75)] animate-pulse'
          }`}
        />
      )}

      {/* Miffy Character + Speech Bubble Anchor Container */}
      <div
        ref={containerRef}
        style={getContainerStyle()}
        className="fixed z-30 flex flex-col sm:flex-row items-center sm:items-start gap-3 transition-all duration-300 ease-out animate-fade-in pointer-events-auto"
      >
        {/* Miffy Mascot Character */}
        <div className="relative shrink-0 flex flex-col items-center">
          {/* Subtle Ambient Aura Glow Behind Miffy */}
          <div
            className={`absolute inset-0 rounded-full blur-xl -z-10 ${
              isMatteBlack ? 'bg-white/20' : 'bg-pink-400/35'
            }`}
          />
          <img
            src="/miffy.png"
            alt="Miffy Mascot Guide"
            className="w-16 sm:w-20 h-auto object-contain select-none drop-shadow-[0_6px_16px_rgba(0,0,0,0.25)] hover:scale-105 transition-transform duration-200"
            draggable={false}
          />
        </div>

        {/* Speech Bubble from Miffy */}
        <div
          className={`relative rounded-3xl p-5 shadow-2xl backdrop-blur-xl border transition-all duration-200 w-full ${
            isMatteBlack
              ? 'bg-[#18181b]/95 text-white border-neutral-700 shadow-[0_16px_40px_rgba(0,0,0,0.85)]'
              : isDark
                ? 'bg-[#1d1429]/95 text-pink-100 border-pink-500/40 shadow-[0_16px_40px_rgba(0,0,0,0.85)]'
                : 'bg-white/95 text-pink-950 border-pink-200/90 shadow-[0_16px_40px_rgba(244,63,94,0.2)]'
          }`}
        >
          {/* Speech Bubble Pointer Tail (points to Miffy: on left for desktop, on top for mobile) */}
          <div
            className={`hidden sm:block absolute -left-2 top-8 w-4 h-4 rotate-45 ${
              isMatteBlack
                ? 'bg-[#18181b] border-l border-b border-neutral-700'
                : isDark
                  ? 'bg-[#1d1429] border-l border-b border-pink-500/40'
                  : 'bg-white border-l border-b border-pink-200/90'
            }`}
          />
          <div
            className={`sm:hidden absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 ${
              isMatteBlack
                ? 'bg-[#18181b] border-l border-t border-neutral-700'
                : isDark
                  ? 'bg-[#1d1429] border-l border-t border-pink-500/40'
                  : 'bg-white border-l border-t border-pink-200/90'
            }`}
          />

          {/* Bubble Header: Badge, Step Indicator & Close Button */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span
                className={`text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                  isMatteBlack
                    ? 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                    : isDark
                      ? 'bg-pink-600/30 text-pink-200 border border-pink-500/40'
                      : 'bg-pink-100 text-pink-700 border border-pink-200'
                }`}
              >
                <Sparkles size={11} className="stroke-[2.5]" />
                <span>{step.badge}</span>
              </span>
              <span
                className={`text-xs font-semibold ${
                  isMatteBlack ? 'text-neutral-400' : isDark ? 'text-pink-300/70' : 'text-pink-900/60'
                }`}
              >
                {currentStep + 1}/{TOUR_STEPS.length}
              </span>
            </div>

            <button
              onClick={onClose}
              title="Close Guide (Esc)"
              className={`p-1 rounded-full transition-colors ${
                isMatteBlack
                  ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white'
                  : isDark
                    ? 'hover:bg-white/10 text-pink-300 hover:text-white'
                    : 'hover:bg-pink-100 text-pink-400 hover:text-pink-700'
              }`}
            >
              <X size={16} className="stroke-[2.5]" />
            </button>
          </div>

          {/* Bubble Content */}
          <h3
            id="tour-step-title"
            className={`text-base sm:text-lg font-bold mb-1.5 leading-snug ${
              isMatteBlack ? 'text-white' : isDark ? 'text-pink-100' : 'text-pink-950'
            }`}
          >
            {step.title}
          </h3>

          <p
            id="tour-step-desc"
            className={`text-xs sm:text-sm leading-relaxed ${
              isMatteBlack ? 'text-neutral-300' : isDark ? 'text-pink-200/85' : 'text-pink-900/80'
            }`}
          >
            {step.content}
          </p>

          {/* Bubble Footer: Progress Dots + Back / Next Controls */}
          <div
            className={`mt-4 pt-3 border-t flex items-center justify-between gap-2 ${
              isMatteBlack
                ? 'border-neutral-800'
                : isDark
                  ? 'border-pink-500/20'
                  : 'border-pink-100'
            }`}
          >
            {/* Step Navigation Dots */}
            <div className="flex items-center space-x-1.5" aria-label="Tour progress">
              {TOUR_STEPS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStep(idx)}
                  title={`Jump to step ${idx + 1}`}
                  className={`h-2 rounded-full transition-all duration-200 ${
                    idx === currentStep
                      ? isMatteBlack
                        ? 'w-5 bg-white shadow-sm'
                        : 'w-5 bg-pink-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
                      : isMatteBlack
                        ? 'w-2 bg-neutral-700 hover:bg-neutral-500'
                        : isDark
                          ? 'w-2 bg-pink-950 hover:bg-pink-800'
                          : 'w-2 bg-pink-200 hover:bg-pink-300'
                  }`}
                />
              ))}
            </div>

            {/* Back / Next Buttons */}
            <div className="flex items-center space-x-2">
              {!isFirstStep && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
                    isMatteBlack
                      ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                      : isDark
                        ? 'bg-white/10 hover:bg-white/15 text-pink-200'
                        : 'bg-pink-100 hover:bg-pink-200 text-pink-700'
                  }`}
                >
                  <ChevronLeft size={14} className="stroke-[2.5]" />
                  <span>Back</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-md active:scale-95 ${
                  isMatteBlack
                    ? 'bg-white hover:bg-neutral-200 text-black'
                    : isDark
                      ? 'bg-pink-600 hover:bg-pink-500 text-white shadow-pink-900/40'
                      : 'bg-pink-600 hover:bg-pink-700 text-white shadow-pink-500/25'
                }`}
              >
                <span>{isLastStep ? 'Got it! 🎉' : 'Next'}</span>
                {!isLastStep && <ChevronRight size={14} className="stroke-[2.5]" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
