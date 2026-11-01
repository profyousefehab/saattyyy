import { useState } from 'react';
import { Clock, Play, Settings, Square } from 'lucide-react';
import { Button, IconButton } from '@/components/ui';
import { useToast } from '@/components/Toast';
import { useLedger } from '@/hooks/useLedger';
import { useNow } from '@/hooks/useNow';
import { cairoDateKey, cairoMonthKey, formatDayLabel, formatMonthLabel, getGreeting } from '@/lib/time';
import { endSession, startSession } from '@/lib/repository';
import {
  findActiveSession,
  findStaleSession,
  sessionEarningsPiastres,
  summarizeDay,
  summarizeMonth,
} from '@/lib/calculations';
import { getErrorMessage } from '@/lib/errors';
import { MonthEarningsCard } from '@/features/home/MonthEarningsCard';
import { ActiveSessionCard } from '@/features/home/ActiveSessionCard';
import { StaleSessionCard } from '@/features/home/StaleSessionCard';
import { TodayStats, LeaveBalance } from '@/features/home/TodayStats';
import { SessionSummarySheet, type SessionSummary } from '@/features/home/SessionSummarySheet';

interface HomeScreenProps {
  onOpenSettings: () => void;
}

export function HomeScreen({ onOpenSettings }: HomeScreenProps) {
  const ledger = useLedger();
  const now = useNow();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<SessionSummary | null>(null);

  if (!ledger) return null;

  const todayKey = cairoDateKey(now);
  const monthKey = cairoMonthKey(now);
  const active = findActiveSession(ledger.sessions);
  const stale = findStaleSession(ledger.sessions, todayKey);
  const today = summarizeDay(ledger, todayKey, now);
  const month = summarizeMonth(ledger, monthKey, now);
  const monthPercent = month.targetPiastres > 0 ? (month.earningsPiastres / month.targetPiastres) * 100 : 0;

  async function handleStart() {
    setBusy(true);
    try {
      await startSession(Date.now());
      toast('بدأنا يومك، شد حيلك');
    } catch (error) {
      toast(getErrorMessage(error), 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handleEnd() {
    if (!active || !ledger) return;
    setBusy(true);
    try {
      const endedAt = Date.now();
      await endSession(active.id as number, endedAt);
      setSummary({
        startedAt: active.startedAt,
        endedAt,
        durationMs: endedAt - active.startedAt,
        earningsPiastres: sessionEarningsPiastres({ startedAt: active.startedAt, endedAt }, ledger.rates, endedAt),
      });
    } catch (error) {
      toast(getErrorMessage(error), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="px-5 pt-[calc(env(safe-area-inset-top)+20px)]">
      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary-600 text-white">
              <Clock size={18} strokeWidth={2} />
            </span>
            <span className="text-sm font-semibold text-primary-700">ساعاتي</span>
          </div>
          <p className="mt-5 text-sm text-ink-muted">{formatDayLabel(todayKey)}</p>
          <h1 className="mt-1 text-2xl font-semibold leading-tight text-ink">{getGreeting(now)}</h1>
        </div>
        <IconButton label="الإعدادات" onClick={onOpenSettings} className="-me-2">
          <Settings size={22} strokeWidth={1.75} />
        </IconButton>
      </header>

      <div className="mt-6 space-y-4">
        <MonthEarningsCard
          monthLabel={formatMonthLabel(monthKey)}
          earningsPiastres={month.earningsPiastres}
          targetPiastres={month.targetPiastres}
          percent={monthPercent}
        />

        {stale ? (
          <StaleSessionCard session={stale} />
        ) : (
          <>
            <ActiveSessionCard active={active} rates={ledger.rates} now={now} />
            <Button block className="h-14 text-base" disabled={busy} onClick={active ? handleEnd : handleStart}>
              {active ? <Square size={18} strokeWidth={2} /> : <Play size={18} strokeWidth={2} />}
              {active ? 'إنهاء اليوم' : 'بدء اليوم'}
            </Button>
          </>
        )}

        <TodayStats today={today} />
        <LeaveBalance remaining={month.leaveRemaining} allowance={ledger.settings.leaveAllowance} />
      </div>

      <SessionSummarySheet summary={summary} onClose={() => setSummary(null)} />
    </div>
  );
}
