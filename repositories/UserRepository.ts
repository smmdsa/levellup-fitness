import { calculateNextLevelXP } from '../services/gameService';
import type { User } from '../types';
import type { DataStore } from './storage/DataStore';
import { BaseRepository } from './BaseRepository';

const USER_KEY = 'levelup_user';
const USER_VERSION = 1;

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
  },
});

export class UserRepository extends BaseRepository<User> {
  constructor(store: DataStore) {
    super({
      key: USER_KEY,
      version: USER_VERSION,
      store,
      defaultValue: createDefaultUser,
    });
  }
}
