import type { DailyProgress } from '../types';
import { getTodayKey } from '../services/dateService';
import type { DataStore } from './storage/DataStore';
import { BaseRepository } from './BaseRepository';

const DAILY_KEY = 'levelup_daily';
const DAILY_VERSION = 1;

const getToday = (dayStartHour: number): string => getTodayKey(dayStartHour);

export const createDefaultDailyProgress = (date: string = getToday(0)): DailyProgress => ({
  date,
  isCompleted: false,
  sessionsDone: 0,
  sessions: [],
  schedule: [],
});

export class DailyProgressRepository extends BaseRepository<DailyProgress> {
  constructor(store: DataStore) {
    super({
      key: DAILY_KEY,
      version: DAILY_VERSION,
      store,
      defaultValue: () => createDefaultDailyProgress(),
    });
  }

  getToday(dayStartHour: number = 0): DailyProgress {
    const today = getToday(dayStartHour);
    const envelope = this.readEnvelope();

    if (!envelope) {
      const fallback = createDefaultDailyProgress(today);
      this.writeEnvelope(fallback);
      return fallback;
    }

    const daily = envelope.data as DailyProgress;
    if (!daily || daily.date !== today) {
      return createDefaultDailyProgress(today);
    }

    if (!daily.schedule) {
      const normalized: DailyProgress = { ...daily, schedule: [] };
      this.writeEnvelope(normalized);
      return normalized;
    }

    return daily;
  }
}
