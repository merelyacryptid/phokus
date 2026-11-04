import React from 'react';
import type { TimerMode, ThemeMode, Task } from '../types';
import { Play, Pause, SkipForward, RotateCcw, Check, Star } from 'lucide-react';
import { BunnyEarsLogo } from './BunnyIcon';

interface PipWidgetProps {
  mode: TimerMode;
  timeLeft: number;
  isRunning: boolean;
  activeTask: Task | null;
  cycleCount: number;
  totalIntervals: number;
  theme: ThemeMode;
  onTogglePlay: () => void;
  onSkip: () => void;
  onReset: () => void;
  onCompleteActiveTask: (taskId?: string) => void;
}

interface PipThemeConfig {
  bg: string;
  color: string;
  borderColor: string;
  logoBg: string;
  logoColor: string;
  badgeBg: string;
  badgeColor: string;
  badgeBorder: string;
  starActive: string;
  starInactive: string;
  digitColor: string;
  digitShadow: string;
  taskCheckboxBorder: string;
  taskCheckboxBg: string;
  taskCheckColor: string;
  taskTextColor: string;
  taskPlaceholderColor: string;
  mainBtnBg: string;
  mainBtnColor: string;
  mainBtnShadow: string;
  secBtnBg: string;
  secBtnBorder: string;
  secBtnColor: string;
}

const PIP_THEMES: Record<ThemeMode, PipThemeConfig> = {
  'matte-black': {
    bg: '#09090b',
    color: '#ffffff',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    logoBg: 'rgba(255, 255, 255, 0.12)',
    logoColor: '#ffffff',
    badgeBg: '#ffffff',
    badgeColor: '#000000',
    badgeBorder: 'none',
    starActive: '#ffffff',
    starInactive: 'rgba(255, 255, 255, 0.2)',
    digitColor: '#ffffff',
    digitShadow: '0 0 16px rgba(255, 255, 255, 0.25)',
    taskCheckboxBorder: '2px solid rgba(255, 255, 255, 0.6)',
    taskCheckboxBg: 'rgba(255, 255, 255, 0.08)',
    taskCheckColor: '#ffffff',
    taskTextColor: '#e4e4e7',
    taskPlaceholderColor: 'rgba(255, 255, 255, 0.45)',
    mainBtnBg: '#ffffff',
    mainBtnColor: '#000000',
    mainBtnShadow: '0 4px 14px rgba(255, 255, 255, 0.25)',
    secBtnBg: 'rgba(255, 255, 255, 0.08)',
    secBtnBorder: 'rgba(255, 255, 255, 0.22)',
    secBtnColor: '#ffffff',
  },
  'dark-mesh': {
    bg: '#07050d',
    color: '#ffffff',
    borderColor: 'rgba(244, 63, 142, 0.35)',
    logoBg: 'rgba(244, 63, 142, 0.2)',
    logoColor: '#f472b6',
    badgeBg: 'rgba(244, 63, 142, 0.25)',
    badgeColor: '#fda4af',
    badgeBorder: '1px solid rgba(244, 63, 142, 0.45)',
    starActive: '#f43f5e',
    starInactive: 'rgba(244, 63, 142, 0.25)',
    digitColor: '#ffffff',
    digitShadow: '0 0 24px rgba(244, 63, 142, 0.4)',
    taskCheckboxBorder: '2px solid rgba(244, 63, 142, 0.6)',
    taskCheckboxBg: 'rgba(255, 255, 255, 0.06)',
    taskCheckColor: '#f43f5e',
    taskTextColor: '#fda4af',
    taskPlaceholderColor: 'rgba(255, 255, 255, 0.4)',
    mainBtnBg: '#f43f5e',
    mainBtnColor: '#ffffff',
    mainBtnShadow: '0 4px 16px rgba(244, 63, 94, 0.45)',
    secBtnBg: 'rgba(255, 255, 255, 0.06)',
    secBtnBorder: 'rgba(244, 63, 142, 0.35)',
    secBtnColor: '#ffffff',
  },
  'light-aura': {
    bg: '#ffffff',
    color: '#831433',
    borderColor: 'rgba(244, 114, 182, 0.35)',
    logoBg: 'rgba(254, 205, 211, 0.65)',
    logoColor: '#ec4899',
    badgeBg: '#fff0f5',
    badgeColor: '#9d174d',
    badgeBorder: '1px solid rgba(244, 114, 182, 0.35)',
    starActive: '#ec4899',
    starInactive: 'rgba(244, 114, 182, 0.25)',
    digitColor: '#831433',
    digitShadow: 'none',
    taskCheckboxBorder: '2px solid #f472b6',
    taskCheckboxBg: '#fff0f5',
    taskCheckColor: '#ec4899',
    taskTextColor: '#831433',
    taskPlaceholderColor: 'rgba(131, 20, 51, 0.45)',
    mainBtnBg: '#ec4899',
    mainBtnColor: '#ffffff',
    mainBtnShadow: '0 4px 14px rgba(236, 72, 153, 0.3)',
    secBtnBg: 'rgba(255, 240, 245, 0.9)',
    secBtnBorder: 'rgba(244, 114, 182, 0.35)',
    secBtnColor: '#9d174d',
  },
  'bunny-pink': {
    bg: '#fff5ea',
    color: '#831433',
    borderColor: 'rgba(251, 113, 133, 0.35)',
    logoBg: 'rgba(254, 205, 215, 0.8)',
    logoColor: '#e11d48',
    badgeBg: 'rgba(255, 255, 255, 0.95)',
    badgeColor: '#9f1239',
    badgeBorder: '1px solid rgba(251, 113, 133, 0.35)',
    starActive: '#f43f5e',
    starInactive: 'rgba(251, 113, 133, 0.25)',
    digitColor: '#831433',
    digitShadow: 'none',
    taskCheckboxBorder: '2px solid #fb7185',
    taskCheckboxBg: '#ffffff',
    taskCheckColor: '#f43f5e',
    taskTextColor: '#9f1239',
    taskPlaceholderColor: 'rgba(159, 18, 57, 0.5)',
    mainBtnBg: '#f43f5e',
    mainBtnColor: '#ffffff',
    mainBtnShadow: '0 4px 14px rgba(244, 63, 94, 0.35)',
    secBtnBg: 'rgba(255, 255, 255, 0.85)',
    secBtnBorder: 'rgba(251, 113, 133, 0.35)',
    secBtnColor: '#831433',
  },
};

export const PipWidget: React.FC<PipWidgetProps> = ({
  mode,
  timeLeft,
  isRunning,
  activeTask,
  cycleCount,
  totalIntervals,
  theme,
  onTogglePlay,
  onSkip,
  onReset,
  onCompleteActiveTask,
}) => {
  const c = PIP_THEMES[theme] || PIP_THEMES['bunny-pink'];

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const modeLabel = mode === 'focus' ? 'FOCUS' : mode === 'shortBreak' ? 'SHORT BREAK' : 'LONG BREAK';

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '16px',
        userSelect: 'none',
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
        backgroundColor: c.bg,
        color: c.color,
        border: '1px solid ' + c.borderColor,
      }}
    >
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              padding: '4px',
              borderRadius: '8px',
              backgroundColor: c.logoBg,
              color: c.logoColor,
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
            }}
          >
            {modeLabel}
          </span>
        </div>

        {/* Stars */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {Array.from({ length: totalIntervals }).map((_, idx) => (
            <Star
              key={idx}
              size={14}
              style={{
                fill: idx < cycleCount ? c.starActive : 'none',
                color: idx < cycleCount ? c.starActive : c.starInactive,
              }}
            />
          ))}
        </div>
      </div>

      {/* Center Clock and Task */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '4px 0' }}>
        <div
          style={{
            fontSize: '48px',
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

        {/* Active Task Name with Checkbox */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '8px',
            maxWidth: '92%',
          }}
        >
          {activeTask ? (
            <>
              <button
                onClick={() => onCompleteActiveTask(activeTask.id)}
                title="Mark task done"
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
                }}
              >
                {activeTask.title}
              </span>
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

      {/* Bottom Controls: Pause & Resume, Skip, Reset */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
        {/* Main Pause / Resume Button */}
        <button
          onClick={onTogglePlay}
          title={isRunning ? "Pause Timer" : "Resume Timer"}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 18px',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '13px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: c.mainBtnBg,
            color: c.mainBtnColor,
            boxShadow: c.mainBtnShadow,
            transition: 'transform 0.15s ease',
          }}
        >
          {isRunning ? (
            <>
              <Pause size={16} />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play size={16} style={{ marginLeft: '1px' }} />
              <span>Resume</span>
            </>
          )}
        </button>

        {/* Skip Button */}
        <button
          onClick={onSkip}
          title="Skip to next session"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '12px',
            border: '1px solid ' + c.secBtnBorder,
            backgroundColor: c.secBtnBg,
            color: c.secBtnColor,
            cursor: 'pointer',
          }}
        >
          <SkipForward size={16} />
        </button>

        {/* Reset Button */}
        <button
          onClick={onReset}
          title="Reset session"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '12px',
            border: '1px solid ' + c.secBtnBorder,
            backgroundColor: c.secBtnBg,
            color: c.secBtnColor,
            cursor: 'pointer',
          }}
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
};

