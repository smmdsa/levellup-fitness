import type { AnalyticsData, WeightEntry } from '../types';
import type { DataStore } from './storage/DataStore';
import { BaseRepository } from './BaseRepository';

const ANALYTICS_KEY = 'levelup_history';
const ANALYTICS_VERSION = 2;

export const createDefaultAnalytics = (): AnalyticsData => ({
  history: [],
  totalReps: {
    push: 0,
    pull: 0,
    core: 0,
    legs: 0,
  },
  weightEntries: [],
});

const normalizeWeightEntries = (entries: unknown): WeightEntry[] => {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries
    .filter((entry): entry is WeightEntry => Boolean(entry) && typeof entry === 'object')
    .map((entry) => {
      const candidate = entry as WeightEntry;
      return {
        date: typeof candidate.date === 'string' ? candidate.date : '',
        weightKg: Number.isFinite(candidate.weightKg) ? candidate.weightKg : 0,
        note: typeof candidate.note === 'string' ? candidate.note : undefined,
      };
    })
    .filter((entry) => entry.date.length > 0 && entry.weightKg > 0);
};

export class AnalyticsRepository extends BaseRepository<AnalyticsData> {
  constructor(store: DataStore) {
    super({
      key: ANALYTICS_KEY,
      version: ANALYTICS_VERSION,
      store,
      defaultValue: createDefaultAnalytics,
      migrate: (data) => {
        const fallback = createDefaultAnalytics();
        if (!data || typeof data !== 'object') {
          return fallback;
        }

        const legacy = data as AnalyticsData;
        const totalReps = {
          push: Number.isFinite(legacy.totalReps?.push) ? legacy.totalReps.push : fallback.totalReps.push,
          pull: Number.isFinite(legacy.totalReps?.pull) ? legacy.totalReps.pull : fallback.totalReps.pull,
          core: Number.isFinite(legacy.totalReps?.core) ? legacy.totalReps.core : fallback.totalReps.core,
          legs: Number.isFinite(legacy.totalReps?.legs) ? legacy.totalReps.legs : fallback.totalReps.legs,
        };

        return {
          history: Array.isArray(legacy.history) ? legacy.history : fallback.history,
          totalReps,
          weightEntries: normalizeWeightEntries((legacy as AnalyticsData).weightEntries),
        };
      },
    });
  }
}
