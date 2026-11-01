import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { MonthSwitcher } from '@/components/MonthSwitcher';
import { useToast } from '@/components/Toast';
import { useLedger } from '@/hooks/useLedger';
import { useNow } from '@/hooks/useNow';
import { summarizeMonth } from '@/lib/calculations';
import { exportMonthReport } from '@/lib/excel';
import { getErrorMessage } from '@/lib/errors';
import { formatDuration, formatEgp } from '@/lib/format';
import { cairoMonthKey, formatMonthLabel } from '@/lib/time';

export function ReportsScreen() {
  const ledger = useLedger();
  const now = useNow();
  const toast = useToast();
  const currentMonth = cairoMonthKey(now);
  const [monthKey, setMonthKey] = useState(currentMonth);
  const [exporting, setExporting] = useState(false);

  if (!ledger) return null;

  const summary = summarizeMonth(ledger, monthKey, now);
  const difference = summary.earningsPiastres - summary.targetPiastres;
  const hasOpenSession = ledger.sessions.some(
    (session) => session.endedAt === null && cairoMonthKey(session.startedAt) === monthKey,
  );

  async function handleExport() {
    setExporting(true);
    try {
      await exportMonthReport(monthKey, ledger!);
      toast('اتجهز ملف الإكسل');
    } catch (error) {
      toast(getErrorMessage(error), 'error');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="px-5 pt-[calc(env(safe-area-inset-top)+20px)]">
      <h1 className="text-2xl font-semibold text-ink">التقارير</h1>

      <div className="mt-5">
        <MonthSwitcher monthKey={monthKey} currentMonthKey={currentMonth} onChange={setMonthKey} />
      </div>

      <Card className="mt-4 p-6">
        <p className="text-sm text-ink-muted">أجر {formatMonthLabel(monthKey)}</p>
        <p className="mt-3 text-4xl font-semibold tracking-tight text-ink tabular-nums">
          {formatEgp(summary.earningsPiastres)}
          <span className="me-2 text-base font-medium text-ink-soft">جنيه</span>
        </p>
        <dl className="mt-6 divide-y divide-line-soft text-sm">
          <Row label="الهدف الشهري" value={`${formatEgp(summary.targetPiastres)} جنيه`} />
          <Row
            label="الفرق عن الهدف"
            value={`${difference >= 0 ? '+' : '-'}${formatEgp(Math.abs(difference))} جنيه`}
          />
          <Row label="ساعات الشغل" value={formatDuration(summary.workedMs)} />
          <Row label="أيام الشغل" value={String(summary.workedDayCount)} />
          <Row
            label="الإجازات المستخدمة"
            value={`${summary.leaveUsed} من ${ledger.settings.leaveAllowance}`}
          />
        </dl>
      </Card>

      {hasOpenSession && (
        <p className="mt-4 rounded-2xl bg-warning-50 px-4 py-3 text-sm leading-relaxed text-warning-700">
          فيه يوم شغل لسه مفتوح في الشهر ده. هيتضاف للتقرير بعد ما تنهيه.
        </p>
      )}

      <Button block className="mt-6 h-14 text-base" disabled={exporting} onClick={handleExport}>
        <Download size={18} />
        تصدير إلى إكسل
      </Button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="font-medium text-ink tabular-nums">{value}</dd>
    </div>
  );
}
