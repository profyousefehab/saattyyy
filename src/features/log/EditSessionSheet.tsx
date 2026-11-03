import { useState, type FormEvent } from 'react';
import { Trash2 } from 'lucide-react';
import { Button, Field, FormError, inputClass } from '@/components/ui';
import { Sheet } from '@/components/Sheet';
import { useToast } from '@/components/Toast';
import type { WorkSession } from '@/lib/db';
import { deleteSession, updateSession } from '@/lib/repository';
import { getErrorMessage } from '@/lib/errors';
import { formatDuration } from '@/lib/format';
import { cairoDateKey, formatTimeInputValue, parseTimeInput, wallTimeToMs } from '@/lib/time';

interface EditSessionSheetProps {
  session: WorkSession;
  onClose: () => void;
}

export function EditSessionSheet({ session, onClose }: EditSessionSheetProps) {
  const toast = useToast();
  const endedAt = session.endedAt ?? session.startedAt;
  const [startDate, setStartDate] = useState(() => cairoDateKey(session.startedAt));
  const [startTime, setStartTime] = useState(() => formatTimeInputValue(session.startedAt));
  const [endDate, setEndDate] = useState(() => cairoDateKey(endedAt));
  const [endTime, setEndTime] = useState(() => formatTimeInputValue(endedAt));
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function buildTimes(): { startedAt: number; endedAt: number } | null {
    if (!startDate || !startTime || !endDate || !endTime) return null;
    const start = parseTimeInput(startTime);
    const end = parseTimeInput(endTime);
    return {
      startedAt: wallTimeToMs(startDate, start.hour, start.minute),
      endedAt: wallTimeToMs(endDate, end.hour, end.minute),
    };
  }

  const times = buildTimes();
  const preview =
    times && times.endedAt > times.startedAt
      ? `مدة الشغل بعد التعديل: ${formatDuration(times.endedAt - times.startedAt)}`
      : 'وقت المغادرة لازم يكون بعد وقت الوصول';

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    if (!times) {
      setError('اكتب التاريخ والوقت كاملين');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateSession(session.id as number, times.startedAt, times.endedAt);
      toast('اتحفظ التعديل');
      onClose();
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    try {
      await deleteSession(session.id as number);
      toast('اتحذف يوم الشغل');
      onClose();
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet title="تعديل يوم الشغل" onClose={onClose}>
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="تاريخ الوصول">
            <input type="date" className={inputClass} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </Field>
          <Field label="وقت الوصول">
            <input type="time" className={inputClass} value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </Field>
          <Field label="تاريخ المغادرة">
            <input type="date" className={inputClass} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </Field>
          <Field label="وقت المغادرة">
            <input type="time" className={inputClass} value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </Field>
        </div>
        <p className="text-sm text-ink-muted">{preview}</p>
        <FormError message={error} />
        <Button type="submit" block disabled={saving || !times}>
          حفظ التعديل
        </Button>
      </form>

      <div className="mt-6 border-t border-line-soft pt-5">
        {confirmingDelete ? (
          <div className="flex items-center gap-3">
            <Button variant="danger" className="flex-1" disabled={saving} onClick={handleDelete}>
              تأكيد الحذف
            </Button>
            <Button variant="secondary" className="flex-1" onClick={() => setConfirmingDelete(false)}>
              إلغاء
            </Button>
          </div>
        ) : (
          <Button variant="ghost" block onClick={() => setConfirmingDelete(true)}>
            <Trash2 size={18} />
            حذف يوم الشغل
          </Button>
        )}
      </div>
    </Sheet>
  );
}
