import { db, DEFAULT_SETTINGS, type LeaveRecord, type RateRecord, type SettingKey, type SettingRecord, type Settings, type WorkSession } from '@/lib/db';
import { toSettings } from '@/lib/repository';
import { AppError } from '@/lib/errors';

export const BACKUP_VERSION = 1;
export const LAST_BACKUP_STORAGE_KEY = 'saatty_last_backup_timestamp';

export interface BackupPayload {
  app: 'saatty';
  version: number;
  exportedAt: string;
  data: {
    sessions: WorkSession[];
    rates: RateRecord[];
    leaves: LeaveRecord[];
    settings: Settings;
  };
}

export interface ValidationSuccess {
  valid: true;
  payload: BackupPayload;
  summary: {
    sessionCount: number;
    rateCount: number;
    leaveCount: number;
  };
}

export interface ValidationFailure {
  valid: false;
  error: string;
}

export type ValidationResult = ValidationSuccess | ValidationFailure;

/**
 * Validate an unknown parsed JSON object to ensure it is a safe and well-formed Saatty backup.
 */
export function validateBackup(raw: unknown): ValidationResult {
  if (!raw || typeof raw !== 'object') {
    return { valid: false, error: 'الملف ليس بتنسيق JSON صالح' };
  }

  const obj = raw as Record<string, unknown>;

  // Check app identifier
  if (obj.app !== 'saatty') {
    return { valid: false, error: 'هذا الملف ليس نسخة احتياطية خاصة بتطبيق ساعاتي' };
  }

  // Check version
  if (typeof obj.version !== 'number' || obj.version < 1 || obj.version > BACKUP_VERSION) {
    return { valid: false, error: `إصدار النسخة الاحتياطية (${obj.version}) غير متوافق مع هذا التطبيق` };
  }

  // Check data container
  if (!obj.data || typeof obj.data !== 'object') {
    return { valid: false, error: 'بيانات النسخة الاحتياطية مفقودة أو غير صالحة' };
  }

  const data = obj.data as Record<string, unknown>;

  // Validate sessions
  if (!Array.isArray(data.sessions)) {
    return { valid: false, error: 'سجل جلسات العمل مفقود أو غير صالح' };
  }
  for (let i = 0; i < data.sessions.length; i++) {
    const s = data.sessions[i];
    if (!s || typeof s !== 'object') {
      return { valid: false, error: `جلسة العمل رقم ${i + 1} غير صالحة` };
    }
    const session = s as Record<string, unknown>;
    if (typeof session.startedAt !== 'number' || !Number.isFinite(session.startedAt) || session.startedAt <= 0) {
      return { valid: false, error: `وقت بدء جلسة العمل رقم ${i + 1} غير صالح` };
    }
    if (session.endedAt !== null && (typeof session.endedAt !== 'number' || !Number.isFinite(session.endedAt))) {
      return { valid: false, error: `وقت انتهاء جلسة العمل رقم ${i + 1} غير صالح` };
    }
  }

  // Validate rates
  if (!Array.isArray(data.rates)) {
    return { valid: false, error: 'سجل أسعار الساعة مفقود أو غير صالح' };
  }
  if (data.rates.length === 0) {
    return { valid: false, error: 'سجل الأسعار يجب أن يحتوي على سعر أساسي واحد على الأقل' };
  }
  for (let i = 0; i < data.rates.length; i++) {
    const r = data.rates[i];
    if (!r || typeof r !== 'object') {
      return { valid: false, error: `سجل السعر رقم ${i + 1} غير صالح` };
    }
    const rate = r as Record<string, unknown>;
    if (typeof rate.effectiveFrom !== 'number' || !Number.isFinite(rate.effectiveFrom) || rate.effectiveFrom < 0) {
      return { valid: false, error: `تاريخ بدء السعر رقم ${i + 1} غير صالح` };
    }
    if (typeof rate.piastresPerHour !== 'number' || !Number.isFinite(rate.piastresPerHour) || rate.piastresPerHour <= 0) {
      return { valid: false, error: `قيمة أجر الساعة في السجل رقم ${i + 1} غير صالحة` };
    }
  }

  // Validate leaves
  if (!Array.isArray(data.leaves)) {
    return { valid: false, error: 'سجل الإجازات مفقود أو غير صالح' };
  }
  for (let i = 0; i < data.leaves.length; i++) {
    const l = data.leaves[i];
    if (!l || typeof l !== 'object') {
      return { valid: false, error: `سجل الإجازة رقم ${i + 1} غير صالح` };
    }
    const leave = l as Record<string, unknown>;
    if (typeof leave.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(leave.date)) {
      return { valid: false, error: `تاريخ الإجازة رقم ${i + 1} غير صالح (المتوقع صيغة YYYY-MM-DD)` };
    }
  }

  // Validate settings
  if (!data.settings || typeof data.settings !== 'object') {
    return { valid: false, error: 'إعدادات التطبيق مفقودة أو غير صالحة' };
  }
  const settings = data.settings as Record<string, unknown>;
  const keys: SettingKey[] = ['dailyTargetMinutes', 'plannedWorkdays', 'leaveAllowance'];
  for (const key of keys) {
    if (typeof settings[key] !== 'number' || !Number.isFinite(settings[key]) || (settings[key] as number) < 0) {
      return { valid: false, error: `قيمة الإعداد "${key}" غير صالحة` };
    }
  }

  return {
    valid: true,
    payload: raw as BackupPayload,
    summary: {
      sessionCount: data.sessions.length,
      rateCount: data.rates.length,
      leaveCount: data.leaves.length,
    },
  };
}

/**
 * Fetch all data currently stored in IndexedDB.
 */
export async function getCurrentBackupPayload(): Promise<BackupPayload> {
  const [sessions, rates, leaves, settingRows] = await Promise.all([
    db.sessions.orderBy('startedAt').toArray(),
    db.rates.orderBy('effectiveFrom').toArray(),
    db.leaves.orderBy('date').toArray(),
    db.settings.toArray(),
  ]);

  return {
    app: 'saatty',
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      sessions,
      rates,
      leaves,
      settings: toSettings(settingRows, DEFAULT_SETTINGS),
    },
  };
}

/**
 * Export a complete JSON backup and trigger a file download.
 */
export async function exportBackupFile(filenamePrefix = 'saatty-backup'): Promise<BackupPayload> {
  const payload = await getCurrentBackupPayload();
  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().slice(0, 10);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filenamePrefix}-${dateStr}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  // Record last backup timestamp
  markBackupSuccess();

  return payload;
}

export function markBackupSuccess(): void {
  try {
    localStorage.setItem(LAST_BACKUP_STORAGE_KEY, String(Date.now()));
  } catch {
    // Ignore localStorage errors in restricted contexts
  }
}

export function getLastBackupTimestamp(): number | null {
  try {
    const raw = localStorage.getItem(LAST_BACKUP_STORAGE_KEY);
    if (!raw) return null;
    const ts = Number(raw);
    return Number.isFinite(ts) && ts > 0 ? ts : null;
  } catch {
    return null;
  }
}

/**
 * Restore data from a validated BackupPayload transactionally.
 * Before touching existing data, a safety backup is exported.
 */
export async function restoreBackup(
  payload: BackupPayload,
  options?: { skipSafetyDownload?: boolean },
): Promise<{ restoredSessions: number; restoredRates: number; restoredLeaves: number }> {
  // 1. Strict validation
  const validation = validateBackup(payload);
  if (!validation.valid) {
    throw new AppError(validation.error);
  }

  // 2. Safety backup export (unless explicitly skipped)
  if (!options?.skipSafetyDownload) {
    await exportBackupFile('saatty-safety-backup-before-restore');
  }

  // 3. Transactional restoration — if any write fails, everything rolls back
  await db.transaction('rw', [db.sessions, db.rates, db.leaves, db.settings], async () => {
    // Clear existing tables
    await db.sessions.clear();
    await db.rates.clear();
    await db.leaves.clear();
    await db.settings.clear();

    // Insert sessions (omit id to allow fresh autoincrement sequence, preserving order)
    const sessions = payload.data.sessions.map((s) => ({
      startedAt: s.startedAt,
      endedAt: s.endedAt,
    }));
    if (sessions.length > 0) {
      await db.sessions.bulkAdd(sessions);
    }

    // Insert rates
    const rates = payload.data.rates.map((r) => ({
      effectiveFrom: r.effectiveFrom,
      piastresPerHour: r.piastresPerHour,
      note: r.note || '',
    }));
    if (rates.length > 0) {
      await db.rates.bulkAdd(rates);
    }

    // Insert leaves
    const leaves = payload.data.leaves.map((l) => ({
      date: l.date,
    }));
    if (leaves.length > 0) {
      await db.leaves.bulkAdd(leaves);
    }

    // Insert settings
    const settingRows: SettingRecord[] = (Object.keys(payload.data.settings) as SettingKey[]).map((key) => ({
      key,
      value: payload.data.settings[key],
    }));
    await db.settings.bulkAdd(settingRows);
  });

  markBackupSuccess();

  return {
    restoredSessions: payload.data.sessions.length,
    restoredRates: payload.data.rates.length,
    restoredLeaves: payload.data.leaves.length,
  };
}

