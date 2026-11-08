import type { UserStats, SessionHistoryItem, UserProfile } from '../types';

/**
 * Format local calendar date YYYY-MM-DD
 * Immune to UTC timezone day-shifting (e.g. IST +5:30 or EST -5)
 */
export function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Safely merge two UserStats objects without losing any data.
 * - Merges dailyActivity by taking the max minutes recorded for any date.
 * - Deduplicates session history items.
 * - Ensures total focus minutes, session counts, and streaks are preserved.
 */
export function mergeUserStats(a?: UserStats | null, b?: UserStats | null): UserStats {
  const defaultStats: UserStats = {
    totalFocusMinutes: 0,
    completedFocusSessions: 0,
    completedShortBreaks: 0,
    completedLongBreaks: 0,
    completedTasksCount: 0,
    streakDays: 1,
    lastActiveDate: formatLocalDate(new Date()),
    dailyActivity: {},
    history: [],
  };

  if (!a && !b) return defaultStats;
  if (!a) return b ? { ...defaultStats, ...b } : defaultStats;
  if (!b) return a ? { ...defaultStats, ...a } : defaultStats;

  // Merge daily activity records (max of each day)
  const dailyActivity: Record<string, number> = { ...(a.dailyActivity || {}) };
  if (b.dailyActivity) {
    for (const [date, minutes] of Object.entries(b.dailyActivity)) {
      dailyActivity[date] = Math.max(dailyActivity[date] || 0, minutes);
    }
  }

  // Deduplicate session history
  const historyMap = new Map<string, SessionHistoryItem>();
  (a.history || []).forEach(item => {
    const key = item.id || `${item.date}_${item.mode}_${item.durationMinutes}_${item.taskTitle || ''}`;
    historyMap.set(key, item);
  });
  (b.history || []).forEach(item => {
    const key = item.id || `${item.date}_${item.mode}_${item.durationMinutes}_${item.taskTitle || ''}`;
    if (!historyMap.has(key)) {
      historyMap.set(key, item);
    }
  });

  const mergedHistory = Array.from(historyMap.values()).sort(
    (x, y) => new Date(y.date).getTime() - new Date(x.date).getTime()
  );

  const totalFromDaily = Object.values(dailyActivity).reduce((acc, m) => acc + m, 0);
  const totalFromHistory = mergedHistory
    .filter(h => h.mode === 'focus')
    .reduce((acc, h) => acc + (h.durationMinutes || 0), 0);

  const totalFocusMinutes = Math.max(
    a.totalFocusMinutes || 0,
    b.totalFocusMinutes || 0,
    totalFromDaily,
    totalFromHistory
  );

  const completedFocusSessions = Math.max(
    a.completedFocusSessions || 0,
    b.completedFocusSessions || 0,
    mergedHistory.filter(h => h.mode === 'focus').length
  );

  const streakDays = Math.max(a.streakDays || 1, b.streakDays || 1);
  const lastActiveDate = (a.lastActiveDate && a.lastActiveDate > (b.lastActiveDate || ''))
    ? a.lastActiveDate
    : (b.lastActiveDate || a.lastActiveDate || formatLocalDate(new Date()));

  return {
    totalFocusMinutes,
    completedFocusSessions,
    completedShortBreaks: Math.max(a.completedShortBreaks || 0, b.completedShortBreaks || 0),
    completedLongBreaks: Math.max(a.completedLongBreaks || 0, b.completedLongBreaks || 0),
    completedTasksCount: Math.max(a.completedTasksCount || 0, b.completedTasksCount || 0),
    streakDays,
    lastActiveDate,
    dailyActivity,
    history: mergedHistory,
  };
}

/**
 * Scans all available local storage locations to recover stats if ever cleared.
 */
export function recoverAllAvailableStats(currentStats?: UserStats): UserStats {
  let result = currentStats || {
    totalFocusMinutes: 0,
    completedFocusSessions: 0,
    completedShortBreaks: 0,
    completedLongBreaks: 0,
    completedTasksCount: 0,
    streakDays: 1,
    lastActiveDate: formatLocalDate(new Date()),
    dailyActivity: {},
    history: [],
  };

  try {
    // 1. Check phokus_stats_backup
    const backupStr = localStorage.getItem('phokus_stats_backup');
    if (backupStr) {
      const backup = JSON.parse(backupStr);
      result = mergeUserStats(result, backup);
    }

    // 2. Check phokus_active_user
    const activeStr = localStorage.getItem('phokus_active_user');
    if (activeStr) {
      const active = JSON.parse(activeStr);
      if (active?.stats) {
        result = mergeUserStats(result, active.stats);
      }
    }

    // 3. Check all accounts in phokus_accounts
    const accountsStr = localStorage.getItem('phokus_accounts');
    if (accountsStr) {
      const accounts: UserProfile[] = JSON.parse(accountsStr);
      if (Array.isArray(accounts)) {
        for (const acc of accounts) {
          if (acc?.stats) {
            result = mergeUserStats(result, acc.stats);
          }
        }
      }
    }

    // 4. Check guest stats
    const guestStr = localStorage.getItem('phokus_guest_stats');
    if (guestStr) {
      const guest = JSON.parse(guestStr);
      if (guest) {
        result = mergeUserStats(result, guest);
      }
    }
  } catch {
    // ignore parsing errors
  }

  // If we recovered meaningful stats, persist backup
  if (result.totalFocusMinutes > 0 || Object.keys(result.dailyActivity).length > 0) {
    try {
      localStorage.setItem('phokus_stats_backup', JSON.stringify(result));
    } catch {
      // ignore
    }
  }

  return result;
}

/**
 * Save stats to backup
 */
export function persistStatsBackup(stats: UserStats): void {
  try {
    if (stats && (stats.totalFocusMinutes > 0 || Object.keys(stats.dailyActivity || {}).length > 0)) {
      localStorage.setItem('phokus_stats_backup', JSON.stringify(stats));
    }
  } catch {
    // ignore
  }
}

