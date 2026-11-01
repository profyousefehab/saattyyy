import Dexie, { type Table } from 'dexie';

export interface WorkSession {
  id?: number;
  startedAt: number;
  endedAt: number | null;
}

export interface RateRecord {
  id?: number;
  effectiveFrom: number;
  piastresPerHour: number;
  note: string;
}

export interface LeaveRecord {
  id?: number;
  date: string;
}

export type SettingKey = 'dailyTargetMinutes' | 'plannedWorkdays' | 'leaveAllowance';
export type Settings = Record<SettingKey, number>;

export interface SettingRecord {
  key: SettingKey;
  value: number;
}

export const DEFAULT_SETTINGS: Settings = {
  dailyTargetMinutes: 420,
  plannedWorkdays: 26,
  leaveAllowance: 4,
};

export const DEFAULT_PIASTRES_PER_HOUR = 1500;

class SaatyDatabase extends Dexie {
  sessions!: Table<WorkSession, number>;
  rates!: Table<RateRecord, number>;
  leaves!: Table<LeaveRecord, number>;
  settings!: Table<SettingRecord, SettingKey>;

  constructor() {
    super('saaty');
    this.version(1).stores({
      sessions: '++id, startedAt',
      rates: '++id, effectiveFrom',
      leaves: '++id, &date',
      settings: 'key',
    });
    this.on('populate', async (tx) => {
      await tx.table<RateRecord, number>('rates').add({
        effectiveFrom: 0,
        piastresPerHour: DEFAULT_PIASTRES_PER_HOUR,
        note: 'السعر الأساسي',
      });
      await tx.table<SettingRecord, SettingKey>('settings').bulkAdd(
        (Object.keys(DEFAULT_SETTINGS) as SettingKey[]).map((key) => ({
          key,
          value: DEFAULT_SETTINGS[key],
        })),
      );
    });
  }
}

export const db = new SaatyDatabase();
