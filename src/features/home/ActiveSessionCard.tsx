import { Card } from '@/components/ui';
import type { RateRecord, WorkSession } from '@/lib/db';
import { sessionEarningsPiastres } from '@/lib/calculations';
import { formatEgp, formatTimer } from '@/lib/format';
import { formatClock } from '@/lib/time';

interface ActiveSessionCardProps {
  active: WorkSession | undefined;
  rates: RateRecord[];
  now: number;
}

export function ActiveSessionCard({ active, rates, now }: ActiveSessionCardProps) {
  const isOpen = active !== undefined;

  return (
    <Card>
      <div className="flex items-center justify-between">
        <span className="text-sm text-ink-muted">{isOpen ? 'شغال دلوقتي' : 'مش شغال دلوقتي'}</span>
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
            isOpen ? 'bg-primary-50 text-primary-700' : 'bg-canvas-deep text-ink-muted'
          }`}
        >
          <span className={`size-2 rounded-full ${isOpen ? 'animate-pulse bg-primary-600' : 'bg-ink-muted/50'}`} />
          {isOpen ? 'مفتوح' : 'مقفول'}
        </span>
      </div>

      {active ? (
        <>
          <p className="mt-4 text-4xl font-semibold tracking-tight text-ink tabular-nums">
            {formatTimer(now - active.startedAt)}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-ink-muted">وقت الوصول</p>
              <p className="mt-1 font-medium text-ink tabular-nums">{formatClock(active.startedAt)}</p>
            </div>
            <div>
              <p className="text-ink-muted">الأجر لحد دلوقتي</p>
              <p className="mt-1 font-medium text-primary-700 tabular-nums">
                {formatEgp(sessionEarningsPiastres(active, rates, now))} جنيه
              </p>
            </div>
          </div>
        </>
      ) : (
        <p className="mt-4 text-sm leading-relaxed text-ink-soft">
          لما توصل الشغل اضغط بدء اليوم، والعداد هيفضل شغال حتى لو قفلت التطبيق.
        </p>
      )}
    </Card>
  );
}
