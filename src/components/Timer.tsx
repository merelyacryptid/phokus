import React, { useRef, useEffect, useState } from 'react';
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
  Plus
} from 'lucide-react';
import { BunnyMascot } from './BunnyMascot';
import confetti from 'canvas-confetti';

interface TimerProps {
  mode: TimerMode;
  timeLeft: number;
  isRunning: boolean;
  activeTask: Task | null;
  cycleCount: number;
  settings: TimerSettings;
  theme: ThemeMode;
  onModeChange: (newMode: TimerMode) => void;
  onTogglePlay: () => void;
  onSkip: () => void;
  onReset: () => void;
  onCompleteActiveTask: () => void;
  onUpdateActiveTaskTitle: (newTitle: string) => void;
  onCreateActiveTask: (title: string) => void;
}

export const Timer: React.FC<TimerProps> = ({
  mode,
  timeLeft,
  isRunning,
  activeTask,
  cycleCount,
  settings,
  theme,
  onModeChange,
  onTogglePlay,
  onSkip,
  onReset,
  onCompleteActiveTask,
  onUpdateActiveTaskTitle,
  onCreateActiveTask,
}) => {
  const isDark = theme === 'dark-mesh';
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [editText, setEditText] = useState('');
  const taskInputRef = useRef<HTMLInputElement>(null);

  // Canvas for native Picture-in-Picture
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPiPActive, setIsPiPActive] = useState(false);

  const startEditing = () => {
    setEditText(activeTask ? activeTask.title : '');
    setIsEditingTask(true);
  };

  // Format time mm:ss
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Update canvas for Picture in Picture when time or mode changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw PiP frame
    const width = 360;
    const height = 200;
    canvas.width = width;
    canvas.height = height;

    // Background
    ctx.fillStyle = isDark ? '#08080a' : '#fff0f4';
    ctx.fillRect(0, 0, width, height);

    // Subtle border
    ctx.strokeStyle = isDark ? '#f43f5e' : '#fbcfe8';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, width - 4, height - 4);

    // Mode label
    ctx.fillStyle = isDark ? '#fb7185' : '#e11d48';
    ctx.font = '600 16px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    const modeLabel = mode === 'focus' ? 'FOCUS' : mode === 'shortBreak' ? 'SHORT BREAK' : 'LONG BREAK';
    ctx.fillText(modeLabel, width / 2, 45);

    // Digits
    ctx.fillStyle = isDark ? '#ffffff' : '#831433';
    ctx.font = '700 68px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(formattedTime, width / 2, 125);

    // Active task or quote
    ctx.fillStyle = isDark ? '#fda4af' : '#9f1239';
    ctx.font = '500 14px "Plus Jakarta Sans", sans-serif';
    const subText = activeTask ? activeTask.title : (isRunning ? 'Stay in flow...' : 'Ready to begin');
    ctx.fillText(subText.slice(0, 35), width / 2, 165);
  }, [timeLeft, mode, isDark, formattedTime, activeTask, isRunning]);

  // Picture in Picture toggle
  const togglePictureInPicture = async () => {
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPiPActive(false);
      } else {
        if (!video.srcObject) {
          const stream = canvas.captureStream(30);
          video.srcObject = stream;
        }
        await video.play();
        await video.requestPictureInPicture();
        setIsPiPActive(true);
      }
    } catch (err) {
      console.warn('PiP error:', err);
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

  // Save inline task edit on main page
  const handleSaveEdit = () => {
    setIsEditingTask(false);
    const trimmed = editText.trim();
    if (!trimmed) return;

    if (activeTask) {
      onUpdateActiveTaskTitle(trimmed);
    } else {
      onCreateActiveTask(trimmed);
    }
  };

  // Checkbox clicked on main page
  const handleMainCheckboxClick = () => {
    if (!activeTask) return;

    // Confetti celebration
    confetti({
      particleCount: 38,
      spread: 60,
      origin: { y: 0.4 },
      colors: isDark ? ['#f43f5e', '#ec4899', '#fb7185', '#fda4af'] : ['#f43f5e', '#fb7185', '#fda4af']
    });

    onCompleteActiveTask();
  };

  // Calculate percentage for subtle progress accent
  const totalSeconds = (
    mode === 'focus' 
      ? settings.focusMinutes 
      : mode === 'shortBreak' 
        ? settings.shortBreakMinutes 
        : settings.longBreakMinutes
  ) * 60;
  const progressPercent = Math.max(0, Math.min(100, ((totalSeconds - timeLeft) / totalSeconds) * 100));

  return (
    <div className="flex flex-col items-center justify-center my-auto select-none z-10 transition-all duration-300">
      {/* Hidden elements for PiP */}
      <canvas ref={canvasRef} className="hidden" />
      <video ref={videoRef} className="hidden" muted playsInline />

      {/* Cute Bunny Mascot - Always White & Pink! */}
      {settings.showBunnyMascot && (
        <div className="mb-4">
          <BunnyMascot mode={mode} isRunning={isRunning} theme={theme} />
        </div>
      )}

      {/* Main Page Active Task Row with Checkbox & Inline Editing */}
      <div className="mb-4 flex items-center justify-center max-w-md w-full px-4 min-h-[44px]">
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
                isDark 
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
                    isDark
                      ? 'border-2 border-pink-400/60 hover:border-pink-400 bg-white/5 hover:bg-pink-600/25 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                      : 'border-2 border-pink-400 hover:border-pink-600 bg-white hover:bg-pink-100/60 shadow-sm'
                  }`}
                >
                  <Check size={16} className="text-pink-400 opacity-0 group-hover:opacity-100 transition-opacity stroke-[3]" />
                </button>

                {/* Editable Task Title */}
                <div
                  onClick={startEditing}
                  title="Click to edit task title directly"
                  className="flex items-center space-x-2 truncate py-1 px-2.5 rounded-xl transition-colors hover:bg-pink-500/10"
                >
                  <span
                    className={`text-lg sm:text-xl font-bold tracking-tight truncate transition-colors ${
                      isDark ? 'text-pink-100 drop-shadow-[0_0_10px_rgba(244,63,94,0.3)]' : 'text-pink-950 font-bold'
                    }`}
                  >
                    {activeTask.title}
                  </span>
                  <Pencil size={14} className="opacity-0 group-hover:opacity-80 transition-opacity text-pink-400 shrink-0" />
                </div>
              </>
            ) : (
              /* When no task is selected yet */
              <div
                onClick={startEditing}
                title="Click to add a task"
                className={`flex items-center space-x-2 py-1.5 px-4 rounded-xl border border-dashed transition-all ${
                  isDark
                    ? 'border-pink-500/30 hover:border-pink-400 bg-white/[0.03] text-pink-200/80'
                    : 'border-pink-300 hover:border-pink-500 bg-pink-50/50 text-pink-900/80'
                }`}
              >
                <Plus size={16} className="text-pink-400" />
                <span className="text-base font-semibold">What do you want to focus on?</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mode Tabs: FOCUS, SHORT BREAK, LONG BREAK */}
      <div className="flex items-center space-x-4 sm:space-x-8 mb-3">
        {(['focus', 'shortBreak', 'longBreak'] as TimerMode[]).map((m) => {
          const isActive = mode === m;
          const label = m === 'focus' ? 'FOCUS' : m === 'shortBreak' ? 'SHORT BREAK' : 'LONG BREAK';

          return (
            <button
              key={m}
              onClick={() => onModeChange(m)}
              className={`text-xs sm:text-sm font-bold tracking-wider uppercase transition-all duration-300 py-1.5 px-3.5 rounded-full ${
                isActive
                  ? isDark
                    ? 'text-pink-100 bg-pink-600/30 border border-pink-500/50 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                    : 'text-pink-950 bg-white/90 shadow-sm border border-pink-200'
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
                  ? isDark
                    ? 'fill-pink-400 text-pink-400 filter drop-shadow-[0_0_8px_rgba(244,63,94,0.7)]'
                    : 'fill-amber-400 text-amber-400 filter drop-shadow'
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
            isDark ? 'text-white drop-shadow-[0_0_30px_rgba(244,63,94,0.3)]' : 'text-pink-950 drop-shadow-sm'
          }`}
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {formattedTime}
        </h1>

        {/* Minimal Progress Bar under the clock */}
        <div className={`w-48 sm:w-64 h-1.5 rounded-full mt-2 overflow-hidden ${
          isDark ? 'bg-pink-950/60' : 'bg-pink-200/60'
        }`}>
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              isDark ? 'bg-gradient-to-r from-pink-500 via-rose-400 to-pink-300 shadow-[0_0_10px_rgba(244,63,94,0.6)]' : 'bg-gradient-to-r from-pink-400 to-rose-500'
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
          className={`p-3.5 sm:p-4 rounded-2xl transition-all duration-200 ${
            isDark ? 'glass-btn-dark' : 'glass-btn-pink'
          }`}
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
          className={`p-3.5 sm:p-4 rounded-2xl transition-all duration-200 ${
            isDark ? 'glass-btn-dark' : 'glass-btn-pink'
          }`}
        >
          <SkipForward size={22} className="stroke-[2.5]" />
        </button>

        {/* Reset Button */}
        <button
          onClick={onReset}
          title="Reset timer (R)"
          className={`p-3.5 sm:p-4 rounded-2xl transition-all duration-200 ${
            isDark ? 'glass-btn-dark' : 'glass-btn-pink'
          }`}
        >
          <RotateCcw size={22} className="stroke-[2.5]" />
        </button>

        {/* Picture-in-Picture Button */}
        <button
          onClick={togglePictureInPicture}
          title="Picture-in-Picture Mini Timer"
          className={`p-3.5 sm:p-4 rounded-2xl transition-all duration-200 ${
            isPiPActive ? 'ring-2 ring-pink-400' : ''
          } ${isDark ? 'glass-btn-dark' : 'glass-btn-pink'}`}
        >
          <PictureInPicture2 size={22} className="stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
