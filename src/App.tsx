import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  TimerMode,
  ThemeMode,
  TimerSettings,
  Task,
  UserStats,
  UserProfile
} from './types';
import { Header } from './components/Header';
import { Timer } from './components/Timer';
import { BottomBar } from './components/BottomBar';
import { TasksDrawer } from './components/TasksDrawer';
import { SettingsModal } from './components/SettingsModal';
import { StatsModal } from './components/StatsModal';
import { AuthModal } from './components/AuthModal';
import { AmbientSoundModal } from './components/AmbientSoundModal';
import { BoredModal } from './components/BoredModal';
import { MiffyTour } from './components/MiffyTour';
import { AuraBackground } from './components/AuraBackground';
import { soundEngine } from './utils/audio';
import {
  isFirebaseConfigured,
  onAuthUserChanged,
  mapFirebaseUserToProfile,
  signOutUser
} from './utils/firebase';
import {
  formatLocalDate,
  mergeUserStats,
  recoverAllAvailableStats,
  persistStatsBackup,
  calculateActualStreak,
  syncStreakWithActivity,
  getTodayCompletedFocusCount
} from './utils/stats';

const DEFAULT_SETTINGS: TimerSettings = {
  focusMinutes: 40,
  shortBreakMinutes: 10,
  longBreakMinutes: 20,
  longBreakInterval: 4,
  autoStartBreaks: true,
  autoStartFocus: false,
  soundAlerts: true,
  soundVolume: 0.7,
  soundType: 'crystal',
  tickSound: false,
  warningBell: true,
  taskSound: true,
  showBunnyMascot: true,
};

const DEFAULT_TASKS: Task[] = [
  { id: 't1', title: 'Deep work session 1', completed: false, createdAt: Date.now() - 300000, pomodoroCount: 1 },
  { id: 't2', title: 'Review lecture notes & flashcards', completed: false, createdAt: Date.now() - 200000, pomodoroCount: 1 },
  { id: 't3', title: 'Solve 3 problem sets', completed: false, createdAt: Date.now() - 100000, pomodoroCount: 0 },
];

const EMPTY_STATS: UserStats = {
  totalFocusMinutes: 0,
  completedFocusSessions: 0,
  completedShortBreaks: 0,
  completedLongBreaks: 0,
  completedTasksCount: 0,
  streakDays: 0,
  lastActiveDate: formatLocalDate(new Date()),
  dailyActivity: {},
  history: [],
};

export function App() {
  // Theme state: 'bunny-pink' (Strawberry Silk) is default
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('phokus_theme');
    const validThemes: ThemeMode[] = ['bunny-pink', 'light-aura', 'dark-mesh', 'matte-black'];
    if (saved && validThemes.includes(saved as ThemeMode)) {
      return saved as ThemeMode;
    }
    return 'bunny-pink';
  });

  // Settings state: default 40 / 10 / 20 mins
  const [settings, setSettings] = useState<TimerSettings>(() => {
    const saved = localStorage.getItem('phokus_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_SETTINGS, ...parsed, autoStartBreaks: true };
      } catch {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  // User Profile & Stats state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('phokus_active_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [stats, setStats] = useState<UserStats>(() => {
    let loaded: UserStats | null = null;
    if (currentUser?.stats) {
      loaded = currentUser.stats;
    } else {
      const saved = localStorage.getItem('phokus_guest_stats');
      if (saved) {
        try {
          loaded = JSON.parse(saved);
        } catch {
          loaded = null;
        }
      }
    }

    const recovered = recoverAllAvailableStats(loaded || undefined);
    if (recovered.totalFocusMinutes === 0 && Object.keys(recovered.dailyActivity).length === 0) {
      return syncStreakWithActivity(EMPTY_STATS);
    }
    return syncStreakWithActivity(recovered);
  });

  // Track current local calendar day so stars reset cleanly to 0 at midnight
  const [todayKey, setTodayKey] = useState<string>(() => formatLocalDate(new Date()));

  // Tasks state
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('phokus_tasks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_TASKS;
      }
    }
    return DEFAULT_TASKS;
  });

  // Active Task ID for two-way synchronization
  const [activeTaskId, setActiveTaskId] = useState<string | null>(() => {
    const saved = localStorage.getItem('phokus_active_task_id');
    if (saved) return saved;
    const initial = DEFAULT_TASKS.find(t => !t.completed);
    return initial ? initial.id : null;
  });

  // Get active task object
  const activeTask = tasks.find(t => t.id === activeTaskId && !t.completed)
    || tasks.find(t => !t.completed)
    || null;

  // Sync active task id to local storage
  useEffect(() => {
    if (activeTask) {
      localStorage.setItem('phokus_active_task_id', activeTask.id);
    } else {
      localStorage.removeItem('phokus_active_task_id');
    }
  }, [activeTask]);

  // Timer state
  const [mode, setMode] = useState<TimerMode>('focus');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [resetCount, setResetCount] = useState<number>(0);

  // Derive stars strictly from focus sessions completed today (0 default stars for all users)
  const completedTodayCount = useMemo(
    () => getTodayCompletedFocusCount(stats.history, todayKey),
    [stats.history, todayKey]
  );
  const cycleCount = completedTodayCount === 0
    ? 0
    : ((completedTodayCount - 1) % settings.longBreakInterval) + 1;

  // Modals state
  const [isTasksOpen, setIsTasksOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAmbientOpen, setIsAmbientOpen] = useState(false);
  const [isBoredOpen, setIsBoredOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Pause animations when hidden and refresh date key when returning across midnight
  useEffect(() => {
    const handleVisibilityChange = () => {
      document.documentElement.classList.toggle('tab-hidden', document.hidden);
      if (!document.hidden) {
        const currentKey = formatLocalDate(new Date());
        setTodayKey((prev) => (prev !== currentKey ? currentKey : prev));
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Sync theme changes with DOM
  useEffect(() => {
    localStorage.setItem('phokus_theme', theme);
    if (theme === 'dark-mesh' || theme === 'matte-black') {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
  }, [theme]);

  // Sync settings
  useEffect(() => {
    localStorage.setItem('phokus_settings', JSON.stringify(settings));
  }, [settings]);

  // Sync tasks
  useEffect(() => {
    localStorage.setItem('phokus_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Listen to Firebase auth state changes to persist session across reloads
  useEffect(() => {
    if (!isFirebaseConfigured) return;

    const unsubscribe = onAuthUserChanged((firebaseUser) => {
      if (firebaseUser) {
        const profile = mapFirebaseUserToProfile(firebaseUser);
        setCurrentUser(profile);
        setStats(prev => {
          const merged = mergeUserStats(prev, profile.stats);
          const updatedProfile = { ...profile, stats: merged };
          persistStatsBackup(merged);
          localStorage.setItem('phokus_active_user', JSON.stringify(updatedProfile));
          return merged;
        });
      } else {
        const saved = localStorage.getItem('phokus_active_user');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            // If active user was a Firebase user (not local_ or demo_), clear session
            if (parsed.id && !parsed.id.startsWith('demo_') && !parsed.id.startsWith('local_')) {
              setCurrentUser(null);
              localStorage.removeItem('phokus_active_user');
            }
          } catch {
            // ignore
          }
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync stats with user or local storage
  const updateStats = useCallback((updater: (prev: UserStats) => UserStats) => {
    setStats((prev) => {
      const updated = updater(prev);
      persistStatsBackup(updated);

      if (currentUser) {
        const updatedUser = { ...currentUser, stats: updated };
        setCurrentUser(updatedUser);
        localStorage.setItem('phokus_active_user', JSON.stringify(updatedUser));

        // Update accounts list
        const accountsStr = localStorage.getItem('phokus_accounts') || '[]';
        try {
          const accounts: UserProfile[] = JSON.parse(accountsStr);
          const idx = accounts.findIndex(a => a.id === updatedUser.id || (updatedUser.email && a.email.toLowerCase() === updatedUser.email.toLowerCase()));
          if (idx >= 0) {
            accounts[idx] = updatedUser;
          } else {
            accounts.push(updatedUser);
          }
          localStorage.setItem('phokus_accounts', JSON.stringify(accounts));
        } catch {
          // ignore
        }
      } else {
        localStorage.setItem('phokus_guest_stats', JSON.stringify(updated));
      }
      return updated;
    });
  }, [currentUser]);

  // Request notification permission on first interaction
  const requestNotifyPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  // Helper to switch modes
  const switchMode = useCallback((newMode: TimerMode, autoStart = false) => {
    soundEngine.unlockAudio();
    setMode(newMode);
    setIsRunning(autoStart);
  }, []);

  // Handle timer completion - PLAYS SOUND FOR BOTH FOCUS AND BREAK COMPLETION
  const handleSessionComplete = useCallback((extraMinutes: number = 0) => {
    // Play gentle chime whenever a focus session ends OR whenever a break ends
    soundEngine.unlockAudio();
    if (settings.soundAlerts) {
      soundEngine.playAlert(settings.soundType, settings.soundVolume);
    }

    // Browser Notification
    if ('Notification' in window && Notification.permission === 'granted') {
      const title = mode === 'focus' ? 'Focus Session Completed!' : 'Break Completed!';
      const body = mode === 'focus'
        ? 'Great job! Time to relax your mind with a gentle break.'
        : 'Feeling refreshed? Ready for your next focus session.';
      try {
        new Notification(title, { body, silent: true });
      } catch {
        // ignore
      }
    }

    const now = new Date();
    const today = formatLocalDate(now);
    const baseDurationMinutes = mode === 'focus'
      ? ((activeTask && activeTask.estimatedMinutes && activeTask.estimatedMinutes > 0) ? activeTask.estimatedMinutes : settings.focusMinutes)
      : mode === 'shortBreak'
        ? settings.shortBreakMinutes
        : settings.longBreakMinutes;
    const durationMinutes = baseDurationMinutes + (mode === 'focus' && extraMinutes > 0 ? extraMinutes : 0);

    // Record stats
    updateStats(prev => {
      const daily = { ...prev.dailyActivity };
      if (mode === 'focus') {
        daily[today] = (daily[today] || 0) + durationMinutes;
      }

      const newHistory = [
        {
          id: 'h_' + Date.now(),
          date: now.toISOString(),
          mode,
          durationMinutes,
          taskTitle: activeTask ? activeTask.title : undefined
        },
        ...prev.history
      ];

      // Calculate streak dynamically from actual daily activity
      let streakDays = prev.streakDays;
      if (mode === 'focus') {
        const { streak: computedStreak } = calculateActualStreak(daily, newHistory);
        if ((prev.streakDays || 0) > computedStreak) {
          if (prev.lastActiveDate !== today) {
            streakDays = (prev.streakDays || 0) + 1;
          }
        } else {
          streakDays = computedStreak;
        }
      }

      return {
        ...prev,
        totalFocusMinutes: prev.totalFocusMinutes + (mode === 'focus' ? durationMinutes : 0),
        completedFocusSessions: prev.completedFocusSessions + (mode === 'focus' ? 1 : 0),
        completedShortBreaks: prev.completedShortBreaks + (mode === 'shortBreak' ? 1 : 0),
        completedLongBreaks: prev.completedLongBreaks + (mode === 'longBreak' ? 1 : 0),
        streakDays,
        lastActiveDate: mode === 'focus' ? today : prev.lastActiveDate,
        dailyActivity: daily,
        history: newHistory
      };
    });

    setTodayKey((prev) => (prev !== today ? today : prev));

    // Advance session cycle: Break timer starts right after a focus session completes
    if (mode === 'focus') {
      const nextTodayTotal = getTodayCompletedFocusCount(stats.history, today) + 1;
      if (nextTodayTotal % settings.longBreakInterval === 0) {
        switchMode('longBreak', true);
      } else {
        switchMode('shortBreak', true);
      }
    } else {
      // Break is finished, go back to focus
      switchMode('focus', settings.autoStartFocus);
    }
  }, [mode, settings, stats.history, activeTask, switchMode, updateStats]);

  // Timer Action Handlers
  const handleTogglePlay = useCallback(() => {
    soundEngine.unlockAudio();
    requestNotifyPermission();
    setIsRunning(prev => !prev);
  }, []);

  const handleSkip = useCallback(() => {
    soundEngine.unlockAudio();
    if (mode === 'focus') {
      // Skipping an incomplete focus session does not award a star
      switchMode('shortBreak', true);
    } else {
      switchMode('focus', false);
    }
  }, [mode, switchMode]);

  const handleReset = useCallback(() => {
    soundEngine.unlockAudio();
    setIsRunning(false);
    setResetCount(c => c + 1);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        handleReset();
      } else if (e.code === 'KeyS') {
        e.preventDefault();
        handleSkip();
      } else if (e.key === 'Escape') {
        setIsTasksOpen(false);
        setIsSettingsOpen(false);
        setIsStatsOpen(false);
        setIsAuthOpen(false);
        setIsAmbientOpen(false);
        setIsBoredOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTogglePlay, handleReset, handleSkip]);

  // Task actions:
  // 1. Every newly added task is appended to the bottom (below previously added tasks)
  const handleAddTask = useCallback((title: string, estimatedMinutes?: number, deadline?: string) => {
    soundEngine.unlockAudio();
    const trimmedDeadline = deadline?.trim();
    const newTask: Task = {
      id: 'task_' + Date.now(),
      title,
      completed: false,
      createdAt: Date.now(),
      pomodoroCount: 0,
      estimatedMinutes: (estimatedMinutes && estimatedMinutes > 0) ? estimatedMinutes : undefined,
      deadline: trimmedDeadline || undefined,
    };
    setTasks(prev => [...prev, newTask]);
    setActiveTaskId(prev => prev || newTask.id);
  }, []);

  // Update or clear an existing task's deadline
  const handleUpdateTaskDeadline = useCallback((taskId: string, deadline?: string) => {
    const trimmedDeadline = deadline?.trim();
    setTasks(prev =>
      prev.map(t =>
        t.id === taskId ? { ...t, deadline: trimmedDeadline || undefined } : t
      )
    );
  }, []);

  // 2. When a task is marked complete, the task below it appears as current doing task
  const handleToggleTask = useCallback((taskId: string) => {
    soundEngine.unlockAudio();
    setTasks(prevTasks => {
      const taskIndex = prevTasks.findIndex(t => t.id === taskId);
      if (taskIndex === -1) return prevTasks;

      const currentTask = prevTasks[taskIndex];
      const willBeCompleted = !currentTask.completed;

      if (willBeCompleted) {
        updateStats(s => ({ ...s, completedTasksCount: s.completedTasksCount + 1 }));

        // If the task being completed is the currently active task
        setActiveTaskId(currentActiveId => {
          if (currentActiveId === taskId) {
            let nextTask: Task | undefined;
            for (let i = taskIndex + 1; i < prevTasks.length; i++) {
              if (!prevTasks[i].completed && prevTasks[i].id !== taskId) {
                nextTask = prevTasks[i];
                break;
              }
            }
            if (!nextTask) {
              for (let i = 0; i < taskIndex; i++) {
                if (!prevTasks[i].completed && prevTasks[i].id !== taskId) {
                  nextTask = prevTasks[i];
                  break;
                }
              }
            }
            return nextTask ? nextTask.id : null;
          }
          return currentActiveId;
        });
      } else {
        setActiveTaskId(taskId);
      }

      return prevTasks.map(t => t.id === taskId ? { ...t, completed: willBeCompleted } : t);
    });
  }, [updateStats]);

  // Delete task
  const handleDeleteTask = useCallback((taskId: string) => {
    soundEngine.unlockAudio();
    setTasks(prev => {
      const remaining = prev.filter(t => t.id !== taskId);
      setActiveTaskId(activeId => {
        if (activeId === taskId) {
          const nextAvailable = remaining.find(t => !t.completed);
          return nextAvailable ? nextAvailable.id : null;
        }
        return activeId;
      });
      return remaining;
    });
  }, []);

  // Select active task from drawer
  const handleSelectActiveTask = useCallback((taskId: string) => {
    soundEngine.unlockAudio();
    setActiveTaskId(taskId);
    setIsTasksOpen(false);
  }, []);

  // Reorder tasks
  const handleReorderTasks = useCallback((newTasks: Task[]) => {
    setTasks(newTasks);
  }, []);

  // Clear all tasks
  const handleClearAllTasks = useCallback(() => {
    soundEngine.unlockAudio();
    setTasks([]);
    setActiveTaskId(null);
  }, []);

  // Two-way sync: update active task title directly from main page
  const handleUpdateActiveTaskTitle = useCallback((newTitle: string, taskId?: string) => {
    setTasks(prev => {
      const targetId = taskId || activeTask?.id || activeTaskId || prev.find(t => !t.completed)?.id;
      if (!targetId) return prev;
      return prev.map(t => t.id === targetId ? { ...t, title: newTitle } : t);
    });
  }, [activeTask?.id, activeTaskId]);

  // Mark active task complete directly from main page checkbox
  const handleCompleteActiveTask = useCallback((taskId?: string) => {
    const targetId = taskId || activeTask?.id || activeTaskId;
    if (targetId) {
      handleToggleTask(targetId);
    }
  }, [activeTask?.id, activeTaskId, handleToggleTask]);

  // Create active task directly from main page input
  const handleCreateActiveTask = useCallback((title: string) => {
    handleAddTask(title);
  }, [handleAddTask]);

  // Auth actions
  const handleSignIn = useCallback((user: UserProfile) => {
    setStats((prev) => {
      const merged = mergeUserStats(prev, user.stats);
      const updatedUser = { ...user, stats: merged };
      setCurrentUser(updatedUser);
      persistStatsBackup(merged);
      localStorage.setItem('phokus_active_user', JSON.stringify(updatedUser));
      return merged;
    });
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await signOutUser();
    } catch {
      // ignore
    }
    setCurrentUser(null);
    localStorage.removeItem('phokus_active_user');
  }, []);

  // Settings save handler
  const handleSaveSettings = useCallback((newSettings: TimerSettings) => {
    setSettings(newSettings);
  }, []);

  // Update streak directly (allows user to correct or set actual streak)
  const handleUpdateStreak = useCallback((newStreak: number) => {
    updateStats(prev => ({
      ...prev,
      streakDays: Math.max(0, newStreak),
      lastActiveDate: formatLocalDate(new Date()),
    }));
  }, [updateStats]);

  // Toggle Theme (cycles through Strawberry Silk -> Light Aura -> Dark Aura -> Matte Black)
  const handleToggleTheme = useCallback(() => {
    soundEngine.unlockAudio();
    setTheme(prev =>
      prev === 'bunny-pink'
        ? 'light-aura'
        : prev === 'light-aura'
          ? 'dark-mesh'
          : prev === 'dark-mesh'
            ? 'matte-black'
            : 'bunny-pink'
    );
  }, []);

  // Direct theme selection
  const handleSelectTheme = useCallback((newTheme: ThemeMode) => {
    soundEngine.unlockAudio();
    setTheme(newTheme);
  }, []);

  const uncompletedTaskCount = useMemo(() => tasks.filter(t => !t.completed).length, [tasks]);

  const handleToggleTasks = useCallback(() => {
    soundEngine.unlockAudio();
    setIsTasksOpen(prev => !prev);
  }, []);

  const handleToggleAmbient = useCallback(() => {
    soundEngine.unlockAudio();
    setIsAmbientOpen(prev => !prev);
  }, []);

  const handleOpenBored = useCallback(() => {
    soundEngine.unlockAudio();
    setIsBoredOpen(true);
  }, []);

  const handleOpenGuide = useCallback(() => {
    soundEngine.unlockAudio();
    setIsGuideOpen(true);
  }, []);

  const handleOpenStats = useCallback(() => {
    soundEngine.unlockAudio();
    setIsStatsOpen(true);
  }, []);

  const handleOpenAuth = useCallback(() => {
    soundEngine.unlockAudio();
    setIsAuthOpen(true);
  }, []);

  const handleOpenSettings = useCallback(() => {
    soundEngine.unlockAudio();
    setIsSettingsOpen(true);
  }, []);

  const handleCloseTasks = useCallback(() => setIsTasksOpen(false), []);
  const handleCloseSettings = useCallback(() => setIsSettingsOpen(false), []);
  const handleCloseStats = useCallback(() => setIsStatsOpen(false), []);
  const handleCloseAuth = useCallback(() => setIsAuthOpen(false), []);
  const handleCloseAmbient = useCallback(() => setIsAmbientOpen(false), []);
  const handleCloseBored = useCallback(() => setIsBoredOpen(false), []);
  const handleCloseGuide = useCallback(() => setIsGuideOpen(false), []);

  return (
    <div
      className={`min-h-screen w-full flex flex-col justify-between relative overflow-hidden transition-all duration-700 ${theme === 'dark-mesh' || theme === 'matte-black' ? 'text-white' : 'text-pink-950'
        }`}
    >
      {/* Dynamic Smooth Aura Gradient with Film Grain (Matching Images 1 & 2) */}
      <AuraBackground theme={theme} />

      {/* Top Header */}
      <Header theme={theme} />

      {/* Main Center Area: Timer with Checkbox & Editable Active Task */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 w-full">
        <Timer
          mode={mode}
          isRunning={isRunning}
          resetCount={resetCount}
          activeTask={activeTask}
          cycleCount={cycleCount}
          completedTodayCount={completedTodayCount}
          settings={settings}
          theme={theme}
          onModeChange={(m) => switchMode(m, false)}
          onTogglePlay={handleTogglePlay}
          onSkip={handleSkip}
          onReset={handleReset}
          onSessionComplete={handleSessionComplete}
          onCompleteActiveTask={handleCompleteActiveTask}
          onUpdateActiveTaskTitle={handleUpdateActiveTaskTitle}
          onCreateActiveTask={handleCreateActiveTask}
          onUpdateTaskDeadline={handleUpdateTaskDeadline}
        />
      </main>

      {/* Bottom Bar */}
      <BottomBar
        theme={theme}
        taskCount={uncompletedTaskCount}
        stats={stats}
        currentUser={currentUser}
        onToggleTasks={handleToggleTasks}
        onToggleAmbient={handleToggleAmbient}
        onOpenBored={handleOpenBored}
        onOpenGuide={handleOpenGuide}
        onToggleTheme={handleToggleTheme}
        onSelectTheme={handleSelectTheme}
        onOpenStats={handleOpenStats}
        onOpenAuth={handleOpenAuth}
        onOpenSettings={handleOpenSettings}
      />

      {/* Modals & Drawers */}
      <TasksDrawer
        isOpen={isTasksOpen}
        tasks={tasks}
        activeTaskId={activeTask ? activeTask.id : null}
        theme={theme}
        defaultFocusMinutes={settings.focusMinutes}
        onClose={handleCloseTasks}
        onAddTask={handleAddTask}
        onToggleTask={handleToggleTask}
        onDeleteTask={handleDeleteTask}
        onClearAll={handleClearAllTasks}
        onSelectActiveTask={handleSelectActiveTask}
        onReorderTasks={handleReorderTasks}
        onUpdateTaskDeadline={handleUpdateTaskDeadline}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        theme={theme}
        onClose={handleCloseSettings}
        onSaveSettings={handleSaveSettings}
        onThemeChange={setTheme}
      />

      <StatsModal
        isOpen={isStatsOpen}
        stats={stats}
        currentUser={currentUser}
        theme={theme}
        onClose={handleCloseStats}
        onOpenAuth={handleOpenAuth}
        onUpdateStreak={handleUpdateStreak}
      />

      <AuthModal
        isOpen={isAuthOpen}
        currentUser={currentUser}
        theme={theme}
        onClose={handleCloseAuth}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
      />

      <AmbientSoundModal
        isOpen={isAmbientOpen}
        theme={theme}
        onClose={handleCloseAmbient}
      />

      <BoredModal
        isOpen={isBoredOpen}
        theme={theme}
        onClose={handleCloseBored}
      />

      {/* Miffy Interactive Getting Started Walkthrough */}
      <MiffyTour
        isOpen={isGuideOpen}
        onClose={handleCloseGuide}
        theme={theme}
      />
    </div>
  );
}

export default App;
