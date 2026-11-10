import type { ThemeMode } from '../types';

export interface Deadline12hParts {
  date: string;       // YYYY-MM-DD (defaults to today)
  hour12: string;     // '1'..'12' or '' when optional time is unset
  minute: string;     // '00'..'59' or '' when unset
  period: 'AM' | 'PM';
}

/**
 * Returns local calendar date string ('YYYY-MM-DD').
 */
export function getTodayLocalDateStr(nowMs: number = Date.now()): string {
  const now = new Date(nowMs);
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

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
 * Formats a deadline strictly in 12-hour AM/PM for compact inline display next to task names.
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

  const timeLabel = target.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${dayLabel}, ${timeLabel}`;
}

/**
 * Splits a stored deadline ('YYYY-MM-DDTHH:mm') into 12-hour AM/PM fields + local date.
 * Always defaults the date to today if none is set.
 */
export function splitDeadlineTo12h(
  deadline?: string,
  options?: { emptyTime?: boolean; nowMs?: number }
): Deadline12hParts {
  const fallbackNow = options?.nowMs ?? Date.now();
  const todayStr = getTodayLocalDateStr(fallbackNow);

  if (!deadline) {
    return {
      date: todayStr,
      hour12: options?.emptyTime ? '' : '11',
      minute: options?.emptyTime ? '' : '59',
      period: 'PM',
    };
  }

  const [datePart, timePart] = deadline.split('T');
  const validDate = datePart && /^\d{4}-\d{2}-\d{2}$/.test(datePart) ? datePart : todayStr;

  if (!timePart) {
    return {
      date: validDate,
      hour12: '11',
      minute: '59',
      period: 'PM',
    };
  }

  const [hhStr, mmStr] = timePart.split(':');
  const hh24 = Math.max(0, Math.min(23, parseInt(hhStr || '23', 10) || 0));
  const mm = Math.max(0, Math.min(59, parseInt(mmStr || '59', 10) || 0));

  const period: 'AM' | 'PM' = hh24 >= 12 ? 'PM' : 'AM';
  const h12 = hh24 % 12 === 0 ? 12 : hh24 % 12;

  return {
    date: validDate,
    hour12: String(h12),
    minute: String(mm).padStart(2, '0'),
    period,
  };
}

/**
 * Combines 12-hour AM/PM parts + local date into 'YYYY-MM-DDTHH:mm'.
 * Returns undefined if no hour was selected (preserving optionality).
 */
export function combine12hToDeadline(parts: Deadline12hParts, fallbackNowMs?: number): string | undefined {
  if (!parts.hour12) return undefined;

  const h12 = Math.max(1, Math.min(12, parseInt(parts.hour12, 10) || 12));
  const rawMin = parts.minute.trim();
  const m = rawMin === '' ? 0 : Math.max(0, Math.min(59, parseInt(rawMin, 10) || 0));

  let h24: number;
  if (parts.period === 'AM') {
    h24 = h12 === 12 ? 0 : h12;
  } else {
    h24 = h12 === 12 ? 12 : h12 + 12;
  }

  const finalDate = parts.date && /^\d{4}-\d{2}-\d{2}$/.test(parts.date)
    ? parts.date
    : getTodayLocalDateStr(fallbackNowMs);

  return `${finalDate}T${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
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
