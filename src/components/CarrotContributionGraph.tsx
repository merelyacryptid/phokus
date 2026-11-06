import React, { useState, useMemo } from 'react';
import type { ThemeMode } from '../types';
import { CarrotIcon } from './CarrotIcon';
import { Calendar } from 'lucide-react';

interface CarrotContributionGraphProps {
  dailyActivity: Record<string, number>; // dateStr -> minutes
  theme: ThemeMode;
}

interface DayCell {
  dateStr: string;
  formattedDate: string;
  dayOfWeek: number;
  minutes: number;
  hours: number;
  level: 0 | 1 | 2 | 3 | 4;
  isToday: boolean;
  isFuture: boolean;
}

interface WeekColumn {
  weekIndex: number;
  monthLabel?: string;
  days: DayCell[];
}

// Pure helper function defined outside the component to satisfy react(purity)
function buildContributionWeeks(dailyActivity: Record<string, number> = {}) {
  const safeDaily = dailyActivity || {};
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentDayOfWeek = now.getDay(); // 0 (Sun) to 6 (Sat)

  // End on the Saturday of this week
  const endOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (6 - currentDayOfWeek));

  const numWeeks = 14;
  // Start date is Sunday of 14 weeks ago
  const startDate = new Date(endOfWeek.getTime() - (numWeeks * 7 - 1) * 86400000);

  const weekCols: WeekColumn[] = [];
  let carrots = 0;
  let totalMinutes = 0;
  let lastSeenMonth = -1;

  for (let w = 0; w < numWeeks; w++) {
    const days: DayCell[] = [];
    let monthLabel: string | undefined = undefined;

    for (let d = 0; d < 7; d++) {
      const cellDate = new Date(startDate.getTime() + (w * 7 + d) * 86400000);
      const dateStr = cellDate.toISOString().split('T')[0];
      const minutes = safeDaily[dateStr] || 0;
      const hours = Number((minutes / 60).toFixed(1));

      const isToday = dateStr === todayStr;
      const isFuture = cellDate.getTime() > now.getTime() && !isToday;

      // Level calculation based on hours focused
      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (!isFuture && minutes > 0) {
        carrots += 1;
        totalMinutes += minutes;
        if (hours < 1.0) level = 1;
        else if (hours < 2.0) level = 2;
        else if (hours < 3.5) level = 3;
        else level = 4;
      }

      // Check for month label change on the 1st or middle day of the week
      const currentMonth = cellDate.getMonth();
      if (d === 0 && currentMonth !== lastSeenMonth) {
        lastSeenMonth = currentMonth;
        monthLabel = cellDate.toLocaleDateString('en-US', { month: 'short' });
      }

      days.push({
        dateStr,
        formattedDate: cellDate.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        dayOfWeek: d,
        minutes,
        hours,
        level,
        isToday,
        isFuture,
      });
    }

    weekCols.push({
      weekIndex: w,
      monthLabel,
      days,
    });
  }

  return {
    weeks: weekCols,
    totalCarrots: carrots,
    totalHoursInRange: Number((totalMinutes / 60).toFixed(1)),
  };
}

export const CarrotContributionGraph: React.FC<CarrotContributionGraphProps> = React.memo(({
  dailyActivity,
  theme,
}) => {
  const isMatteBlack = theme === 'matte-black';
  const isDark = theme === 'dark-mesh' || isMatteBlack;
  const [hoveredCell, setHoveredCell] = useState<DayCell | null>(null);

  // Purely tonal progression (from lightest shade Level 1 to darkest/deepest Level 4)
  const getCellClasses = (level: 0 | 1 | 2 | 3 | 4) => {
    if (isMatteBlack) {
      switch (level) {
        case 1:
          return 'bg-white/10 border border-white/15'; // Faintest
        case 2:
          return 'bg-white/25 border border-white/35'; // Medium light
        case 3:
          return 'bg-white/50 border border-white/60 shadow-[0_0_6px_rgba(255,255,255,0.25)]'; // Darker/crisp
        case 4:
          return 'bg-white/85 border border-white shadow-[0_0_10px_rgba(255,255,255,0.6)]'; // Pure solid white
        default:
          return 'bg-white/[0.03] border border-white/[0.06] hover:border-white/25';
      }
    }

    if (isDark) {
      switch (level) {
        case 1:
          // Lightest: soft, translucent peach-orange
          return 'bg-orange-500/15 border border-orange-400/25';
        case 2:
          // Medium light: warm golden amber
          return 'bg-orange-500/30 border border-orange-400/50';
        case 3:
          // Medium dark: rich deep orange
          return 'bg-orange-600/55 border border-orange-400/75 shadow-[0_0_6px_rgba(249,115,22,0.35)]';
        case 4:
          // Darkest / Highest harvest: intense bold burnt-orange
          return 'bg-orange-600/85 border border-orange-300 shadow-[0_0_10px_rgba(249,115,22,0.65)]';
        default:
          return 'bg-white/[0.04] border border-white/[0.06] hover:border-pink-400/40';
      }
    }

    // Light themes (bunny-pink & light-aura)
    switch (level) {
      case 1:
        // Lightest: pale delicate peach
        return 'bg-orange-100/70 border border-orange-200/90';
      case 2:
        // Medium light: warm golden orange
        return 'bg-orange-200/90 border border-orange-300';
      case 3:
        // Medium dark: rich vibrant orange
        return 'bg-orange-400/85 border border-orange-500 shadow-[0_0_6px_rgba(251,146,60,0.35)]';
      case 4:
        // Darkest: deep saturated roasted orange
        return 'bg-orange-600/90 border border-orange-700 shadow-[0_0_10px_rgba(234,88,12,0.45)]';
      default:
        return 'bg-pink-100/40 border border-pink-200/60 hover:border-pink-300';
    }
  };

  // Generate 14 weeks of GitHub-style contribution data
  const { weeks, totalCarrots, totalHoursInRange } = useMemo(() => {
    return buildContributionWeeks(dailyActivity);
  }, [dailyActivity]);

  return (
    <div
      className={`p-4 rounded-2xl select-none transition-all duration-200 ${
        isMatteBlack
          ? 'bg-neutral-900/60 border border-neutral-800'
          : isDark
            ? 'bg-white/[0.04] border border-pink-500/15'
            : 'bg-pink-50/80 border border-pink-100/90'
      }`}
    >
      {/* Header Info */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Calendar size={15} className={isDark ? 'text-pink-400' : 'text-pink-600'} />
          <h4 className="text-xs font-bold uppercase tracking-wider">
            Focus Harvest (Days Focused)
          </h4>
        </div>

        {/* Live Hover Status or Total Summary */}
        <div className="text-right">
          {hoveredCell ? (
            <div className="flex items-center space-x-1.5 text-xs font-medium">
              <span className={isDark ? 'text-pink-200' : 'text-pink-900'}>
                {hoveredCell.formattedDate}:
              </span>
              {hoveredCell.isFuture ? (
                <span className="opacity-50">Future</span>
              ) : hoveredCell.hours > 0 ? (
                <span className="font-bold text-orange-400 flex items-center space-x-1">
                  <span>{hoveredCell.hours} hrs</span>
                  <CarrotIcon size={13} level={hoveredCell.level || 1} />
                </span>
              ) : (
                <span className="opacity-50">0 hrs</span>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-xs">
              <span className="font-bold text-orange-400 flex items-center space-x-1">
                <span>{totalCarrots} carrots</span>
                <CarrotIcon size={13} level={2} />
              </span>
              <span className={`text-[11px] ${isDark ? 'text-pink-300/50' : 'text-pink-900/50'}`}>
                ({totalHoursInRange} hrs total)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* GitHub Style Heatmap Grid Container */}
      <div className="overflow-x-auto pb-1 scrollbar-thin">
        <div className="inline-flex flex-col min-w-max">
          {/* Month Labels Header */}
          <div className="flex ml-7 mb-1 text-[10px] font-semibold tracking-wide">
            {weeks.map((w, idx) => (
              <div
                key={idx}
                className="w-5 text-left text-pink-400/70"
                style={{ marginRight: '3px' }}
              >
                {w.monthLabel || ''}
              </div>
            ))}
          </div>

          {/* Grid Rows: 7 days of the week */}
          <div className="flex">
            {/* Day Labels on left (Mon, Wed, Fri) */}
            <div className="flex flex-col justify-between pr-2 text-[9px] font-semibold text-pink-300/50 py-0.5">
              <span className="h-5 leading-5 opacity-0">Sun</span>
              <span className="h-5 leading-5">Mon</span>
              <span className="h-5 leading-5 opacity-0">Tue</span>
              <span className="h-5 leading-5">Wed</span>
              <span className="h-5 leading-5 opacity-0">Thu</span>
              <span className="h-5 leading-5">Fri</span>
              <span className="h-5 leading-5 opacity-0">Sat</span>
            </div>

            {/* Weeks Columns */}
            <div className="flex gap-[3px]">
              {weeks.map((week) => (
                <div key={week.weekIndex} className="flex flex-col gap-[3px]">
                  {week.days.map((cell) => {
                    const hasCarrot = cell.hours > 0 && !cell.isFuture;

                    return (
                      <div
                        key={cell.dateStr}
                        onMouseEnter={() => setHoveredCell(cell)}
                        onMouseLeave={() => setHoveredCell(null)}
                        className={`w-5 h-5 rounded-[5px] flex items-center justify-center transition-all duration-150 cursor-pointer ${
                          cell.isFuture
                            ? 'opacity-20 pointer-events-none bg-white/[0.02]'
                            : hasCarrot
                              ? getCellClasses(cell.level)
                              : getCellClasses(0)
                        } ${
                          cell.isToday
                            ? isMatteBlack
                              ? 'ring-1.5 ring-white shadow-[0_0_6px_rgba(255,255,255,0.6)]'
                              : 'ring-1.5 ring-pink-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]'
                            : ''
                        }`}
                      >
                        {hasCarrot && (
                          <CarrotIcon
                            size={13}
                            level={cell.level || 1}
                            theme={theme}
                            className="transform transition-transform hover:scale-125"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend & Details Footer */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-pink-500/15 text-[11px]">
        <div className="flex items-center space-x-1.5 text-xs text-orange-400 font-medium">
          <CarrotIcon size={13} level={3} theme={theme} />
          <span>Each carrot = a day of deep focus</span>
        </div>

        {/* Legend: Strictly lighter to darker, all same size */}
        <div className="flex items-center space-x-1.5 text-[10px] opacity-75">
          <span>Less</span>
          {/* Level 0: Empty */}
          <div
            title="0 hrs"
            className={`w-3.5 h-3.5 rounded-[3px] flex items-center justify-center ${getCellClasses(0)}`}
          />
          {/* Level 1: Lightest */}
          <div
            title="< 1 hr (Lightest)"
            className={`w-3.5 h-3.5 rounded-[3px] flex items-center justify-center ${getCellClasses(1)}`}
          >
            <CarrotIcon size={10} level={1} theme={theme} />
          </div>
          {/* Level 2: Medium light */}
          <div
            title="1 - 2 hrs (Medium light)"
            className={`w-3.5 h-3.5 rounded-[3px] flex items-center justify-center ${getCellClasses(2)}`}
          >
            <CarrotIcon size={10} level={2} theme={theme} />
          </div>
          {/* Level 3: Medium dark */}
          <div
            title="2 - 3.5 hrs (Darker)"
            className={`w-3.5 h-3.5 rounded-[3px] flex items-center justify-center ${getCellClasses(3)}`}
          >
            <CarrotIcon size={10} level={3} theme={theme} />
          </div>
          {/* Level 4: Darkest */}
          <div
            title="3.5+ hrs (Darkest)"
            className={`w-3.5 h-3.5 rounded-[3px] flex items-center justify-center ${getCellClasses(4)}`}
          >
            <CarrotIcon size={10} level={4} theme={theme} />
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
});
