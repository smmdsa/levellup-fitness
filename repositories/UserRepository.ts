import { calculateNextLevelXP } from '../services/gameService';
import type { User } from '../types';
import type { DataStore } from './storage/DataStore';
import { BaseRepository } from './BaseRepository';

const USER_KEY = 'levelup_user';
const USER_VERSION = 2;

export const createDefaultUser = (): User => ({
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
    sessionsPerDay: 10,
    dayStartHour: 8,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  },
});

export class UserRepository extends BaseRepository<User> {
  constructor(store: DataStore) {
    super({
      key: USER_KEY,
      version: USER_VERSION,
      store,
      defaultValue: createDefaultUser,
      migrate: (data) => {
        const fallback = createDefaultUser();
        if (!data || typeof data !== 'object') {
          return fallback;
        }

        const legacy = data as User;
        const sessionsPerDayRaw = legacy?.settings?.sessionsPerDay;
        const sessionsPerDay = Number.isFinite(sessionsPerDayRaw)
          ? Math.max(1, Math.min(50, Math.floor(sessionsPerDayRaw as number)))
          : fallback.settings.sessionsPerDay;
        const dayStartHourRaw = legacy?.settings?.dayStartHour;
        const dayStartHour = Number.isFinite(dayStartHourRaw)
          ? Math.max(0, Math.min(23, Math.floor(dayStartHourRaw as number)))
          : fallback.settings.dayStartHour;
        const timeZoneRaw = legacy?.settings?.timeZone;
        const timeZone = typeof timeZoneRaw === 'string' && timeZoneRaw.trim().length > 0
          ? timeZoneRaw
          : fallback.settings.timeZone;

        return {
          ...fallback,
          ...legacy,
          profile: {
            ...fallback.profile,
            ...legacy.profile,
          },
          stats: {
            ...fallback.stats,
            ...legacy.stats,
          },
          settings: {
            ...fallback.settings,
            ...legacy.settings,
            sessionsPerDay,
            dayStartHour,
            timeZone,
          },
        };
      },
    });
  }
}
