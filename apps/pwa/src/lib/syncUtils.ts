/**
 * Sync utilities for conflict resolution and data merging
 */

/**
 * Resolve conflicts using last-write-wins strategy
 * When timestamps are equal, remote wins (server is source of truth)
 */
export function resolveConflict<T extends { updatedAt?: number }>(
  local: T,
  remote: T
): T {
  const localTime = local.updatedAt || 0;
  const remoteTime = remote.updatedAt || 0;

  return remoteTime >= localTime ? remote : local;
}

/**
 * Merge arrays of objects by ID
 */
export function mergeById<T extends { id: string; updatedAt?: number }>(
  local: T[],
  remote: T[],
  conflictResolver: (local: T, remote: T) => T = resolveConflict
): T[] {
  const merged = new Map<string, T>();

  // Add all local items
  local.forEach((item) => merged.set(item.id, item));

  // Merge remote items
  remote.forEach((remoteItem) => {
    const localItem = merged.get(remoteItem.id);

    if (localItem) {
      // Conflict - resolve
      merged.set(remoteItem.id, conflictResolver(localItem, remoteItem));
    } else {
      // New remote item
      merged.set(remoteItem.id, remoteItem);
    }
  });

  return Array.from(merged.values());
}

/**
 * Calculate diff between local and remote
 */
export function calculateDiff<T extends { id: string; updatedAt?: number }>(
  local: T[],
  remote: T[]
): {
  added: T[];
  updated: T[];
  deleted: string[];
} {
  const localMap = new Map(local.map((item) => [item.id, item]));
  const remoteMap = new Map(remote.map((item) => [item.id, item]));

  const added: T[] = [];
  const updated: T[] = [];
  const deleted: string[] = [];

  // Find added and updated
  remote.forEach((remoteItem) => {
    const localItem = localMap.get(remoteItem.id);

    if (!localItem) {
      added.push(remoteItem);
    } else {
      // Check if updated (compare timestamps or stringified data)
      const localTime = localItem.updatedAt || 0;
      const remoteTime = remoteItem.updatedAt || 0;

      if (remoteTime > localTime) {
        updated.push(remoteItem);
      }
    }
  });

  // Find deleted
  local.forEach((localItem) => {
    if (!remoteMap.has(localItem.id)) {
      deleted.push(localItem.id);
    }
  });

  return { added, updated, deleted };
}

/**
 * Apply diff to local data
 */
export function applyDiff<T extends { id: string }>(
  local: T[],
  diff: {
    added: T[];
    updated: T[];
    deleted: string[];
  }
): T[] {
  // Remove deleted items
  let result = local.filter((item) => !diff.deleted.includes(item.id));

  // Update existing items
  const updateMap = new Map(diff.updated.map((item) => [item.id, item]));
  result = result.map((item) => updateMap.get(item.id) || item);

  // Add new items
  result = [...result, ...diff.added];

  return result;
}

/**
 * Generate a checksum for data to detect changes
 */
export function generateChecksum(data: unknown): string {
  const str = JSON.stringify(data);
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return hash.toString(36);
}

/**
 * Check if two objects are equal
 */
export function isEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Exponential backoff calculator
 */
export function calculateBackoff(
  retryCount: number,
  baseDelay = 1000,
  maxDelay = 300000
): number {
  const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
  // Add jitter (random 0-25% of delay)
  const jitter = delay * 0.25 * Math.random();
  return delay + jitter;
}

/**
 * Batch items into chunks
 */
export function batchItems<T>(items: T[], batchSize: number): T[][] {
  const batches: T[][] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }

  return batches;
}
