import { useState, type FormEvent } from 'react';
import { Button, Card, Field, FormError, inputClass } from '@/components/ui';
import { useToast } from '@/components/Toast';
import type { WorkSession } from '@/lib/db';
import { endSession } from '@/lib/repository';
import { getErrorMessage } from '@/lib/errors';
import { cairoDateKey, formatClock, formatDayLabel, parseTimeInput, wallTimeToMs } from '@/lib/time';

interface StaleSessionCardProps {
  session: WorkSession;
}

export function StaleSessionCard({ session }: StaleSessionCardProps) {
  const toast = useToast();
  const startKey = cairoDateKey(session.startedAt);
  const [endDate, setEndDate] = useState(startKey);
  const [endTime, setEndTime] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    if (!endDate || !endTime) {
      setError('اكتب تاريخ ووقت المغادرة الحقيقي');
      return;
    }
    const { hour, minute } = parseTimeInput(endTime);
    setSaving(true);
    setError(null);
    try {
      await endSession(session.id as number, wallTimeToMs(endDate, hour, minute));
      toast('اتقفل يوم الشغل القديم');
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="border border-warning-100 bg-warning-50">
      <h2 className="text-base font-semibold text-warning-700">فيه يوم شغل مفتوح من يوم فات</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        بدأ يوم {formatDayLabel(startKey)} الساعة {formatClock(session.startedAt)} ولسه متقفلش. اكتب وقت
        المغادرة الحقيقي عشان نحسب أجرك صح.
      </p>
      <form onSubmit={handleSave} className="mt-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="تاريخ المغادرة">
            <input type="date" className={inputClass} value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          </Field>
          <Field label="وقت المغادرة">
            <input type="time" className={inputClass} value={endTime} onChange={(event) => setEndTime(event.target.value)} />
          </Field>
        </div>
        <FormError message={error} />
        <Button type="submit" block disabled={saving}>
          حفظ وقت المغادرة
        </Button>
      </form>
    </Card>
  );
}
