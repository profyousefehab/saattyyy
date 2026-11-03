import { registerSW } from 'virtual:pwa-register';

type Listener = () => void;

class PwaManager {
  private offlineReady = false;
  private online = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private listeners = new Set<Listener>();
  private initialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnlineChange(true));
      window.addEventListener('offline', () => this.handleOnlineChange(false));

      // If already controlled by a service worker, precache is active
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        if (navigator.serviceWorker.controller) {
          this.offlineReady = true;
        }
      }
    }
  }

  public init() {
    if (this.initialized) return;
    this.initialized = true;

    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    try {
      registerSW({
        immediate: true,
        onOfflineReady: () => {
          this.offlineReady = true;
          this.notify();
        },
        onNeedRefresh: () => {
          // Automatic or notify update
        },
        onRegistered: (registration) => {
          if (registration?.active) {
            this.offlineReady = true;
            this.notify();
          }
        },
      });
    } catch {
      // Ignore registration errors in unsupported contexts
    }
  }

  private handleOnlineChange(isOnline: boolean) {
    this.online = isOnline;
    this.notify();
  }

  private notify() {
    for (const listener of this.listeners) {
      listener();
    }
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public isOnline(): boolean {
    return this.online;
  }

  public isOfflineReady(): boolean {
    return this.offlineReady;
  }
}

export const pwaManager = new PwaManager();

