/**
 * Comprehensive test suite for SyncService
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SyncService } from './sync';
import { db } from '../db/schema';
import type { Child } from '@kids-home-hub/shared';
import type { CustomChore } from '../stores/customChoresStore';

// Mock the API client
vi.mock('../api/client', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn()
  }
}));

// Mock auth
vi.mock('../lib/auth', () => ({
  isAuthenticated: vi.fn(() => true),
  getAuthToken: vi.fn(() => 'mock-token')
}));

describe('SyncService', () => {
  let syncService: SyncService;

  beforeEach(async () => {
    // Clear all data
    await db.syncQueue.clear();
    await db.metadata.clear();
    await db.conflicts.clear();
    localStorage.clear();

    syncService = new SyncService();
  });

  afterEach(() => {
    syncService.stopPeriodicSync();
  });

  describe('queueAction', () => {
    it('should queue an action for sync', async () => {
      await syncService.queueAction({
        type: 'add_child',
        entityType: 'child',
        entityId: 'test-child',
        data: { name: 'Test Child' }
      });

      const queued = await db.syncQueue.toArray();
      expect(queued).toHaveLength(1);
      expect(queued[0]?.operation).toBe('add_child');
      expect(queued[0]?.entityType).toBe('child');
      expect(queued[0]?.entityId).toBe('test-child');
    });

    it('should trigger background sync if online and authenticated', async () => {
      const fullSyncSpy = vi.spyOn(syncService, 'fullSync');

      // Mock navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });

      await syncService.queueAction({
        type: 'update_child',
        entityType: 'child',
        entityId: 'test-child',
        data: { points: 10 }
      });

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(fullSyncSpy).toHaveBeenCalled();
    });
  });

  describe('getPendingActionsCount', () => {
    it('should return correct count of pending actions', async () => {
      // Add 3 pending actions
      await syncService.queueAction({
        type: 'add_child',
        entityType: 'child',
        entityId: 'child-1',
        data: {}
      });

      await syncService.queueAction({
        type: 'add_chore',
        entityType: 'chore',
        entityId: 'chore-1',
        data: {}
      });

      await syncService.queueAction({
        type: 'update_child',
        entityType: 'child',
        entityId: 'child-1',
        data: {}
      });

      const count = await syncService.getPendingActionsCount();
      expect(count).toBe(3);
    });

    it('should return 0 when no pending actions', async () => {
      const count = await syncService.getPendingActionsCount();
      expect(count).toBe(0);
    });
  });

  describe('syncChildren', () => {
    it('should merge local and remote children data', async () => {
      const { api } = await import('../api/client');

      // Setup local data
      const localChildren: Child[] = [
        { id: 'child-1', name: 'Alice', avatar: '👧', moneyTotal: 10, pointsTotal: 50, screenTotal: 30 }
      ];
      localStorage.setItem('children', JSON.stringify(localChildren));

      // Setup remote data
      const remoteChildren: Child[] = [
        { id: 'child-1', name: 'Alice', avatar: '👧', moneyTotal: 15, pointsTotal: 60, screenTotal: 40 },
        { id: 'child-2', name: 'Bob', avatar: '👦', moneyTotal: 5, pointsTotal: 20, screenTotal: 10 }
      ];

      vi.mocked(api.get).mockResolvedValueOnce({
        json: async () => ({ children: remoteChildren })
      } as any);

      const result = await syncService.syncChildren();

      expect(result).toHaveLength(2);
      expect(result.find(c => c.id === 'child-1')).toBeDefined();
      expect(result.find(c => c.id === 'child-2')).toBeDefined();
    });

    it('should return local data if offline', async () => {
      const localChildren: Child[] = [
        { id: 'child-1', name: 'Alice', avatar: '👧', moneyTotal: 10, pointsTotal: 50, screenTotal: 30 }
      ];
      localStorage.setItem('children', JSON.stringify(localChildren));

      // Mock offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      const result = await syncService.syncChildren();

      expect(result).toEqual(localChildren);
    });
  });

  describe('syncChores', () => {
    it('should merge local and remote chores data', async () => {
      const { api } = await import('../api/client');

      // Setup local data
      const localChores: CustomChore[] = [
        { id: 'chore-1', label: 'Clean room', points: 10, createdAt: Date.now(), updatedAt: Date.now() }
      ];
      localStorage.setItem('custom_chores', JSON.stringify(localChores));

      // Setup remote data
      const remoteChores: CustomChore[] = [
        { id: 'chore-1', label: 'Clean room', points: 15, createdAt: Date.now(), updatedAt: Date.now() + 1000 },
        { id: 'chore-2', label: 'Do homework', points: 20, createdAt: Date.now(), updatedAt: Date.now() }
      ];

      vi.mocked(api.get).mockResolvedValueOnce({
        json: async () => ({ chores: remoteChores })
      } as any);

      const result = await syncService.syncChores();

      expect(result).toHaveLength(2);
      expect(result.find(c => c.id === 'chore-1')?.points).toBe(15); // Remote is newer
      expect(result.find(c => c.id === 'chore-2')).toBeDefined();
    });
  });

  describe('needsSync', () => {
    it('should return true if more than 5 minutes since last sync', async () => {
      // Set last sync time to 6 minutes ago
      const sixMinutesAgo = Date.now() - (6 * 60 * 1000);
      await db.metadata.put({
        key: 'last_sync_time',
        value: sixMinutesAgo,
        lastUpdated: Date.now()
      });

      // Reload sync service to pick up the metadata
      const newSyncService = new SyncService();
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(newSyncService.needsSync()).toBe(true);
    });

    it('should return false if synced recently', async () => {
      // Set last sync time to 2 minutes ago
      const twoMinutesAgo = Date.now() - (2 * 60 * 1000);
      await db.metadata.put({
        key: 'last_sync_time',
        value: twoMinutesAgo,
        lastUpdated: Date.now()
      });

      const newSyncService = new SyncService();
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(newSyncService.needsSync()).toBe(false);
    });

    it('should return false if offline', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      expect(syncService.needsSync()).toBe(false);
    });
  });

  describe('getSyncStatus', () => {
    it('should return "offline" when not online', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      expect(syncService.getSyncStatus()).toBe('offline');
    });

    it('should return "synced" when online and recently synced', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });

      // Set recent sync time
      const oneMinuteAgo = Date.now() - (1 * 60 * 1000);
      await db.metadata.put({
        key: 'last_sync_time',
        value: oneMinuteAgo,
        lastUpdated: Date.now()
      });

      const newSyncService = new SyncService();
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(newSyncService.getSyncStatus()).toBe('synced');
    });

    it('should return "pending" when needs sync', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });

      // Set old sync time
      const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
      await db.metadata.put({
        key: 'last_sync_time',
        value: tenMinutesAgo,
        lastUpdated: Date.now()
      });

      const newSyncService = new SyncService();
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(newSyncService.getSyncStatus()).toBe('pending');
    });
  });

  describe('uploadLocalData', () => {
    it('should upload all local data to cloud', async () => {
      const { api } = await import('../api/client');

      // Setup local data
      const localChildren: Child[] = [
        { id: 'child-1', name: 'Alice', avatar: '👧', moneyTotal: 10, pointsTotal: 50, screenTotal: 30 }
      ];
      const localChores: CustomChore[] = [
        { id: 'chore-1', label: 'Clean room', points: 10, createdAt: Date.now(), updatedAt: Date.now() }
      ];

      localStorage.setItem('children', JSON.stringify(localChildren));
      localStorage.setItem('custom_chores', JSON.stringify(localChores));

      vi.mocked(api.post).mockResolvedValueOnce({
        json: async () => ({ success: true })
      } as any);

      await syncService.uploadLocalData();

      expect(api.post).toHaveBeenCalledWith('v1/households', expect.any(Object));
      expect(localStorage.getItem('migrated_to_cloud')).toBe('true');
    });

    it('should throw error if offline', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      await expect(syncService.uploadLocalData()).rejects.toThrow();
    });
  });

  describe('periodic sync', () => {
    it('should start periodic sync', () => {
      vi.spyOn(syncService, 'fullSync').mockResolvedValue();

      syncService.startPeriodicSync();

      // Should not start twice
      const intervalId1 = (syncService as any).syncIntervalId;
      syncService.startPeriodicSync();
      const intervalId2 = (syncService as any).syncIntervalId;

      expect(intervalId1).toBe(intervalId2);

      syncService.stopPeriodicSync();
    });

    it('should stop periodic sync', () => {
      syncService.startPeriodicSync();
      expect((syncService as any).syncIntervalId).not.toBeNull();

      syncService.stopPeriodicSync();
      expect((syncService as any).syncIntervalId).toBeNull();
    });
  });

  describe('conflict resolution', () => {
    it('should store conflicts in IndexedDB', async () => {
      const conflicts = [
        {
          entityType: 'child',
          entityId: 'child-1',
          local: { name: 'Alice', points: 10 },
          remote: { name: 'Alice', points: 15 }
        }
      ];

      await (syncService as any).handleConflicts(conflicts);

      const storedConflicts = await db.conflicts.toArray();
      expect(storedConflicts).toHaveLength(1);
      expect(storedConflicts[0]?.entityType).toBe('child');
      expect(storedConflicts[0]?.resolved).toBe(false);
    });
  });
});
