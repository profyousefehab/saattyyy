import { useState } from 'react';
import { Plus, Pencil } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { useNow } from '@/hooks/useNow';
import type { RateRecord, WorkSession } from '@/lib/db';
import { rateRecordAt } from '@/lib/calculations';
import { formatEgp } from '@/lib/format';
import { formatDayLabel, cairoDateKey } from '@/lib/time';
import { RateFormSheet } from '@/features/settings/RateFormSheet';

interface RateSectionProps {
  rates: RateRecord[];
  sessions: WorkSession[];
}

type RateEditTarget = RateRecord | 'new' | null;

export function RateSection({ rates, sessions }: RateSectionProps) {
  const now = useNow();
  const [editTarget, setEditTarget] = useState<RateEditTarget>(null);
  const current = rateRecordAt(rates, now);
  const history = [...rates].sort((a, b) => b.effectiveFrom - a.effectiveFrom);

  return (
    <Card>
      <h2 className="text-base font-semibold text-ink">سعر الساعة</h2>

      <div className="mt-4 rounded-2xl bg-primary-50 px-4 py-4">
        <p className="text-sm text-primary-700">السعر الحالي</p>
        <p className="mt-1 text-2xl font-semibold text-ink">
          {formatEgp(current.piastresPerHour)} <span className="text-base font-medium text-ink-soft">جنيه/ساعة</span>
        </p>
        {current.note && <p className="mt-1 text-sm text-ink-muted">{current.note}</p>}
      </div>

      <h3 className="mt-6 text-sm font-medium text-ink-soft">سجل الأسعار</h3>
      <ul className="mt-2 divide-y divide-line-soft">
        {history.map((rate) => {
          const isBase = rate.effectiveFrom === 0;
          return (
            <li key={rate.id}>
              <button
                type="button"
                onClick={() => setEditTarget(rate)}
                className="flex min-h-14 w-full items-center justify-between gap-3 rounded-xl px-2 py-3 text-start transition hover:bg-canvas-deep active:scale-[0.99]"
              >
                <span className="min-w-0">
                  <span className="block font-medium text-ink">
                    {formatEgp(rate.piastresPerHour)} جنيه/ساعة
                  </span>
                  <span className="mt-0.5 block text-sm text-ink-muted">
                    {isBase
                      ? rate.note || 'السعر الأساسي'
                      : `من ${formatDayLabel(cairoDateKey(rate.effectiveFrom))}${rate.note ? ` · ${rate.note}` : ''}`}
                  </span>
                </span>
                <Pencil size={16} strokeWidth={1.75} className="shrink-0 text-ink-muted" aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>

      <Button variant="secondary" block className="mt-4" onClick={() => setEditTarget('new')}>
        <Plus size={18} strokeWidth={2} />
        تغيير السعر
      </Button>

      {editTarget && (
        <RateFormSheet
          rate={editTarget === 'new' ? undefined : editTarget}
          sessions={sessions}
          onClose={() => setEditTarget(null)}
        />
      )}
    </Card>
  );
}
