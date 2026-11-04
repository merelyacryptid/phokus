import React from 'react';
import type { UserStats, ThemeMode, UserProfile } from '../types';
import { Flame, Clock, CheckCircle, Award, X, History } from 'lucide-react';
import { CarrotContributionGraph } from './CarrotContributionGraph';

interface StatsModalProps {
  isOpen: boolean;
  stats: UserStats;
  currentUser: UserProfile | null;
  theme: ThemeMode;
  onClose: () => void;
  onOpenAuth: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  stats,
  currentUser,
  theme,
  onClose,
  onOpenAuth,
}) => {
  const isMatteBlack = theme === 'matte-black';
  const isDark = theme === 'dark-mesh' || isMatteBlack;

  if (!isOpen) return null;

  // Format total focus time in hours (with 1 decimal place)
  const totalHours = (stats.totalFocusMinutes / 60).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className={`relative w-full max-w-xl max-h-[88vh] flex flex-col rounded-3xl p-6 shadow-2xl transition-all duration-300 select-none ${
          isMatteBlack
            ? 'bg-[#0f0f12] border border-neutral-700/80 text-white shadow-2xl shadow-black/95'
            : isDark
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
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
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

          {/* Quick Stats Grid (Hours Focused) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Streak */}
            <div className={`p-3.5 rounded-2xl flex flex-col items-center justify-center text-center ${
              isDark ? 'bg-white/[0.04] border border-pink-500/15' : 'bg-pink-50 border border-pink-100'
            }`}>
              <Flame size={20} className="text-orange-400 mb-1" />
              <span className="text-xl font-bold">{stats.streakDays}</span>
              <span className={`text-[11px] font-medium ${isDark ? 'text-pink-300/50' : 'text-pink-900/50'}`}>Day Streak</span>
            </div>

            {/* Total Focus Time (in Hours) */}
            <div className={`p-3.5 rounded-2xl flex flex-col items-center justify-center text-center ${
              isDark ? 'bg-white/[0.04] border border-pink-500/15' : 'bg-pink-50 border border-pink-100'
            }`}>
              <Clock size={20} className="text-pink-400 mb-1" />
              <span className="text-xl font-bold">
                {totalHours} <span className="text-xs font-semibold opacity-75">hrs</span>
              </span>
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

          {/* GitHub Style Contribution Graph with Carrots */}
          <CarrotContributionGraph
            dailyActivity={stats.dailyActivity}
            theme={theme}
          />

          {/* Session History Log (Durations in Hours) */}
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
                  const itemHours = (item.durationMinutes / 60).toFixed(1);

                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-2 rounded-xl text-xs ${
                        isDark ? 'bg-white/[0.04] border border-pink-500/10' : 'bg-white border border-pink-100'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <span className={`w-2 h-2 rounded-full ${item.mode === 'focus' ? 'bg-pink-500' : 'bg-rose-400'}`} />
                        <span className="font-semibold capitalize text-pink-100">
                          {item.mode === 'shortBreak' ? 'Short Break' : item.mode === 'longBreak' ? 'Long Break' : 'Focus'}
                        </span>
                        {item.taskTitle && (
                          <span className={`truncate ${isDark ? 'text-pink-200/50' : 'text-pink-900/60'}`}>
                            — {item.taskTitle}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-3 shrink-0 ml-2 font-mono">
                        <span className="font-bold text-pink-300">{itemHours} hrs</span>
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
