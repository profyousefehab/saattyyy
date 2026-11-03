import { useState } from 'react';
import { CalendarPlus, Pencil } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { MonthSwitcher } from '@/components/MonthSwitcher';
import { useLedger } from '@/hooks/useLedger';
import { useNow } from '@/hooks/useNow';
import { summarizeMonth, type DayEntry } from '@/lib/calculations';
import type { WorkSession } from '@/lib/db';
import { formatDuration, formatEgp } from '@/lib/format';
import { cairoMonthKey, formatClock, formatDayLabel } from '@/lib/time';
import { EditSessionSheet } from '@/features/log/EditSessionSheet';
import { LeaveSheet } from '@/features/log/LeaveSheet';
import { ManualSessionSheet } from '@/features/log/ManualSessionSheet';

interface LogItem {
  key: string;
  dateKey: string;
  startedAt: number;
  day?: DayEntry;
  leaveId?: number;
}

export function WorkLogScreen() {
  const ledger = useLedger();
  const now = useNow();
  const currentMonth = cairoMonthKey(now);
  const [monthKey, setMonthKey] = useState(currentMonth);
  const [selected, setSelected] = useState<WorkSession | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);

  if (!ledger) return null;

  const summary = summarizeMonth(ledger, monthKey, now);
  const monthLeaves = ledger.leaves.filter((leave) => leave.date.startsWith(monthKey));

  const items: LogItem[] = [
    ...summary.days.map((day) => ({
      key: `s-${day.session.id}`,
      dateKey: day.dateKey,
      startedAt: day.session.startedAt,
      day,
    })),
    ...monthLeaves.map((leave) => ({
      key: `l-${leave.id}`,
      dateKey: leave.date,
      startedAt: 0,
      leaveId: leave.id,
    })),
  ].sort((a, b) => b.dateKey.localeCompare(a.dateKey) || b.startedAt - a.startedAt);

  return (
    <div className="px-5 pt-[calc(env(safe-area-inset-top)+20px)]">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-ink">سجل الشغل</h1>
        <Button variant="secondary" className="min-h-11 px-4 text-sm" onClick={() => setLeaveOpen(true)}>
          <CalendarPlus size={18} />
          تسجيل إجازة
        </Button>
      </header>

      <div className="mt-5">
        <MonthSwitcher monthKey={monthKey} currentMonthKey={currentMonth} onChange={setMonthKey} />
      </div>

      <Button variant="secondary" block className="mt-4" onClick={() => setManualOpen(true)}>
        <CalendarPlus size={18} />
        تسجيل يوم شغل فات
      </Button>

      <Card className="mt-4 grid grid-cols-3 gap-2 px-4 py-4 text-center">
        <div>
          <p className="text-xs text-ink-muted">ساعات الشهر</p>
          <p className="mt-1 text-sm font-semibold text-ink">{formatDuration(summary.workedMs)}</p>
        </div>
        <div>
          <p className="text-xs text-ink-muted">أيام الشغل</p>
          <p className="mt-1 text-sm font-semibold text-ink tabular-nums">{summary.workedDayCount}</p>
        </div>
        <div>
          <p className="text-xs text-ink-muted">الأجر</p>
          <p className="mt-1 text-sm font-semibold text-primary-700 tabular-nums">{formatEgp(summary.earningsPiastres)} جنيه</p>
        </div>
      </Card>

      {items.length === 0 ? (
        <p className="mt-10 text-center text-sm leading-relaxed text-ink-muted">
          مفيش أيام شغل مسجلة الشهر ده لسه.
        </p>
      ) : (
        <ul className="mt-5 space-y-3">
          {items.map((item) => (
            <li key={item.key}>
              {item.day ? (
                <SessionRow
                  dateKey={item.dateKey}
                  day={item.day}
                  onSelect={() => setSelected(item.day!.session)}
                />
              ) : (
                <div className="flex items-center justify-between rounded-2xl bg-canvas-deep px-4 py-3.5">
                  <span className="text-sm font-medium text-ink">{formatDayLabel(item.dateKey)}</span>
                  <span className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-ink-soft">إجازة</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <EditSessionSheet
          key={selected.id}
          session={selected}
          rates={ledger.rates}
          onClose={() => setSelected(null)}
        />
      )}
      {manualOpen && <ManualSessionSheet onClose={() => setManualOpen(false)} />}
      {leaveOpen && (
        <LeaveSheet leaves={ledger.leaves} allowance={ledger.settings.leaveAllowance} onClose={() => setLeaveOpen(false)} />
      )}
    </div>
  );
}

function SessionRow({ dateKey, day, onSelect }: { dateKey: string; day: DayEntry; onSelect: () => void }) {
  const isOpen = day.session.endedAt === null;
  const endLabel = isOpen ? 'مفتوح (قيد العمل)' : formatClock(day.session.endedAt as number);

  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center justify-between gap-3 rounded-2xl bg-surface px-4 py-3.5 text-start shadow-card transition active:scale-[0.99]"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-ink">{formatDayLabel(dateKey)}</p>
          {isOpen && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-medium text-primary-700">
              <span className="size-1.5 rounded-full bg-primary-600 animate-pulse" />
              قيد العمل
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-ink-muted tabular-nums">
          {formatClock(day.session.startedAt)} - {endLabel}
        </p>
      </div>
      <div className="shrink-0 flex items-center gap-2.5">
        <div className="text-end">
          <p className="text-sm font-medium text-primary-700 tabular-nums">
            {isOpen ? 'قيد العمل' : `${formatEgp(day.earningsPiastres)} جنيه`}
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            {isOpen ? 'لم يُنتهِ بعد' : formatDuration(day.durationMs)}
          </p>
        </div>
        <Pencil size={15} className="text-ink-muted/50 shrink-0" aria-hidden="true" />
      </div>
    </button>
  );
}
