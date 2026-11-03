import { useEffect, useState } from 'react';
import { BottomNav, type MainTab } from '@/components/BottomNav';
import { ToastProvider } from '@/components/Toast';
import { OfflineBanner } from '@/components/OfflineBanner';
import { HomeScreen } from '@/features/home/HomeScreen';
import { WorkLogScreen } from '@/features/log/WorkLogScreen';
import { ReportsScreen } from '@/features/reports/ReportsScreen';
import { SettingsScreen } from '@/features/settings/SettingsScreen';
import { requestPersistentStorage } from '@/lib/storage';

function App() {
  const [tab, setTab] = useState<MainTab>('home');
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    // Attempt to secure persistent browser storage silently on startup
    requestPersistentStorage();
  }, []);

  return (
    <ToastProvider>
      <div className="min-h-dvh bg-canvas text-ink">
        <div className="fixed inset-x-0 top-[env(safe-area-inset-top)] z-40 mx-auto max-w-md pt-2 pointer-events-none">
          <div className="pointer-events-auto">
            <OfflineBanner />
          </div>
        </div>
        <main className="relative mx-auto min-h-dvh max-w-md pb-[calc(env(safe-area-inset-bottom)+96px)]">
          {settingsOpen ? (
            <SettingsScreen onBack={() => setSettingsOpen(false)} />
          ) : (
            <div key={tab} className="animate-fade-in">
              {tab === 'home' && <HomeScreen onOpenSettings={() => setSettingsOpen(true)} />}
              {tab === 'log' && <WorkLogScreen />}
              {tab === 'reports' && <ReportsScreen />}
            </div>
          )}
        </main>
        {!settingsOpen && <BottomNav active={tab} onChange={setTab} />}
      </div>
    </ToastProvider>
  );
}

export default App;
