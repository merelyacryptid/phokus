import type { ThemeMode } from '../types';

export interface Deadline12hParts {
  date: string;       // YYYY-MM-DD (defaults to today)
  hour12: string;     // '1'..'12' or '' when optional time is unset
  minute: string;     // '00'..'59' or '' when unset
  period: 'AM' | 'PM';
}

const MONTH_MAP: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

function isValidLocalCalendarDate(y: number, m: number, d: number): boolean {
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const check = new Date(y, m - 1, d);
  return check.getFullYear() === y && check.getMonth() === m - 1 && check.getDate() === d;
}

/**
 * Parses natural-language task deadlines into 'YYYY-MM-DDTHH:mm'.
 * Supports:
 * - Time only (defaults date to today): "12 pm", "5:30 pm", "11:59am", "17:30"
 * - Relative days: "tom", "tmrw", "tomorrow", "tod", "today" (with or without time)
 * - Short/full months (either order): "Nov 12 12 pm", "12 nov 4:30 pm", "dec 5"
 * - Numeric dates: "12/11 5 pm", "2026-11-12 12 pm"
 * Returns null if input cannot be parsed.
 */
export function parseNaturalDeadline(input: string, nowMs: number = Date.now()): string | null {
  if (!input || typeof input !== 'string') return null;

  let working = input.trim().replace(/\s+/g, ' ');
  if (!working) return null;

  let hh24: number | null = null;
  let mm: number = 0;

  // 1. Try explicit 12-hour AM/PM time (e.g. "12 pm", "5:30pm", "11:59 a.m.", "4p")
  const amPmRegex = /(?:^|[\s,@])(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?|am|pm|a|p)(?=$|[\s,])/i;
  const amPmMatch = amPmRegex.exec(working);

  if (amPmMatch) {
    const rawH = parseInt(amPmMatch[1], 10);
    const rawM = amPmMatch[2] ? parseInt(amPmMatch[2], 10) : 0;
    const rawPeriod = amPmMatch[3].toLowerCase();

    if (rawH < 1 || rawH > 12 || rawM < 0 || rawM > 59) return null;

    const isPm = rawPeriod.startsWith('p');
    if (isPm) {
      hh24 = rawH === 12 ? 12 : rawH + 12;
    } else {
      hh24 = rawH === 12 ? 0 : rawH;
    }
    mm = rawM;

    working = (
      working.slice(0, amPmMatch.index) +
      ' ' +
      working.slice(amPmMatch.index + amPmMatch[0].length)
    )
      .replace(/\s+/g, ' ')
      .trim();
  } else {
    // 2. Try colon time without AM/PM (e.g. "5:30", "17:30")
    const colonRegex = /(?:^|[\s,@])(\d{1,2}):(\d{2})(?=$|[\s,])/;
    const colonMatch = colonRegex.exec(working);
    if (colonMatch) {
      const rawH = parseInt(colonMatch[1], 10);
      const rawM = parseInt(colonMatch[2], 10);
      if (rawH < 0 || rawH > 23 || rawM < 0 || rawM > 59) return null;

      if (rawH === 0 || rawH >= 13 || rawH === 12) {
        hh24 = rawH;
      } else if (rawH >= 1 && rawH <= 7) {
        hh24 = rawH + 12;
      } else {
        hh24 = rawH;
      }
      mm = rawM;

      working = (
        working.slice(0, colonMatch.index) +
        ' ' +
        working.slice(colonMatch.index + colonMatch[0].length)
      )
        .replace(/\s+/g, ' ')
        .trim();
    }
  }

  // Strip commas and common filler connectors left around the remaining date part
  const datePart = working
    .replace(/,/g, ' ')
    .replace(/\b(?:at|on|by)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const now = new Date(nowMs);
  let year = now.getFullYear();
  let month = now.getMonth() + 1;
  let day = now.getDate();

  if (datePart === '') {
    // No date mentioned -> require a valid time to have been parsed, and default date to today
    if (hh24 === null) return null;
  } else {
    const lowerDate = datePart.toLowerCase();

    if (/^(today|tod)$/.test(lowerDate)) {
      // Already today
    } else if (/^(tomorrow|tom|tmrw|tmw)$/.test(lowerDate)) {
      const tom = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      year = tom.getFullYear();
      month = tom.getMonth() + 1;
      day = tom.getDate();
    } else {
      // Match "Nov 12" or "November 12th 2026"
      const monthFirstMatch = /^([a-z]+)[\s.\-/]+(\d{1,2})(?:st|nd|rd|th)?(?:[\s\-/]+(\d{2,4}))?$/i.exec(datePart);
      // Match "12 Nov" or "12th November 2026"
      const dayFirstMatch = /^(\d{1,2})(?:st|nd|rd|th)?[\s.\-/]+([a-z]+)(?:[\s\-/]+(\d{2,4}))?$/i.exec(datePart);
      // Match "YYYY-MM-DD" or "YYYY/MM/DD"
      const isoDateMatch = /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/.exec(datePart);
      // Match "DD/MM" or "DD/MM/YYYY"
      const numericDateMatch = /^(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?$/.exec(datePart);

      const normalizeYear = (rawY?: string, parsedMonth?: number): number => {
        if (rawY) {
          const parsedY = parseInt(rawY, 10);
          return rawY.length === 2 ? 2000 + parsedY : parsedY;
        }
        // If month is 2+ months earlier in calendar year (e.g. typing "Jan 5" in Nov/Dec), infer next year
        if (parsedMonth !== undefined && parsedMonth < now.getMonth()) {
          return now.getFullYear() + 1;
        }
        return now.getFullYear();
      };

      if (monthFirstMatch) {
        const mNum = MONTH_MAP[monthFirstMatch[1].toLowerCase()];
        const dNum = parseInt(monthFirstMatch[2], 10);
        if (!mNum) return null;
        year = normalizeYear(monthFirstMatch[3], mNum);
        month = mNum;
        day = dNum;
      } else if (dayFirstMatch) {
        const dNum = parseInt(dayFirstMatch[1], 10);
        const mNum = MONTH_MAP[dayFirstMatch[2].toLowerCase()];
        if (!mNum) return null;
        year = normalizeYear(dayFirstMatch[3], mNum);
        month = mNum;
        day = dNum;
      } else if (isoDateMatch) {
        year = parseInt(isoDateMatch[1], 10);
        month = parseInt(isoDateMatch[2], 10);
        day = parseInt(isoDateMatch[3], 10);
      } else if (numericDateMatch) {
        const first = parseInt(numericDateMatch[1], 10);
        const second = parseInt(numericDateMatch[2], 10);
        // Support DD/MM (default) or MM/DD when second > 12
        if (first <= 12 && second > 12) {
          month = first;
          day = second;
        } else {
          day = first;
          month = second;
        }
        year = normalizeYear(numericDateMatch[3], month);
      } else {
        return null;
      }
    }

    // If user entered a date only (e.g. "tom" or "Nov 15") with no time, default time to 11:59 PM
    if (hh24 === null) {
      hh24 = 23;
      mm = 59;
    }
  }

  if (!isValidLocalCalendarDate(year, month, day)) return null;

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hh24).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
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
