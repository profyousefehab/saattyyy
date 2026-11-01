import { Card, ProgressBar } from '@/components/ui';
import { formatEgp, formatPercent } from '@/lib/format';

interface MonthEarningsCardProps {
  monthLabel: string;
  earningsPiastres: number;
  targetPiastres: number;
  percent: number;
}

export function MonthEarningsCard({ monthLabel, earningsPiastres, targetPiastres, percent }: MonthEarningsCardProps) {
  const difference = earningsPiastres - targetPiastres;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between text-sm text-ink-muted">
        <span>أجرك في {monthLabel}</span>
        <span className="tabular-nums">{formatPercent(percent)}</span>
      </div>
      <p className="mt-3 text-[40px] font-semibold leading-none tracking-tight text-ink tabular-nums">
        {formatEgp(earningsPiastres)}
        <span className="me-2 text-base font-medium text-ink-soft">جنيه</span>
      </p>
      <div className="mt-5">
        <ProgressBar percent={percent} />
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 text-sm">
        <span className="text-ink-muted">الهدف: {formatEgp(targetPiastres)} جنيه</span>
        <span className={difference >= 0 ? 'font-medium text-primary-700' : 'font-medium text-ink-soft'}>
          {difference >= 0
            ? `فوق الهدف بـ ${formatEgp(difference)} جنيه`
            : `باقي ${formatEgp(-difference)} جنيه`}
        </span>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-ink-muted">
        الأرقام دي لحد دلوقتي. الهدف مجرد تخطيط، مش فلوس اتقبضت.
      </p>
    </Card>
  );
}
