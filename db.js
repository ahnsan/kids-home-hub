/**
 * IndexedDB Database Manager for Kids Home Hub
 *
 * Features:
 * - Dexie.js wrapper for easier API
 * - Structured schema for offline-first operations
 * - Transaction management
 * - Sync queue management
 * - Conflict tracking
 * - Metadata storage
 */

import Dexie from 'dexie';

// Database version
const DB_VERSION = 1;
const DB_NAME = 'kidsHomeHub';

/**
 * Kids Home Hub Database Class
 */
class KidsHubDatabase extends Dexie {
  constructor() {
    super(DB_NAME);

    // Define database schema
    this.version(DB_VERSION).stores({
      // Transactions: money, points, screen time operations
      transactions: '++id, childId, type, syncStatus, timestamp, createdAt, [childId+type], [syncStatus+priority]',

      // Chores: completed chores with point rewards
      chores: '++id, childId, syncStatus, timestamp, createdAt, [childId+syncStatus]',

      // Sync Queue: pending operations waiting for network
      syncQueue: '++id, status, priority, createdAt, nextRetryAt, retryCount, [status+priority], [status+nextRetryAt]',

      // Metadata: cached totals, settings, device info
      metadata: 'key, lastUpdated, pendingChanges',

      // Conflicts: version conflicts between local and server
      conflicts: '++id, entityType, entityId, resolved, timestamp, [resolved+timestamp]',

      // Redemptions: points redeemed for screen time
      redemptions: '++id, childId, syncStatus, timestamp, createdAt, [childId+syncStatus]',
    });

    // Table shortcuts
    this.transactions = this.table('transactions');
    this.chores = this.table('chores');
    this.syncQueue = this.table('syncQueue');
    this.metadata = this.table('metadata');
    this.conflicts = this.table('conflicts');
    this.redemptions = this.table('redemptions');
  }

  /**
   * Initialize database with default data
   */
  async initialize() {
    try {
      await this.open();
      console.log('[DB] Database opened successfully');

      // Check if already initialized
      const initialized = await this.metadata.get('initialized');

      if (!initialized) {
        console.log('[DB] First-time initialization');

        // Set default metadata
        await this.metadata.bulkPut([
          {
            key: 'initialized',
            value: true,
            lastUpdated: Date.now(),
          },
          {
            key: 'deviceId',
            value: this.generateDeviceId(),
            lastUpdated: Date.now(),
          },
          {
            key: 'dbVersion',
            value: DB_VERSION,
            lastUpdated: Date.now(),
          },
        ]);

        // Initialize totals for each child
        const children = ['adam', 'sami'];
        const features = ['money', 'points', 'screen'];

        const metadataEntries = [];
        for (const child of children) {
          for (const feature of features) {
            metadataEntries.push({
              key: `${feature}:total:${child}`,
              value: 0,
              lastUpdated: Date.now(),
              pendingChanges: 0,
            });
          }
        }

        await this.metadata.bulkPut(metadataEntries);
        console.log('[DB] Initialized with default data');
      }

      return true;
    } catch (error) {
      console.error('[DB] Initialization failed:', error);
      return false;
    }
  }

  /**
   * Generate unique device ID
   */
  generateDeviceId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `device_${timestamp}_${random}`;
  }

  /**
   * Get device ID
   */
  async getDeviceId() {
    const record = await this.metadata.get('deviceId');
    return record?.value || null;
  }

  /**
   * Add transaction to database and sync queue
   */
  async addTransaction(transaction) {
    try {
      // Generate ID if not provided
      if (!transaction.id) {
        transaction.id = this.generateId();
      }

      // Set defaults
      const transactionData = {
        ...transaction,
        createdAt: transaction.createdAt || Date.now(),
        syncStatus: 'pending',
        localVersion: 1,
        deviceId: await this.getDeviceId(),
      };

      // Use transaction for atomic operations
      await this.transaction('rw', this.transactions, this.syncQueue, this.metadata, async () => {
        // 1. Add transaction
        await this.transactions.add(transactionData);

        // 2. Update metadata totals
        await this.updateMetadataTotal(
          transactionData.type,
          transactionData.childId,
          transactionData.amount,
          transactionData.action
        );

        // 3. Add to sync queue
        await this.addToSyncQueue({
          operation: 'create',
          entityType: 'transaction',
          entityId: transactionData.id,
          data: transactionData,
          priority: this.calculatePriority(transactionData),
        });
      });

      console.log('[DB] Transaction added:', transactionData.id);
      return transactionData;
    } catch (error) {
      console.error('[DB] Failed to add transaction:', error);
      throw error;
    }
  }

  /**
   * Add chore entry to database
   */
  async addChore(chore) {
    try {
      if (!chore.id) {
        chore.id = this.generateId();
      }

      const choreData = {
        ...chore,
        createdAt: chore.createdAt || Date.now(),
        syncStatus: 'pending',
        deviceId: await this.getDeviceId(),
      };

      await this.transaction('rw', this.chores, this.syncQueue, this.metadata, async () => {
        // 1. Add chore
        await this.chores.add(choreData);

        // 2. Update points total
        await this.updateMetadataTotal(
          'points',
          choreData.childId,
          choreData.totalPoints,
          'add'
        );

        // 3. Add to sync queue
        await this.addToSyncQueue({
          operation: 'create',
          entityType: 'chore',
          entityId: choreData.id,
          data: choreData,
          priority: 5,
        });
      });

      console.log('[DB] Chore added:', choreData.id);
      return choreData;
    } catch (error) {
      console.error('[DB] Failed to add chore:', error);
      throw error;
    }
  }

  /**
   * Update metadata total
   */
  async updateMetadataTotal(type, childId, amount, action) {
    const key = `${type}:total:${childId}`;
    const current = await this.metadata.get(key);

    const delta = action === 'add' ? amount : -amount;
    const newValue = (current?.value || 0) + delta;

    await this.metadata.put({
      key,
      value: Math.max(0, newValue), // Prevent negative values
      lastUpdated: Date.now(),
      pendingChanges: (current?.pendingChanges || 0) + 1,
    });
  }

  /**
   * Add item to sync queue
   */
  async addToSyncQueue(item) {
    const queueItem = {
      id: this.generateId(),
      ...item,
      createdAt: Date.now(),
      status: 'pending',
      retryCount: 0,
      maxRetries: 5,
      lastError: null,
      nextRetryAt: null,
    };

    await this.syncQueue.add(queueItem);
    return queueItem;
  }

  /**
   * Get pending sync queue items
   */
  async getPendingSyncItems(limit = 10) {
    return this.syncQueue
      .where('status')
      .equals('pending')
      .and((item) => {
        // Only include items ready to retry
        return !item.nextRetryAt || item.nextRetryAt <= Date.now();
      })
      .sortBy('priority')
      .then((items) => items.reverse().slice(0, limit));
  }

  /**
   * Mark sync item as synced
   */
  async markSynced(itemId, serverResponse = {}) {
    await this.transaction('rw', this.syncQueue, this.transactions, this.chores, this.metadata, async () => {
      // 1. Get queue item
      const queueItem = await this.syncQueue.get(itemId);
      if (!queueItem) return;

      // 2. Delete from queue
      await this.syncQueue.delete(itemId);

      // 3. Update entity status
      const entityTable = queueItem.entityType === 'transaction' ? this.transactions : this.chores;
      const entity = await entityTable.get(queueItem.entityId);

      if (entity) {
        entity.syncStatus = 'synced';
        entity.serverVersion = serverResponse.version || entity.localVersion;
        entity.syncedAt = Date.now();
        await entityTable.put(entity);
      }

      // 4. Update metadata
      const metadataKey = `${queueItem.data.type}:total:${queueItem.data.childId}`;
      const metadata = await this.metadata.get(metadataKey);

      if (metadata && metadata.pendingChanges > 0) {
        metadata.pendingChanges -= 1;
        metadata.lastSyncedAt = Date.now();
        await this.metadata.put(metadata);
      }
    });

    console.log('[DB] Sync item marked as synced:', itemId);
  }

  /**
   * Mark sync item as failed and schedule retry
   */
  async markSyncFailed(itemId, error) {
    const item = await this.syncQueue.get(itemId);
    if (!item) return;

    item.retryCount += 1;
    item.lastError = error.message || String(error);

    if (item.retryCount >= item.maxRetries) {
      // Max retries exceeded
      item.status = 'failed';
      item.failedAt = Date.now();
    } else {
      // Schedule retry with exponential backoff
      const backoffMs = Math.min(
        1000 * Math.pow(2, item.retryCount), // Exponential: 2^n seconds
        300000 // Max 5 minutes
      );

      item.status = 'pending';
      item.nextRetryAt = Date.now() + backoffMs;
    }

    await this.syncQueue.put(item);
    console.log('[DB] Sync item retry scheduled:', itemId, `(attempt ${item.retryCount}/${item.maxRetries})`);
  }

  /**
   * Get failed sync items
   */
  async getFailedSyncItems() {
    return this.syncQueue.where('status').equals('failed').toArray();
  }

  /**
   * Retry failed sync item
   */
  async retrySyncItem(itemId) {
    const item = await this.syncQueue.get(itemId);
    if (!item) return;

    item.status = 'pending';
    item.retryCount = 0;
    item.nextRetryAt = null;
    item.lastError = null;

    await this.syncQueue.put(item);
    console.log('[DB] Sync item reset for retry:', itemId);
  }

  /**
   * Get transactions for a child
   */
  async getTransactions(childId, type = null, limit = 50) {
    let query = this.transactions.where({ childId });

    if (type) {
      query = this.transactions.where(['childId', 'type']).equals([childId, type]);
    }

    return query
      .reverse()
      .sortBy('timestamp')
      .then((items) => items.slice(0, limit));
  }

  /**
   * Get chores for a child
   */
  async getChores(childId, limit = 50) {
    return this.chores
      .where({ childId })
      .reverse()
      .sortBy('timestamp')
      .then((items) => items.slice(0, limit));
  }

  /**
   * Get metadata value
   */
  async getMetadata(key) {
    const record = await this.metadata.get(key);
    return record?.value ?? null;
  }

  /**
   * Get total for child and feature
   */
  async getTotal(feature, childId) {
    const key = `${feature}:total:${childId}`;
    return this.getMetadata(key);
  }

  /**
   * Get pending changes count
   */
  async getPendingChangesCount() {
    return this.syncQueue.where('status').equals('pending').count();
  }

  /**
   * Calculate priority for sync item
   */
  calculatePriority(transaction) {
    // Higher priority for deductions (prevent overspending)
    if (transaction.action === 'deduct') return 10;

    // Medium priority for additions
    if (transaction.action === 'add') return 5;

    // Default priority
    return 1;
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clear all data (reset database)
   */
  async clearAll() {
    await this.transaction('rw', this.tables, async () => {
      await Promise.all(this.tables.map((table) => table.clear()));
    });
    console.log('[DB] All data cleared');
  }

  /**
   * Export database for backup
   */
  async exportData() {
    const data = {
      version: DB_VERSION,
      timestamp: Date.now(),
      transactions: await this.transactions.toArray(),
      chores: await this.chores.toArray(),
      syncQueue: await this.syncQueue.toArray(),
      metadata: await this.metadata.toArray(),
      conflicts: await this.conflicts.toArray(),
    };

    return data;
  }

  /**
   * Import database from backup
   */
  async importData(data) {
    if (data.version !== DB_VERSION) {
      throw new Error('Incompatible database version');
    }

    await this.transaction('rw', this.tables, async () => {
      await this.transactions.bulkPut(data.transactions);
      await this.chores.bulkPut(data.chores);
      await this.syncQueue.bulkPut(data.syncQueue);
      await this.metadata.bulkPut(data.metadata);
      await this.conflicts.bulkPut(data.conflicts);
    });

    console.log('[DB] Data imported successfully');
  }
}

// Create and initialize database instance
const db = new KidsHubDatabase();

// Auto-initialize
db.initialize().catch((error) => {
  console.error('[DB] Auto-initialization failed:', error);
});

// Export singleton
export default db;
