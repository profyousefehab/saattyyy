import { useState, type FormEvent } from 'react';
import { Button, Field, FormError, inputClass } from '@/components/ui';
import { Sheet } from '@/components/Sheet';
import { useToast } from '@/components/Toast';
import type { RateRecord, WorkSession } from '@/lib/db';
import { addRate, updateRate } from '@/lib/repository';
import { getErrorMessage } from '@/lib/errors';
import { parseArabicNumber } from '@/lib/format';
import { cairoDateKey, wallTimeToMs } from '@/lib/time';

interface RateFormSheetProps {
  rate?: RateRecord;
  sessions: WorkSession[];
  onClose: () => void;
}

export function RateFormSheet({ rate, sessions, onClose }: RateFormSheetProps) {
  const toast = useToast();
  const isEditing = rate !== undefined;
  const isBaseRate = rate?.effectiveFrom === 0;
  const [rateValue, setRateValue] = useState(() => (rate ? String(rate.piastresPerHour / 100) : ''));
  const [effectiveDate, setEffectiveDate] = useState(() =>
    rate && !isBaseRate ? cairoDateKey(rate.effectiveFrom) : cairoDateKey(Date.now()),
  );
  const [note, setNote] = useState(() => rate?.note ?? '');
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const effectiveFrom = isBaseRate ? 0 : effectiveDate ? wallTimeToMs(effectiveDate, 0, 0) : NaN;
  const earliest = Math.min(effectiveFrom, rate?.effectiveFrom ?? Infinity);
  const affectsHistory = sessions.some((session) => (session.endedAt ?? Infinity) > earliest);
  const needsConfirmation = isEditing || affectsHistory;

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    const piastresPerHour = Math.round(parseArabicNumber(rateValue) * 100);
    if (!Number.isFinite(piastresPerHour) || piastresPerHour <= 0) {
      setError('اكتب سعر ساعة صحيح');
      return;
    }
    if (!Number.isFinite(effectiveFrom)) {
      setError('اختار تاريخ بداية السعر');
      return;
    }
    if (needsConfirmation && !confirmed) {
      setError('فعّل خانة التأكيد الأول عشان نعرف إنك عارف إن الأجور القديمة ممكن تتغير');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const input = { effectiveFrom, piastresPerHour, note: note.trim() };
      if (rate?.id !== undefined) {
        await updateRate(rate.id, input);
      } else {
        await addRate(input);
      }
      toast('اتحفظ سعر الساعة');
      onClose();
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet title={isEditing ? 'تعديل سعر الساعة' : 'تغيير سعر الساعة'} onClose={onClose}>
      <form onSubmit={handleSave} className="space-y-4">
        <Field label="سعر الساعة بالجنيه">
          <input
            type="text"
            inputMode="decimal"
            className={inputClass}
            value={rateValue}
            onChange={(e) => setRateValue(e.target.value)}
            placeholder="مثال: ١٨"
          />
        </Field>
        {isBaseRate ? (
          <p className="text-sm text-ink-muted">ده السعر الأساسي اللي بدأنا بيه، ومالوش تاريخ بداية.</p>
        ) : (
          <Field label="يبدأ من يوم" hint="الشغل اللي قبل التاريخ ده هيفضل بالسعر القديم">
            <input
              type="date"
              className={inputClass}
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
            />
          </Field>
        )}
        <Field label="ملاحظة (اختياري)">
          <input
            type="text"
            className={inputClass}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="مثال: زيادة مرتب"
          />
        </Field>

        {needsConfirmation && (
          <label className="flex items-start gap-3 rounded-2xl bg-warning-50 px-4 py-3 text-sm leading-relaxed text-warning-700">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1 size-4 accent-primary-600"
            />
            <span>
              {isEditing
                ? 'فاهم إن تعديل سعر قديم ممكن يغير أجور أيام شغل سابقة وتقارير الشهور اللي فاتت.'
                : 'فاهم إن السعر ده بيبدأ من تاريخ فات، وممكن يغير أجور أيام شغل سابقة.'}
            </span>
          </label>
        )}

        <FormError message={error} />
        <Button type="submit" block disabled={saving}>
          حفظ السعر
        </Button>
      </form>
    </Sheet>
  );
}
