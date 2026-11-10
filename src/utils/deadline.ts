import type { ThemeMode } from '../types';

/**
 * Parses a local wall-clock deadline string ('YYYY-MM-DDTHH:mm' or 'YYYY-MM-DD')
 * into epoch milliseconds without UTC timezone drift.
 */
export function parseDeadlineLocalMs(deadline?: string): number | null {
  if (!deadline || typeof deadline !== 'string') return null;

  const trimmed = deadline.trim();
  if (!trimmed) return null;

  const [datePart, timePart] = trimmed.split('T');
  const datePieces = datePart.split('-').map(Number);
  if (datePieces.length !== 3) return null;

  const [y, m, d] = datePieces;
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return null;

  let hh = 23;
  let mm = 59;
  let ss = 59;
  let ms = 999;

  if (timePart !== undefined) {
    const timePieces = timePart.split(':').map(Number);
    hh = Number.isFinite(timePieces[0]) ? timePieces[0] : 0;
    mm = Number.isFinite(timePieces[1]) ? timePieces[1] : 0;
    ss = 0;
    ms = 0;
  }

  const parsed = new Date(y, m - 1, d, hh, mm, ss, ms);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== y ||
    parsed.getMonth() !== m - 1 ||
    parsed.getDate() !== d
  ) {
    return null;
  }

  return parsed.getTime();
}

/**
 * Returns true once the local wall-clock deadline has been reached or passed.
 */
export function isDeadlineReached(deadline?: string, nowMs: number = Date.now()): boolean {
  const targetMs = parseDeadlineLocalMs(deadline);
  if (targetMs === null) return false;
  return nowMs >= targetMs;
}

/**
 * Formats a deadline cleanly for compact inline display next to task names.
 */
export function formatDeadlineLabel(deadline: string, nowMs: number = Date.now()): string {
  const targetMs = parseDeadlineLocalMs(deadline);
  if (targetMs === null) return deadline;

  const target = new Date(targetMs);
  const now = new Date(nowMs);

  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const targetMidnight = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const dayDiff = Math.round((targetMidnight - todayMidnight) / 86400000);

  let dayLabel: string;
  if (dayDiff === 0) {
    dayLabel = 'Today';
  } else if (dayDiff === 1) {
    dayLabel = 'Tomorrow';
  } else if (dayDiff === -1) {
    dayLabel = 'Yesterday';
  } else if (target.getFullYear() === now.getFullYear()) {
    dayLabel = target.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } else {
    dayLabel = target.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  if (!deadline.includes('T')) {
    return dayLabel;
  }

  const timeLabel = target.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return `${dayLabel}, ${timeLabel}`;
}

/**
 * Normalizes a stored deadline string for <input type="datetime-local"> value.
 */
export function toDateTimeLocalValue(deadline?: string): string {
  if (!deadline) return '';
  if (deadline.includes('T')) return deadline.slice(0, 16);
  return `${deadline}T23:59`;
}

/**
 * Generates a sensible local default ('today at 23:59') when adding a deadline to an existing task.
 */
export function getDefaultDeadlineValue(nowMs: number = Date.now()): string {
  const now = new Date(nowMs);
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}T23:59`;
}

/**
 * Shared Tailwind badge styling for task deadlines (green before deadline, red once reached).
 */
export function getDeadlineBadgeClasses(isOverdue: boolean, theme: ThemeMode): string {
  const isDark = theme === 'dark-mesh' || theme === 'matte-black';
  if (isOverdue) {
    return isDark
      ? 'bg-red-500/15 text-red-400 border border-red-500/40'
      : 'bg-red-100/90 text-red-600 border border-red-300';
  }
  return isDark
    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/35'
    : 'bg-emerald-100/90 text-emerald-700 border border-emerald-300';
}
