import { Card, ProgressBar } from '@/components/ui';
import type { DaySummary } from '@/lib/calculations';
import { formatDuration, formatEgp, formatPercent } from '@/lib/format';

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-ink-muted">{label}</p>
      <p className="mt-1 text-base font-medium text-ink tabular-nums">{value}</p>
    </div>
  );
}

export function TodayStats({ today }: { today: DaySummary }) {
  return (
    <Card>
      <h2 className="text-base font-semibold text-ink">النهارده</h2>
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5">
        <Stat label="أجر النهارده" value={`${formatEgp(today.earningsPiastres)} جنيه`} />
        <Stat label="ساعات الشغل" value={formatDuration(today.workedMs)} />
        <Stat label="الهدف اليومي" value={formatDuration(today.targetMs)} />
        <Stat label="أجر الهدف" value={`${formatEgp(today.targetPiastres)} جنيه`} />
      </div>
      <div className="mt-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-soft">نسبة الهدف</span>
          <span className="font-medium text-ink tabular-nums">{formatPercent(today.percent)}</span>
        </div>
        <div className="mt-2">
          <ProgressBar percent={today.percent} />
        </div>
        <p className="mt-2 text-xs text-ink-muted">
          {today.remainingMs > 0
            ? `باقي ${formatDuration(today.remainingMs)} على الهدف`
            : 'خلصت الهدف بتاع النهارده'}
        </p>
      </div>
    </Card>
  );
}

export function LeaveBalance({ remaining, allowance }: { remaining: number; allowance: number }) {
  return (
    <Card className="flex items-center justify-between py-4">
      <span className="text-sm text-ink-soft">الإجازات المتبقية هذا الشهر</span>
      <span className="text-base font-semibold text-ink tabular-nums">
        {remaining} من {allowance}
      </span>
    </Card>
  );
}
