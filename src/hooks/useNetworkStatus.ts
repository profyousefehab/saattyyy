import { useEffect, useState } from 'react';
import { pwaManager } from '@/lib/pwa';

export interface NetworkStatus {
  isOnline: boolean;
  isOfflineReady: boolean;
}

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>(() => ({
    isOnline: pwaManager.isOnline(),
    isOfflineReady: pwaManager.isOfflineReady(),
  }));

  useEffect(() => {
    return pwaManager.subscribe(() => {
      setStatus({
        isOnline: pwaManager.isOnline(),
        isOfflineReady: pwaManager.isOfflineReady(),
      });
    });
  }, []);

  return status;
}

