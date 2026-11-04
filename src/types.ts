export type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

export type ThemeMode = 'bunny-pink' | 'light-aura' | 'dark-mesh' | 'matte-black';

export interface TimerSettings {
  focusMinutes: number; // default: 40
  shortBreakMinutes: number; // default: 10
  longBreakMinutes: number; // default: 20
  longBreakInterval: number; // default: 4
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  soundAlerts: boolean;
  soundVolume: number; // 0 to 1
  soundType: 'crystal' | 'bell' | 'marimba' | 'softBeep';
  tickSound: boolean;
  showBunnyMascot: boolean;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
  pomodoroCount: number;
}

export interface SessionHistoryItem {
  id: string;
  date: string; // ISO string
  mode: TimerMode;
  durationMinutes: number;
  taskTitle?: string;
}

export interface UserStats {
  totalFocusMinutes: number;
  completedFocusSessions: number;
  completedShortBreaks: number;
  completedLongBreaks: number;
  completedTasksCount: number;
  streakDays: number;
  lastActiveDate: string; // YYYY-MM-DD
  dailyActivity: Record<string, number>; // YYYY-MM-DD -> focus minutes
  history: SessionHistoryItem[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarSeed?: string;
  stats: UserStats;
}

export interface DocumentPictureInPictureOptions {
  width?: number;
  height?: number;
  disallowReturnToOpener?: boolean;
}

export interface DocumentPictureInPicture {
  requestWindow(options?: DocumentPictureInPictureOptions): Promise<Window>;
  window: Window | null;
  onenter: ((this: DocumentPictureInPicture, ev: Event) => unknown) | null;
}

declare global {
  interface Window {
    documentPictureInPicture?: DocumentPictureInPicture;
  }
}


