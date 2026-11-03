import { db, type SettingRecord, type Settings, type SettingKey, type WorkSession } from '@/lib/db';
import { AppError } from '@/lib/errors';
import { addDaysToDateKey, cairoDateKey, wallTimeToMs } from '@/lib/time';

export interface RateInput {
  effectiveFrom: number;
  piastresPerHour: number;
  note: string;
}

async function ensureDbOpen(): Promise<void> {
  if (!db.isOpen()) {
    await db.open();
  }
}

function assertValidInterval(startedAt: number, endedAt: number) {
  if (endedAt <= startedAt) {
    throw new AppError('وقت المغادرة لازم يكون بعد وقت الوصول');
  }
  // Allow a tiny 1-second margin of clock drift between Date.now() calls
  if (endedAt > Date.now() + 1000) {
    throw new AppError('وقت المغادرة مينفعش يكون في المستقبل');
  }
}

async function assertNoOverlap(startedAt: number, endedAt: number, ignoreId?: number) {
  const overlap = await db.sessions
    .filter(
      (session) =>
        session.id !== ignoreId &&
        session.startedAt < endedAt &&
        (session.endedAt ?? Infinity) > startedAt,
    )
    .first();
  if (overlap) {
    throw new AppError('الوقت ده بيتقاطع مع يوم شغل تاني');
  }
}

/**
 * Retrieve the current open session directly from IndexedDB.
 */
export async function getActiveSession(): Promise<WorkSession | undefined> {
  await ensureDbOpen();
  const openSessions = await db.sessions.filter((s) => s.endedAt === null).toArray();
  if (openSessions.length === 0) return undefined;
  return openSessions.sort((a, b) => b.startedAt - a.startedAt)[0];
}

/**
 * Start a new work session.
 * Saves the session's exact startedAt timestamp immediately to IndexedDB.
 * Prevents creating duplicate active sessions.
 */
export async function startSession(startedAt: number): Promise<number> {
  await ensureDbOpen();
  const safeStartedAt = Math.min(startedAt, Date.now());

  return db.transaction('rw', db.sessions, async () => {
    const open = await db.sessions.filter((session) => session.endedAt === null).first();
    if (open) {
      throw new AppError('فيه يوم شغل مفتوح بالفعل');
    }
    const id = await db.sessions.add({ startedAt: safeStartedAt, endedAt: null });
    return id as number;
  });
}

/**
 * End an active work session.
 */
export async function endSession(id: number, endedAt: number): Promise<void> {
  await ensureDbOpen();
  await db.transaction('rw', db.sessions, async () => {
    const session = await db.sessions.get(id);
    if (!session || session.endedAt !== null) {
      throw new AppError('اليوم ده مش مفتوح');
    }
    assertValidInterval(session.startedAt, endedAt);
    await assertNoOverlap(session.startedAt, endedAt, id);
    await db.sessions.update(id, { endedAt });
  });
}

export async function updateSession(
  id: number,
  startedAt: number,
  endedAt: number | null,
): Promise<void> {
  await ensureDbOpen();
  await db.transaction('rw', [db.sessions, db.leaves], async () => {
    const session = await db.sessions.get(id);
    if (!session) {
      throw new AppError('اليوم ده مش موجود');
    }

    if (!Number.isFinite(startedAt) || startedAt <= 0) {
      throw new AppError('اكتب التاريخ والوقت كاملين');
    }

    if (startedAt > Date.now() + 1000) {
      throw new AppError('وقت الوصول مينفعش يكون في المستقبل');
    }

    const leave = await db.leaves.where('date').equals(cairoDateKey(startedAt)).first();
    if (leave) {
      throw new AppError('اليوم ده متسجل إجازة، مينفعش تسجله شغل');
    }

    if (endedAt === null) {
      // Editing an active session's start time
      await assertNoOverlap(startedAt, Date.now(), id);
      await db.sessions.update(id, { startedAt });
    } else {
      // Editing a completed session's start and end times
      if (!Number.isFinite(endedAt) || endedAt <= 0) {
        throw new AppError('اكتب التاريخ والوقت كاملين');
      }
      assertValidInterval(startedAt, endedAt);
      await assertNoOverlap(startedAt, endedAt, id);
      await db.sessions.update(id, { startedAt, endedAt });
    }
  });
}

export async function updateActiveSession(id: number, startedAt: number): Promise<void> {
  return updateSession(id, startedAt, null);
}

export async function addManualSession(startedAt: number, endedAt: number): Promise<void> {
  await ensureDbOpen();
  await db.transaction('rw', [db.sessions, db.leaves], async () => {
    assertValidInterval(startedAt, endedAt);
    await assertNoOverlap(startedAt, endedAt);
    const leave = await db.leaves.where('date').equals(cairoDateKey(startedAt)).first();
    if (leave) {
      throw new AppError('اليوم ده متسجل إجازة، مينفعش تسجله شغل');
    }
    await db.sessions.add({ startedAt, endedAt });
  });
}

export async function deleteSession(id: number): Promise<void> {
  await ensureDbOpen();
  await db.sessions.delete(id);
}

async function assertRateStartIsFree(effectiveFrom: number, ignoreId?: number) {
  const clash = await db.rates.where('effectiveFrom').equals(effectiveFrom).first();
  if (clash && clash.id !== ignoreId) {
    throw new AppError('فيه سعر بيبدأ في اليوم ده بالفعل');
  }
}

export async function addRate(input: RateInput): Promise<void> {
  await ensureDbOpen();
  await db.transaction('rw', db.rates, async () => {
    await assertRateStartIsFree(input.effectiveFrom);
    await db.rates.add(input);
  });
}

export async function updateRate(id: number, input: RateInput): Promise<void> {
  await ensureDbOpen();
  await db.transaction('rw', db.rates, async () => {
    await assertRateStartIsFree(input.effectiveFrom, id);
    await db.rates.update(id, input);
  });
}

export async function addLeave(dateKey: string): Promise<void> {
  await ensureDbOpen();
  await db.transaction('rw', [db.leaves, db.sessions], async () => {
    const existing = await db.leaves.where('date').equals(dateKey).first();
    if (existing) {
      throw new AppError('الإجازة دي متسجلة قبل كده');
    }
    const dayStart = wallTimeToMs(dateKey, 0, 0);
    const dayEnd = wallTimeToMs(addDaysToDateKey(dateKey, 1), 0, 0);
    const worked = await db.sessions.where('startedAt').between(dayStart, dayEnd, true, false).count();
    if (worked > 0) {
      throw new AppError('فيه شغل متسجل في اليوم ده، مينفعش تسجله إجازة');
    }
    await db.leaves.add({ date: dateKey });
  });
}

export async function deleteLeave(id: number): Promise<void> {
  await ensureDbOpen();
  await db.leaves.delete(id);
}

export async function saveSettings(values: Settings): Promise<void> {
  await ensureDbOpen();
  const rows: SettingRecord[] = (Object.keys(values) as SettingKey[]).map((key) => ({
    key,
    value: values[key],
  }));
  await db.settings.bulkPut(rows);
}

export function toSettings(rows: SettingRecord[], defaults: Settings): Settings {
  const settings = { ...defaults };
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  return settings;
}
