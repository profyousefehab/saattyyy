import { Button } from '@/components/ui';
import { Sheet } from '@/components/Sheet';
import { formatClock } from '@/lib/time';
import { formatDuration, formatEgp } from '@/lib/format';

export interface SessionSummary {
  startedAt: number;
  endedAt: number;
  durationMs: number;
  earningsPiastres: number;
}

interface SessionSummarySheetProps {
  summary: SessionSummary | null;
  onClose: () => void;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-line-soft py-3 text-sm last:border-0">
      <span className="text-ink-muted">{label}</span>
      <span className="font-medium text-ink tabular-nums">{value}</span>
    </div>
  );
}

export function SessionSummarySheet({ summary, onClose }: SessionSummarySheetProps) {
  if (!summary) return null;

  return (
    <Sheet title="ملخص اليوم" onClose={onClose}>
      <div>
        <Row label="وقت الوصول" value={formatClock(summary.startedAt)} />
        <Row label="وقت المغادرة" value={formatClock(summary.endedAt)} />
        <Row label="مدة الشغل" value={formatDuration(summary.durationMs)} />
      </div>
      <div className="mt-6 rounded-2xl bg-primary-50 px-5 py-5 text-center">
        <p className="text-sm text-primary-700">أجر اليوم</p>
        <p className="mt-2 text-3xl font-semibold text-primary-700 tabular-nums">
          {formatEgp(summary.earningsPiastres)} جنيه
        </p>
      </div>
      <Button block className="mt-6" onClick={onClose}>
        تمام
      </Button>
    </Sheet>
  );
}
