import React, { useId } from 'react';
import type { ThemeMode } from '../types';
import type { Deadline12hParts } from '../utils/deadline';

interface DeadlineFieldsProps {
  value: Deadline12hParts;
  onChange: (next: Deadline12hParts) => void;
  theme: ThemeMode;
  allowEmptyHour?: boolean;
  onEnter?: () => void;
  onEscape?: () => void;
  autoFocus?: boolean;
}

const HOURS_12 = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

export const DeadlineFields: React.FC<DeadlineFieldsProps> = ({
  value,
  onChange,
  theme,
  allowEmptyHour = false,
  onEnter,
  onEscape,
  autoFocus = false,
}) => {
  const baseId = useId();
  const isMatteBlack = theme === 'matte-black';
  const isDark = theme === 'dark-mesh' || isMatteBlack;

  const fieldClass = isMatteBlack
    ? 'bg-[#151518] text-white border border-neutral-700 focus-visible:border-white focus-visible:ring-1 focus-visible:ring-white/50'
    : isDark
      ? 'bg-[#1f1b2b] text-white border border-pink-500/30 focus-visible:border-pink-400 focus-visible:ring-1 focus-visible:ring-pink-500/50'
      : 'bg-pink-50 text-pink-950 border border-pink-200 focus-visible:border-pink-500 focus-visible:ring-1 focus-visible:ring-pink-400/50';

  const optionClass = isDark ? 'bg-[#1f1b2b] text-white' : 'bg-white text-pink-950';

  const handleHourChange = (nextHour: string) => {
    if (!nextHour) {
      onChange({ ...value, hour12: '', minute: '' });
      return;
    }
    onChange({
      ...value,
      hour12: nextHour,
      minute: value.minute === '' ? '00' : value.minute,
    });
  };

  const handleMinuteChange = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, '').slice(0, 2);
    onChange({ ...value, minute: digits });
  };

  const handleMinuteBlur = () => {
    if (!value.hour12 && !value.minute) return;
    if (value.minute === '') {
      onChange({ ...value, minute: '00' });
      return;
    }
    const clamped = Math.max(0, Math.min(59, parseInt(value.minute, 10) || 0));
    onChange({ ...value, minute: String(clamped).padStart(2, '0') });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (e.key === 'Enter' && onEnter) {
      e.preventDefault();
      onEnter();
    } else if (e.key === 'Escape' && onEscape) {
      e.preventDefault();
      onEscape();
    }
  };

  return (
    <div
      role="group"
      aria-label="Deadline time and date"
      className="flex items-center gap-1.5 flex-wrap"
    >
      {/* 1. Time (12h AM/PM) comes FIRST */}
      <div className="flex items-center gap-1">
        <label htmlFor={`${baseId}-hour`} className="sr-only">
          Deadline hour (12-hour)
        </label>
        <select
          id={`${baseId}-hour`}
          value={value.hour12}
          onChange={(e) => handleHourChange(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus={autoFocus}
          title="Hour (12h)"
          style={{ colorScheme: isDark ? 'dark' : 'light' }}
          className={`px-1.5 py-1 rounded-lg text-[11px] font-semibold outline-none cursor-pointer ${fieldClass}`}
        >
          {allowEmptyHour && (
            <option value="" className={optionClass}>
              --
            </option>
          )}
          {HOURS_12.map((h) => (
            <option key={h} value={h} className={optionClass}>
              {h}
            </option>
          ))}
        </select>

        <span className={`text-[11px] font-bold ${isDark ? 'text-pink-200/70' : 'text-pink-900/70'}`}>:</span>

        <label htmlFor={`${baseId}-minute`} className="sr-only">
          Deadline minute
        </label>
        <input
          id={`${baseId}-minute`}
          type="text"
          inputMode="numeric"
          value={value.minute}
          onChange={(e) => handleMinuteChange(e.target.value)}
          onBlur={handleMinuteBlur}
          onKeyDown={handleKeyDown}
          placeholder="00"
          title="Minutes (00-59)"
          className={`w-8 text-center py-1 rounded-lg text-[11px] font-semibold outline-none ${fieldClass}`}
        />

        {/* AM / PM Toggle Buttons */}
        <div
          role="group"
          aria-label="AM or PM"
          className={`inline-flex rounded-lg overflow-hidden border ${
            isMatteBlack
              ? 'border-neutral-700 bg-[#151518]'
              : isDark
                ? 'border-pink-500/30 bg-[#1f1b2b]'
                : 'border-pink-200 bg-pink-50'
          }`}
        >
          {(['AM', 'PM'] as const).map((p) => {
            const active = value.period === p;
            return (
              <button
                key={p}
                type="button"
                aria-pressed={active}
                onClick={() => onChange({ ...value, period: p })}
                className={`px-1.5 py-1 text-[10px] font-bold transition-colors cursor-pointer ${
                  active
                    ? isMatteBlack
                      ? 'bg-white text-black'
                      : 'bg-pink-600 text-white'
                    : isDark
                      ? 'text-pink-200/60 hover:text-white'
                      : 'text-pink-900/60 hover:text-pink-950'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Date comes SECOND (always defaults to today) */}
      <div className="flex items-center">
        <label htmlFor={`${baseId}-date`} className="sr-only">
          Deadline date
        </label>
        <input
          id={`${baseId}-date`}
          type="date"
          value={value.date}
          onChange={(e) => onChange({ ...value, date: e.target.value })}
          onKeyDown={handleKeyDown}
          title="Deadline date (defaults to today)"
          style={{ colorScheme: isDark ? 'dark' : 'light' }}
          className={`px-2 py-1 rounded-lg text-[11px] font-medium outline-none ${fieldClass}`}
        />
      </div>
    </div>
  );
};

