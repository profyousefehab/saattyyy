import { useEffect, useState } from 'react';

/**
 * Hook providing the current timestamp in milliseconds.
 * - Immediately updates when the page/app returns to foreground (visibilitychange, focus, pageshow).
 * - Ticks every second purely to refresh the displayed duration without accumulating drift.
 */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const refresh = () => setNow(Date.now());
    const timer = window.setInterval(refresh, intervalMs);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', refresh);
    window.addEventListener('pageshow', refresh);
    window.addEventListener('online', refresh);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('pageshow', refresh);
      window.removeEventListener('online', refresh);
    };
  }, [intervalMs]);

  return now;
}
