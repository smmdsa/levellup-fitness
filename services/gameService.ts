import { UserStats, ExerciseItem } from '../types';

export const XP_PER_SESSION_BASE = 100;
export const XP_DAILY_BONUS = 500;
export const STREAK_BONUS_MULTIPLIER = 1.5;
export const STREAK_THRESHOLD_DAYS = 7;

/**
 * Calculates XP for a single session.
 * Formula: Base + (Level * 10)
 */
export const calculateSessionXP = (currentLevel: number): number => {
  return XP_PER_SESSION_BASE + (currentLevel * 10);
};

export const calculateNextLevelXP = (level: number): number => {
  return Math.floor(level * 1000 * 1.2);
};

export const processLevelUp = (stats: UserStats, addedXP: number): UserStats => {
  let { level, currentXP, nextLevelXP, totalXP, fitCoins } = stats;

  currentXP += addedXP;
  totalXP += addedXP;

  let leveledUp = false;

  while (currentXP >= nextLevelXP) {
    currentXP -= nextLevelXP;
    level++;
    nextLevelXP = calculateNextLevelXP(level);
    fitCoins += 100;
    leveledUp = true;
  }

  return {
    ...stats,
    level,
    currentXP,
    nextLevelXP,
    totalXP,
    fitCoins
  };
};

/**
 * Generates the default routine list based on session number.
 */
export const generateSessionRoutine = (sessionNumber: number): ExerciseItem[] => {
  const baseRoutine: ExerciseItem[] = [
    { id: '1', name: 'Pushups', reps: 10, completed: false },
    { id: '2', name: 'Situps', reps: 10, completed: false },
    { id: '3', name: 'Squats', reps: 10, completed: false },
    { id: '4', name: 'Plank', reps: '60s', completed: false },
  ];

  let extraName = 'Glute Bridges';
  if (sessionNumber % 2 !== 0) {
    extraName = 'Supermans';
  }

  baseRoutine.push({
    id: '5',
    name: extraName,
    reps: 10,
    completed: false
  });

  return baseRoutine;
};

export const getQuote = (level: number): string => {
  if (level < 5) return "Every rep is a step towards greatness.";
  if (level < 10) return "Discipline is doing what needs to be done, even if you don't want to.";
  if (level < 20) return "You are forging a new identity in the fires of effort.";
  return "You have become a legend. Inspire others.";
};
