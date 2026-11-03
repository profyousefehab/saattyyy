import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { IconButton } from '@/components/ui';

interface SheetProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Sheet({ title, onClose, children }: SheetProps) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      // Trap keyboard focus inside the sheet dialog
      if (event.key === 'Tab' && sheetRef.current) {
        const focusables = sheetRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    // Store previous active element to restore focus when the modal closes
    const previousActiveElement = document.activeElement as HTMLElement | null;

    // Prevent background scrolling on both body and html (vital for mobile Safari)
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    // Mark background root as aria-hidden for assistive technologies
    const rootElement = document.getElementById('root');
    const prevAriaHidden = rootElement ? rootElement.getAttribute('aria-hidden') : null;
    if (rootElement) {
      rootElement.setAttribute('aria-hidden', 'true');
    }

    window.addEventListener('keydown', handleKey);

    // Focus the sheet modal on mount for accessibility
    sheetRef.current?.focus();

    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      if (rootElement) {
        if (prevAriaHidden === null) {
          rootElement.removeAttribute('aria-hidden');
        } else {
          rootElement.setAttribute('aria-hidden', prevAriaHidden);
        }
      }
      previousActiveElement?.focus?.();
    };
  }, []);

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop overlay covering the full viewport including bottom navigation */}
      <button
        type="button"
        aria-label="إغلاق"
        onClick={onClose}
        onTouchMove={(event) => event.preventDefault()}
        className="absolute inset-0 bg-ink/40 animate-fade-in"
      />

      {/* Modal Sheet Container */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="relative flex max-h-[90vh] supports-[max-height:90dvh]:max-h-[90dvh] w-full max-w-md flex-col rounded-t-[24px] bg-surface shadow-sheet animate-sheet-up focus:outline-none"
      >
        <header className="flex shrink-0 items-center justify-between px-5 pb-3 pt-4">
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          <IconButton label="إغلاق" onClick={onClose}>
            <X size={20} strokeWidth={1.75} />
          </IconButton>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[calc(env(safe-area-inset-bottom)+24px)]">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
