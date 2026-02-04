import { LocalStorageDataStore } from './storage/LocalStorageDataStore';
import { UserRepository } from './UserRepository';
import { AnalyticsRepository } from './AnalyticsRepository';
import { DailyProgressRepository } from './DailyProgressRepository';
import { ClanRepository } from './ClanRepository';

const store = new LocalStorageDataStore();

export const userRepository = new UserRepository(store);
export const analyticsRepository = new AnalyticsRepository(store);
export const dailyProgressRepository = new DailyProgressRepository(store);
export const clanRepository = new ClanRepository(store);

export type { StorageEnvelope } from './BaseRepository';
