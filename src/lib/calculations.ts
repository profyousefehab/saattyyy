import type { LeaveRecord, RateRecord, Settings, WorkSession } from '@/lib/db';
import { cairoDateKey, cairoMonthKey, wallTimeToMs } from '@/lib/time';

export interface LedgerData {
  sessions: WorkSession[];
  rates: RateRecord[];
  leaves: LeaveRecord[];
  settings: Settings;
}

export interface DayEntry {
  session: WorkSession;
  dateKey: string;
  durationMs: number;
  earningsPiastres: number;
}

export interface DaySummary {
  workedMs: number;
  earningsPiastres: number;
  targetMs: number;
  targetPiastres: number;
  percent: number;
  remainingMs: number;
}

export interface MonthSummary {
  days: DayEntry[];
  workedMs: number;
  earningsPiastres: number;
  workedDayCount: number;
  targetPiastres: number;
  leaveUsed: number;
  leaveRemaining: number;
}

const MS_PER_HOUR = 3_600_000;

export function rateRecordAt(rates: RateRecord[], timestamp: number): RateRecord {
  let current = rates[0];
  for (const rate of rates) {
    if (rate.effectiveFrom <= timestamp) {
      current = rate;
    } else {
      break;
    }
  }
  return current;
}

export function sessionDurationMs(session: WorkSession, now: number): number {
  return Math.max(0, (session.endedAt ?? now) - session.startedAt);
}

export interface RateSegment {
  startedAt: number;
  endedAt: number;
  piastresPerHour: number;
  earningsPiastres: number;
}

export function sessionRateSegments(session: WorkSession, rates: RateRecord[], now: number): RateSegment[] {
  const start = session.startedAt;
  const end = session.endedAt ?? now;
  if (end <= start) return [];

  const cuts = rates.map((rate) => rate.effectiveFrom).filter((time) => time > start && time < end);
  const points = [start, ...cuts, end];

  const segments: RateSegment[] = [];
  for (let index = 0; index < points.length - 1; index++) {
    const from = points[index];
    const to = points[index + 1];
    const piastresPerHour = rateRecordAt(rates, from).piastresPerHour;
    segments.push({
      startedAt: from,
      endedAt: to,
      piastresPerHour,
      earningsPiastres: Math.round(((to - from) * piastresPerHour) / MS_PER_HOUR),
    });
  }
  return segments;
}

export function sessionEarningsPiastres(session: WorkSession, rates: RateRecord[], now: number): number {
  return sessionRateSegments(session, rates, now).reduce((sum, segment) => sum + segment.earningsPiastres, 0);
}

export function findActiveSession(sessions: WorkSession[]): WorkSession | undefined {
  return sessions.find((session) => session.endedAt === null);
}

export function findStaleSession(sessions: WorkSession[], todayKey: string): WorkSession | undefined {
  const active = findActiveSession(sessions);
  return active && cairoDateKey(active.startedAt) !== todayKey ? active : undefined;
}

export function summarizeDay(data: LedgerData, dateKey: string, now: number): DaySummary {
  const daySessions = data.sessions.filter((session) => cairoDateKey(session.startedAt) === dateKey);
  const workedMs = daySessions.reduce((sum, session) => sum + sessionDurationMs(session, now), 0);
  const earningsPiastres = daySessions.reduce(
    (sum, session) => sum + sessionEarningsPiastres(session, data.rates, now),
    0,
  );
  const targetMs = data.settings.dailyTargetMinutes * 60_000;
  const rate = rateRecordAt(data.rates, now).piastresPerHour;
  const targetPiastres = Math.round((data.settings.dailyTargetMinutes / 60) * rate);
  return {
    workedMs,
    earningsPiastres,
    targetMs,
    targetPiastres,
    percent: targetMs > 0 ? (workedMs / targetMs) * 100 : 0,
    remainingMs: Math.max(0, targetMs - workedMs),
  };
}

export function summarizeMonth(data: LedgerData, monthKey: string, now: number): MonthSummary {
  const days: DayEntry[] = data.sessions
    .filter((session) => cairoMonthKey(session.startedAt) === monthKey)
    .map((session) => ({
      session,
      dateKey: cairoDateKey(session.startedAt),
      durationMs: sessionDurationMs(session, now),
      earningsPiastres: sessionEarningsPiastres(session, data.rates, now),
    }))
    .sort((a, b) => b.session.startedAt - a.session.startedAt);

  const workedMs = days.reduce((sum, day) => sum + day.durationMs, 0);
  const earningsPiastres = days.reduce((sum, day) => sum + day.earningsPiastres, 0);
  const workedDayCount = new Set(days.map((day) => day.dateKey)).size;

  const leaveUsed = data.leaves.filter((leave) => leave.date.startsWith(monthKey)).length;
  const leaveRemaining = Math.max(0, data.settings.leaveAllowance - leaveUsed);

  const monthStart = wallTimeToMs(`${monthKey}-01`, 0, 0);
  const rateTime = monthKey === cairoMonthKey(now) ? now : monthStart;
  const rate = rateRecordAt(data.rates, rateTime).piastresPerHour;
  const targetPiastres = Math.round(
    data.settings.plannedWorkdays * (data.settings.dailyTargetMinutes / 60) * rate,
  );

  return {
    days,
    workedMs,
    earningsPiastres,
    workedDayCount,
    targetPiastres,
    leaveUsed,
    leaveRemaining,
  };
}
