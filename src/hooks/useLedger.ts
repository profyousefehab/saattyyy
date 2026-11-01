import { useLiveQuery } from 'dexie-react-hooks';
import { db, DEFAULT_SETTINGS } from '@/lib/db';
import type { LedgerData } from '@/lib/calculations';
import { toSettings } from '@/lib/repository';

export function useLedger(): LedgerData | undefined {
  return useLiveQuery(async (): Promise<LedgerData> => {
    const [sessions, rates, leaves, settingRows] = await Promise.all([
      db.sessions.orderBy('startedAt').toArray(),
      db.rates.orderBy('effectiveFrom').toArray(),
      db.leaves.orderBy('date').toArray(),
      db.settings.toArray(),
    ]);
    return { sessions, rates, leaves, settings: toSettings(settingRows, DEFAULT_SETTINGS) };
  }, []);
}
