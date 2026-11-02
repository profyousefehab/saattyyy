import { useState, type FormEvent } from 'react';
import { Button, Field, FormError, inputClass } from '@/components/ui';
import { Sheet } from '@/components/Sheet';
import { useToast } from '@/components/Toast';
import { addManualSession } from '@/lib/repository';
import { getErrorMessage } from '@/lib/errors';
import { formatDuration } from '@/lib/format';
import { cairoDateKey, parseTimeInput, wallTimeToMs } from '@/lib/time';

interface ManualSessionSheetProps {
  onClose: () => void;
}

export function ManualSessionSheet({ onClose }: ManualSessionSheetProps) {
  const toast = useToast();
  const todayKey = cairoDateKey(Date.now());
  const [startDate, setStartDate] = useState(todayKey);
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState(todayKey);
  const [endTime, setEndTime] = useState('17:00');
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
  const isValidRange = times !== null && times.endedAt > times.startedAt;
  const preview = isValidRange
    ? `مدة الشغل: ${formatDuration(times.endedAt - times.startedAt)}`
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
      await addManualSession(times.startedAt, times.endedAt);
      toast('اتسجل يوم الشغل');
      onClose();
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet title="تسجيل يوم شغل فات" onClose={onClose}>
      <form onSubmit={handleSave} className="space-y-4">
        <p className="text-sm leading-relaxed text-ink-muted">
          استخدم ده لو نسيت تبدأ أو تنهي اليوم. اكتب الوقت اللي فعلاً اشتغلته.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="تاريخ الوصول">
            <input
              type="date"
              className={inputClass}
              value={startDate}
              max={todayKey}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </Field>
          <Field label="وقت الوصول">
            <input type="time" className={inputClass} value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </Field>
          <Field label="تاريخ المغادرة">
            <input
              type="date"
              className={inputClass}
              value={endDate}
              max={todayKey}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </Field>
          <Field label="وقت المغادرة">
            <input type="time" className={inputClass} value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </Field>
        </div>
        <p className={`text-sm ${isValidRange ? 'text-ink-muted' : 'text-error-700'}`}>{preview}</p>
        <FormError message={error} />
        <Button type="submit" block disabled={saving || !isValidRange}>
          حفظ يوم الشغل
        </Button>
      </form>
    </Sheet>
  );
}
