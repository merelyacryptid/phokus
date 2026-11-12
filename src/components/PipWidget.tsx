import React from 'react';
import type { TimerMode, ThemeMode, Task } from '../types';
import { Play, Pause, SkipForward, RotateCcw, Check, Clock, CalendarClock, AlertCircle } from 'lucide-react';
import { BunnyEarsLogo } from './BunnyIcon';
import { formatDeadlineLabel, isDeadlineReached } from '../utils/deadline';

interface PipWidgetProps {
  mode: TimerMode;
  timeLeft: number;
  totalSeconds: number;
  extraFocusMinutes?: number;
  isRunning: boolean;
  activeTask: Task | null;
  nowMs?: number;
  theme: ThemeMode;
  onTogglePlay: () => void;
  onSkip: () => void;
  onReset: () => void;
  onAddTenMinutes: () => void;
  onCompleteActiveTask: (taskId?: string) => void;
}

interface PipThemeConfig {
  color: string;
  borderColor: string;
  logoBg: string;
  logoColor: string;
  logoBorder: string;
  badgeBg: string;
  badgeColor: string;
  badgeBorder: string;
  badgeShadow: string;
  clockBg: string;
  clockColor: string;
  clockBorder: string;
  digitColor: string;
  digitShadow: string;
  progressTrack: string;
  progressFill: string;
  progressShadow: string;
  taskCheckboxBorder: string;
  taskCheckboxBg: string;
  taskCheckColor: string;
  taskTextColor: string;
  taskTextShadow: string;
  taskPlaceholderColor: string;
  mainBtnBg: string;
  mainBtnColor: string;
  mainBtnShadow: string;
  secBtnClass: string;
}

const PIP_THEMES: Record<ThemeMode, PipThemeConfig> = {
  'matte-black': {
    color: '#ffffff',
    borderColor: 'rgba(255, 255, 255, 0.16)',
    logoBg: '#18181b',
    logoColor: '#ffffff',
    logoBorder: '1px solid #3f3f46',
    badgeBg: '#ffffff',
    badgeColor: '#000000',
    badgeBorder: 'none',
    badgeShadow: '0 0 15px rgba(255, 255, 255, 0.35)',
    clockBg: 'rgba(255, 255, 255, 0.08)',
    clockColor: '#e4e4e7',
    clockBorder: '1px solid rgba(255, 255, 255, 0.16)',
    digitColor: '#ffffff',
    digitShadow: '0 0 24px rgba(255, 255, 255, 0.2)',
    progressTrack: '#27272a',
    progressFill: '#ffffff',
    progressShadow: '0 0 12px rgba(255, 255, 255, 0.8)',
    taskCheckboxBorder: '2px solid #a1a1aa',
    taskCheckboxBg: '#18181b',
    taskCheckColor: '#ffffff',
    taskTextColor: '#ffffff',
    taskTextShadow: '0 0 8px rgba(255, 255, 255, 0.2)',
    taskPlaceholderColor: 'rgba(255, 255, 255, 0.45)',
    mainBtnBg: '#ffffff',
    mainBtnColor: '#000000',
    mainBtnShadow: '0 4px 14px rgba(255, 255, 255, 0.25)',
    secBtnClass: 'glass-btn-matte',
  },
  'dark-mesh': {
    color: '#ffffff',
    borderColor: 'rgba(244, 63, 142, 0.28)',
    logoBg: 'rgba(236, 72, 153, 0.16)',
    logoColor: '#f472b6',
    logoBorder: '1px solid rgba(236, 72, 153, 0.3)',
    badgeBg: 'rgba(219, 39, 119, 0.3)',
    badgeColor: '#fce7f3',
    badgeBorder: '1px solid rgba(236, 72, 153, 0.5)',
    badgeShadow: '0 0 14px rgba(244, 63, 94, 0.3)',
    clockBg: 'rgba(255, 255, 255, 0.08)',
    clockColor: '#fce7f3',
    clockBorder: '1px solid rgba(244, 114, 182, 0.28)',
    digitColor: '#ffffff',
    digitShadow: '0 0 28px rgba(244, 63, 94, 0.35)',
    progressTrack: 'rgba(80, 7, 36, 0.6)',
    progressFill: 'linear-gradient(90deg, #ec4899, #fb7185, #f9a8d4)',
    progressShadow: '0 0 10px rgba(244, 63, 94, 0.6)',
    taskCheckboxBorder: '2px solid rgba(244, 114, 182, 0.6)',
    taskCheckboxBg: 'rgba(255, 255, 255, 0.06)',
    taskCheckColor: '#f472b6',
    taskTextColor: '#fce7f3',
    taskTextShadow: '0 0 10px rgba(244, 63, 94, 0.3)',
    taskPlaceholderColor: 'rgba(252, 231, 243, 0.55)',
    mainBtnBg: 'linear-gradient(135deg, #f43f5e, #db2777)',
    mainBtnColor: '#ffffff',
    mainBtnShadow: '0 4px 16px rgba(244, 63, 94, 0.45)',
    secBtnClass: 'glass-btn-dark',
  },
  'light-aura': {
    color: '#500724',
    borderColor: 'rgba(244, 114, 182, 0.3)',
    logoBg: 'rgba(252, 231, 243, 0.75)',
    logoColor: '#db2777',
    logoBorder: '1px solid rgba(244, 114, 182, 0.22)',
    badgeBg: 'rgba(255, 255, 255, 0.92)',
    badgeColor: '#500724',
    badgeBorder: '1px solid #fbcfe8',
    badgeShadow: '0 1px 2px rgba(80, 7, 36, 0.06)',
    clockBg: 'rgba(255, 255, 255, 0.78)',
    clockColor: '#831843',
    clockBorder: '1px solid rgba(244, 114, 182, 0.3)',
    digitColor: '#500724',
    digitShadow: '0 1px 2px rgba(80, 7, 36, 0.08)',
    progressTrack: 'rgba(251, 207, 232, 0.65)',
    progressFill: 'linear-gradient(90deg, #f472b6, #f43f5e)',
    progressShadow: 'none',
    taskCheckboxBorder: '2px solid #f472b6',
    taskCheckboxBg: '#ffffff',
    taskCheckColor: '#f472b6',
    taskTextColor: '#500724',
    taskTextShadow: 'none',
    taskPlaceholderColor: 'rgba(80, 7, 36, 0.55)',
    mainBtnBg: 'linear-gradient(135deg, #ec4899, #f43f5e)',
    mainBtnColor: '#ffffff',
    mainBtnShadow: '0 4px 14px rgba(236, 72, 153, 0.3)',
    secBtnClass: 'glass-btn-pink',
  },
  'bunny-pink': {
    color: '#500724',
    borderColor: 'rgba(251, 113, 133, 0.3)',
    logoBg: 'rgba(252, 231, 243, 0.75)',
    logoColor: '#db2777',
    logoBorder: '1px solid rgba(251, 113, 133, 0.22)',
    badgeBg: 'rgba(255, 255, 255, 0.92)',
    badgeColor: '#500724',
    badgeBorder: '1px solid #fbcfe8',
    badgeShadow: '0 1px 2px rgba(80, 7, 36, 0.06)',
    clockBg: 'rgba(255, 255, 255, 0.78)',
    clockColor: '#831843',
    clockBorder: '1px solid rgba(244, 114, 182, 0.3)',
    digitColor: '#500724',
    digitShadow: '0 1px 2px rgba(80, 7, 36, 0.08)',
    progressTrack: 'rgba(251, 207, 232, 0.65)',
    progressFill: 'linear-gradient(90deg, #f472b6, #f43f5e)',
    progressShadow: 'none',
    taskCheckboxBorder: '2px solid #f472b6',
    taskCheckboxBg: '#ffffff',
    taskCheckColor: '#f472b6',
    taskTextColor: '#500724',
    taskTextShadow: 'none',
    taskPlaceholderColor: 'rgba(80, 7, 36, 0.55)',
    mainBtnBg: 'linear-gradient(135deg, #f43f5e, #ec4899)',
    mainBtnColor: '#ffffff',
    mainBtnShadow: '0 4px 14px rgba(244, 63, 94, 0.35)',
    secBtnClass: 'glass-btn-pink',
  },
};

// Isolated memoized static background layer so 1s timer ticks never re-render the fixed theme background
const PipBackground = React.memo(({ theme }: { theme: ThemeMode }) => (
  <div aria-hidden="true" className={`pip-bg-layer pip-bg-${theme}`} />
));

export const PipWidget: React.FC<PipWidgetProps> = ({
  mode,
  timeLeft,
  totalSeconds,
  extraFocusMinutes = 0,
  isRunning,
  activeTask,
  nowMs = 0,
  theme,
  onTogglePlay,
  onSkip,
  onReset,
  onAddTenMinutes,
  onCompleteActiveTask,
}) => {
  const c = PIP_THEMES[theme] || PIP_THEMES['bunny-pink'];
  const [clockNow, setClockNow] = React.useState<number>(() => Date.now());

  React.useEffect(() => {
    const id = setInterval(() => setClockNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const currentNow = Math.max(clockNow, nowMs);
  const currentDate = new Date(currentNow);
  const currentTimeLabel = currentDate.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
  const currentFullLabel = currentDate.toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const progressPercent = totalSeconds > 0
    ? Math.max(0, Math.min(100, ((totalSeconds - timeLeft) / totalSeconds) * 100))
    : 0;

  const modeLabel = mode === 'focus' ? 'FOCUS' : mode === 'shortBreak' ? 'SHORT BREAK' : 'LONG BREAK';

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        boxSizing: 'border-box',
        userSelect: 'none',
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
        colorScheme: theme === 'dark-mesh' || theme === 'matte-black' ? 'dark' : 'light',
        color: c.color,
        border: '1px solid ' + c.borderColor,
      }}
    >
      {/* Fixed pre-rendered aura background image for the current theme */}
      <PipBackground theme={theme} />

      {/* Foreground HUD */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '14px 16px',
        }}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div
              style={{
                padding: '4px',
                borderRadius: '8px',
                backgroundColor: c.logoBg,
                color: c.logoColor,
                border: c.logoBorder,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BunnyEarsLogo className="w-4 h-4" />
            </div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '2px 8px',
                borderRadius: '9999px',
                backgroundColor: c.badgeBg,
                color: c.badgeColor,
                border: c.badgeBorder,
                boxShadow: c.badgeShadow,
              }}
            >
              {modeLabel}
            </span>
            {mode === 'focus' && extraFocusMinutes > 0 && (
              <span
                title={`+${extraFocusMinutes} minutes added to current focus session`}
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '9999px',
                  backgroundColor: c.badgeBg,
                  color: c.badgeColor,
                  border: c.badgeBorder,
                }}
              >
                +{extraFocusMinutes}m
              </span>
            )}
          </div>

          {/* Current local time */}
          <div
            title={currentFullLabel}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '0.01em',
              padding: '2px 8px',
              borderRadius: '9999px',
              backgroundColor: c.clockBg,
              color: c.clockColor,
              border: c.clockBorder,
            }}
          >
            <Clock size={11} />
            <span>{currentTimeLabel}</span>
          </div>
        </div>

        {/* Center Clock, Progress Bar, and Task */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '2px 0' }}>
          <div
            style={{
              fontSize: '46px',
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: '-0.03em',
              fontVariantNumeric: 'tabular-nums',
              color: c.digitColor,
              textShadow: c.digitShadow,
            }}
          >
            {formattedTime}
          </div>

          {/* Minimal Theme-Matched Progress Bar */}
          <div
            style={{
              width: '144px',
              height: '4px',
              borderRadius: '9999px',
              backgroundColor: c.progressTrack,
              marginTop: '6px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progressPercent}%`,
                height: '100%',
                borderRadius: '9999px',
                background: c.progressFill,
                boxShadow: c.progressShadow,
                transition: 'width 0.8s linear',
              }}
            />
          </div>

          {/* Active Task Name with Checkbox */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '7px',
              maxWidth: '92%',
            }}
          >
            {activeTask ? (
              <>
                <button
                  type="button"
                  onClick={() => onCompleteActiveTask(activeTask.id)}
                  title="Mark task done"
                  aria-label="Mark active task done"
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '6px',
                    border: c.taskCheckboxBorder,
                    backgroundColor: c.taskCheckboxBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0,
                    padding: 0,
                  }}
                >
                  <Check size={13} style={{ color: c.taskCheckColor }} />
                </button>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    color: c.taskTextColor,
                    textShadow: c.taskTextShadow,
                  }}
                >
                  {activeTask.title}
                </span>
                {activeTask.deadline && (() => {
                  const isDarkTheme = theme === 'dark-mesh' || theme === 'matte-black';
                  const overdue = isDeadlineReached(activeTask.deadline, currentNow);
                  const deadlineLabel = formatDeadlineLabel(activeTask.deadline, currentNow);
                  return (
                    <span
                      title={`${overdue ? 'Past deadline' : 'Before deadline'}: ${deadlineLabel}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '9999px',
                        flexShrink: 0,
                        backgroundColor: overdue
                          ? isDarkTheme ? 'rgba(239, 68, 68, 0.2)' : 'rgba(254, 226, 226, 0.92)'
                          : isDarkTheme ? 'rgba(16, 185, 129, 0.18)' : 'rgba(209, 250, 229, 0.92)',
                        color: overdue
                          ? isDarkTheme ? '#f87171' : '#dc2626'
                          : isDarkTheme ? '#34d399' : '#047857',
                        border: overdue
                          ? isDarkTheme ? '1px solid rgba(248, 113, 113, 0.45)' : '1px solid rgba(239, 68, 68, 0.45)'
                          : isDarkTheme ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)',
                      }}
                    >
                      {overdue ? <AlertCircle size={10} /> : <CalendarClock size={10} />}
                      <span>{deadlineLabel}</span>
                    </span>
                  );
                })()}
              </>
            ) : (
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: c.taskPlaceholderColor,
                }}
              >
                {isRunning ? 'Focusing...' : 'Ready to start'}
              </span>
            )}
          </div>
        </div>

        {/* Bottom Controls: Pause / Resume, +10m (focus), Skip, Reset */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          {/* Main Pause / Resume Button */}
          <button
            type="button"
            onClick={onTogglePlay}
            title={isRunning ? 'Pause Timer' : 'Resume Timer'}
            className="pip-action-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0 16px',
              height: '36px',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '13px',
              border: 'none',
              cursor: 'pointer',
              background: c.mainBtnBg,
              color: c.mainBtnColor,
              boxShadow: c.mainBtnShadow,
            }}
          >
            {isRunning ? (
              <>
                <Pause size={15} />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play size={15} style={{ marginLeft: '1px' }} />
                <span>Resume</span>
              </>
            )}
          </button>

          {/* +10m Button for Current Focus Session */}
          {mode === 'focus' && (
            <button
              type="button"
              onClick={onAddTenMinutes}
              title="Add 10 minutes to this focus session"
              aria-label="Add 10 minutes to current focus session"
              className={`pip-action-btn ${c.secBtnClass}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 10px',
                height: '36px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                letterSpacing: '-0.02em',
              }}
            >
              +10m
            </button>
          )}

          {/* Skip Button */}
          <button
            type="button"
            onClick={onSkip}
            title="Skip to next session"
            aria-label="Skip to next session"
            className={`pip-action-btn ${c.secBtnClass}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '12px',
              cursor: 'pointer',
            }}
          >
            <SkipForward size={15} />
          </button>

          {/* Reset Button */}
          <button
            type="button"
            onClick={onReset}
            title="Reset session"
            aria-label="Reset session"
            className={`pip-action-btn ${c.secBtnClass}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '12px',
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};
