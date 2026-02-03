import type { DataStore } from './DataStore';

export class LocalStorageDataStore implements DataStore {
  private readonly storage: Storage | null;

  constructor() {
    this.storage = typeof window !== 'undefined' ? window.localStorage : null;
  }

  getItem(key: string): string | null {
    if (!this.storage) return null;
    return this.storage.getItem(key);
  }

  setItem(key: string, value: string): void {
    if (!this.storage) return;
    this.storage.setItem(key, value);
  }

  removeItem(key: string): void {
    if (!this.storage) return;
    this.storage.removeItem(key);
  }
}
