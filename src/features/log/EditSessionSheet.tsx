import { useState, type FormEvent } from 'react';
import { Trash2 } from 'lucide-react';
import { Button, Field, FormError, inputClass } from '@/components/ui';
import { Sheet } from '@/components/Sheet';
import { useToast } from '@/components/Toast';
import { useNow } from '@/hooks/useNow';
import type { RateRecord, WorkSession } from '@/lib/db';
import { deleteSession, updateActiveSession, updateSession } from '@/lib/repository';
import { sessionEarningsPiastres } from '@/lib/calculations';
import { getErrorMessage } from '@/lib/errors';
import { formatDuration, formatEgp } from '@/lib/format';
import { cairoDateKey, formatTimeInputValue, parseTimeInput, wallTimeToMs } from '@/lib/time';

interface EditSessionSheetProps {
  session: WorkSession;
  rates?: RateRecord[];
  onClose: () => void;
}

export function EditSessionSheet({ session, rates = [], onClose }: EditSessionSheetProps) {
  const toast = useToast();
  const now = useNow();
  const isOpen = session.endedAt === null;
  const todayKey = cairoDateKey(now);

  const [startDate, setStartDate] = useState(() => cairoDateKey(session.startedAt));
  const [startTime, setStartTime] = useState(() => formatTimeInputValue(session.startedAt));
  const [endDate, setEndDate] = useState(() => cairoDateKey(session.endedAt ?? session.startedAt));
  const [endTime, setEndTime] = useState(() => formatTimeInputValue(session.endedAt ?? session.startedAt));
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Active Session calculations
  function buildActiveStart(): number | null {
    if (!startDate || !startTime) return null;
    const start = parseTimeInput(startTime);
    return wallTimeToMs(startDate, start.hour, start.minute);
  }

  const activeStart = buildActiveStart();
  const isActiveFuture = activeStart !== null && activeStart > now + 1000;
  const isStartValid = activeStart !== null && !isActiveFuture;

  let activePreviewText = '';
  if (!startDate || !startTime) {
    activePreviewText = 'اكتب تاريخ ووقت الوصول';
  } else if (isActiveFuture) {
    activePreviewText = 'وقت الوصول مينفعش يكون في المستقبل';
  } else if (activeStart !== null) {
    const elapsed = Math.max(0, now - activeStart);
    const earnings = rates.length > 0 ? sessionEarningsPiastres({ startedAt: activeStart, endedAt: null }, rates, now) : null;
    activePreviewText = `المدة لحد دلوقتي: ${formatDuration(elapsed)}${earnings !== null ? ` — الأجر: ${formatEgp(earnings)} جنيه` : ''}`;
  }

  // Completed Session calculations
  function buildCompletedTimes(): { startedAt: number; endedAt: number } | null {
    if (!startDate || !startTime || !endDate || !endTime) return null;
    const start = parseTimeInput(startTime);
    const end = parseTimeInput(endTime);
    return {
      startedAt: wallTimeToMs(startDate, start.hour, start.minute),
      endedAt: wallTimeToMs(endDate, end.hour, end.minute),
    };
  }

  const completedTimes = buildCompletedTimes();
  const isOrderValid = completedTimes !== null && completedTimes.endedAt > completedTimes.startedAt;
  const isCompletedFuture = completedTimes !== null && completedTimes.endedAt > now + 1000;
  const isCompletedValid = isOrderValid && !isCompletedFuture;

  let completedPreviewText = '';
  if (!startDate || !startTime || !endDate || !endTime) {
    completedPreviewText = 'اكتب التاريخ والوقت كاملين';
  } else if (!isOrderValid) {
    completedPreviewText = 'وقت المغادرة لازم يكون بعد وقت الوصول';
  } else if (isCompletedFuture) {
    completedPreviewText = 'وقت المغادرة مينفعش يكون في المستقبل';
  } else if (completedTimes !== null) {
    const duration = completedTimes.endedAt - completedTimes.startedAt;
    const earnings = rates.length > 0
      ? sessionEarningsPiastres({ startedAt: completedTimes.startedAt, endedAt: completedTimes.endedAt }, rates, completedTimes.endedAt)
      : null;
    completedPreviewText = `مدة الشغل بعد التعديل: ${formatDuration(duration)}${earnings !== null ? ` — الأجر: ${formatEgp(earnings)} جنيه` : ''}`;
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (isOpen) {
        if (!activeStart) {
          setError('اكتب تاريخ ووقت الوصول');
          return;
        }
        if (isActiveFuture) {
          setError('وقت الوصول مينفعش يكون في المستقبل');
          return;
        }
        await updateActiveSession(session.id as number, activeStart);
        toast('اتحفظ وقت بدء اليوم');
      } else {
        if (!completedTimes) {
          setError('اكتب التاريخ والوقت كاملين');
          return;
        }
        if (!isOrderValid) {
          setError('وقت المغادرة لازم يكون بعد وقت الوصول');
          return;
        }
        if (isCompletedFuture) {
          setError('وقت المغادرة مينفعش يكون في المستقبل');
          return;
        }
        await updateSession(session.id as number, completedTimes.startedAt, completedTimes.endedAt);
        toast('اتحفظ التعديل');
      }
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
      toast(isOpen ? 'اتلغى يوم الشغل' : 'اتحذف يوم الشغل');
      onClose();
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet title={isOpen ? 'تعديل وقت بدء اليوم' : 'تعديل يوم الشغل'} onClose={onClose}>
      <form onSubmit={handleSave} className="space-y-4">
        {isOpen ? (
          <>
            <p className="text-sm leading-relaxed text-ink-muted">
              يوم الشغل لسه شغال ومفتوح. لو نسيت تبدأ العداد في ميعادك، تقدر تظبط وقت الوصول هنا والعداد هيفضل مكمل عادي بدون توقف.
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
                <input
                  type="time"
                  className={inputClass}
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </Field>
            </div>
            <p className={`text-sm ${isStartValid ? 'text-ink-muted' : 'text-error-700'}`}>
              {activePreviewText}
            </p>
            <FormError message={error} />
            <Button type="submit" block disabled={saving || !isStartValid}>
              حفظ وقت الوصول
            </Button>
          </>
        ) : (
          <>
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
                <input
                  type="time"
                  className={inputClass}
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
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
                <input
                  type="time"
                  className={inputClass}
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </Field>
            </div>
            <p className={`text-sm ${isCompletedValid ? 'text-ink-muted' : 'text-error-700'}`}>
              {completedPreviewText}
            </p>
            <FormError message={error} />
            <Button type="submit" block disabled={saving || !isCompletedValid}>
              حفظ التعديل
            </Button>
          </>
        )}
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
            {isOpen ? 'إلغاء يوم الشغل' : 'حذف يوم الشغل'}
          </Button>
        )}
      </div>
    </Sheet>
  );
}
