/**
 * Storage persistence helper.
 * Requests and inspects persistent storage via the StorageManager API.
 */

export interface StorageStatus {
  supported: boolean;
  persisted: boolean;
  quotaBytes?: number;
  usageBytes?: number;
}

export function isPersistenceSupported(): boolean {
  return typeof navigator !== 'undefined' && 'storage' in navigator && typeof navigator.storage?.persist === 'function';
}

export async function checkStorageStatus(): Promise<StorageStatus> {
  if (!isPersistenceSupported()) {
    return { supported: false, persisted: false };
  }

  try {
    const persisted = await navigator.storage.persisted();
    let quotaBytes: number | undefined;
    let usageBytes: number | undefined;

    if (typeof navigator.storage.estimate === 'function') {
      const estimate = await navigator.storage.estimate();
      quotaBytes = estimate.quota;
      usageBytes = estimate.usage;
    }

    return {
      supported: true,
      persisted,
      quotaBytes,
      usageBytes,
    };
  } catch {
    return { supported: true, persisted: false };
  }
}

export async function requestPersistentStorage(): Promise<boolean> {
  if (!isPersistenceSupported()) {
    return false;
  }

  try {
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

