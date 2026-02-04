import type { ClanStore } from '../types';
import type { DataStore } from './storage/DataStore';
import { BaseRepository } from './BaseRepository';

const CLAN_KEY = 'levelup_clans';
const CLAN_VERSION = 1;

export const createDefaultClanStore = (): ClanStore => ({
  clans: [],
});

export class ClanRepository extends BaseRepository<ClanStore> {
  constructor(store: DataStore) {
    super({
      key: CLAN_KEY,
      version: CLAN_VERSION,
      store,
      defaultValue: createDefaultClanStore,
    });
  }
}
