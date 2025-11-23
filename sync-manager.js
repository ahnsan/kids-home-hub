// sync-manager.js - Offline-First Sync Manager for Kids Home Hub

import Dexie from 'dexie';
import { v4 as uuidv4 } from 'uuid';

/**
 * SyncManager - Manages offline operations and background sync
 *
 * Features:
 * - Queue-based sync with priority
 * - Exponential backoff retry logic
 * - Conflict detection and resolution
 * - Optimistic UI updates
 * - Online/offline detection
 */
class SyncManager {
  constructor() {
    this.db = null;
    this.deviceId = null;
    this.isOnline = navigator.onLine;
    this.syncInProgress = false;
    this.listeners = new Set();

    // Configuration
    this.config = {
      maxRetries: 5,
      initialBackoff: 1000, // 1 second
      maxBackoff: 300000, // 5 minutes
      batchSize: 10,
    };

    // Monitor online/offline status
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }

  /**
   * Initialize the sync manager
   */
  async init() {
    this.db = await this.openDatabase();
    this.deviceId = await this.getOrCreateDeviceId();

    console.log('[SyncManager] Initialized with device ID:', this.deviceId);

    // Start periodic sync check (every 30 seconds)
    this.startPeriodicSync();
  }

  /**
   * Open IndexedDB database with Dexie
   */
  openDatabase() {
    const db = new Dexie('kidsHomeHub');

    db.version(1).stores({
      transactions: '++id, childId, type, syncStatus, timestamp, createdAt',
      chores: '++id, childId, syncStatus, timestamp, createdAt',
      syncQueue: '++id, status, priority, createdAt, nextRetryAt',
      metadata: 'key',
      conflicts: '++id, resolved, timestamp',
    });

    return db.open();
  }

  /**
   * Get or create device ID
   */
  async getOrCreateDeviceId() {
    let deviceIdRecord = await this.db.metadata.get('deviceId');

    if (!deviceIdRecord) {
      const deviceId = this.generateDeviceId();
      deviceIdRecord = { key: 'deviceId', value: deviceId };
      await this.db.metadata.put(deviceIdRecord);
    }

    return deviceIdRecord.value;
  }

  generateDeviceId() {
    return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ===============================================
  // TRANSACTION OPERATIONS
  // ===============================================

  /**
   * Add a new transaction (money, points, screen time)
   */
  async addTransaction(transaction) {
    const tx = {
      id: uuidv4(),
      ...transaction,
      createdAt: Date.now(),
      syncStatus: 'pending',
      deviceId: this.deviceId,
      localVersion: 1,
      timestamp: transaction.timestamp || new Date().toISOString(),
    };

    try {
      // 1. Store transaction locally
      await this.db.transactions.add(tx);

      // 2. Update metadata (totals)
      await this.updateMetadata(tx);

      // 3. Add to sync queue
      await this.addToSyncQueue({
        entityType: 'transaction',
        entityId: tx.id,
        data: tx,
        priority: this.calculatePriority(tx),
      });

      // 4. Emit event for UI update
      this.emit('transaction-added', tx);

      // 5. Trigger sync if online
      if (this.isOnline) {
        this.triggerSync();
      }

      return tx;

    } catch (error) {
      console.error('[SyncManager] Failed to add transaction:', error);
      throw error;
    }
  }

  /**
   * Add completed chores
   */
  async addChore(chore) {
    const choreEntry = {
      id: uuidv4(),
      ...chore,
      createdAt: Date.now(),
      syncStatus: 'pending',
      deviceId: this.deviceId,
      timestamp: chore.timestamp || new Date().toISOString(),
    };

    try {
      // 1. Store chore locally
      await this.db.chores.add(choreEntry);

      // 2. Update points metadata
      await this.updateMetadata({
        type: 'points',
        childId: chore.childId,
        action: 'add',
        amount: chore.totalPoints,
      });

      // 3. Add to sync queue
      await this.addToSyncQueue({
        entityType: 'chore',
        entityId: choreEntry.id,
        data: choreEntry,
        priority: 5,
      });

      // 4. Emit event
      this.emit('chore-added', choreEntry);

      // 5. Trigger sync
      if (this.isOnline) {
        this.triggerSync();
      }

      return choreEntry;

    } catch (error) {
      console.error('[SyncManager] Failed to add chore:', error);
      throw error;
    }
  }

  /**
   * Calculate priority for queue items
   */
  calculatePriority(transaction) {
    // Higher priority for deductions (prevent overspending)
    if (transaction.action === 'deduct') return 10;

    // Medium priority for additions
    if (transaction.action === 'add') return 5;

    // Default
    return 1;
  }

  /**
   * Update local metadata (totals)
   */
  async updateMetadata(transaction) {
    const metadataKey = `${transaction.type}:total:${transaction.childId}`;

    let metadata = await this.db.metadata.get(metadataKey);

    if (!metadata) {
      metadata = {
        key: metadataKey,
        value: 0,
        lastUpdated: Date.now(),
        pendingChanges: 0,
      };
    }

    // Calculate delta
    const delta = transaction.action === 'add'
      ? transaction.amount
      : -transaction.amount;

    // Update value
    metadata.value += delta;
    metadata.lastUpdated = Date.now();
    metadata.pendingChanges += 1;

    await this.db.metadata.put(metadata);
  }

  // ===============================================
  // SYNC QUEUE MANAGEMENT
  // ===============================================

  /**
   * Add item to sync queue
   */
  async addToSyncQueue({ entityType, entityId, data, priority = 1 }) {
    const queueItem = {
      id: uuidv4(),
      operation: 'create',
      entityType,
      entityId,
      data,
      priority,
      createdAt: Date.now(),
      status: 'pending',
      retryCount: 0,
      maxRetries: this.config.maxRetries,
    };

    await this.db.syncQueue.add(queueItem);

    console.log(`[SyncManager] Added to queue: ${entityType}/${entityId}`);
  }

  /**
   * Get pending sync queue items
   */
  async getPendingQueueItems() {
    const items = await this.db.syncQueue
      .where('status')
      .equals('pending')
      .toArray();

    // Sort by priority (descending), then by createdAt (ascending)
    items.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.createdAt - b.createdAt;
    });

    return items;
  }

  /**
   * Get sync queue statistics
   */
  async getSyncStats() {
    const pending = await this.db.syncQueue.where('status').equals('pending').count();
    const processing = await this.db.syncQueue.where('status').equals('processing').count();
    const failed = await this.db.syncQueue.where('status').equals('failed').count();

    return { pending, processing, failed, total: pending + processing + failed };
  }

  // ===============================================
  // SYNC OPERATIONS
  // ===============================================

  /**
   * Trigger background sync
   */
  async triggerSync() {
    if (this.syncInProgress) {
      console.log('[SyncManager] Sync already in progress, skipping');
      return;
    }

    if (!this.isOnline) {
      console.log('[SyncManager] Offline, skipping sync');
      return;
    }

    this.syncInProgress = true;
    this.emit('sync-start');

    try {
      await this.processQueue();
      this.emit('sync-complete');
    } catch (error) {
      console.error('[SyncManager] Sync failed:', error);
      this.emit('sync-error', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Process sync queue
   */
  async processQueue() {
    const pendingItems = await this.getPendingQueueItems();

    if (pendingItems.length === 0) {
      console.log('[SyncManager] No pending items to sync');
      return;
    }

    console.log(`[SyncManager] Processing ${pendingItems.length} queue items`);

    let successCount = 0;
    let failureCount = 0;

    // Process in batches
    for (let i = 0; i < pendingItems.length; i += this.config.batchSize) {
      const batch = pendingItems.slice(i, i + this.config.batchSize);

      // Process batch items
      for (const item of batch) {
        try {
          await this.syncQueueItem(item);
          successCount++;
        } catch (error) {
          console.error(`[SyncManager] Failed to sync item ${item.id}:`, error);
          await this.handleSyncFailure(item, error);
          failureCount++;
        }
      }
    }

    console.log(`[SyncManager] Sync complete: ${successCount} succeeded, ${failureCount} failed`);

    this.emit('sync-stats', { successCount, failureCount });
  }

  /**
   * Sync a single queue item
   */
  async syncQueueItem(item) {
    // Update status to processing
    await this.db.syncQueue.update(item.id, { status: 'processing' });

    // Determine endpoint
    const endpoint = this.getEndpoint(item.entityType);

    // Send to server
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sync-Id': item.id,
        'X-Device-Id': this.deviceId,
        'X-Local-Version': item.data.localVersion?.toString() || '1',
      },
      body: JSON.stringify(item.data),
    });

    // Handle response
    if (!response.ok) {
      if (response.status === 409) {
        // Conflict detected
        const conflict = await response.json();
        await this.handleConflict(item, conflict);
        throw new Error('Conflict detected');
      }

      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    // Handle success
    await this.handleSyncSuccess(item, result);
  }

  /**
   * Get API endpoint for entity type
   */
  getEndpoint(entityType) {
    const endpoints = {
      transaction: '/transaction',
      chore: '/chores',
      redeem: '/redeem',
    };

    return endpoints[entityType] || '/transaction';
  }

  /**
   * Handle successful sync
   */
  async handleSyncSuccess(item, serverResponse) {
    console.log(`[SyncManager] Sync success: ${item.entityType}/${item.entityId}`);

    // Remove from queue
    await this.db.syncQueue.delete(item.id);

    // Update entity status
    const table = item.entityType === 'chore' ? this.db.chores : this.db.transactions;

    await table.update(item.entityId, {
      syncStatus: 'synced',
      serverVersion: serverResponse.version || 1,
      syncedAt: Date.now(),
    });

    // Update metadata
    const metadataKey = `${item.data.type}:total:${item.data.childId}`;
    const metadata = await this.db.metadata.get(metadataKey);

    if (metadata) {
      metadata.pendingChanges = Math.max(0, metadata.pendingChanges - 1);
      metadata.lastSyncedAt = Date.now();
      await this.db.metadata.put(metadata);
    }

    // Emit event
    this.emit('item-synced', { item, result: serverResponse });
  }

  /**
   * Handle sync failure
   */
  async handleSyncFailure(item, error) {
    console.error(`[SyncManager] Sync failure: ${item.entityType}/${item.entityId}`, error);

    const retryCount = item.retryCount + 1;

    if (retryCount >= item.maxRetries) {
      // Max retries exceeded - mark as failed
      await this.db.syncQueue.update(item.id, {
        status: 'failed',
        retryCount,
        lastError: error.message,
        failedAt: Date.now(),
      });

      this.emit('item-failed', { item, error });

    } else {
      // Calculate next retry with exponential backoff
      const backoffMs = Math.min(
        this.config.initialBackoff * Math.pow(2, retryCount),
        this.config.maxBackoff
      );

      const nextRetryAt = Date.now() + backoffMs;

      await this.db.syncQueue.update(item.id, {
        status: 'pending',
        retryCount,
        lastError: error.message,
        nextRetryAt,
      });

      console.log(`[SyncManager] Will retry in ${backoffMs}ms (attempt ${retryCount}/${item.maxRetries})`);

      // Schedule retry
      setTimeout(() => {
        if (this.isOnline) {
          this.triggerSync();
        }
      }, backoffMs);
    }
  }

  // ===============================================
  // CONFLICT RESOLUTION
  // ===============================================

  /**
   * Handle sync conflict
   */
  async handleConflict(item, serverResponse) {
    console.warn('[SyncManager] Conflict detected:', item.entityId);

    // Fetch latest server version
    const serverVersion = serverResponse.currentVersion || 1;
    const localVersion = item.data.localVersion || 1;

    // Store conflict
    const conflict = {
      id: uuidv4(),
      entityType: item.entityType,
      entityId: item.entityId,
      localVersion: item.data,
      serverVersion: serverResponse,
      timestamp: Date.now(),
      resolved: false,
    };

    await this.db.conflicts.add(conflict);

    // Update entity status
    const table = item.entityType === 'chore' ? this.db.chores : this.db.transactions;

    await table.update(item.entityId, {
      syncStatus: 'conflict',
    });

    // Emit event for UI to handle
    this.emit('conflict-detected', { conflict, item });

    // Auto-resolve if strategy is defined
    if (this.config.autoResolveConflicts) {
      await this.resolveConflict(conflict.id, this.config.conflictStrategy || 'server');
    }
  }

  /**
   * Resolve a conflict
   */
  async resolveConflict(conflictId, strategy = 'server') {
    const conflict = await this.db.conflicts.get(conflictId);

    if (!conflict) {
      throw new Error(`Conflict not found: ${conflictId}`);
    }

    let resolvedVersion;

    switch (strategy) {
      case 'local':
        resolvedVersion = conflict.localVersion;
        break;

      case 'server':
        resolvedVersion = conflict.serverVersion;
        break;

      case 'merge':
        resolvedVersion = this.mergeVersions(
          conflict.localVersion,
          conflict.serverVersion
        );
        break;

      default:
        resolvedVersion = conflict.serverVersion;
    }

    // Update entity
    const table = conflict.entityType === 'chore' ? this.db.chores : this.db.transactions;

    await table.update(conflict.entityId, {
      ...resolvedVersion,
      syncStatus: 'synced',
      resolvedAt: Date.now(),
    });

    // Mark conflict as resolved
    await this.db.conflicts.update(conflictId, {
      resolved: true,
      resolution: strategy,
      mergedVersion: resolvedVersion,
      resolvedAt: Date.now(),
    });

    // Emit event
    this.emit('conflict-resolved', { conflictId, strategy, resolvedVersion });
  }

  /**
   * Merge two versions (simple timestamp-based)
   */
  mergeVersions(local, server) {
    // Prefer newer timestamp
    const localTime = new Date(local.timestamp).getTime();
    const serverTime = new Date(server.timestamp).getTime();

    return localTime > serverTime ? local : server;
  }

  // ===============================================
  // ONLINE/OFFLINE HANDLERS
  // ===============================================

  handleOnline() {
    console.log('[SyncManager] Device is online');
    this.isOnline = true;
    this.emit('online');

    // Trigger sync after a short delay
    setTimeout(() => this.triggerSync(), 1000);
  }

  handleOffline() {
    console.log('[SyncManager] Device is offline');
    this.isOnline = false;
    this.emit('offline');
  }

  /**
   * Start periodic sync check
   */
  startPeriodicSync() {
    setInterval(async () => {
      if (this.isOnline && !this.syncInProgress) {
        const stats = await this.getSyncStats();

        if (stats.pending > 0) {
          console.log(`[SyncManager] Periodic sync: ${stats.pending} items pending`);
          this.triggerSync();
        }
      }
    }, 30000); // Check every 30 seconds
  }

  // ===============================================
  // READ OPERATIONS
  // ===============================================

  /**
   * Get transactions for a child
   */
  async getTransactions(childId, options = {}) {
    let query = this.db.transactions.where('childId').equals(childId);

    if (options.type) {
      const transactions = await query.toArray();
      return transactions
        .filter(t => t.type === options.type)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, options.limit || 50);
    }

    const transactions = await query.toArray();

    return transactions
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, options.limit || 50);
  }

  /**
   * Get chores for a child
   */
  async getChores(childId, options = {}) {
    const chores = await this.db.chores
      .where('childId')
      .equals(childId)
      .toArray();

    return chores
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, options.limit || 50);
  }

  /**
   * Get metadata (totals)
   */
  async getMetadata(key) {
    const metadata = await this.db.metadata.get(key);
    return metadata?.value || 0;
  }

  /**
   * Get all metadata for a child
   */
  async getChildMetadata(childId) {
    const moneyKey = `money:total:${childId}`;
    const pointsKey = `points:total:${childId}`;
    const screenKey = `screen:total:${childId}`;

    const [money, points, screen] = await Promise.all([
      this.getMetadata(moneyKey),
      this.getMetadata(pointsKey),
      this.getMetadata(screenKey),
    ]);

    return { money, points, screen };
  }

  /**
   * Get pending sync count
   */
  async getPendingSyncCount() {
    return await this.db.syncQueue.where('status').equals('pending').count();
  }

  /**
   * Get unresolved conflicts
   */
  async getUnresolvedConflicts() {
    return await this.db.conflicts.where('resolved').equals(false).toArray();
  }

  // ===============================================
  // EVENT SYSTEM
  // ===============================================

  /**
   * Add event listener
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event).add(callback);
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  /**
   * Emit event
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[SyncManager] Error in event listener for ${event}:`, error);
        }
      });
    }

    // Also dispatch DOM event for easy integration
    window.dispatchEvent(new CustomEvent('sync-manager', {
      detail: { event, data }
    }));
  }

  // ===============================================
  // UTILITIES
  // ===============================================

  /**
   * Clear all local data (for testing)
   */
  async clearAllData() {
    await this.db.transactions.clear();
    await this.db.chores.clear();
    await this.db.syncQueue.clear();
    await this.db.metadata.clear();
    await this.db.conflicts.clear();

    console.log('[SyncManager] All local data cleared');
  }

  /**
   * Export data for debugging
   */
  async exportData() {
    const [transactions, chores, queue, metadata, conflicts] = await Promise.all([
      this.db.transactions.toArray(),
      this.db.chores.toArray(),
      this.db.syncQueue.toArray(),
      this.db.metadata.toArray(),
      this.db.conflicts.toArray(),
    ]);

    return {
      transactions,
      chores,
      queue,
      metadata,
      conflicts,
      deviceId: this.deviceId,
      timestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const syncManager = new SyncManager();

// Auto-initialize when module loads
if (typeof window !== 'undefined') {
  syncManager.init().catch(error => {
    console.error('[SyncManager] Failed to initialize:', error);
  });
}
