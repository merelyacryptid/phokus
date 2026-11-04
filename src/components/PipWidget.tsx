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
  onCompleteActiveTask: () => void;
}

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
  const isMatteBlack = theme === 'matte-black';
  const isDark = theme === 'dark-mesh' || isMatteBlack;

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
        backgroundColor: isMatteBlack ? '#0a0a0c' : isDark ? '#09080e' : '#fff5ea',
        color: isDark ? '#ffffff' : '#831433',
        border: isMatteBlack ? '1px solid rgba(255, 255, 255, 0.2)' : isDark ? '1px solid rgba(244, 63, 142, 0.25)' : '1px solid rgba(251, 113, 133, 0.3)',
      }}
    >
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              padding: '4px',
              borderRadius: '8px',
              backgroundColor: isMatteBlack ? 'rgba(255, 255, 255, 0.12)' : isDark ? 'rgba(244, 63, 142, 0.15)' : 'rgba(244, 63, 94, 0.1)',
              color: isMatteBlack ? '#ffffff' : isDark ? '#f472b6' : '#e11d48',
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
              backgroundColor: isMatteBlack ? '#ffffff' : isDark ? 'rgba(244, 63, 142, 0.2)' : 'rgba(255, 255, 255, 0.9)',
              color: isMatteBlack ? '#000000' : isDark ? '#fda4af' : '#9f1239',
              border: isMatteBlack ? 'none' : isDark ? '1px solid rgba(244, 63, 142, 0.35)' : '1px solid rgba(251, 113, 133, 0.3)',
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
                fill: idx < cycleCount ? (isMatteBlack ? '#ffffff' : '#f43f5e') : 'none',
                color: idx < cycleCount ? (isMatteBlack ? '#ffffff' : '#f43f5e') : isDark ? 'rgba(255,255,255,0.2)' : 'rgba(131,20,51,0.2)',
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
            color: isDark ? '#ffffff' : '#831433',
            textShadow: isDark ? '0 0 20px rgba(244, 63, 142, 0.35)' : 'none',
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
                onClick={onCompleteActiveTask}
                title="Mark task done"
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '6px',
                  border: isDark ? '2px solid rgba(244, 63, 142, 0.6)' : '2px solid #fb7185',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  padding: 0,
                }}
              >
                <Check size={13} style={{ color: '#f43f5e' }} />
              </button>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  color: isDark ? '#fda4af' : '#9f1239',
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
                color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(131,20,51,0.5)',
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
            backgroundColor: isMatteBlack ? '#ffffff' : '#f43f5e',
            color: isMatteBlack ? '#000000' : '#ffffff',
            boxShadow: isMatteBlack ? '0 4px 14px rgba(255, 255, 255, 0.25)' : '0 4px 14px rgba(244, 63, 94, 0.35)',
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
            border: isMatteBlack ? '1px solid rgba(255, 255, 255, 0.2)' : isDark ? '1px solid rgba(244, 63, 142, 0.3)' : '1px solid rgba(251, 113, 133, 0.4)',
            backgroundColor: isMatteBlack ? 'rgba(255,255,255,0.08)' : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)',
            color: isDark ? '#ffffff' : '#831433',
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
            border: isMatteBlack ? '1px solid rgba(255, 255, 255, 0.2)' : isDark ? '1px solid rgba(244, 63, 142, 0.3)' : '1px solid rgba(251, 113, 133, 0.4)',
            backgroundColor: isMatteBlack ? 'rgba(255,255,255,0.08)' : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)',
            color: isDark ? '#ffffff' : '#831433',
            cursor: 'pointer',
          }}
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
};

