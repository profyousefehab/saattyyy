import { toArabicDigits } from '@/lib/format';

const CAIRO_TIME_ZONE = 'Africa/Cairo';

const cairoFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: CAIRO_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const dayLabelFormatter = new Intl.DateTimeFormat('ar-EG', {
  timeZone: 'UTC',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

const monthLabelFormatter = new Intl.DateTimeFormat('ar-EG', {
  timeZone: 'UTC',
  month: 'long',
  year: 'numeric',
});

interface CairoParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

const pad2 = (value: number) => String(value).padStart(2, '0');

function cairoParts(timestamp: number): CairoParts {
  const values: Record<string, string> = {};
  for (const part of cairoFormatter.formatToParts(timestamp)) {
    values[part.type] = part.value;
  }
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour) % 24,
    minute: Number(values.minute),
  };
}

export function cairoDateKey(timestamp: number): string {
  const { year, month, day } = cairoParts(timestamp);
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export function cairoMonthKey(timestamp: number): string {
  return cairoDateKey(timestamp).slice(0, 7);
}

export function wallTimeToMs(dateKey: string, hour: number, minute: number): number {
  const wallTime = `${dateKey}T${pad2(hour)}:${pad2(minute)}:00`;
  const candidates = ['+02:00', '+03:00'].map((offset) => Date.parse(`${wallTime}${offset}`));
  const match = candidates.find((timestamp) => {
    const parts = cairoParts(timestamp);
    return cairoDateKey(timestamp) === dateKey && parts.hour === hour && parts.minute === minute;
  });
  return match ?? candidates[0];
}

export function addDaysToDateKey(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function shiftMonthKey(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}`;
}

export function formatClock(timestamp: number): string {
  const { hour, minute } = cairoParts(timestamp);
  const hour12 = hour % 12 || 12;
  const suffix = hour < 12 ? 'ص' : 'م';
  return `${toArabicDigits(`${hour12}:${pad2(minute)}`)} ${suffix}`;
}

export function formatTimeInputValue(timestamp: number): string {
  const { hour, minute } = cairoParts(timestamp);
  return `${pad2(hour)}:${pad2(minute)}`;
}

export function parseTimeInput(value: string): { hour: number; minute: number } {
  const [hour, minute] = value.split(':').map(Number);
  return { hour, minute };
}

export function formatDayLabel(dateKey: string): string {
  return dayLabelFormatter.format(new Date(`${dateKey}T12:00:00Z`));
}

export function formatMonthLabel(monthKey: string): string {
  return monthLabelFormatter.format(new Date(`${monthKey}-15T12:00:00Z`));
}

export function getGreeting(timestamp: number): string {
  const { hour } = cairoParts(timestamp);
  if (hour < 12) return 'صباح الخير';
  if (hour < 18) return 'مساء الخير';
  return 'مساء النور';
}
