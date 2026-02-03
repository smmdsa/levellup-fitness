import type { AnalyticsData } from '../types';
import type { DataStore } from './storage/DataStore';
import { BaseRepository } from './BaseRepository';

const ANALYTICS_KEY = 'levelup_history';
const ANALYTICS_VERSION = 1;

export const createDefaultAnalytics = (): AnalyticsData => ({
  history: [],
  totalReps: {
    push: 0,
    pull: 0,
    core: 0,
    legs: 0,
  },
});

export class AnalyticsRepository extends BaseRepository<AnalyticsData> {
  constructor(store: DataStore) {
    super({
      key: ANALYTICS_KEY,
      version: ANALYTICS_VERSION,
      store,
      defaultValue: createDefaultAnalytics,
    });
  }
}
