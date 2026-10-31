import React, { useMemo } from 'react';
import type { UserStats, ThemeMode, UserProfile } from '../types';
import { Flame, Clock, CheckCircle, Award, X, Calendar, History } from 'lucide-react';

interface StatsModalProps {
  isOpen: boolean;
  stats: UserStats;
  currentUser: UserProfile | null;
  theme: ThemeMode;
  onClose: () => void;
  onOpenAuth: () => void;
}

function getRecentDays(dailyActivity: Record<string, number>) {
  const list: { dateStr: string; dayLabel: string; minutes: number }[] = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = dayNames[d.getDay()];
    const minutes = dailyActivity[dateStr] || 0;
    list.push({ dateStr, dayLabel, minutes });
  }

  const max = Math.max(60, ...list.map(d => d.minutes));
  return { days: list, todayStr: today, maxMinutes: max };
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  stats,
  currentUser,
  theme,
  onClose,
  onOpenAuth,
}) => {
  const isDark = theme === 'dark-mesh';

  // Generate last 7 days for visual bar chart
  const { days, todayStr, maxMinutes } = useMemo(() => {
    return getRecentDays(stats.dailyActivity);
  }, [stats.dailyActivity]);

  if (!isOpen) return null;

  // Convert total minutes to hours and minutes
  const totalHours = Math.floor(stats.totalFocusMinutes / 60);
  const remainingMinutes = stats.totalFocusMinutes % 60;
  const timeFormatted = totalHours > 0 ? `${totalHours}h ${remainingMinutes}m` : `${remainingMinutes}m`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className={`relative w-full max-w-lg max-h-[85vh] flex flex-col rounded-3xl p-6 shadow-2xl transition-all duration-300 ${
          isDark
            ? 'bg-[#140a12]/95 border border-pink-500/25 text-white shadow-2xl shadow-pink-950/60'
            : 'bg-white/95 border border-pink-200 text-pink-950 shadow-pink-200/50'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-pink-500/20 mb-4">
          <div className="flex items-center space-x-2.5">
            <div
              className={`p-2 rounded-xl ${
                isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600'
              }`}
            >
              <Flame size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Focus Statistics</h3>
              <p className={`text-xs ${isDark ? 'text-pink-300/60' : 'text-pink-900/60'}`}>
                {currentUser ? `Account: ${currentUser.name}` : 'Local Guest Session'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? 'hover:bg-white/10 text-pink-200/70 hover:text-pink-100' : 'hover:bg-pink-100 text-pink-800'
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Sign in reminder banner if not signed in */}
          {!currentUser && (
            <div className={`p-3.5 rounded-2xl flex items-center justify-between text-xs ${
              isDark ? 'bg-pink-950/40 border border-pink-500/30 text-pink-200' : 'bg-pink-100/70 border border-pink-200 text-pink-900'
            }`}>
              <span>Sign in to keep your stats saved permanently!</span>
              <button
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="px-3 py-1.5 rounded-xl font-bold transition-colors bg-pink-600 hover:bg-pink-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.3)]"
              >
                Sign In
              </button>
            </div>
          )}

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Streak */}
            <div className={`p-3.5 rounded-2xl flex flex-col items-center justify-center text-center ${
              isDark ? 'bg-white/[0.04] border border-pink-500/15' : 'bg-pink-50 border border-pink-100'
            }`}>
              <Flame size={20} className="text-orange-400 mb-1" />
              <span className="text-xl font-bold">{stats.streakDays}</span>
              <span className={`text-[11px] font-medium ${isDark ? 'text-pink-300/50' : 'text-pink-900/50'}`}>Day Streak</span>
            </div>

            {/* Total Focus Time */}
            <div className={`p-3.5 rounded-2xl flex flex-col items-center justify-center text-center ${
              isDark ? 'bg-white/[0.04] border border-pink-500/15' : 'bg-pink-50 border border-pink-100'
            }`}>
              <Clock size={20} className="text-pink-400 mb-1" />
              <span className="text-xl font-bold">{timeFormatted}</span>
              <span className={`text-[11px] font-medium ${isDark ? 'text-pink-300/50' : 'text-pink-900/50'}`}>Total Time</span>
            </div>

            {/* Completed Sessions */}
            <div className={`p-3.5 rounded-2xl flex flex-col items-center justify-center text-center ${
              isDark ? 'bg-white/[0.04] border border-pink-500/15' : 'bg-pink-50 border border-pink-100'
            }`}>
              <Award size={20} className="text-pink-400 mb-1" />
              <span className="text-xl font-bold">{stats.completedFocusSessions}</span>
              <span className={`text-[11px] font-medium ${isDark ? 'text-pink-300/50' : 'text-pink-900/50'}`}>Sessions</span>
            </div>

            {/* Completed Tasks */}
            <div className={`p-3.5 rounded-2xl flex flex-col items-center justify-center text-center ${
              isDark ? 'bg-white/[0.04] border border-pink-500/15' : 'bg-pink-50 border border-pink-100'
            }`}>
              <CheckCircle size={20} className="text-emerald-400 mb-1" />
              <span className="text-xl font-bold">{stats.completedTasksCount}</span>
              <span className={`text-[11px] font-medium ${isDark ? 'text-pink-300/50' : 'text-pink-900/50'}`}>Tasks Done</span>
            </div>
          </div>

          {/* Weekly Activity Bar Chart */}
          <div className={`p-4 rounded-2xl ${isDark ? 'bg-white/[0.04] border border-pink-500/15' : 'bg-pink-50/70 border border-pink-100'}`}>
            <div className="flex items-center space-x-2 mb-3">
              <Calendar size={15} className={isDark ? 'text-pink-400' : 'text-pink-600'} />
              <h4 className="text-xs font-bold uppercase tracking-wider">Last 7 Days (Minutes Focused)</h4>
            </div>

            <div className="flex items-end justify-between h-28 pt-4 px-2">
              {days.map((d) => {
                const heightPercent = Math.max(8, Math.round((d.minutes / maxMinutes) * 100));
                const isToday = d.dateStr === todayStr;

                return (
                  <div key={d.dateStr} className="flex flex-col items-center flex-1 group">
                    <span className="text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity mb-1 text-pink-300">
                      {d.minutes}m
                    </span>
                    <div className="w-6 sm:w-8 h-20 bg-white/5 rounded-t-lg flex items-end justify-center overflow-hidden">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-lg transition-all duration-500 ${
                          isToday
                            ? 'bg-pink-500 shadow-[0_0_10px_rgba(244,63,94,0.6)]'
                            : isDark
                              ? 'bg-pink-500/35 group-hover:bg-pink-500/70'
                              : 'bg-pink-300 group-hover:bg-pink-400'
                        }`}
                      />
                    </div>
                    <span className={`text-[11px] mt-1.5 font-medium ${
                      isToday
                        ? isDark ? 'text-pink-400 font-bold' : 'text-pink-700 font-bold'
                        : isDark ? 'text-pink-300/50' : 'text-pink-900/50'
                    }`}>
                      {d.dayLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Session History Log */}
          <div className={`p-4 rounded-2xl ${isDark ? 'bg-white/[0.04] border border-pink-500/15' : 'bg-pink-50/70 border border-pink-100'}`}>
            <div className="flex items-center space-x-2 mb-3">
              <History size={15} className={isDark ? 'text-pink-400' : 'text-pink-600'} />
              <h4 className="text-xs font-bold uppercase tracking-wider">Recent Activity</h4>
            </div>

            {stats.history.length === 0 ? (
              <p className={`text-xs text-center py-4 ${isDark ? 'text-pink-300/40' : 'text-pink-900/50'}`}>
                Complete your first focus session to log history here!
              </p>
            ) : (
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {stats.history.slice(0, 8).map((item) => {
                  const date = new Date(item.date);
                  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-2 rounded-xl text-xs ${
                        isDark ? 'bg-white/[0.04] border border-pink-500/10' : 'bg-white border border-pink-100'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <span className={`w-2 h-2 rounded-full ${item.mode === 'focus' ? 'bg-pink-500' : 'bg-rose-400'}`} />
                        <span className="font-semibold capitalize text-pink-100">{item.mode === 'shortBreak' ? 'Short Break' : item.mode === 'longBreak' ? 'Long Break' : 'Focus'}</span>
                        {item.taskTitle && (
                          <span className={`truncate ${isDark ? 'text-pink-200/50' : 'text-pink-900/60'}`}>
                            — {item.taskTitle}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-3 shrink-0 ml-2 font-mono">
                        <span className="font-bold text-pink-300">{item.durationMinutes}m</span>
                        <span className={isDark ? 'text-pink-300/40' : 'text-pink-900/40'}>{timeStr}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
