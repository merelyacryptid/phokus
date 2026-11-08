import React, { useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { TimerMode, ThemeMode, TimerSettings, Task } from '../types';
import { 
  Play, 
  Pause, 
  SkipForward, 
  RotateCcw, 
  PictureInPicture2, 
  Check, 
  Pencil, 
  Star,
  Plus,
  Clock
} from 'lucide-react';
import { BunnyMascot } from './BunnyMascot';
import { PipWidget } from './PipWidget';
import { soundEngine } from '../utils/audio';
import confetti from 'canvas-confetti';

interface TimerProps {
  mode: TimerMode;
  isRunning: boolean;
  resetCount?: number;
  activeTask: Task | null;
  cycleCount: number;
  settings: TimerSettings;
  theme: ThemeMode;
  onModeChange: (newMode: TimerMode) => void;
  onTogglePlay: () => void;
  onSkip: () => void;
  onReset: () => void;
  onSessionComplete: () => void;
  onCompleteActiveTask: (taskId?: string) => void;
  onUpdateActiveTaskTitle: (newTitle: string, taskId?: string) => void;
  onCreateActiveTask: (title: string) => void;
}

export const Timer: React.FC<TimerProps> = React.memo(({
  mode,
  isRunning,
  resetCount,
  activeTask,
  cycleCount,
  settings,
  theme,
  onModeChange,
  onTogglePlay,
  onSkip,
  onReset,
  onSessionComplete,
  onCompleteActiveTask,
  onUpdateActiveTaskTitle,
  onCreateActiveTask,
}) => {
  const isMatteBlack = theme === 'matte-black';
  const isDark = theme === 'dark-mesh' || isMatteBlack;
  const btnClass = isMatteBlack ? 'glass-btn-matte' : isDark ? 'glass-btn-dark' : 'glass-btn-pink';
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [editText, setEditText] = useState('');
  const taskInputRef = useRef<HTMLInputElement>(null);

  // Document Picture-in-Picture Window & Video fallback
  const [pipDocWindow, setPipDocWindow] = useState<Window | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPiPActive, setIsPiPActive] = useState(false);

  // Focus duration: Use task's custom estimatedMinutes if present, otherwise default to settings.focusMinutes
  const focusMinutes = (activeTask && activeTask.estimatedMinutes && activeTask.estimatedMinutes > 0)
    ? activeTask.estimatedMinutes
    : settings.focusMinutes;

  // Total seconds calculation based on mode and settings
  const totalSeconds = (
    mode === 'focus' 
      ? focusMinutes 
      : mode === 'shortBreak' 
        ? settings.shortBreakMinutes 
        : settings.longBreakMinutes
  ) * 60;

  // Local accurate timer state (isolates high-frequency ticks to Timer component)
  const [timeLeft, setTimeLeft] = useState<number>(totalSeconds);
  const timerEndRef = useRef<number | null>(null);
  const lastTickSecond = useRef<number>(timeLeft);
  const timeLeftRef = useRef<number>(timeLeft);
  const isRunningRef = useRef<boolean>(isRunning);
  const prevActiveTaskIdRef = useRef<string | null>(activeTask ? activeTask.id : null);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  const currentActiveTaskId = activeTask ? activeTask.id : null;

  // Sync timeLeft when mode, settings, reset, or active task changes
  useEffect(() => {
    const activeTaskChanged = prevActiveTaskIdRef.current !== currentActiveTaskId;
    prevActiveTaskIdRef.current = currentActiveTaskId;

    // If active task changed while on a break, do not interrupt or reset the running break timer
    if (activeTaskChanged && mode !== 'focus') {
      return;
    }

    // oxlint-disable-next-line react/set-state-in-effect
    setTimeLeft(totalSeconds);
    if (isRunningRef.current) {
      timerEndRef.current = Date.now() + totalSeconds * 1000;
    } else {
      timerEndRef.current = null;
    }
  }, [mode, totalSeconds, resetCount, currentActiveTaskId]);

  // High-accuracy timer tick interval
  useEffect(() => {
    if (!isRunning) {
      timerEndRef.current = null;
      return;
    }

    if (!timerEndRef.current) {
      timerEndRef.current = Date.now() + timeLeftRef.current * 1000;
    }

    const interval = setInterval(() => {
      const remainingMs = (timerEndRef.current || 0) - Date.now();
      const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));

      if (settings.tickSound && remainingSec !== lastTickSecond.current) {
        soundEngine.playTick();
        lastTickSecond.current = remainingSec;
      }

      if (remainingSec <= 0) {
        clearInterval(interval);
        setTimeLeft(0);
        timerEndRef.current = null;
        onSessionComplete();
      } else {
        setTimeLeft(remainingSec);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [isRunning, settings.tickSound, onSessionComplete]);

  // Update document title with remaining time directly from Timer (isolates re-renders)
  useEffect(() => {
    const min = Math.floor(timeLeft / 60);
    const sec = timeLeft % 60;
    const formatted = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    const modeLabel = mode === 'focus' ? 'Focus' : mode === 'shortBreak' ? 'Short Break' : 'Long Break';
    document.title = `${formatted} — ${modeLabel} | Phokus`;
  }, [timeLeft, mode]);

  const handleResetClick = () => {
    setTimeLeft(totalSeconds);
    timerEndRef.current = null;
    onReset();
  };

  const startEditing = () => {
    setEditText(activeTask ? activeTask.title : '');
    setIsEditingTask(true);
  };

  // Format time mm:ss
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Draw canvas frame for Video PiP fallback
  const drawCanvasFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Palette per theme
    const paletteMap: Record<ThemeMode, {
      bg: string;
      border: string;
      modeText: string;
      digits: string;
      subText: string;
      btnBg: string;
      btnText: string;
    }> = {
      'matte-black': {
        bg: '#09090b',
        border: '#ffffff',
        modeText: '#ffffff',
        digits: '#ffffff',
        subText: '#a1a1aa',
        btnBg: '#ffffff',
        btnText: '#000000',
      },
      'dark-mesh': {
        bg: '#07050d',
        border: '#f43f5e',
        modeText: '#fb7185',
        digits: '#ffffff',
        subText: '#fda4af',
        btnBg: '#f43f5e',
        btnText: '#ffffff',
      },
      'light-aura': {
        bg: '#ffffff',
        border: '#f472b6',
        modeText: '#ec4899',
        digits: '#831433',
        subText: '#9d174d',
        btnBg: '#ec4899',
        btnText: '#ffffff',
      },
      'bunny-pink': {
        bg: '#fff5ea',
        border: '#fb7185',
        modeText: '#e11d48',
        digits: '#831433',
        subText: '#9f1239',
        btnBg: '#f43f5e',
        btnText: '#ffffff',
      },
    };

    const p = paletteMap[theme] || paletteMap['bunny-pink'];

    // Draw PiP frame
    const width = 360;
    const height = 210;
    canvas.width = width;
    canvas.height = height;

    // Background
    ctx.fillStyle = p.bg;
    ctx.fillRect(0, 0, width, height);

    // Subtle border
    ctx.strokeStyle = p.border;
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, width - 4, height - 4);

    // Mode label
    ctx.fillStyle = p.modeText;
    ctx.font = '600 15px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    const modeLabel = mode === 'focus' ? 'FOCUS' : mode === 'shortBreak' ? 'SHORT BREAK' : 'LONG BREAK';
    ctx.fillText(modeLabel, width / 2, 38);

    // Digits
    ctx.fillStyle = p.digits;
    ctx.font = '800 64px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(formattedTime, width / 2, 108);

    // Active task or quote
    ctx.fillStyle = p.subText;
    ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
    const subText = activeTask ? activeTask.title : (isRunning ? 'Stay in flow...' : 'Ready to begin');
    ctx.fillText(subText.slice(0, 32), width / 2, 138);

    // Pause / Resume Action Pill on canvas
    ctx.fillStyle = p.btnBg;
    ctx.beginPath();
    ctx.roundRect(width / 2 - 65, height - 44, 130, 28, 14);
    ctx.fill();

    ctx.fillStyle = p.btnText;
    ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(isRunning ? '❚❚ PAUSE' : '▶ RESUME', width / 2, height - 25);
  }, [theme, mode, formattedTime, activeTask, isRunning]);

  // Update canvas for Picture in Picture only when PiP is actually active
  useEffect(() => {
    if (!isPiPActive && !document.pictureInPictureElement) return;
    drawCanvasFrame();
  }, [isPiPActive, drawCanvasFrame, timeLeft]);

  // MediaSession integration for Video PiP controls
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `${formattedTime} - ${mode === 'focus' ? 'Focus' : 'Break'}`,
        artist: activeTask?.title || 'Phokus Timer',
        album: isRunning ? 'Running' : 'Paused',
      });

      navigator.mediaSession.setActionHandler('play', () => {
        onTogglePlay();
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        onTogglePlay();
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        onSkip();
      });
    }
  }, [formattedTime, mode, activeTask, isRunning, onTogglePlay, onSkip]);

  // Picture in Picture toggle: supports both Document PiP and Video PiP
  const togglePictureInPicture = async () => {
    // If Document PiP is open, close it
    if (pipDocWindow) {
      pipDocWindow.close();
      setPipDocWindow(null);
      setIsPiPActive(false);
      return;
    }

    // If Video PiP is open, close it
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture().catch(() => {});
      setIsPiPActive(false);
      return;
    }

    // 1. Try Document Picture-in-Picture (Chrome, Edge, Chromium)
    if ('documentPictureInPicture' in window && window.documentPictureInPicture) {
      try {
        const pipWindow = await window.documentPictureInPicture.requestWindow({
          width: 360,
          height: 230,
        });

        // Copy styles to PiP window
        [...document.styleSheets].forEach((styleSheet) => {
          try {
            const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
            const style = pipWindow.document.createElement('style');
            style.textContent = cssRules;
            pipWindow.document.head.appendChild(style);
          } catch {
            const link = pipWindow.document.createElement('link');
            if (styleSheet.href) {
              link.rel = 'stylesheet';
              link.type = styleSheet.type;
              link.media = styleSheet.media.toString();
              link.href = styleSheet.href;
              pipWindow.document.head.appendChild(link);
            }
          }
        });

        pipWindow.document.title = 'Phokus — Mini Timer';
        pipWindow.document.body.style.margin = '0';
        pipWindow.document.body.style.padding = '0';
        pipWindow.document.body.style.overflow = 'hidden';

        pipWindow.addEventListener('pagehide', () => {
          setPipDocWindow(null);
          setIsPiPActive(false);
        });

        setPipDocWindow(pipWindow);
        setIsPiPActive(true);
        return;
      } catch (err) {
        console.warn('Document PiP request failed, falling back to Video PiP:', err);
      }
    }

    // 2. Video Picture-in-Picture fallback
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      drawCanvasFrame();
      if (!video.srcObject) {
        const stream = canvas.captureStream(30);
        video.srcObject = stream;
      }
      await video.play();
      await video.requestPictureInPicture();
      setIsPiPActive(true);
    } catch (err) {
      console.warn('Video PiP error:', err);
    }
  };

  useEffect(() => {
    const handleLeavePiP = () => setIsPiPActive(false);
    const video = videoRef.current;
    if (video) {
      video.addEventListener('leavepictureinpicture', handleLeavePiP);
      return () => video.removeEventListener('leavepictureinpicture', handleLeavePiP);
    }
  }, []);

  // Close PiP window when component unmounts
  useEffect(() => {
    return () => {
      if (pipDocWindow) {
        pipDocWindow.close();
      }
    };
  }, [pipDocWindow]);

  // Auto-focus input when editing active task title
  useEffect(() => {
    if (isEditingTask && taskInputRef.current) {
      taskInputRef.current.focus();
      taskInputRef.current.select();
    }
  }, [isEditingTask]);

  // Save inline task edit on main page
  const handleSaveEdit = () => {
    setIsEditingTask(false);
    const trimmed = editText.trim();
    if (!trimmed) return;

    if (activeTask) {
      onUpdateActiveTaskTitle(trimmed, activeTask.id);
    } else {
      onCreateActiveTask(trimmed);
    }
  };

  // Checkbox clicked on main page
  const handleMainCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeTask || isCompleting) return;

    setIsCompleting(true);

    // Confetti celebration
    confetti({
      particleCount: 38,
      spread: 60,
      origin: { y: 0.4 },
      colors: isMatteBlack 
        ? ['#ffffff', '#e4e4e7', '#a1a1aa', '#71717a'] 
        : isDark ? ['#f43f5e', '#ec4899', '#fb7185', '#fda4af'] : ['#f43f5e', '#fb7185', '#fda4af']
    });

    const completedTaskId = activeTask.id;
    setTimeout(() => {
      onCompleteActiveTask(completedTaskId);
      setIsCompleting(false);
    }, 280);
  };

  // Calculate percentage for subtle progress accent
  const progressPercent = Math.max(0, Math.min(100, ((totalSeconds - timeLeft) / totalSeconds) * 100));

  return (
    <div className="flex flex-col items-center justify-center my-auto select-none z-10 transition-all duration-300 hw-accelerated">
      {/* Hidden elements for Video PiP fallback */}
      <canvas ref={canvasRef} className="hidden" />
      <video 
        ref={videoRef} 
        className="hidden" 
        muted 
        playsInline 
        onClick={onTogglePlay} 
      />

      {/* Document Picture-in-Picture Portal with Pause / Resume controls */}
      {pipDocWindow &&
        createPortal(
          <PipWidget
            mode={mode}
            timeLeft={timeLeft}
            isRunning={isRunning}
            activeTask={activeTask}
            cycleCount={cycleCount}
            totalIntervals={settings.longBreakInterval}
            theme={theme}
            onTogglePlay={onTogglePlay}
            onSkip={onSkip}
            onReset={handleResetClick}
            onCompleteActiveTask={onCompleteActiveTask}
          />,
          pipDocWindow.document.body
        )}

      {/* Mascot Character (Hollow Knight in Matte Black, Miffy in Pink) */}
      {settings.showBunnyMascot && (
        <div className="mb-2 sm:mb-3">
          <BunnyMascot mode={mode} isRunning={isRunning} theme={theme} />
        </div>
      )}

      {/* Main Page Active Task Row with Checkbox & Inline Editing */}
      <div
        data-tour="task-setup"
        className="mb-4 flex items-center justify-center max-w-md w-full px-4 min-h-[44px]"
      >
        {isEditingTask ? (
          <div className="w-full flex items-center justify-center space-x-2">
            <input
              ref={taskInputRef}
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit();
                if (e.key === 'Escape') setIsEditingTask(false);
              }}
              placeholder="What do you want to focus on?"
              autoFocus
              className={`w-full text-center text-lg sm:text-xl font-bold bg-transparent border-b-2 outline-none pb-1 transition-all ${
                isMatteBlack
                  ? 'text-white border-white placeholder-neutral-500'
                  : isDark 
                    ? 'text-pink-100 border-pink-500 placeholder-pink-400/40' 
                    : 'text-pink-950 border-pink-500 placeholder-pink-900/40'
              }`}
            />
          </div>
        ) : (
          <div className="flex items-center space-x-3 group cursor-pointer max-w-full">
            {activeTask ? (
              <>
                {/* Main page checkbox to mark active task complete */}
                <button
                  onClick={handleMainCheckboxClick}
                  title="Mark active task as done (advances to next task below)"
                  className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all duration-200 shrink-0 ${
                    isCompleting
                      ? isMatteBlack
                        ? 'bg-white text-black border border-white shadow-[0_0_10px_rgba(255,255,255,0.6)] scale-105'
                        : isDark
                          ? 'bg-pink-500 text-white border border-pink-400 shadow-[0_0_12px_rgba(244,63,94,0.6)] scale-105'
                          : 'bg-pink-600 text-white border border-pink-500 shadow-[0_0_10px_rgba(244,63,94,0.4)] scale-105'
                      : isMatteBlack
                        ? 'border-2 border-neutral-400 hover:border-white bg-neutral-900 hover:bg-neutral-800 shadow-sm'
                        : isDark
                          ? 'border-2 border-pink-400/60 hover:border-pink-400 bg-white/5 hover:bg-pink-600/25 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                          : 'border-2 border-pink-400 hover:border-pink-600 bg-white hover:bg-pink-100/60 shadow-sm'
                  }`}
                >
                  <Check
                    size={16}
                    className={`stroke-[3] transition-all duration-150 ${
                      isCompleting
                        ? isMatteBlack ? 'text-black opacity-100 scale-110' : 'text-white opacity-100 scale-110'
                        : `${isMatteBlack ? 'text-white' : 'text-pink-400'} opacity-0 group-hover:opacity-100`
                    }`}
                  />
                </button>

                {/* Editable Task Title */}
                <div
                  onClick={startEditing}
                  title="Click to edit task title directly"
                  className={`flex items-center space-x-2 truncate py-1 px-2.5 rounded-xl transition-all duration-200 ${
                    isCompleting ? 'line-through opacity-50 scale-[0.98]' : ''
                  } ${
                    isMatteBlack ? 'hover:bg-white/5' : 'hover:bg-pink-500/10'
                  }`}
                >
                  <span
                    className={`text-lg sm:text-xl font-bold tracking-tight truncate transition-colors ${
                      isMatteBlack
                        ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]'
                        : isDark ? 'text-pink-100 drop-shadow-[0_0_10px_rgba(244,63,94,0.3)]' : 'text-pink-950 font-bold'
                    }`}
                  >
                    {activeTask.title}
                  </span>
                  {activeTask.estimatedMinutes && (
                    <span
                      title={`Estimated focus duration: ${activeTask.estimatedMinutes} minutes`}
                      className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 ${
                        isMatteBlack
                          ? 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                          : isDark
                            ? 'bg-pink-500/20 text-pink-200 border border-pink-500/35'
                            : 'bg-pink-100 text-pink-700 border border-pink-300'
                      }`}
                    >
                      <Clock size={11} className="stroke-[2.2]" />
                      <span>{activeTask.estimatedMinutes}m</span>
                    </span>
                  )}
                  {!isCompleting && (
                    <Pencil size={14} className={`opacity-0 group-hover:opacity-80 transition-opacity ${isMatteBlack ? 'text-neutral-400' : 'text-pink-400'} shrink-0`} />
                  )}
                </div>
              </>
            ) : (
              /* When no task is selected yet */
              <div
                onClick={startEditing}
                title="Click to add a task"
                className={`flex items-center space-x-2 py-1.5 px-4 rounded-xl border border-dashed transition-all ${
                  isMatteBlack
                    ? 'border-neutral-700 hover:border-white bg-white/5 text-neutral-300'
                    : isDark
                      ? 'border-pink-500/30 hover:border-pink-400 bg-white/[0.03] text-pink-200/80'
                      : 'border-pink-300 hover:border-pink-500 bg-pink-50/50 text-pink-900/80'
                }`}
              >
                <Plus size={16} className={isMatteBlack ? 'text-white' : 'text-pink-400'} />
                <span className="text-base font-semibold">What do you want to focus on?</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mode Tabs: FOCUS, SHORT BREAK, LONG BREAK */}
      <div
        data-tour="timer-setup"
        className="flex items-center space-x-4 sm:space-x-8 mb-3"
      >
        {(['focus', 'shortBreak', 'longBreak'] as TimerMode[]).map((m) => {
          const isActive = mode === m;
          const label = m === 'focus' ? 'FOCUS' : m === 'shortBreak' ? 'SHORT BREAK' : 'LONG BREAK';

          return (
            <button
              key={m}
              onClick={() => onModeChange(m)}
              className={`text-xs sm:text-sm font-bold tracking-wider uppercase transition-all duration-300 py-1.5 px-3.5 rounded-full ${
                isActive
                  ? isMatteBlack
                    ? 'text-black bg-white shadow-[0_0_15px_rgba(255,255,255,0.35)] font-extrabold'
                    : isDark
                      ? 'text-pink-100 bg-pink-600/30 border border-pink-500/50 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                      : 'text-pink-950 bg-white/90 shadow-sm border border-pink-200'
                  : isMatteBlack
                    ? 'text-neutral-500 hover:text-white'
                    : isDark
                      ? 'text-pink-200/50 hover:text-pink-100'
                      : 'text-pink-900/50 hover:text-pink-900'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Pomodoro Session Cycle Indicator */}
      <div className="flex items-center space-x-2 mb-4">
        {Array.from({ length: settings.longBreakInterval }).map((_, idx) => {
          const isCompleted = idx < cycleCount;
          return (
            <Star
              key={idx}
              size={18}
              strokeWidth={2}
              className={`transition-all duration-300 ${
                isCompleted
                  ? isMatteBlack
                    ? 'fill-white text-white filter drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]'
                    : isDark
                      ? 'fill-pink-400 text-pink-400 filter drop-shadow-[0_0_8px_rgba(244,63,94,0.7)]'
                      : 'fill-amber-400 text-amber-400 filter drop-shadow'
                  : isMatteBlack
                    ? 'text-neutral-700 fill-none'
                    : isDark
                      ? 'text-pink-950/60 fill-none'
                      : 'text-pink-300/40 fill-none'
              }`}
            />
          );
        })}
      </div>

      {/* Main Digital Clock Display: 09:58 */}
      <div className="relative my-1 flex flex-col items-center">
        <h1
          className={`text-7xl sm:text-8xl md:text-9xl font-bold tracking-tight select-none font-sans transition-all duration-300 ${
            isMatteBlack
              ? 'text-white drop-shadow-[0_0_24px_rgba(255,255,255,0.2)]'
              : isDark ? 'text-white drop-shadow-[0_0_30px_rgba(244,63,94,0.3)]' : 'text-pink-950 drop-shadow-sm'
          }`}
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {formattedTime}
        </h1>

        {/* Minimal Progress Bar under the clock */}
        <div className={`w-48 sm:w-64 h-1.5 rounded-full mt-2 overflow-hidden ${
          isMatteBlack ? 'bg-neutral-800' : isDark ? 'bg-pink-950/60' : 'bg-pink-200/60'
        }`}>
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              isMatteBlack
                ? 'bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)]'
                : isDark
                  ? 'bg-gradient-to-r from-pink-500 via-rose-400 to-pink-300 shadow-[0_0_10px_rgba(244,63,94,0.6)]'
                  : 'bg-gradient-to-r from-pink-400 to-rose-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Glassmorphic Control Buttons */}
      <div className="flex items-center space-x-3 sm:space-x-4 mt-8">
        {/* Play / Pause Button */}
        <button
          onClick={onTogglePlay}
          title={isRunning ? "Pause (Space)" : "Start (Space)"}
          className={`p-3.5 sm:p-4 rounded-2xl transition-all duration-200 ${btnClass}`}
        >
          {isRunning ? (
            <Pause size={22} className="stroke-[2.5]" />
          ) : (
            <Play size={22} className="stroke-[2.5] ml-0.5" />
          )}
        </button>

        {/* Skip Button */}
        <button
          onClick={onSkip}
          title="Skip to next session"
          className={`p-3.5 sm:p-4 rounded-2xl transition-all duration-200 ${btnClass}`}
        >
          <SkipForward size={22} className="stroke-[2.5]" />
        </button>

        {/* Reset Button */}
        <button
          onClick={handleResetClick}
          title="Reset timer (R)"
          className={`p-3.5 sm:p-4 rounded-2xl transition-all duration-200 ${btnClass}`}
        >
          <RotateCcw size={22} className="stroke-[2.5]" />
        </button>

        {/* Picture-in-Picture Button */}
        <button
          data-tour="pip-button"
          onClick={togglePictureInPicture}
          title="Picture-in-Picture Floating Timer (with Pause & Resume)"
          className={`p-3.5 sm:p-4 rounded-2xl transition-all duration-200 ${
            isPiPActive 
              ? isMatteBlack
                ? 'ring-2 ring-white shadow-[0_0_15px_rgba(255,255,255,0.5)]'
                : 'ring-2 ring-pink-400 shadow-[0_0_15px_rgba(244,63,94,0.5)]' 
              : ''
          } ${btnClass}`}
        >
          <PictureInPicture2 size={22} className="stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
});
