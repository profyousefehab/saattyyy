import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button, Field, FormError, IconButton, inputClass } from '@/components/ui';
import { Sheet } from '@/components/Sheet';
import { useToast } from '@/components/Toast';
import type { LeaveRecord } from '@/lib/db';
import { addLeave, deleteLeave } from '@/lib/repository';
import { getErrorMessage } from '@/lib/errors';
import { cairoDateKey, cairoMonthKey, formatDayLabel } from '@/lib/time';

interface LeaveSheetProps {
  leaves: LeaveRecord[];
  allowance: number;
  onClose: () => void;
}

export function LeaveSheet({ leaves, allowance, onClose }: LeaveSheetProps) {
  const toast = useToast();
  const now = Date.now();
  const currentMonth = cairoMonthKey(now);
  const [date, setDate] = useState(() => cairoDateKey(now));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const monthLeaves = leaves
    .filter((leave) => leave.date.startsWith(currentMonth))
    .sort((a, b) => a.date.localeCompare(b.date));
  const remaining = Math.max(0, allowance - monthLeaves.length);

  async function handleAdd() {
    if (!date) {
      setError('اختار تاريخ الإجازة');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await addLeave(date);
      toast('اتسجلت الإجازة');
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteLeave(id);
      toast('اتشالت الإجازة');
    } catch (caught) {
      setError(getErrorMessage(caught));
    }
  }

  return (
    <Sheet title="تسجيل إجازة" onClose={onClose}>
      <p className="text-sm text-ink-muted">
        متبقي لك {remaining} من {allowance} إجازات في الشهر ده.
      </p>
      <div className="mt-4 flex items-end gap-3">
        <div className="flex-1">
          <Field label="تاريخ الإجازة">
            <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>
        <Button onClick={handleAdd} disabled={saving} className="h-11">
          تسجيل
        </Button>
      </div>
      <div className="mt-4">
        <FormError message={error} />
      </div>

      <h3 className="mt-6 text-sm font-medium text-ink-soft">إجازات الشهر</h3>
      {monthLeaves.length === 0 ? (
        <p className="mt-3 text-sm text-ink-muted">مفيش إجازات متسجلة الشهر ده.</p>
      ) : (
        <ul className="mt-3 divide-y divide-line-soft">
          {monthLeaves.map((leave) => (
            <li key={leave.id} className="flex items-center justify-between py-3">
              <span className="text-sm text-ink">{formatDayLabel(leave.date)}</span>
              <IconButton label="حذف الإجازة" onClick={() => handleDelete(leave.id as number)}>
                <Trash2 size={18} />
              </IconButton>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}
