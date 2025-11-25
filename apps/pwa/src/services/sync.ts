/**
 * Data synchronization service
 * Handles syncing between local storage and cloud database
 */

import { api } from '../api/client';
import { isAuthenticated as isAuthenticatedSignal } from '../stores/authStore';
import type { Child, QueuedAction } from '@kids-home-hub/shared';
import { db, getDeviceId } from '../db/schema';
import { mergeById } from '../lib/syncUtils';
import type { CustomChore } from '../stores/customChoresStore';
import { user } from '../stores/authStore';

interface FullSyncResponse {
  children: Child[];
  chores: CustomChore[];
  serverTime: number;
  conflicts?: Array<{
    entityType: string;
    entityId: string;
    local: any;
    remote: any;
  }>;
}


/**
 * Sync manager class with comprehensive queue management and conflict resolution
 */
export class SyncService {
  private syncInProgress = false;
  private lastSyncTime = 0;
  private syncIntervalId: number | null = null;

  constructor() {
    // Load last sync time from metadata
    this.loadLastSyncTime();
  }

  /**
   * Load last sync time from IndexedDB
   */
  private async loadLastSyncTime(): Promise<void> {
    try {
      const metadata = await db.metadata.get('last_sync_time');
      if (metadata) {
        this.lastSyncTime = Number(metadata.value);
      }
    } catch (error) {
      console.error('[Sync] Failed to load last sync time:', error);
    }
  }

  /**
   * Check if we can sync (user is authenticated and online)
   */
  private canSync(): boolean {
    const authenticated = isAuthenticatedSignal.value;
    const online = navigator.onLine;

    console.log('[Sync] canSync check:', {
      authenticated,
      online,
      canSync: authenticated && online
    });

    return authenticated && online;
  }

  /**
   * Full sync: Upload local changes and download remote changes
   */
  async fullSync(): Promise<void> {
    if (!this.canSync() || this.syncInProgress) {
      console.log('[Sync] Skipping sync - not authenticated or already syncing');
      return;
    }

    this.syncInProgress = true;
    console.log('[Sync] Starting full sync...');

    try {
      // 1. Get local changes from IndexedDB queue
      const queuedActions = await db.syncQueue
        .where('status')
        .equals('pending')
        .toArray();

      console.log(`[Sync] Found ${queuedActions.length} queued actions`);

      // 2. Get local data
      const localChildren = this.getLocalChildren();
      const localChores = this.getLocalChores();

      // 3. Call sync API with local changes
      const deviceId = await getDeviceId();
      const response = await api
        .post('v1/sync', {
          json: {
            lastSyncedAt: this.lastSyncTime,
            deviceId,
            changes: {
              children: localChildren,
              chores: localChores,
              queuedActions: queuedActions.map((a) => ({
                type: a.operation,
                entityType: a.entityType,
                entityId: a.entityId,
                data: a.data,
                timestamp: a.createdAt
              }))
            }
          }
        })
        .json<FullSyncResponse>();

      console.log('[Sync] Server response received');

      // 4. Apply remote changes locally
      await this.applyRemoteChanges(response);

      // 5. Mark queued actions as synced
      await this.markActionsSynced(queuedActions);

      // 6. Update last sync time
      this.lastSyncTime = response.serverTime;
      await db.metadata.put({
        key: 'last_sync_time',
        value: response.serverTime,
        lastUpdated: Date.now()
      });

      console.log('[Sync] Full sync completed successfully');
    } catch (error) {
      console.error('[Sync] Full sync failed:', error);
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Sync children data
   */
  async syncChildren(): Promise<Child[]> {
    if (!this.canSync()) {
      return this.getLocalChildren();
    }

    try {
      console.log('[Sync] Syncing children...');
      const localChildren = this.getLocalChildren();

      if (!user.value?.householdId) {
        console.warn('[Sync] No householdId - using local children');
        return this.getLocalChildren();
      }

      const response = await api
        .get(`v1/households/${user.value.householdId}/children`)
        .json<{ children: Child[] }>();

      // Merge with local data using last-write-wins
      const merged = mergeById(localChildren, response.children);

      // Update local storage
      localStorage.setItem('children', JSON.stringify(merged));

      console.log('[Sync] Children synced successfully');
      return merged;
    } catch (error) {
      console.error('[Sync] Children sync failed:', error);
      return this.getLocalChildren();
    }
  }

  /**
   * Sync chores data
   */
  async syncChores(): Promise<CustomChore[]> {
    if (!this.canSync()) {
      return this.getLocalChores();
    }

    try {
      console.log('[Sync] Syncing chores...');
      const localChores = this.getLocalChores();

      const response = await api
        .get('v1/chores')
        .json<{ chores: CustomChore[] }>();

      // Merge with local data
      const merged = mergeById(localChores, response.chores);

      // Update local storage
      localStorage.setItem('custom_chores', JSON.stringify(merged));

      console.log('[Sync] Chores synced successfully');
      return merged;
    } catch (error) {
      console.error('[Sync] Chores sync failed:', error);
      return this.getLocalChores();
    }
  }

  /**
   * Upload local data to cloud (migration)
   */
  async uploadLocalData(): Promise<void> {
    if (!this.canSync()) {
      throw new Error('Cannot upload data: user not authenticated or offline');
    }

    try {
      console.log('[Sync] Uploading local data to cloud...');

      // Get all local data
      const localChildren = this.getLocalChildren();
      const localChores = this.getLocalChores();
      const localTransactions = await this.getLocalTransactions();

      // Create household with children and chores
      const response = await api
        .post('v1/households', {
          json: {
            name: 'My Household',
            children: localChildren.map((c) => ({
              name: c.name,
              avatar: c.avatar,
              moneyTotal: c.moneyTotal,
              pointsTotal: c.pointsTotal,
              screenTotal: c.screenTotal
            })),
            chores: localChores.map((ch) => ({
              label: ch.label,
              points: ch.points
            })),
            transactions: localTransactions
          }
        })
        .json();

      // Mark as migrated
      localStorage.setItem('migrated_to_cloud', 'true');
      localStorage.setItem('migration_date', Date.now().toString());

      console.log('[Sync] Local data uploaded successfully', response);
    } catch (error) {
      console.error('[Sync] Failed to upload local data:', error);
      throw error;
    }
  }

  /**
   * Queue an action for sync
   */
  async queueAction(action: {
    type: 'update_child' | 'add_child' | 'remove_child' | 'add_chore' | 'update_chore' | 'delete_chore' | 'add_transaction';
    entityType: 'transaction' | 'chore' | 'redeem' | 'child';
    entityId: string;
    data: any;
  }): Promise<void> {
    try {
      const queuedAction: QueuedAction = {
        operation: action.type as QueuedAction['operation'],
        entityType: action.entityType,
        entityId: action.entityId,
        data: action.data,
        status: 'pending',
        priority: 1,
        retryCount: 0,
        maxRetries: 5,
        createdAt: Date.now(),
        nextRetryAt: Date.now()
      };

      await db.syncQueue.add(queuedAction);
      console.log(`[Sync] Action queued: ${action.type} for ${action.entityType}`);

      // Trigger sync if online
      if (this.canSync()) {
        // Don't await - let it run in background
        this.fullSync().catch((error) => {
          console.error('[Sync] Background sync failed:', error);
        });
      }
    } catch (error) {
      console.error('[Sync] Failed to queue action:', error);
    }
  }

  /**
   * Apply remote changes to local storage
   */
  private async applyRemoteChanges(response: FullSyncResponse): Promise<void> {
    try {
      // Update children
      if (response.children && response.children.length > 0) {
        const localChildren = this.getLocalChildren();
        const merged = mergeById(localChildren, response.children);
        localStorage.setItem('children', JSON.stringify(merged));
        console.log('[Sync] Applied remote children changes');
      }

      // Update chores
      if (response.chores && response.chores.length > 0) {
        const localChores = this.getLocalChores();
        const merged = mergeById(localChores, response.chores);
        localStorage.setItem('custom_chores', JSON.stringify(merged));
        console.log('[Sync] Applied remote chores changes');
      }

      // Handle conflicts
      if (response.conflicts && response.conflicts.length > 0) {
        console.warn(`[Sync] Conflicts detected: ${response.conflicts.length}`);
        await this.handleConflicts(response.conflicts);
      }
    } catch (error) {
      console.error('[Sync] Failed to apply remote changes:', error);
      throw error;
    }
  }

  /**
   * Mark queued actions as synced
   */
  private async markActionsSynced(actions: QueuedAction[]): Promise<void> {
    if (actions.length === 0) return;

    try {
      const ids = actions.map((a) => a.id).filter((id): id is number => id !== undefined);
      await db.syncQueue.bulkDelete(ids);
      console.log(`[Sync] Marked ${ids.length} actions as synced`);
    } catch (error) {
      console.error('[Sync] Failed to mark actions as synced:', error);
    }
  }

  /**
   * Handle sync conflicts
   */
  private async handleConflicts(conflicts: any[]): Promise<void> {
    for (const conflict of conflicts) {
      try {
        await db.conflicts.add({
          id: crypto.randomUUID(),
          entityType: conflict.entityType,
          entityId: conflict.entityId,
          localVersion: conflict.local,
          serverVersion: conflict.remote,
          timestamp: Date.now(),
          resolved: false
        });
      } catch (error) {
        console.error('[Sync] Failed to store conflict:', error);
      }
    }
  }

  /**
   * Get local children from localStorage
   */
  private getLocalChildren(): Child[] {
    try {
      const stored = localStorage.getItem('children');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('[Sync] Failed to get local children:', error);
      return [];
    }
  }

  /**
   * Get local chores from localStorage
   */
  private getLocalChores(): CustomChore[] {
    try {
      const stored = localStorage.getItem('custom_chores');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('[Sync] Failed to get local chores:', error);
      return [];
    }
  }

  /**
   * Get local transactions from IndexedDB
   */
  private async getLocalTransactions(): Promise<any[]> {
    try {
      return await db.transactions.toArray();
    } catch (error) {
      console.error('[Sync] Failed to get local transactions:', error);
      return [];
    }
  }

  /**
   * Check if data needs sync
   */
  needsSync(): boolean {
    if (!this.canSync()) {
      return false;
    }

    // Sync if more than 5 minutes since last sync
    const fiveMinutes = 5 * 60 * 1000;
    return Date.now() - this.lastSyncTime > fiveMinutes;
  }

  /**
   * Get sync status
   */
  getSyncStatus(): 'synced' | 'syncing' | 'pending' | 'offline' {
    console.log('[Sync] getSyncStatus check:', {
      'navigator.onLine': navigator.onLine,
      'isAuthenticated': isAuthenticatedSignal.value,
      'syncInProgress': this.syncInProgress
    });

    if (!navigator.onLine) {
      console.log('[Sync] Status: offline (no network)');
      return 'offline';
    }

    if (!isAuthenticatedSignal.value) {
      console.log('[Sync] Status: offline (not authenticated)');
      return 'offline';
    }

    if (this.syncInProgress) {
      console.log('[Sync] Status: syncing');
      return 'syncing';
    }

    if (this.needsSync()) {
      console.log('[Sync] Status: pending');
      return 'pending';
    }

    console.log('[Sync] Status: synced');
    return 'synced';
  }

  /**
   * Start periodic sync (every 5 minutes)
   */
  startPeriodicSync(): void {
    if (this.syncIntervalId !== null) {
      return; // Already started
    }

    console.log('[Sync] Starting periodic sync (every 5 minutes)');

    this.syncIntervalId = window.setInterval(() => {
      if (this.canSync() && this.needsSync()) {
        this.fullSync().catch((error) => {
          console.error('[Sync] Periodic sync failed:', error);
        });
      }
    }, 5 * 60 * 1000);

    // Sync when coming online
    window.addEventListener('online', this.handleOnline);

    // Initial sync
    if (this.canSync()) {
      this.fullSync().catch((error) => {
        console.error('[Sync] Initial sync failed:', error);
      });
    }
  }

  /**
   * Stop periodic sync
   */
  stopPeriodicSync(): void {
    if (this.syncIntervalId !== null) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }

    window.removeEventListener('online', this.handleOnline);
    console.log('[Sync] Stopped periodic sync');
  }

  /**
   * Handle online event
   */
  private handleOnline = (): void => {
    console.log('[Sync] Network online - triggering sync');
    this.fullSync().catch((error) => {
      console.error('[Sync] Online sync failed:', error);
    });
  };

  /**
   * Get pending actions count
   */
  async getPendingActionsCount(): Promise<number> {
    try {
      return await db.syncQueue.where('status').equals('pending').count();
    } catch (error) {
      console.error('[Sync] Failed to get pending actions count:', error);
      return 0;
    }
  }
}

/**
 * Singleton instance
 */
export const syncService = new SyncService();
