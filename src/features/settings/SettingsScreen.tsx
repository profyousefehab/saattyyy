import { ArrowRight } from 'lucide-react';
import { IconButton } from '@/components/ui';
import { useLedger } from '@/hooks/useLedger';
import { PlanningSection } from '@/features/settings/PlanningSection';
import { RateSection } from '@/features/settings/RateSection';
import { BackupSection } from '@/features/settings/BackupSection';

interface SettingsScreenProps {
  onBack: () => void;
}

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  const ledger = useLedger();

  if (!ledger) return null;

  return (
    <div className="px-5 pt-[calc(env(safe-area-inset-top)+12px)]">
      <header className="flex items-center gap-3">
        <IconButton label="رجوع" onClick={onBack} className="-ms-2">
          <ArrowRight size={22} strokeWidth={1.75} />
        </IconButton>
        <h1 className="text-2xl font-semibold text-ink">الإعدادات</h1>
      </header>

      <div className="mt-6 space-y-4 pb-10">
        <PlanningSection settings={ledger.settings} rates={ledger.rates} />
        <RateSection rates={ledger.rates} sessions={ledger.sessions} />
        <BackupSection />
      </div>
    </div>
  );
}
