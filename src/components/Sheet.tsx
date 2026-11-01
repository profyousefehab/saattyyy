import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { IconButton } from '@/components/ui';

interface SheetProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Sheet({ title, onClose, children }: SheetProps) {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button type="button" aria-label="إغلاق" onClick={onClose} className="absolute inset-0 bg-ink/40 animate-fade-in" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex max-h-[90dvh] w-full max-w-md flex-col rounded-t-[24px] bg-surface shadow-sheet animate-sheet-up"
      >
        <header className="flex items-center justify-between px-5 pb-3 pt-4">
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          <IconButton label="إغلاق" onClick={onClose}>
            <X size={20} strokeWidth={1.75} />
          </IconButton>
        </header>
        <div className="overflow-y-auto px-5 pb-[calc(env(safe-area-inset-bottom)+24px)]">{children}</div>
      </div>
    </div>
  );
}
