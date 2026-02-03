import type { DataStore } from './storage/DataStore';

export interface StorageEnvelope<T> {
  version: number;
  updatedAt: string;
  data: T;
}

export type DefaultValue<T> = T | (() => T);
export type Migration<T> = (data: unknown, fromVersion: number) => T;
export type Validator<T> = (data: unknown) => data is T;

interface BaseRepositoryOptions<T> {
  key: string;
  version: number;
  store: DataStore;
  defaultValue: DefaultValue<T>;
  migrate?: Migration<T>;
  validate?: Validator<T>;
}

export class BaseRepository<T> {
  protected readonly key: string;
  protected readonly version: number;
  protected readonly store: DataStore;
  protected readonly defaultValue: DefaultValue<T>;
  protected readonly migrate?: Migration<T>;
  protected readonly validate?: Validator<T>;

  constructor(options: BaseRepositoryOptions<T>) {
    this.key = options.key;
    this.version = options.version;
    this.store = options.store;
    this.defaultValue = options.defaultValue;
    this.migrate = options.migrate;
    this.validate = options.validate;
  }

  get(): T {
    const envelope = this.readEnvelope();
    if (!envelope) {
      const fallback = this.resolveDefault();
      this.writeEnvelope(fallback);
      return fallback;
    }

    if (envelope.version !== this.version) {
      const migrated = this.tryMigrate(envelope.data, envelope.version);
      this.writeEnvelope(migrated);
      return migrated;
    }

    if (this.validate && !this.validate(envelope.data)) {
      const fallback = this.resolveDefault();
      this.writeEnvelope(fallback);
      return fallback;
    }

    return envelope.data;
  }

  getEnvelope(): StorageEnvelope<T> {
    const envelope = this.readEnvelope();
    if (envelope && envelope.version === this.version) {
      return envelope;
    }

    const fallback = this.resolveDefault();
    const next = this.toEnvelope(fallback);
    this.store.setItem(this.key, JSON.stringify(next));
    return next;
  }

  set(value: T): void {
    this.writeEnvelope(value);
  }

  update(updater: (current: T) => T): T {
    const current = this.get();
    const next = updater(current);
    this.writeEnvelope(next);
    return next;
  }

  clear(): void {
    this.store.removeItem(this.key);
  }

  protected readEnvelope(): StorageEnvelope<T> | null {
    const raw = this.store.getItem(this.key);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as StorageEnvelope<T> | T;
      if (parsed && typeof parsed === 'object' && 'data' in parsed && 'version' in parsed) {
        return parsed as StorageEnvelope<T>;
      }

      return this.legacyEnvelope(parsed as T);
    } catch {
      return null;
    }
  }

  protected writeEnvelope(value: T): void {
    const envelope = this.toEnvelope(value);
    this.store.setItem(this.key, JSON.stringify(envelope));
  }

  protected resolveDefault(): T {
    return typeof this.defaultValue === 'function'
      ? (this.defaultValue as () => T)()
      : this.defaultValue;
  }

  protected toEnvelope(value: T): StorageEnvelope<T> {
    return {
      version: this.version,
      updatedAt: new Date().toISOString(),
      data: value,
    };
  }

  protected legacyEnvelope(value: T): StorageEnvelope<T> {
    return {
      version: this.version,
      updatedAt: new Date().toISOString(),
      data: value,
    };
  }

  protected tryMigrate(data: unknown, fromVersion: number): T {
    if (this.migrate) {
      return this.migrate(data, fromVersion);
    }

    return this.resolveDefault();
  }
}
