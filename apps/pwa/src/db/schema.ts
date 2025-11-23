/**
 * IndexedDB schema using Dexie
 */

import Dexie, { type Table } from 'dexie';
import type { Transaction, ChoreSession, QueuedAction, SyncConflict } from '@kids-home-hub/shared';

/**
 * Metadata stored in IndexedDB
 */
export interface Metadata {
  key: string;
  value: number | string | boolean;
  lastUpdated: number;
  pendingChanges?: number;
  lastSyncedAt?: number;
}

/**
 * Kids Hub Database
 */
export class KidsHubDB extends Dexie {
  transactions!: Table<Transaction, string>;
  chores!: Table<ChoreSession, string>;
  syncQueue!: Table<QueuedAction, number>;
  metadata!: Table<Metadata, string>;
  conflicts!: Table<SyncConflict, string>;

  constructor() {
    super('KidsHubDB');

    this.version(1).stores({
      transactions: 'id, childId, type, syncStatus, timestamp, createdAt',
      chores: 'id, childId, syncStatus, timestamp, createdAt',
      syncQueue: '++id, status, priority, createdAt, nextRetryAt',
      metadata: 'key',
      conflicts: 'id, resolved, timestamp'
    });
  }
}

/**
 * Database singleton instance
 */
export const db = new KidsHubDB();

/**
 * Initialize database
 */
export async function initDatabase(): Promise<void> {
  try {
    await db.open();
  } catch (error) {
    console.error('[DB] Failed to open database:', error);
    throw error;
  }
}

/**
 * Get or create device ID
 */
export async function getDeviceId(): Promise<string> {
  let deviceIdRecord = await db.metadata.get('deviceId');

  if (!deviceIdRecord) {
    const deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    deviceIdRecord = {
      key: 'deviceId',
      value: deviceId,
      lastUpdated: Date.now()
    };
    await db.metadata.put(deviceIdRecord);
  }

  return String(deviceIdRecord.value);
}

/**
 * Clear all data (for testing)
 */
export async function clearAllData(): Promise<void> {
  await db.transactions.clear();
  await db.chores.clear();
  await db.syncQueue.clear();
  await db.metadata.clear();
  await db.conflicts.clear();
}
