import { useState, useEffect, useRef, useCallback } from 'react';
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
import { AuraBackground } from './components/AuraBackground';
import { soundEngine } from './utils/audio';

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
  showBunnyMascot: true,
};

const DEFAULT_TASKS: Task[] = [
  { id: 't1', title: 'Deep work session 1', completed: false, createdAt: Date.now() - 300000, pomodoroCount: 1 },
  { id: 't2', title: 'Review lecture notes & flashcards', completed: false, createdAt: Date.now() - 200000, pomodoroCount: 1 },
  { id: 't3', title: 'Solve 3 problem sets', completed: false, createdAt: Date.now() - 100000, pomodoroCount: 0 },
];

const INITIAL_STATS: UserStats = {
  totalFocusMinutes: 40,
  completedFocusSessions: 1,
  completedShortBreaks: 1,
  completedLongBreaks: 0,
  completedTasksCount: 1,
  streakDays: 3,
  lastActiveDate: new Date().toISOString().split('T')[0],
  dailyActivity: {
    [new Date().toISOString().split('T')[0]]: 40
  },
  history: [
    {
      id: 'init_1',
      date: new Date().toISOString(),
      mode: 'focus',
      durationMinutes: 40,
      taskTitle: 'Review lecture notes & flashcards'
    }
  ]
};

function calculateStreakStats(baseStats: UserStats): UserStats {
  const today = new Date().toISOString().split('T')[0];
  if (baseStats.lastActiveDate === today) return baseStats;

  const lastDate = new Date(baseStats.lastActiveDate);
  const currDate = new Date(today);
  const diffDays = Math.round((currDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));

  if (diffDays === 1) {
    return { ...baseStats, streakDays: baseStats.streakDays + 1, lastActiveDate: today };
  } else if (diffDays > 1) {
    return { ...baseStats, streakDays: 1, lastActiveDate: today };
  }
  return baseStats;
}

export function App() {
  // Theme state: 'bunny-pink' is default
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('phokus_theme');
    return (saved as ThemeMode) || 'bunny-pink';
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
    let loaded = INITIAL_STATS;
    if (currentUser?.stats) {
      loaded = currentUser.stats;
    } else {
      const saved = localStorage.getItem('phokus_guest_stats');
      if (saved) {
        try {
          loaded = JSON.parse(saved);
        } catch {
          loaded = INITIAL_STATS;
        }
      }
    }
    return calculateStreakStats(loaded);
  });

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
  const [timeLeft, setTimeLeft] = useState<number>(settings.focusMinutes * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [cycleCount, setCycleCount] = useState<number>(1);

  // Modals state
  const [isTasksOpen, setIsTasksOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAmbientOpen, setIsAmbientOpen] = useState(false);

  // Accurate timer reference
  const timerEndRef = useRef<number | null>(null);
  const lastTickSecond = useRef<number>(timeLeft);

  // Sync theme changes with DOM
  useEffect(() => {
    localStorage.setItem('phokus_theme', theme);
    if (theme === 'dark-mesh') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
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

  // Sync stats with user or local storage
  const updateStats = useCallback((updater: (prev: UserStats) => UserStats) => {
    setStats((prev) => {
      const updated = updater(prev);
      if (currentUser) {
        const updatedUser = { ...currentUser, stats: updated };
        setCurrentUser(updatedUser);
        localStorage.setItem('phokus_active_user', JSON.stringify(updatedUser));

        // Update accounts list
        const accountsStr = localStorage.getItem('phokus_accounts') || '[]';
        try {
          const accounts: UserProfile[] = JSON.parse(accountsStr);
          const idx = accounts.findIndex(a => a.id === updatedUser.id);
          if (idx >= 0) {
            accounts[idx] = updatedUser;
            localStorage.setItem('phokus_accounts', JSON.stringify(accounts));
          }
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
    const duration = (
      newMode === 'focus' 
        ? settings.focusMinutes 
        : newMode === 'shortBreak' 
          ? settings.shortBreakMinutes 
          : settings.longBreakMinutes
    ) * 60;
    setTimeLeft(duration);
    if (autoStart) {
      timerEndRef.current = Date.now() + duration * 1000;
    } else {
      timerEndRef.current = null;
    }
  }, [settings]);

  // Handle timer completion - PLAYS SOUND FOR BOTH FOCUS AND BREAK COMPLETION
  const handleSessionComplete = useCallback(() => {
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

    const today = new Date().toISOString().split('T')[0];
    const durationMinutes = mode === 'focus' 
      ? settings.focusMinutes 
      : mode === 'shortBreak' 
        ? settings.shortBreakMinutes 
        : settings.longBreakMinutes;

    // Record stats
    updateStats(prev => {
      const daily = { ...prev.dailyActivity };
      if (mode === 'focus') {
        daily[today] = (daily[today] || 0) + durationMinutes;
      }

      return {
        ...prev,
        totalFocusMinutes: prev.totalFocusMinutes + (mode === 'focus' ? durationMinutes : 0),
        completedFocusSessions: prev.completedFocusSessions + (mode === 'focus' ? 1 : 0),
        completedShortBreaks: prev.completedShortBreaks + (mode === 'shortBreak' ? 1 : 0),
        completedLongBreaks: prev.completedLongBreaks + (mode === 'longBreak' ? 1 : 0),
        dailyActivity: daily,
        history: [
          {
            id: 'h_' + Date.now(),
            date: new Date().toISOString(),
            mode: mode,
            durationMinutes: durationMinutes,
            taskTitle: activeTask ? activeTask.title : undefined
          },
          ...prev.history
        ]
      };
    });

    // Advance session cycle: Break timer starts right after a focus session
    if (mode === 'focus') {
      const nextCycle = cycleCount + 1;
      if (nextCycle > settings.longBreakInterval) {
        setCycleCount(0);
        switchMode('longBreak', true);
      } else {
        setCycleCount(nextCycle);
        switchMode('shortBreak', true);
      }
    } else {
      // Break is finished, go back to focus
      switchMode('focus', settings.autoStartFocus);
    }
  }, [mode, settings, cycleCount, activeTask, switchMode, updateStats]);

  // Timer Tick Interval
  useEffect(() => {
    if (!isRunning) {
      timerEndRef.current = null;
      return;
    }

    if (!timerEndRef.current) {
      timerEndRef.current = Date.now() + timeLeft * 1000;
    }

    const interval = setInterval(() => {
      const remainingMs = (timerEndRef.current || 0) - Date.now();
      const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));

      if (settings.tickSound && remainingSec !== lastTickSecond.current) {
        soundEngine.playTick();
        lastTickSecond.current = remainingSec;
      }

      if (remainingSec <= 0) {
        clearInterval(interval);
        setTimeLeft(0);
        handleSessionComplete();
      } else {
        setTimeLeft(remainingSec);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, settings.tickSound, handleSessionComplete]);

  // Update document title with remaining time
  useEffect(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const formatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    const modeLabel = mode === 'focus' ? 'Focus' : mode === 'shortBreak' ? 'Short Break' : 'Long Break';
    document.title = `${formatted} — ${modeLabel} | Phokus`;
  }, [timeLeft, mode]);

  // Timer Action Handlers
  const handleTogglePlay = () => {
    soundEngine.unlockAudio();
    requestNotifyPermission();
    if (!isRunning) {
      timerEndRef.current = Date.now() + timeLeft * 1000;
      setIsRunning(true);
    } else {
      setIsRunning(false);
      timerEndRef.current = null;
    }
  };

  const handleSkip = () => {
    soundEngine.unlockAudio();
    if (mode === 'focus') {
      const nextCycle = cycleCount + 1;
      if (nextCycle > settings.longBreakInterval) {
        setCycleCount(0);
        switchMode('longBreak', true);
      } else {
        setCycleCount(nextCycle);
        switchMode('shortBreak', true);
      }
    } else {
      switchMode('focus', false);
    }
  };

  const handleReset = () => {
    soundEngine.unlockAudio();
    setIsRunning(false);
    timerEndRef.current = null;
    const duration = (
      mode === 'focus' 
        ? settings.focusMinutes 
        : mode === 'shortBreak' 
          ? settings.shortBreakMinutes 
          : settings.longBreakMinutes
    ) * 60;
    setTimeLeft(duration);
  };

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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Task actions:
  // 1. Every newly added task is appended to the bottom (below previously added tasks)
  const handleAddTask = (title: string) => {
    soundEngine.unlockAudio();
    const newTask: Task = {
      id: 'task_' + Date.now(),
      title,
      completed: false,
      createdAt: Date.now(),
      pomodoroCount: 0
    };
    setTasks(prev => [...prev, newTask]); // Appends below previous tasks!
    if (!activeTaskId) {
      setActiveTaskId(newTask.id);
    }
  };

  // 2. When a task is marked complete, the task below it appears as current doing task
  const handleToggleTask = (taskId: string) => {
    soundEngine.unlockAudio();
    setTasks(prev => {
      const taskIndex = prev.findIndex(t => t.id === taskId);
      if (taskIndex === -1) return prev;
      const willBeCompleted = !prev[taskIndex].completed;

      if (willBeCompleted) {
        updateStats(s => ({ ...s, completedTasksCount: s.completedTasksCount + 1 }));

        // If the task being completed is the currently active task
        if (activeTaskId === taskId || !activeTaskId) {
          // Look for the next uncompleted task below it
          let nextTask: Task | undefined;
          for (let i = taskIndex + 1; i < prev.length; i++) {
            if (!prev[i].completed && prev[i].id !== taskId) {
              nextTask = prev[i];
              break;
            }
          }
          // If none below it, check from top
          if (!nextTask) {
            for (let i = 0; i < taskIndex; i++) {
              if (!prev[i].completed && prev[i].id !== taskId) {
                nextTask = prev[i];
                break;
              }
            }
          }
          setActiveTaskId(nextTask ? nextTask.id : null);
        }
      } else {
        // If uncompleting and no active task, set it as active
        if (!activeTaskId) {
          setActiveTaskId(taskId);
        }
      }

      return prev.map(t => t.id === taskId ? { ...t, completed: willBeCompleted } : t);
    });
  };

  // Delete task
  const handleDeleteTask = (taskId: string) => {
    soundEngine.unlockAudio();
    setTasks(prev => {
      const remaining = prev.filter(t => t.id !== taskId);
      if (activeTaskId === taskId) {
        const nextAvailable = remaining.find(t => !t.completed);
        setActiveTaskId(nextAvailable ? nextAvailable.id : null);
      }
      return remaining;
    });
  };

  // Select active task from drawer
  const handleSelectActiveTask = (taskId: string) => {
    soundEngine.unlockAudio();
    setActiveTaskId(taskId);
    setIsTasksOpen(false);
  };

  // Reorder tasks
  const handleReorderTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
  };

  // Two-way sync: update active task title directly from main page
  const handleUpdateActiveTaskTitle = (newTitle: string) => {
    if (!activeTaskId) return;
    setTasks(prev => prev.map(t => t.id === activeTaskId ? { ...t, title: newTitle } : t));
  };

  // Mark active task complete directly from main page checkbox
  const handleCompleteActiveTask = () => {
    if (activeTaskId) {
      handleToggleTask(activeTaskId);
    }
  };

  // Create active task directly from main page input
  const handleCreateActiveTask = (title: string) => {
    handleAddTask(title);
  };

  // Auth actions
  const handleSignIn = (user: UserProfile) => {
    setCurrentUser(user);
    setStats(user.stats);
    localStorage.setItem('phokus_active_user', JSON.stringify(user));
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    localStorage.removeItem('phokus_active_user');
  };

  // Settings save handler
  const handleSaveSettings = (newSettings: TimerSettings) => {
    setSettings(newSettings);
    if (!isRunning) {
      const duration = (
        mode === 'focus' 
          ? newSettings.focusMinutes 
          : mode === 'shortBreak' 
            ? newSettings.shortBreakMinutes 
            : newSettings.longBreakMinutes
      ) * 60;
      setTimeLeft(duration);
    }
  };

  // Toggle Theme (cycles through Light Aura -> Strawberry Silk -> Dark Aura)
  const handleToggleTheme = () => {
    soundEngine.unlockAudio();
    const nextTheme: ThemeMode = 
      theme === 'light-aura' 
        ? 'bunny-pink' 
        : theme === 'bunny-pink' 
          ? 'dark-mesh' 
          : 'light-aura';
    setTheme(nextTheme);
  };

  return (
    <div
      className={`min-h-screen w-full flex flex-col justify-between relative overflow-hidden transition-all duration-700 ${
        theme === 'dark-mesh' ? 'text-white' : 'text-pink-950'
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
          timeLeft={timeLeft}
          isRunning={isRunning}
          activeTask={activeTask}
          cycleCount={cycleCount}
          settings={settings}
          theme={theme}
          onModeChange={(m) => switchMode(m, false)}
          onTogglePlay={handleTogglePlay}
          onSkip={handleSkip}
          onReset={handleReset}
          onCompleteActiveTask={handleCompleteActiveTask}
          onUpdateActiveTaskTitle={handleUpdateActiveTaskTitle}
          onCreateActiveTask={handleCreateActiveTask}
        />
      </main>

      {/* Bottom Bar */}
      <BottomBar
        theme={theme}
        taskCount={tasks.filter(t => !t.completed).length}
        stats={stats}
        currentUser={currentUser}
        onToggleTasks={() => {
          soundEngine.unlockAudio();
          setIsTasksOpen(prev => !prev);
        }}
        onToggleAmbient={() => {
          soundEngine.unlockAudio();
          setIsAmbientOpen(prev => !prev);
        }}
        onToggleTheme={handleToggleTheme}
        onOpenStats={() => {
          soundEngine.unlockAudio();
          setIsStatsOpen(true);
        }}
        onOpenAuth={() => {
          soundEngine.unlockAudio();
          setIsAuthOpen(true);
        }}
        onOpenSettings={() => {
          soundEngine.unlockAudio();
          setIsSettingsOpen(true);
        }}
      />

      {/* Modals & Drawers */}
      <TasksDrawer
        isOpen={isTasksOpen}
        tasks={tasks}
        activeTaskId={activeTask ? activeTask.id : null}
        theme={theme}
        onClose={() => setIsTasksOpen(false)}
        onAddTask={handleAddTask}
        onToggleTask={handleToggleTask}
        onDeleteTask={handleDeleteTask}
        onSelectActiveTask={handleSelectActiveTask}
        onReorderTasks={handleReorderTasks}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        theme={theme}
        onClose={() => setIsSettingsOpen(false)}
        onSaveSettings={handleSaveSettings}
        onThemeChange={setTheme}
      />

      <StatsModal
        isOpen={isStatsOpen}
        stats={stats}
        currentUser={currentUser}
        theme={theme}
        onClose={() => setIsStatsOpen(false)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        currentUser={currentUser}
        theme={theme}
        onClose={() => setIsAuthOpen(false)}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
      />

      <AmbientSoundModal
        isOpen={isAmbientOpen}
        theme={theme}
        onClose={() => setIsAmbientOpen(false)}
      />
    </div>
  );
}

export default App;
