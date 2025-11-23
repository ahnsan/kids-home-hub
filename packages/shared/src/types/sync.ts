/**
 * Offline sync types
 */

export type QueueStatus = 'pending' | 'processing' | 'synced' | 'failed';
export type QueuePriority = 1 | 5 | 10;

/**
 * Queued action for offline sync
 */
export interface QueuedAction {
  id?: number;
  operation: 'create' | 'update' | 'delete';
  entityType: 'transaction' | 'chore' | 'redeem';
  entityId: string;
  data: unknown;
  priority: QueuePriority;
  status: QueueStatus;
  retryCount: number;
  maxRetries: number;
  createdAt: number;
  nextRetryAt?: number;
  lastError?: string;
  failedAt?: number;
  syncedAt?: number;
}

/**
 * Sync statistics
 */
export interface SyncStats {
  pending: number;
  processing: number;
  failed: number;
  total: number;
}

/**
 * Conflict record
 */
export interface SyncConflict {
  id: string;
  entityType: string;
  entityId: string;
  localVersion: unknown;
  serverVersion: unknown;
  timestamp: number;
  resolved: boolean;
  resolution?: 'local' | 'server' | 'merge';
  mergedVersion?: unknown;
  resolvedAt?: number;
}
