import { calculateNextLevelXP } from '../services/gameService';
import type { User } from '../types';
import type { DataStore } from './storage/DataStore';
import { BaseRepository } from './BaseRepository';

const USER_KEY = 'levelup_user';
const USER_VERSION = 3;

const createUserId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `user_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
};

export const createDefaultUser = (): User => ({
  profile: {
    id: createUserId(),
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
  clan: {
    status: 'none',
    clanId: null,
    invitedClanId: null,
    invitedAt: null,
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

        const profileId = typeof legacy?.profile?.id === 'string' && legacy.profile.id.trim().length > 0
          ? legacy.profile.id
          : fallback.profile.id;
        const clanStatus = legacy?.clan?.status;
        const clanId = typeof legacy?.clan?.clanId === 'string' ? legacy.clan.clanId : null;
        const invitedClanId = typeof legacy?.clan?.invitedClanId === 'string' ? legacy.clan.invitedClanId : null;
        const invitedAt = typeof legacy?.clan?.invitedAt === 'string' ? legacy.clan.invitedAt : null;
        const normalizedStatus = clanStatus === 'leader' || clanStatus === 'member' || clanStatus === 'invited'
          ? clanStatus
          : 'none';

        return {
          ...fallback,
          ...legacy,
          profile: {
            ...fallback.profile,
            ...legacy.profile,
            id: profileId,
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
          clan: {
            status: normalizedStatus,
            clanId: normalizedStatus === 'member' || normalizedStatus === 'leader' ? clanId : null,
            invitedClanId: normalizedStatus === 'invited' ? invitedClanId : null,
            invitedAt: normalizedStatus === 'invited' ? invitedAt : null,
          },
        };
      },
    });
  }
}
