import { ChevronLeft, ChevronRight } from 'lucide-react';
import { IconButton } from '@/components/ui';
import { formatMonthLabel, shiftMonthKey } from '@/lib/time';

interface MonthSwitcherProps {
  monthKey: string;
  currentMonthKey: string;
  onChange: (monthKey: string) => void;
}

export function MonthSwitcher({ monthKey, currentMonthKey, onChange }: MonthSwitcherProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-surface px-2 py-1 shadow-card">
      <IconButton label="الشهر اللي قبله" onClick={() => onChange(shiftMonthKey(monthKey, -1))}>
        <ChevronRight size={22} />
      </IconButton>
      <p className="text-base font-semibold text-ink">{formatMonthLabel(monthKey)}</p>
      <IconButton
        label="الشهر اللي بعده"
        disabled={monthKey >= currentMonthKey}
        onClick={() => onChange(shiftMonthKey(monthKey, 1))}
      >
        <ChevronLeft size={22} />
      </IconButton>
    </div>
  );
}
