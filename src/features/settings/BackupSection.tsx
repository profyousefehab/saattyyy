import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Download, Upload, ShieldCheck, AlertTriangle, Database, Smartphone, HardDrive } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { Sheet } from '@/components/Sheet';
import { useToast } from '@/components/Toast';
import {
  exportBackupFile,
  getLastBackupTimestamp,
  restoreBackup,
  validateBackup,
  type BackupPayload,
  type ValidationSuccess,
} from '@/lib/backup';
import { checkStorageStatus, requestPersistentStorage, type StorageStatus } from '@/lib/storage';
import { getErrorMessage } from '@/lib/errors';
import { formatDayLabel, cairoDateKey, formatClock } from '@/lib/time';

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

export function BackupSection() {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [lastBackup, setLastBackup] = useState<number | null>(() => getLastBackupTimestamp());
  const [storageStatus, setStorageStatus] = useState<StorageStatus | null>(null);
  const [exporting, setExporting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<{
    payload: BackupPayload;
    summary: ValidationSuccess['summary'];
  } | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  useEffect(() => {
    checkStorageStatus().then(setStorageStatus);
  }, []);

  async function handleExport() {
    setExporting(true);
    try {
      await exportBackupFile();
      setLastBackup(Date.now());
      toast('تم حفظ وتنزيل النسخة الاحتياطية بنجاح');
    } catch (error) {
      toast(getErrorMessage(error), 'error');
    } finally {
      setExporting(false);
    }
  }

  function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reset file input value so selecting the same file again triggers change
    event.target.value = '';

    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        const validation = validateBackup(parsed);

        if (!validation.valid) {
          toast(validation.error, 'error');
          return;
        }

        setRestoreError(null);
        setPendingRestore({
          payload: validation.payload,
          summary: validation.summary,
        });
      } catch {
        toast('الملف الذي اخترته غير صالح (تأكد أنه ملف JSON سليم)', 'error');
      }
    };
    reader.onerror = () => {
      toast('حدث خطأ أثناء قراءة الملف، حاول مجدداً', 'error');
    };
    reader.readAsText(file);
  }

  async function confirmRestore() {
    if (!pendingRestore) return;
    setRestoring(true);
    setRestoreError(null);

    try {
      await restoreBackup(pendingRestore.payload);
      setLastBackup(Date.now());
      toast('تمت استعادة البيانات بنجاح بعد حفظ نسخة أمان تلقائية');
      setPendingRestore(null);
    } catch (error) {
      setRestoreError(getErrorMessage(error));
    } finally {
      setRestoring(false);
    }
  }

  async function handleRequestPersistence() {
    const granted = await requestPersistentStorage();
    const updated = await checkStorageStatus();
    setStorageStatus(updated);
    if (granted) {
      toast('تم تفعيل التخزين الدائم بنجاح');
    } else {
      toast('لم يمنح المتصفح إذناً بالتخزين الدائم (البيانات تظل محفوظة محلياً)', 'error');
    }
  }

  const isOldBackup = lastBackup !== null && Date.now() - lastBackup > FOURTEEN_DAYS_MS;

  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-2">
        <Database size={20} className="text-primary-700" />
        <h2 className="text-base font-semibold text-ink">النسخ الاحتياطي وحماية البيانات</h2>
      </div>

      {/* Backup Status Reminder */}
      {lastBackup ? (
        <div className="rounded-xl bg-canvas-deep px-4 py-3 text-xs leading-relaxed text-ink-muted">
          <span>آخر نسخة احتياطية ناجحة: </span>
          <span className="font-semibold text-ink">
            {formatDayLabel(cairoDateKey(lastBackup))} — {formatClock(lastBackup)}
          </span>
          {isOldBackup && (
            <p className="mt-1 font-medium text-warning-700">
              مرّ أكثر من أسبوعين على آخر نسخة، يُنصح بتصدير نسخة جديدة الآن.
            </p>
          )}
        </div>
      ) : (
        <div className="flex items-start gap-2.5 rounded-xl border border-warning-100 bg-warning-50 p-3 text-xs leading-relaxed text-warning-700">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>لم تقم بإنشاء نسخة احتياطية بعد. يُنصح بحفظ نسخة دورية لحماية ساعات عملك من الفقدان.</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <Button variant="secondary" onClick={handleExport} disabled={exporting} className="h-12 text-sm">
          <Download size={16} />
          {exporting ? 'جاري التصدير...' : 'نسخة احتياطية (JSON)'}
        </Button>

        <Button
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={restoring}
          className="h-12 text-sm"
        >
          <Upload size={16} />
          استعادة نسخة
        </Button>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* Storage Persistence Info */}
      <div className="border-t border-line-soft pt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 font-medium text-ink-soft">
            <HardDrive size={15} />
            حالة التخزين في المتصفح:
          </span>
          {storageStatus?.persisted ? (
            <span className="inline-flex items-center gap-1 font-semibold text-primary-700">
              <ShieldCheck size={14} />
              تخزين دائم ومحمي
            </span>
          ) : (
            <span className="text-ink-muted">تخزين المتصفح القياسي</span>
          )}
        </div>

        {storageStatus?.supported && !storageStatus.persisted && (
          <div className="mt-2.5">
            <Button
              variant="ghost"
              className="h-9 w-full text-xs text-primary-700 hover:bg-primary-50"
              onClick={handleRequestPersistence}
            >
              طلب حماية التخزين من الحذف التلقائي
            </Button>
          </div>
        )}
      </div>

      {/* Realistic Safari Warning */}
      <div className="rounded-xl border border-line-soft bg-canvas-deep p-3.5 text-xs leading-relaxed text-ink-muted">
        <p className="font-semibold text-ink">تنبيه هام حول حفظ البيانات:</p>
        <p className="mt-1">
          بياناتك محفوظة محلياً داخل هذا الجهاز في قاعدة بيانات IndexedDB بالكامل بدون خوادم خارجية. ولكن إذا قمت بمسح
          بيانات الموقع في متصفح Safari أو قمت بإزالة التطبيق، فقد يحذف المتصفح هذه البيانات. احرص دائماً على تنزيل
          نسخة احتياطية وحفظها في مكان آمن مثل iCloud Drive أو بريدك الإلكتروني.
        </p>
      </div>

      {/* iPhone Installation Tip */}
      <div className="rounded-xl border border-primary-100 bg-primary-50/60 p-3.5 text-xs leading-relaxed text-primary-700">
        <div className="flex items-center gap-1.5 font-semibold">
          <Smartphone size={15} />
          <span>تثبيت التطبيق على آيفون:</span>
        </div>
        <p className="mt-1">
          افتح الموقع في Safari، اضغط زر المشاركة (Share)، ثم اختر «إضافة إلى الصفحة الرئيسية» (Add to Home Screen)
          ليعمل كتطبيق مستقل وسريع بدون شريط المتصفح.
        </p>
      </div>

      {/* Restore Confirmation Sheet */}
      {pendingRestore && (
        <Sheet title="تأكيد استعادة النسخة الاحتياطية" onClose={() => setPendingRestore(null)}>
          <div className="space-y-4 text-sm leading-relaxed text-ink">
            <div className="rounded-2xl border border-warning-100 bg-warning-50 p-4 text-warning-700">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle size={18} />
                <span>تحذير: سيتم استبدال البيانات الحالية</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed">
                سيتم استبدال جلسات العمل وسجل الأسعار والإجازات المسجلة حالياً بالبيانات الموجودة في ملف النسخة
                الاحتياطية.
              </p>
              <p className="mt-2 text-xs font-semibold text-primary-700">
                ✓ سيقوم التطبيق تلقائياً بتنزيل نسخة أمان لبياناتك الحالية قبل البدء.
              </p>
            </div>

            <div className="rounded-xl border border-line-soft bg-surface p-3 text-xs space-y-1.5 text-ink-soft">
              <p className="font-semibold text-ink">محتويات النسخة المراد استعادتها:</p>
              <p>• جلسات العمل: {pendingRestore.summary.sessionCount} جلسة</p>
              <p>• سجلات الأسعار: {pendingRestore.summary.rateCount} سجل</p>
              <p>• أيام الإجازة: {pendingRestore.summary.leaveCount} يوم</p>
              <p className="text-ink-muted">
                تاريخ تصدير النسخة: {new Date(pendingRestore.payload.exportedAt).toLocaleString('ar-EG')}
              </p>
            </div>

            {restoreError && (
              <p className="rounded-xl bg-error-50 px-3 py-2 text-xs text-error-700">{restoreError}</p>
            )}

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="danger"
                className="flex-1"
                disabled={restoring}
                onClick={confirmRestore}
              >
                {restoring ? 'جاري الاستعادة...' : 'تأكيد الاستبدال والاستعادة'}
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                disabled={restoring}
                onClick={() => setPendingRestore(null)}
              >
                إلغاء
              </Button>
            </div>
          </div>
        </Sheet>
      )}
    </Card>
  );
}

