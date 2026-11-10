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
  Clock,
  CalendarClock,
  CalendarPlus,
  AlertCircle,
  X,
  Trash2
} from 'lucide-react';
import { BunnyMascot } from './BunnyMascot';
import { PipWidget } from './PipWidget';
import { soundEngine } from '../utils/audio';
import {
  formatDeadlineLabel,
  getDeadlineBadgeClasses,
  getDefaultDeadlineValue,
  isDeadlineReached,
  toDateTimeLocalValue,
} from '../utils/deadline';
import confetti from 'canvas-confetti';

interface TimerProps {
  mode: TimerMode;
  isRunning: boolean;
  resetCount?: number;
  activeTask: Task | null;
  cycleCount: number;
  completedTodayCount?: number;
  settings: TimerSettings;
  theme: ThemeMode;
  onModeChange: (newMode: TimerMode) => void;
  onTogglePlay: () => void;
  onSkip: () => void;
  onReset: () => void;
  onSessionComplete: (extraMinutes?: number) => void;
  onCompleteActiveTask: (taskId?: string) => void;
  onUpdateActiveTaskTitle: (newTitle: string, taskId?: string) => void;
  onCreateActiveTask: (title: string) => void;
  onUpdateTaskDeadline?: (taskId: string, deadline?: string) => void;
}

export const Timer: React.FC<TimerProps> = React.memo(({
  mode,
  isRunning,
  resetCount,
  activeTask,
  cycleCount,
  completedTodayCount = cycleCount,
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
  onUpdateTaskDeadline,
}) => {
  const isMatteBlack = theme === 'matte-black';
  const isDark = theme === 'dark-mesh' || isMatteBlack;
  const btnClass = isMatteBlack ? 'glass-btn-matte' : isDark ? 'glass-btn-dark' : 'glass-btn-pink';
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [editText, setEditText] = useState('');
  const [isEditingDeadline, setIsEditingDeadline] = useState(false);
  const [deadlineDraft, setDeadlineDraft] = useState('');
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const taskInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);

  // Document Picture-in-Picture Window & Video fallback
  const [pipDocWindow, setPipDocWindow] = useState<Window | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPiPActive, setIsPiPActive] = useState(false);
  const pipBgImagesRef = useRef<Partial<Record<ThemeMode, HTMLImageElement>>>({});

  // Pre-warm fixed PiP background images cleanly after mount
  useEffect(() => {
    const themePaths: Record<ThemeMode, string> = {
      'bunny-pink': '/pip-bg-bunny-pink-2x.webp',
      'light-aura': '/pip-bg-light-aura-2x.webp',
      'dark-mesh': '/pip-bg-dark-mesh-2x.webp',
      'matte-black': '/pip-bg-matte-black-2x.webp',
    };
    (Object.entries(themePaths) as [ThemeMode, string][]).forEach(([key, src]) => {
      if (!pipBgImagesRef.current[key]) {
        const img = new Image();
        img.decoding = 'async';
        img.src = src;
        pipBgImagesRef.current[key] = img;
      }
    });
  }, []);

  // Focus duration: Use task's custom estimatedMinutes if present, otherwise default to settings.focusMinutes
  const focusMinutes = (activeTask && activeTask.estimatedMinutes && activeTask.estimatedMinutes > 0)
    ? activeTask.estimatedMinutes
    : settings.focusMinutes;

  // Base session duration (without temporary +10m extensions)
  const baseTotalSeconds = (
    mode === 'focus' 
      ? focusMinutes 
      : mode === 'shortBreak' 
        ? settings.shortBreakMinutes 
        : settings.longBreakMinutes
  ) * 60;

  // Temporary +10m extensions scoped exclusively to the current focus session
  const [extraFocusMinutes, setExtraFocusMinutes] = useState<number>(0);
  const extraFocusMinutesRef = useRef<number>(0);

  const totalSeconds = baseTotalSeconds + (mode === 'focus' ? extraFocusMinutes * 60 : 0);

  // Local accurate timer state (isolates high-frequency ticks to Timer component)
  const [timeLeft, setTimeLeft] = useState<number>(baseTotalSeconds);
  const timerEndRef = useRef<number | null>(null);
  const lastTickSecond = useRef<number>(timeLeft);
  const timeLeftRef = useRef<number>(timeLeft);
  const isRunningRef = useRef<boolean>(isRunning);
  const prevModeRef = useRef<TimerMode>(mode);
  const prevResetCountRef = useRef<number>(resetCount || 0);
  const prevActiveTaskRef = useRef<Task | null>(activeTask);
  const prevSettingsDurationsRef = useRef({
    focus: settings.focusMinutes,
    short: settings.shortBreakMinutes,
    long: settings.longBreakMinutes,
  });
  const hasWarnedRef = useRef<boolean>(false);

  const modeRef = useRef<TimerMode>(mode);
  const totalSecondsRef = useRef<number>(totalSeconds);
  const settingsRef = useRef<TimerSettings>(settings);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    totalSecondsRef.current = totalSeconds;
  }, [totalSeconds]);

  useEffect(() => {
    extraFocusMinutesRef.current = extraFocusMinutes;
  }, [extraFocusMinutes]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  // Sync timeLeft when mode, settings, reset, or active task changes
  useEffect(() => {
    const modeChanged = prevModeRef.current !== mode;
    prevModeRef.current = mode;

    const resetChanged = prevResetCountRef.current !== resetCount;
    prevResetCountRef.current = resetCount || 0;

    const prevTask = prevActiveTaskRef.current;
    const activeTaskChanged = prevTask?.id !== activeTask?.id;
    const taskEstimateEdited = prevTask?.id === activeTask?.id && prevTask?.estimatedMinutes !== activeTask?.estimatedMinutes;
    prevActiveTaskRef.current = activeTask;

    const prevDurations = prevSettingsDurationsRef.current;
    const settingsChanged = 
      prevDurations.focus !== settings.focusMinutes ||
      prevDurations.short !== settings.shortBreakMinutes ||
      prevDurations.long !== settings.longBreakMinutes;
    prevSettingsDurationsRef.current = {
      focus: settings.focusMinutes,
      short: settings.shortBreakMinutes,
      long: settings.longBreakMinutes,
    };

    let shouldResetTimer = false;

    if (modeChanged || resetChanged) {
      shouldResetTimer = true;
    } else if (settingsChanged && !isRunningRef.current) {
      shouldResetTimer = true;
    } else if (activeTaskChanged && mode === 'focus') {
      const prevHadEstimate = Boolean(prevTask && prevTask.estimatedMinutes && prevTask.estimatedMinutes > 0);
      const completedBeforeEstimate = prevHadEstimate && timeLeftRef.current > 0;

      if (completedBeforeEstimate) {
        // User completed an estimated task before the estimate expired
        shouldResetTimer = true;
      } else if (!isRunningRef.current && activeTask && activeTask.estimatedMinutes && activeTask.estimatedMinutes > 0) {
        // Idle timer selecting a task with a custom estimate
        shouldResetTimer = true;
      }
      // Otherwise: regular task completed or switched while running/idle -> do NOT reset, continue running!
    } else if (taskEstimateEdited && mode === 'focus' && !isRunningRef.current) {
      shouldResetTimer = true;
    }

    if (shouldResetTimer) {
      // oxlint-disable-next-line react/set-state-in-effect
      setExtraFocusMinutes(0);
      extraFocusMinutesRef.current = 0;
      setTimeLeft(baseTotalSeconds);
      hasWarnedRef.current = false;
      if (isRunningRef.current) {
        timerEndRef.current = Date.now() + baseTotalSeconds * 1000;
      } else {
        timerEndRef.current = null;
      }
    }
  }, [mode, baseTotalSeconds, resetCount, activeTask, settings.focusMinutes, settings.shortBreakMinutes, settings.longBreakMinutes]);

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

      // Check 5m (focus) and 2m (break) warning bell
      const currentMode = modeRef.current;
      const currentTotal = totalSecondsRef.current;
      const currentSettings = settingsRef.current;
      const shouldPlayWarning = currentSettings.soundAlerts && currentSettings.warningBell !== false;

      if (shouldPlayWarning && !hasWarnedRef.current) {
        const isFocusWarning = currentMode === 'focus' && currentTotal > 300 && remainingSec <= 300 && remainingSec > 0;
        const isBreakWarning = (currentMode === 'shortBreak' || currentMode === 'longBreak') && currentTotal > 120 && remainingSec <= 120 && remainingSec > 0;

        if (isFocusWarning || isBreakWarning) {
          hasWarnedRef.current = true;
          soundEngine.playSmallBell(currentSettings.soundVolume);
        }
      }

      if (remainingSec <= 0) {
        const addedMinutes = extraFocusMinutesRef.current;
        clearInterval(interval);
        setTimeLeft(0);
        timerEndRef.current = null;
        hasWarnedRef.current = false;
        setExtraFocusMinutes(0);
        extraFocusMinutesRef.current = 0;
        onSessionComplete(addedMinutes);
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
    document.title = `${formatted} ${modeLabel} | Phokus`;
  }, [timeLeft, mode]);

  // Add +10 minutes to the CURRENT focus session's overall time (without modifying saved preferences)
  const handleAddTenMinutes = useCallback(() => {
    if (modeRef.current !== 'focus') return;
    soundEngine.unlockAudio();

    const addSeconds = 10 * 60;
    const nextTimeLeft = timeLeftRef.current + addSeconds;

    if (isRunningRef.current) {
      const currentEnd = timerEndRef.current || (Date.now() + timeLeftRef.current * 1000);
      timerEndRef.current = currentEnd + addSeconds * 1000;
    }

    timeLeftRef.current = nextTimeLeft;
    setTimeLeft(nextTimeLeft);

    const nextExtra = extraFocusMinutesRef.current + 10;
    extraFocusMinutesRef.current = nextExtra;
    setExtraFocusMinutes(nextExtra);

    if (nextTimeLeft > 300) {
      hasWarnedRef.current = false;
    }
  }, []);

  const handleResetClick = () => {
    setExtraFocusMinutes(0);
    extraFocusMinutesRef.current = 0;
    setTimeLeft(baseTotalSeconds);
    timerEndRef.current = null;
    hasWarnedRef.current = false;
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

    // Palette per theme matching main page exact tokens
    const paletteMap: Record<ThemeMode, {
      bg: string;
      border: string;
      modeText: string;
      digits: string;
      subText: string;
      btnBg: string;
      btnText: string;
      progressTrack: string;
      progressFill: string;
    }> = {
      'matte-black': {
        bg: '#09090b',
        border: 'rgba(255, 255, 255, 0.25)',
        modeText: '#ffffff',
        digits: '#ffffff',
        subText: '#e4e4e7',
        btnBg: '#ffffff',
        btnText: '#000000',
        progressTrack: '#27272a',
        progressFill: '#ffffff',
      },
      'dark-mesh': {
        bg: '#05040a',
        border: 'rgba(244, 63, 142, 0.4)',
        modeText: '#fce7f3',
        digits: '#ffffff',
        subText: '#fce7f3',
        btnBg: '#f43f5e',
        btnText: '#ffffff',
        progressTrack: 'rgba(80, 7, 36, 0.6)',
        progressFill: '#f472b6',
      },
      'light-aura': {
        bg: '#ffffff',
        border: 'rgba(244, 114, 182, 0.35)',
        modeText: '#db2777',
        digits: '#500724',
        subText: '#500724',
        btnBg: '#ec4899',
        btnText: '#ffffff',
        progressTrack: 'rgba(251, 207, 232, 0.7)',
        progressFill: '#f43f5e',
      },
      'bunny-pink': {
        bg: '#fff5ea',
        border: 'rgba(251, 113, 133, 0.35)',
        modeText: '#db2777',
        digits: '#500724',
        subText: '#500724',
        btnBg: '#f43f5e',
        btnText: '#ffffff',
        progressTrack: 'rgba(251, 207, 232, 0.7)',
        progressFill: '#f43f5e',
      },
    };

    const p = paletteMap[theme] || paletteMap['bunny-pink'];

    // Draw PiP frame without reallocating canvas dimensions every tick
    const width = 360;
    const height = 230;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    } else {
      ctx.clearRect(0, 0, width, height);
    }

    // Draw fixed pre-rendered aura background image if loaded, fallback to base color
    const bgImg = pipBgImagesRef.current[theme];
    if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
      ctx.drawImage(bgImg, 0, 0, width, height);
    } else {
      ctx.fillStyle = p.bg;
      ctx.fillRect(0, 0, width, height);
    }

    // Subtle border
    ctx.strokeStyle = p.border;
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, width - 3, height - 3);

    // Mode label (+ extra focus badge if extended)
    ctx.fillStyle = p.modeText;
    ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    const baseLabel = mode === 'focus' ? 'FOCUS' : mode === 'shortBreak' ? 'SHORT BREAK' : 'LONG BREAK';
    const modeLabel = mode === 'focus' && extraFocusMinutes > 0 ? `${baseLabel} · +${extraFocusMinutes}M` : baseLabel;
    ctx.fillText(modeLabel, width / 2, 34);

    // Digits
    ctx.fillStyle = p.digits;
    ctx.font = '800 62px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(formattedTime, width / 2, 102);

    // Slim progress bar matching Document PiP
    const pct = totalSeconds > 0 ? Math.max(0, Math.min(1, (totalSeconds - timeLeft) / totalSeconds)) : 0;
    const barW = 144;
    const barH = 4;
    const barX = (width - barW) / 2;
    const barY = 114;
    ctx.fillStyle = p.progressTrack;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 2);
    ctx.fill();
    if (pct > 0) {
      ctx.fillStyle = p.progressFill;
      ctx.beginPath();
      ctx.roundRect(barX, barY, Math.max(4, barW * pct), barH, 2);
      ctx.fill();
    }

    // Active task or quote
    ctx.fillStyle = p.subText;
    ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
    const subText = activeTask ? activeTask.title : (isRunning ? 'Stay in flow...' : 'Ready to begin');
    ctx.fillText(subText.slice(0, 32), width / 2, 144);

    // Pause / Resume Action Pill on canvas
    ctx.fillStyle = p.btnBg;
    ctx.beginPath();
    ctx.roundRect(width / 2 - 65, height - 46, 130, 30, 15);
    ctx.fill();

    ctx.fillStyle = p.btnText;
    ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(isRunning ? '❚❚ PAUSE' : '▶ RESUME', width / 2, height - 26);
  }, [theme, mode, formattedTime, activeTask, isRunning, extraFocusMinutes, totalSeconds, timeLeft]);

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
          height: 238,
        });

        // Ensure relative URLs (e.g. fixed /pip-bg-* images) resolve reliably inside about:blank PiP
        const baseEl = pipWindow.document.createElement('base');
        baseEl.href = window.location.href;
        pipWindow.document.head.appendChild(baseEl);

        pipWindow.document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';

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

        pipWindow.document.title = 'Phokus | Mini Timer';
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

    soundEngine.unlockAudio();
    if (settings.soundAlerts && settings.taskSound !== false) {
      soundEngine.playTaskComplete(settings.soundVolume);
    }

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

  // Complete task triggered from Picture-in-Picture window
  const handlePipCompleteTask = useCallback((taskId?: string) => {
    soundEngine.unlockAudio();
    if (settings.soundAlerts && settings.taskSound !== false) {
      soundEngine.playTaskComplete(settings.soundVolume);
    }
    onCompleteActiveTask(taskId);
  }, [settings.soundAlerts, settings.taskSound, settings.soundVolume, onCompleteActiveTask]);

  // Calculate percentage for subtle progress accent
  const progressPercent = totalSeconds > 0
    ? Math.max(0, Math.min(100, ((totalSeconds - timeLeft) / totalSeconds) * 100))
    : 0;

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

      {/* Document Picture-in-Picture Portal with Pause / Resume & +10m controls */}
      {pipDocWindow &&
        createPortal(
          <PipWidget
            mode={mode}
            timeLeft={timeLeft}
            totalSeconds={totalSeconds}
            extraFocusMinutes={extraFocusMinutes}
            isRunning={isRunning}
            activeTask={activeTask}
            cycleCount={cycleCount}
            completedTodayCount={completedTodayCount}
            totalIntervals={settings.longBreakInterval}
            nowMs={nowMs}
            theme={theme}
            onTogglePlay={onTogglePlay}
            onSkip={onSkip}
            onReset={handleResetClick}
            onAddTenMinutes={handleAddTenMinutes}
            onCompleteActiveTask={handlePipCompleteTask}
          />,
          pipDocWindow.document.body
        )}

      {/* Mascot Character (Hollow Knight in Matte Black, Miffy in Pink) */}
      {settings.showBunnyMascot && (
        <div className="mb-2 sm:mb-3">
          <BunnyMascot mode={mode} isRunning={isRunning} theme={theme} />
        </div>
      )}

      {/* Main Page Active Task Row with Checkbox, Estimate, Deadline & Inline Editing */}
      <div
        data-tour="task-setup"
        className="mb-4 flex flex-col items-center justify-center max-w-xl w-full px-4 min-h-[44px]"
      >
        {isEditingTask ? (
          <div className="w-full max-w-md flex items-center justify-center space-x-2">
            <input
              ref={taskInputRef}
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={(e) => {
                if (e.nativeEvent.isComposing) return;
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
          <div className="flex items-center justify-center flex-wrap gap-2 group max-w-full">
            {activeTask ? (
              <>
                {/* Main page checkbox to mark active task complete */}
                <button
                  type="button"
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
                  className={`flex items-center space-x-2 max-w-[300px] sm:max-w-[380px] truncate py-1 px-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
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
                  {!isCompleting && (
                    <Pencil size={14} className={`opacity-0 group-hover:opacity-80 transition-opacity ${isMatteBlack ? 'text-neutral-400' : 'text-pink-400'} shrink-0`} />
                  )}
                </div>

                {/* Estimated Time Badge */}
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

                {/* Deadline Badge / Add Deadline Button (green before deadline, red at/after deadline) */}
                {activeTask.deadline && !isEditingDeadline ? (() => {
                  const overdue = isDeadlineReached(activeTask.deadline, nowMs);
                  const label = formatDeadlineLabel(activeTask.deadline, nowMs);
                  return (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeadlineDraft(toDateTimeLocalValue(activeTask.deadline));
                        setIsEditingDeadline(true);
                      }}
                      title={`${overdue ? 'Past deadline' : 'Before deadline'}: ${label} (click to edit)`}
                      className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 cursor-pointer transition-opacity hover:opacity-85 ${getDeadlineBadgeClasses(overdue, theme)}`}
                    >
                      {overdue ? (
                        <AlertCircle size={11} className="stroke-[2.3] shrink-0" />
                      ) : (
                        <CalendarClock size={11} className="stroke-[2.2] shrink-0" />
                      )}
                      <span>{label}</span>
                    </button>
                  );
                })() : !activeTask.deadline && !isEditingDeadline && onUpdateTaskDeadline ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeadlineDraft(getDefaultDeadlineValue(Date.now()));
                      setIsEditingDeadline(true);
                    }}
                    title="Add optional deadline"
                    aria-label="Add deadline to active task"
                    className={`opacity-0 group-hover:opacity-80 hover:!opacity-100 p-1.5 rounded-xl transition-all shrink-0 ${
                      isMatteBlack
                        ? 'text-neutral-400 hover:text-white hover:bg-white/10'
                        : isDark
                          ? 'text-pink-300/70 hover:text-pink-100 hover:bg-pink-500/15'
                          : 'text-pink-800/60 hover:text-pink-950 hover:bg-pink-200/50'
                    }`}
                  >
                    <CalendarPlus size={14} />
                  </button>
                ) : null}
              </>
            ) : (
              /* When no task is selected yet */
              <div
                onClick={startEditing}
                title="Click to add a task"
                className={`flex items-center space-x-2 py-1.5 px-4 rounded-xl border border-dashed cursor-pointer transition-all ${
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

        {/* Inline Active Task Deadline Editor on Main Page */}
        {activeTask && isEditingDeadline && onUpdateTaskDeadline && (
          <div className="mt-2 flex items-center justify-center gap-1.5 flex-wrap">
            <label htmlFor="active-task-deadline-edit" className="sr-only">
              Active task deadline
            </label>
            <input
              id="active-task-deadline-edit"
              type="datetime-local"
              value={deadlineDraft}
              onChange={(e) => setDeadlineDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.nativeEvent.isComposing) return;
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onUpdateTaskDeadline(activeTask.id, deadlineDraft.trim() || undefined);
                  setIsEditingDeadline(false);
                  setNowMs(Date.now());
                } else if (e.key === 'Escape') {
                  setIsEditingDeadline(false);
                }
              }}
              style={{ colorScheme: isDark ? 'dark' : 'light' }}
              className={`px-2.5 py-1 rounded-xl text-xs font-medium outline-none border ${
                isMatteBlack
                  ? 'bg-[#151518] text-white border-neutral-600 focus-visible:border-white'
                  : isDark
                    ? 'bg-[#1f1b2b] text-white border-pink-500/40 focus-visible:border-pink-400'
                    : 'bg-white/95 text-pink-950 border-pink-300 focus-visible:border-pink-500'
              }`}
              autoFocus
            />
            <button
              type="button"
              onClick={() => {
                onUpdateTaskDeadline(activeTask.id, deadlineDraft.trim() || undefined);
                setIsEditingDeadline(false);
                setNowMs(Date.now());
              }}
              title="Save deadline"
              aria-label="Save deadline"
              className={`p-1.5 rounded-xl transition-colors ${
                isMatteBlack ? 'bg-white text-black hover:bg-neutral-200' : 'bg-pink-600 text-white hover:bg-pink-500'
              }`}
            >
              <Check size={13} className="stroke-[2.5]" />
            </button>
            {activeTask.deadline && (
              <button
                type="button"
                onClick={() => {
                  onUpdateTaskDeadline(activeTask.id, undefined);
                  setIsEditingDeadline(false);
                }}
                title="Remove deadline"
                aria-label="Remove deadline"
                className={`p-1.5 rounded-xl transition-colors ${
                  isDark ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30' : 'bg-red-100 text-red-600 hover:bg-red-200'
                }`}
              >
                <Trash2 size={12} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsEditingDeadline(false)}
              title="Cancel"
              aria-label="Cancel deadline edit"
              className={`p-1.5 rounded-xl transition-colors ${
                isDark ? 'hover:bg-white/10 text-neutral-300' : 'hover:bg-pink-100 text-pink-800'
              }`}
            >
              <X size={13} />
            </button>
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

      {/* Pomodoro Session Cycle Indicator (linked to today's completed focus sessions) */}
      <div
        title={`${completedTodayCount} focus ${completedTodayCount === 1 ? 'session' : 'sessions'} completed today`}
        className="flex items-center space-x-2 mb-4"
      >
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
        {completedTodayCount > settings.longBreakInterval && (
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              isMatteBlack
                ? 'bg-white/15 text-white border border-white/25'
                : isDark
                  ? 'bg-pink-500/20 text-pink-200 border border-pink-400/35'
                  : 'bg-white/80 text-pink-900 border border-pink-200/80 shadow-sm'
            }`}
          >
            {completedTodayCount} today
          </span>
        )}
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

        {/* Indicator when temporary +10m time has been added to current focus session */}
        {mode === 'focus' && extraFocusMinutes > 0 && (
          <span
            className={`mt-2 text-[11px] font-bold px-2.5 py-0.5 rounded-full tracking-wide ${
              isMatteBlack
                ? 'bg-white/15 text-white border border-white/25'
                : isDark
                  ? 'bg-pink-500/20 text-pink-200 border border-pink-400/35'
                  : 'bg-white/80 text-pink-900 border border-pink-200/80 shadow-sm'
            }`}
          >
            +{extraFocusMinutes}m added to this session
          </span>
        )}
      </div>

      {/* Glassmorphic Control Buttons */}
      <div className="flex items-center space-x-3 sm:space-x-4 mt-8">
        {/* Play / Pause Button */}
        <button
          type="button"
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

        {/* Add +10m to current focus session only */}
        {mode === 'focus' && (
          <button
            type="button"
            onClick={handleAddTenMinutes}
            title="Add 10 minutes to current focus session"
            aria-label="Add 10 minutes to current focus session"
            className={`px-3.5 h-[50px] sm:h-[54px] rounded-2xl font-bold text-xs sm:text-sm tracking-tight flex items-center justify-center transition-all duration-200 cursor-pointer ${btnClass}`}
          >
            +10m
          </button>
        )}

        {/* Skip Button */}
        <button
          type="button"
          onClick={onSkip}
          title="Skip to next session"
          className={`p-3.5 sm:p-4 rounded-2xl transition-all duration-200 ${btnClass}`}
        >
          <SkipForward size={22} className="stroke-[2.5]" />
        </button>

        {/* Reset Button */}
        <button
          type="button"
          onClick={handleResetClick}
          title="Reset timer (R)"
          className={`p-3.5 sm:p-4 rounded-2xl transition-all duration-200 ${btnClass}`}
        >
          <RotateCcw size={22} className="stroke-[2.5]" />
        </button>

        {/* Picture-in-Picture Button */}
        <button
          type="button"
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
