export class AppError extends Error {}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error && typeof error === 'object') {
    const err = error as { name?: string; message?: string };
    switch (err.name) {
      case 'QuotaExceededError':
        return 'مساحة التخزين في المتصفح ممتلئة، يرجى تحرير مساحة على جهازك';
      case 'DatabaseClosedError':
        return 'تم إغلاق قاعدة البيانات بواسطة النظام، يرجى إعادة فتح التطبيق';
      case 'ConstraintError':
        return 'حدث تعارض في البيانات، لم يتم الحفظ';
      case 'SecurityError':
        return 'المتصفح يقيد التخزين المحلي (يرجى إيقاف وضع التصفح الخاص المقيد)';
      case 'VersionError':
        return 'إصدار قاعدة البيانات غير متوافق';
      case 'NotFoundError':
        return 'السجل المطلوب غير موجود';
      case 'TransactionInactiveError':
      case 'AbortError':
        return 'تم إلغاء عملية الحفظ للحفاظ على سلامة البيانات، حاول مجدداً';
    }

    if (err.message && typeof err.message === 'string' && err.message.length < 120) {
      // If it has a specific message that isn't too long or cryptic
      if (/indexeddb|dexie|quota|storage/i.test(err.message)) {
        return 'تعذر إتمام عملية التخزين على الجهاز، يرجى المحاولة ثانية';
      }
    }
  }

  return 'حصلت مشكلة غير متوقعة أثناء حفظ البيانات، حاول تاني';
}
