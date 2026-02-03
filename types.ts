export interface UserProfile {
  username: string;
  avatarUrl: string; // Using placeholder for now
  createdAt: string;
}

export interface UserStats {
  level: number;
  currentXP: number;
  nextLevelXP: number;
  totalXP: number;
  fitCoins: number;
  currentStreak: number;
  highestStreak: number;
}

export interface User {
  profile: UserProfile;
  stats: UserStats;
  settings: {
    notificationsEnabled: boolean;
    sessionsPerDay: number;
    dayStartHour: number;
    timeZone: string;
  };
}

export interface ExerciseItem {
  id: string;
  name: string;
  reps: string | number;
  completed: boolean;
}

export interface Session {
  sessionId: number;
  timestamp: string;
  exercises: ExerciseItem[];
}

export interface ScheduledSession {
  sessionId: number;
  targetTime: string; // ISO String
  notificationSent: boolean;
}

export interface DailyProgress {
  date: string; // ISO Date string YYYY-MM-DD
  isCompleted: boolean;
  sessionsDone: number;
  sessions: Session[];
  schedule: ScheduledSession[];
}

export interface HistoryEntry {
  date: string;
  sessionsDone: number;
  xpEarned: number;
}

export interface AnalyticsData {
  history: HistoryEntry[];
  totalReps: {
    push: number;
    pull: number;
    core: number;
    legs: number;
  };
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  STATS = 'STATS',
  PROFILE = 'PROFILE'
}
