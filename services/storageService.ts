import { User, DailyProgress, AnalyticsData } from '../types';
import { analyticsRepository, dailyProgressRepository, userRepository } from '../repositories';

export const loadUser = (): User => userRepository.get();

export const saveUser = (user: User) => {
  userRepository.set(user);
};

export const loadHistory = (): AnalyticsData => analyticsRepository.get();

export const saveHistory = (data: AnalyticsData) => {
  analyticsRepository.set(data);
};

export const loadDailyProgress = (dayStartHour: number = 0): DailyProgress =>
  dailyProgressRepository.getToday(dayStartHour);

export const saveDailyProgress = (progress: DailyProgress) => {
  dailyProgressRepository.set(progress);
};
