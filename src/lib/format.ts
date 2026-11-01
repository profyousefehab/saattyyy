const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
const DECIMAL_SEPARATOR = '٫';
const THOUSANDS_SEPARATOR = '٬';

export function toArabicDigits(value: string | number): string {
  return String(value).replace(/[0-9]/g, (digit) => ARABIC_DIGITS[Number(digit)]);
}

export function parseArabicNumber(value: string): number {
  const normalized = value
    .trim()
    .replace(/[٠-٩]/g, (digit) => String(ARABIC_DIGITS.indexOf(digit)))
    .replace(/[,٫]/g, '.');
  return normalized === '' ? NaN : Number(normalized);
}

export function formatEgp(piastres: number): string {
  const sign = piastres < 0 ? '-' : '';
  const absolute = Math.abs(piastres);
  const pounds = Math.floor(absolute / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, THOUSANDS_SEPARATOR);
  const cents = String(absolute % 100).padStart(2, '0');
  return toArabicDigits(`${sign}${pounds}${DECIMAL_SEPARATOR}${cents}`);
}

export function formatDuration(durationMs: number): string {
  const totalMinutes = Math.floor(Math.max(0, durationMs) / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];
  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? 'ساعة' : hours === 2 ? 'ساعتين' : 'ساعات'}`);
  }
  if (minutes > 0 || hours === 0) {
    parts.push(`${minutes} دقيقة`);
  }
  return toArabicDigits(parts.join(' و'));
}

export function formatTimer(durationMs: number): string {
  const totalSeconds = Math.floor(Math.max(0, durationMs) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number) => String(value).padStart(2, '0');
  return toArabicDigits(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
}

export function formatPercent(value: number): string {
  return `${toArabicDigits(value.toFixed(1).replace('.', DECIMAL_SEPARATOR))}٪`;
}
