import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-primary-600 text-white shadow-sm hover:bg-primary-700',
  secondary: 'border border-line bg-surface text-ink hover:bg-canvas-deep',
  ghost: 'text-primary-700 hover:bg-primary-50',
  danger: 'border border-error-100 bg-error-50 text-error-700 hover:bg-error-100',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  block?: boolean;
}

export function Button({ variant = 'primary', block = false, className = '', type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-5 text-[15px] font-medium transition duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${block ? 'w-full' : ''} ${className}`}
      {...props}
    />
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

export function IconButton({ label, className = '', children, ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink-soft transition hover:bg-canvas-deep active:scale-95 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-[20px] bg-surface p-5 shadow-card ${className}`}>{children}</section>;
}

export const inputClass =
  'block w-full min-w-0 min-h-11 rounded-xl border border-line bg-surface px-3.5 text-base text-ink outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100';

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-sm font-medium text-ink-soft">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs leading-relaxed text-ink-muted">{hint}</span>}
    </label>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-xl bg-error-50 px-4 py-3 text-sm leading-relaxed text-error-700">
      {message}
    </p>
  );
}

export function ProgressBar({ percent }: { percent: number }) {
  const width = Math.min(100, Math.max(0, percent));
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-line-soft"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(width)}
    >
      <div className="h-full rounded-full bg-primary-600 transition-[width] duration-700 ease-out" style={{ width: `${width}%` }} />
    </div>
  );
}
