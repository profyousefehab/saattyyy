import { useState, type FormEvent } from 'react';
import { Button, Card, Field, FormError, inputClass } from '@/components/ui';
import { useToast } from '@/components/Toast';
import { useNow } from '@/hooks/useNow';
import type { RateRecord, Settings } from '@/lib/db';
import { rateRecordAt } from '@/lib/calculations';
import { saveSettings } from '@/lib/repository';
import { getErrorMessage } from '@/lib/errors';
import { formatEgp, parseArabicNumber } from '@/lib/format';

interface PlanningSectionProps {
  settings: Settings;
  rates: RateRecord[];
}

export function PlanningSection({ settings, rates }: PlanningSectionProps) {
  const toast = useToast();
  const now = useNow();
  const [hours, setHours] = useState(() => String(settings.dailyTargetMinutes / 60));
  const [workdays, setWorkdays] = useState(() => String(settings.plannedWorkdays));
  const [allowance, setAllowance] = useState(() => String(settings.leaveAllowance));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const hoursValue = parseArabicNumber(hours);
  const workdaysValue = parseArabicNumber(workdays);
  const allowanceValue = parseArabicNumber(allowance);
  const rate = rateRecordAt(rates, now).piastresPerHour;
  const isValid =
    hoursValue >= 1 &&
    hoursValue <= 16 &&
    Number.isInteger(hoursValue * 2) &&
    Number.isInteger(workdaysValue) &&
    workdaysValue >= 1 &&
    workdaysValue <= 31 &&
    Number.isInteger(allowanceValue) &&
    allowanceValue >= 0 &&
    allowanceValue <= 31;
  const previewTarget = isValid ? Math.round(workdaysValue * hoursValue * rate) : null;

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    if (!isValid) {
      setError('تأكد إن الأرقام صح: الساعات من ١ لـ ١٦ (بنص ساعة)، وأيام الشغل من ١ لـ ٣١، والإجازات من ٠ لـ ٣١');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await saveSettings({
        dailyTargetMinutes: Math.round(hoursValue * 60),
        plannedWorkdays: workdaysValue,
        leaveAllowance: allowanceValue,
      });
      toast('اتحفظت الأهداف');
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <h2 className="text-base font-semibold text-ink">أهداف الشهر</h2>
      <form onSubmit={handleSave} className="mt-4 space-y-4">
        <Field label="ساعات الشغل المطلوبة في اليوم" hint="الهدف اليومي، وبيتحسب منه الهدف الشهري">
          <input
            type="text"
            inputMode="decimal"
            className={inputClass}
            value={hours}
            onChange={(e) => setHours(e.target.value)}
          />
        </Field>
        <Field label="أيام الشغل في الشهر">
          <input
            type="text"
            inputMode="numeric"
            className={inputClass}
            value={workdays}
            onChange={(e) => setWorkdays(e.target.value)}
          />
        </Field>
        <Field label="الإجازات الأساسية في الشهر">
          <input
            type="text"
            inputMode="numeric"
            className={inputClass}
            value={allowance}
            onChange={(e) => setAllowance(e.target.value)}
          />
        </Field>
        <p className="text-sm text-ink-muted">
          الهدف الشهري بالسعر الحالي:{' '}
          <span className="font-medium text-ink">
            {previewTarget === null ? '—' : `${formatEgp(previewTarget)} جنيه`}
          </span>
        </p>
        <FormError message={error} />
        <Button type="submit" block disabled={saving}>
          حفظ الأهداف
        </Button>
      </form>
    </Card>
  );
}
