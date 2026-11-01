import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { Check, TriangleAlert } from 'lucide-react';

type ToastTone = 'success' | 'error';

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

type ShowToast = (message: string, tone?: ToastTone) => void;

const ToastContext = createContext<ShowToast | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const show = useCallback<ShowToast>((message, tone = 'success') => {
    const id = Date.now() + Math.random();
    setItems((previous) => [...previous, { id, message, tone }]);
    window.setTimeout(() => {
      setItems((previous) => previous.filter((item) => item.id !== id));
    }, 3200);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+12px)] z-[60] mx-auto flex max-w-md flex-col items-center gap-2 px-4"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium shadow-sheet animate-toast-in ${
              item.tone === 'error' ? 'bg-error-700 text-white' : 'bg-ink text-white'
            }`}
          >
            {item.tone === 'error' ? <TriangleAlert size={18} /> : <Check size={18} />}
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ShowToast {
  const show = useContext(ToastContext);
  if (!show) throw new Error('useToast must be used inside ToastProvider');
  return show;
}
