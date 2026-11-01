import ExcelJS from 'exceljs';
import { sessionRateSegments, summarizeMonth, type LedgerData, type RateSegment } from '@/lib/calculations';
import { formatClock, formatDayLabel, formatMonthLabel } from '@/lib/time';

const MS_PER_HOUR = 3_600_000;
const HEADER_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF5F0' } };
const ACCENT_FONT: Partial<ExcelJS.Font> = { bold: true, color: { argb: 'FF245A40' } };
const MONEY_FORMAT = '#,##0.00';
const HOURS_FORMAT = '0.00';
const COLUMN_COUNT = 5;

export async function exportMonthReport(monthKey: string, ledger: LedgerData): Promise<void> {
  const now = Date.now();
  const summary = summarizeMonth(ledger, monthKey, now);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ساعاتي';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('تقرير الشهر', { views: [{ rightToLeft: true }] });
  sheet.columns = [{ width: 24 }, { width: 18 }, { width: 18 }, { width: 16 }, { width: 18 }];

  const monthLabel = formatMonthLabel(monthKey);
  sheet.mergeCells(1, 1, 1, COLUMN_COUNT);
  const title = sheet.getCell(1, 1);
  title.value = `ساعاتي - تقرير ${monthLabel}`;
  title.font = { bold: true, size: 16, color: { argb: 'FF1F2A24' } };
  title.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(1).height = 32;

  let row = 3;
  row = addSectionTitle(sheet, row, 'ملخص الشهر');
  const difference = summary.earningsPiastres - summary.targetPiastres;
  const summaryRows: [string, ExcelJS.CellValue, string?][] = [
    ['الهدف الشهري (جنيه)', summary.targetPiastres / 100, MONEY_FORMAT],
    ['إجمالي الأجر (جنيه)', summary.earningsPiastres / 100, MONEY_FORMAT],
    ['الفرق عن الهدف (جنيه)', difference / 100, MONEY_FORMAT],
    ['ساعات الشغل (ساعة)', summary.workedMs / MS_PER_HOUR, HOURS_FORMAT],
    ['أيام الشغل', summary.workedDayCount],
    ['الإجازات المستخدمة', summary.leaveUsed],
    ['الإجازات المتبقية', summary.leaveRemaining],
  ];
  for (const [label, value, format] of summaryRows) {
    sheet.getCell(row, 1).value = label;
    sheet.getCell(row, 1).font = { color: { argb: 'FF66716A' } };
    const valueCell = sheet.getCell(row, 2);
    valueCell.value = value;
    if (format) valueCell.numFmt = format;
    valueCell.font = { bold: true };
    row++;
  }
  row++;

  row = addSectionTitle(sheet, row, 'تفاصيل أيام الشغل');
  row = addHeaderRow(sheet, row, ['التاريخ', 'وقت الوصول', 'وقت المغادرة', 'المدة (ساعة)', 'الأجر (جنيه)']);
  const chronologicalDays = [...summary.days].reverse();
  const firstDataRow = row;
  for (const day of chronologicalDays) {
    const isOpen = day.session.endedAt === null;
    sheet.getRow(row).values = [
      formatDayLabel(day.dateKey),
      formatClock(day.session.startedAt),
      isOpen ? 'لسه مفتوح' : formatClock(day.session.endedAt as number),
      day.durationMs / MS_PER_HOUR,
      day.earningsPiastres / 100,
    ];
    sheet.getCell(row, 4).numFmt = HOURS_FORMAT;
    sheet.getCell(row, 5).numFmt = MONEY_FORMAT;
    row++;
  }
  if (chronologicalDays.length === 0) {
    sheet.getCell(row, 1).value = 'مفيش أيام شغل متسجلة في الشهر ده.';
    row++;
  } else {
    row = addTotalRow(sheet, row, {
      label: 'الإجمالي',
      hours: summary.workedMs / MS_PER_HOUR,
      earnings: summary.earningsPiastres / 100,
      firstDataRow,
      lastDataRow: row - 1,
    });
  }
  row++;

  row = addSectionTitle(sheet, row, 'الأجر حسب سعر الساعة');
  row = addHeaderRow(sheet, row, ['سعر الساعة (جنيه)', '', '', 'الساعات', 'الأجر (جنيه)']);
  const rateBreakdown = buildRateBreakdown(
    summary.days.flatMap((day) => sessionRateSegments(day.session, ledger.rates, now)),
  );
  const rateStartRow = row;
  for (const entry of rateBreakdown) {
    sheet.getCell(row, 1).value = entry.piastresPerHour / 100;
    sheet.getCell(row, 1).numFmt = MONEY_FORMAT;
    sheet.getCell(row, 4).value = entry.durationMs / MS_PER_HOUR;
    sheet.getCell(row, 4).numFmt = HOURS_FORMAT;
    sheet.getCell(row, 5).value = entry.earningsPiastres / 100;
    sheet.getCell(row, 5).numFmt = MONEY_FORMAT;
    row++;
  }
  if (rateBreakdown.length > 0) {
    row = addTotalRow(sheet, row, {
      label: 'الإجمالي',
      hours: summary.workedMs / MS_PER_HOUR,
      earnings: summary.earningsPiastres / 100,
      firstDataRow: rateStartRow,
      lastDataRow: row - 1,
    });
  }
  row++;

  row = addSectionTitle(sheet, row, 'الإجازات');
  const leaveDates = ledger.leaves
    .map((leave) => leave.date)
    .filter((date) => date.startsWith(monthKey))
    .sort();
  if (leaveDates.length === 0) {
    sheet.getCell(row, 1).value = 'مفيش إجازات متسجلة في الشهر ده.';
  }
  for (const date of leaveDates) {
    sheet.getCell(row, 1).value = formatDayLabel(date);
    row++;
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `saaty-${monthKey}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

interface RateBreakdownEntry {
  piastresPerHour: number;
  durationMs: number;
  earningsPiastres: number;
}

function buildRateBreakdown(segments: RateSegment[]): RateBreakdownEntry[] {
  const byRate = new Map<number, RateBreakdownEntry>();
  for (const segment of segments) {
    const entry = byRate.get(segment.piastresPerHour) ?? {
      piastresPerHour: segment.piastresPerHour,
      durationMs: 0,
      earningsPiastres: 0,
    };
    entry.durationMs += segment.endedAt - segment.startedAt;
    entry.earningsPiastres += segment.earningsPiastres;
    byRate.set(segment.piastresPerHour, entry);
  }
  return [...byRate.values()];
}

function addSectionTitle(sheet: ExcelJS.Worksheet, row: number, text: string): number {
  const cell = sheet.getCell(row, 1);
  cell.value = text;
  cell.font = { ...ACCENT_FONT, size: 13 };
  return row + 1;
}

function addHeaderRow(sheet: ExcelJS.Worksheet, row: number, labels: string[]): number {
  labels.forEach((label, index) => {
    const cell = sheet.getCell(row, index + 1);
    cell.value = label || undefined;
    cell.fill = HEADER_FILL;
    cell.font = ACCENT_FONT;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });
  return row + 1;
}

interface TotalRowOptions {
  label: string;
  hours: number;
  earnings: number;
  firstDataRow: number;
  lastDataRow: number;
}

function addTotalRow(sheet: ExcelJS.Worksheet, row: number, options: TotalRowOptions): number {
  sheet.getCell(row, 1).value = options.label;
  sheet.getCell(row, 1).font = { bold: true };
  const hoursCell = sheet.getCell(row, 4);
  const earningsCell = sheet.getCell(row, 5);
  if (options.lastDataRow >= options.firstDataRow) {
    hoursCell.value = { formula: `SUM(D${options.firstDataRow}:D${options.lastDataRow})`, result: options.hours };
    earningsCell.value = { formula: `SUM(E${options.firstDataRow}:E${options.lastDataRow})`, result: options.earnings };
  }
  hoursCell.numFmt = HOURS_FORMAT;
  earningsCell.numFmt = MONEY_FORMAT;
  hoursCell.font = { bold: true };
  earningsCell.font = { bold: true, color: { argb: 'FF245A40' } };
  for (let column = 1; column <= COLUMN_COUNT; column++) {
    sheet.getCell(row, column).border = { top: { style: 'thin', color: { argb: 'FFE2DED3' } } };
  }
  return row + 1;
}
