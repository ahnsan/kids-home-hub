/**
 * Offline sync queue management
 */

import { db } from './schema';
import { api } from '../api/client';
import type { QueuedAction, SyncStats } from '@kids-home-hub/shared';

/**
 * Queue an action for offline sync
 */
export async function queueOfflineAction(params: {
  url: string;
  method: string;
  body: string;
  headers?: Record<string, string>;
}): Promise<void> {
  const queueItem: QueuedAction = {
    operation: 'create',
    entityType: 'transaction', // inferred from URL
    entityId: crypto.randomUUID(),
    data: params,
    priority: 5,
    status: 'pending',
    retryCount: 0,
    maxRetries: 5,
    createdAt: Date.now()
  };

  await db.syncQueue.add(queueItem);
}

/**
 * Process offline sync queue
 */
export async function processSyncQueue(): Promise<SyncStats> {
  const pending = await db.syncQueue
    .where('status')
    .equals('pending')
    .toArray();

  if (pending.length === 0) {
    return { pending: 0, processing: 0, failed: 0, total: 0 };
  }

  let successCount = 0;
  let failureCount = 0;

  for (const item of pending) {
    try {
      // Update status to processing
      await db.syncQueue.update(item.id!, { status: 'processing' });

      // Attempt to sync
      const data = item.data as { url: string; method: string; body: string; headers?: Record<string, string> };
      await api(data.url, {
        method: data.method,
        body: data.body,
        headers: data.headers
      });

      // Success - remove from queue
      await db.syncQueue.delete(item.id!);
      successCount++;
    } catch (error) {
      // Handle failure
      const retryCount = item.retryCount + 1;

      if (retryCount >= item.maxRetries) {
        // Max retries exceeded
        await db.syncQueue.update(item.id!, {
          status: 'failed',
          retryCount,
          lastError: error instanceof Error ? error.message : 'Unknown error',
          failedAt: Date.now()
        });
        failureCount++;
      } else {
        // Schedule retry with exponential backoff
        const backoffMs = Math.min(1000 * Math.pow(2, retryCount), 300000);
        await db.syncQueue.update(item.id!, {
          status: 'pending',
          retryCount,
          nextRetryAt: Date.now() + backoffMs,
          lastError: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  return getSyncStats();
}

/**
 * Get sync queue statistics
 */
export async function getSyncStats(): Promise<SyncStats> {
  const [pending, processing, failed] = await Promise.all([
    db.syncQueue.where('status').equals('pending').count(),
    db.syncQueue.where('status').equals('processing').count(),
    db.syncQueue.where('status').equals('failed').count()
  ]);

  return {
    pending,
    processing,
    failed,
    total: pending + processing + failed
  };
}

/**
 * Clear failed items from queue
 */
export async function clearFailedItems(): Promise<number> {
  const failed = await db.syncQueue.where('status').equals('failed').toArray();
  await db.syncQueue.bulkDelete(failed.map(item => item.id!));
  return failed.length;
}

/**
 * Start periodic sync (every 30 seconds)
 */
export function startPeriodicSync(): void {
  setInterval(async () => {
    if (navigator.onLine) {
      const stats = await getSyncStats();
      if (stats.pending > 0) {
        await processSyncQueue();
      }
    }
  }, 30000);

  // Also sync when coming online
  window.addEventListener('online', () => {
    void processSyncQueue();
  });
}
