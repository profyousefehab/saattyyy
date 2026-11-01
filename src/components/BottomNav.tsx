import { CalendarDays, ChartPie, House, type LucideIcon } from 'lucide-react';

export type MainTab = 'home' | 'log' | 'reports';

const TABS: { id: MainTab; label: string; icon: LucideIcon }[] = [
  { id: 'home', label: 'الرئيسية', icon: House },
  { id: 'log', label: 'سجل الشغل', icon: CalendarDays },
  { id: 'reports', label: 'التقارير', icon: ChartPie },
];

interface BottomNavProps {
  active: MainTab;
  onChange: (tab: MainTab) => void;
}

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]">
      <ul className="grid grid-cols-3">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = id === active;
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => onChange(id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex min-h-16 w-full flex-col items-center justify-center gap-1 text-xs font-medium transition ${
                  isActive ? 'text-primary-700' : 'text-ink-muted hover:text-ink-soft'
                }`}
              >
                <Icon size={22} strokeWidth={isActive ? 2 : 1.75} />
                {label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
