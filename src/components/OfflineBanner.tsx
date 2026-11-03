import { WifiOff } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export function OfflineBanner() {
  const { isOnline } = useNetworkStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-5 mb-3 flex items-center justify-center gap-2 rounded-2xl border border-warning-100 bg-warning-50 px-3.5 py-2 text-xs font-medium text-warning-700 shadow-sm animate-fade-in"
    >
      <WifiOff size={14} className="shrink-0" />
      <span>بدون إنترنت — بياناتك محفوظة على الجهاز</span>
    </div>
  );
}

