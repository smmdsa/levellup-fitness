import { User, DailyProgress, AnalyticsData, HistoryEntry } from '../types';
import { calculateNextLevelXP } from './gameService';

const USER_KEY = 'levelup_user';
const DAILY_KEY = 'levelup_daily';
const HISTORY_KEY = 'levelup_history';

const INITIAL_USER: User = {
  profile: {
    username: 'Rookie',
    avatarUrl: 'https://picsum.photos/200',
    createdAt: new Date().toISOString(),
  },
  stats: {
    level: 1,
    currentXP: 0,
    nextLevelXP: calculateNextLevelXP(1),
    totalXP: 0,
    fitCoins: 0,
    currentStreak: 0,
    highestStreak: 0,
  },
  settings: {
    notificationsEnabled: false,
  }
};

const INITIAL_ANALYTICS: AnalyticsData = {
  history: [],
  totalReps: { push: 0, pull: 0, core: 0, legs: 0 }
};

export const loadUser = (): User => {
  const stored = localStorage.getItem(USER_KEY);
  return stored ? JSON.parse(stored) : INITIAL_USER;
};

export const saveUser = (user: User) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const loadHistory = (): AnalyticsData => {
  const stored = localStorage.getItem(HISTORY_KEY);
  return stored ? JSON.parse(stored) : INITIAL_ANALYTICS;
};

export const saveHistory = (data: AnalyticsData) => {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(data));
};

export const loadDailyProgress = (): DailyProgress => {
  const today = new Date().toISOString().split('T')[0];
  const stored = localStorage.getItem(DAILY_KEY);
  
  if (stored) {
    const parsed: DailyProgress = JSON.parse(stored);
    // If the stored date matches today, return it
    if (parsed.date === today) {
      // Ensure schedule exists for migration of old data
      if (!parsed.schedule) {
        parsed.schedule = [];
      }
      return parsed;
    }
    // If date is different, we handle archiving in the main App logic, 
    // but here we just return a fresh day if the date doesn't match
  }

  return {
    date: today,
    isCompleted: false,
    sessionsDone: 0,
    sessions: [],
    schedule: [] 
  };
};

export const saveDailyProgress = (progress: DailyProgress) => {
  localStorage.setItem(DAILY_KEY, JSON.stringify(progress));
};
