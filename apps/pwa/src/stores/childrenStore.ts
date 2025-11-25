/**
 * Children state management with Preact Signals
 * Enhanced with cloud sync support
 */

import { signal, computed, effect } from '@preact/signals';
import type { Child, ChildId } from '@kids-home-hub/shared';
import { isAuthenticated, user } from './authStore';
import { syncService } from '../services/sync';
import { api, isOnline } from '../api/client';

/**
 * Selected child ID
 */
export const selectedChildId = signal<ChildId>('');

/**
 * Load children from localStorage or return empty array
 */
function loadChildren(): Child[] {
  try {
    const stored = localStorage.getItem('children');
    if (stored) {
      return JSON.parse(stored) as Child[];
    }
  } catch (error) {
    console.error('[Store] Failed to load children:', error);
  }
  // Return empty array if nothing stored - onboarding will populate
  return [];
}

/**
 * Save children to localStorage and sync to cloud if authenticated
 */
async function saveChildren(childrenData: Child[]): Promise<void> {
  try {
    // Always save locally first
    localStorage.setItem('children', JSON.stringify(childrenData));

    // If authenticated, trigger sync
    if (isAuthenticated.value) {
      // Sync in background without blocking
      syncService.syncChildren().catch(error => {
        console.error('[Store] Background sync failed:', error);
      });
    }
  } catch (error) {
    console.error('[Store] Failed to save children:', error);
  }
}

/**
 * Children data
 */
export const children = signal<Child[]>(loadChildren());

/**
 * Currently selected child
 */
export const currentChild = computed(() =>
  children.value.find(c => c.id === selectedChildId.value)
);

/**
 * Select a child
 */
export function selectChild(childId: ChildId): void {
  selectedChildId.value = childId;
}

/**
 * Update child data
 */
export function updateChildData(childId: ChildId, updates: Partial<Child>): void {
  // Optimistically update local state first
  children.value = children.value.map(child =>
    child.id === childId ? { ...child, ...updates } : child
  );
  void saveChildren(children.value);

  // If authenticated and online, make immediate API call
  if (isAuthenticated.value && isOnline()) {
    api.patch(`v1/children/${childId}`, {
      json: updates
    }).then(() => {
      console.log(`[Store] Child ${childId} updated on server immediately`);
    }).catch(error => {
      console.error(`[Store] Failed to update child ${childId} on server:`, error);
      // Keep optimistic local update - data will sync later via background sync
    });
  } else if (isAuthenticated.value) {
    // Offline but authenticated - queue for background sync
    syncService.queueAction({
      type: 'update_child',
      entityType: 'child',
      entityId: childId,
      data: updates
    }).catch(error => {
      console.error('[Store] Failed to queue sync action:', error);
    });
  }
}

/**
 * Add a new child (for onboarding)
 * Note: This uses a simplified approach with string IDs and emoji avatars
 */
export function addChild(name: string, avatar: string): void {
  const id = name.toLowerCase().replace(/\s+/g, '_') as ChildId;

  const newChild: Child = {
    id,
    name,
    avatar, // emoji or URL
    moneyTotal: 0,
    pointsTotal: 0,
    screenTotal: 0
  };

  // Optimistically update local state first
  children.value = [...children.value, newChild];
  void saveChildren(children.value);

  // Select the first child if none selected
  if (!selectedChildId.value && children.value.length > 0) {
    selectedChildId.value = children.value[0]!.id;
  }

  // If authenticated and online, make immediate API call
  if (isAuthenticated.value && isOnline() && user.value?.householdId) {
    api.post('v1/children', {
      json: {
        householdId: user.value.householdId,
        name: newChild.name,
        avatar: newChild.avatar,
        displayOrder: 0
      }
    }).then(() => {
      console.log(`[Store] Child ${name} created on server immediately`);
    }).catch(error => {
      console.error(`[Store] Failed to create child ${name} on server:`, error);
      // Keep optimistic local update - data will sync later via background sync
    });
  } else if (isAuthenticated.value) {
    // Offline but authenticated, or no householdId yet - queue for background sync
    syncService.queueAction({
      type: 'add_child',
      entityType: 'child',
      entityId: id,
      data: newChild
    }).catch(error => {
      console.error('[Store] Failed to queue sync action:', error);
    });
  }
}

/**
 * Remove a child
 */
export function removeChild(childId: ChildId): void {
  // Optimistically update local state first
  children.value = children.value.filter(child => child.id !== childId);
  void saveChildren(children.value);

  // If the removed child was selected, select the first available child
  if (selectedChildId.value === childId && children.value.length > 0) {
    selectedChildId.value = children.value[0]!.id;
  }

  // If authenticated and online, make immediate API call
  if (isAuthenticated.value && isOnline()) {
    api.delete(`v1/children/${childId}`).then(() => {
      console.log(`[Store] Child ${childId} deleted on server immediately`);
    }).catch(error => {
      console.error(`[Store] Failed to delete child ${childId} on server:`, error);
      // Keep optimistic local update - data will sync later via background sync
    });
  } else if (isAuthenticated.value) {
    // Offline but authenticated - queue for background sync
    syncService.queueAction({
      type: 'remove_child',
      entityType: 'child',
      entityId: childId,
      data: { deleted: true }
    }).catch(error => {
      console.error('[Store] Failed to queue sync action:', error);
    });
  }
}

/**
 * Replace all children (used during onboarding)
 */
export async function setChildren(newChildren: Array<{ name: string; avatar: string }>): Promise<void> {
  children.value = newChildren.map((child) => ({
    id: child.name.toLowerCase().replace(/\s+/g, '_') as ChildId,
    name: child.name,
    avatar: child.avatar,
    moneyTotal: 0,
    pointsTotal: 0,
    screenTotal: 0
  }));

  // Save locally first
  await saveChildren(children.value);

  // If authenticated, ensure we have a household and sync
  if (isAuthenticated.value) {
    try {
      // Wait for householdId with retries if needed (it might still be loading after login)
      let retries = 0;
      const maxRetries = 5;

      while (!user.value?.householdId && retries < maxRetries) {
        console.log(`[ChildrenStore] Waiting for householdId (attempt ${retries + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 500));
        retries++;
      }

      if (!user.value?.householdId) {
        console.error('[ChildrenStore] No householdId after retries - creating household first');
        // Try to ensure household exists
        const { api: apiClient } = await import('../api/client');
        const householdsResponse = await apiClient.get('v1/households').json<{ households: any[] }>();

        if (householdsResponse.households.length === 0) {
          // Create default household
          const createResponse = await apiClient.post('v1/households', {
            json: { name: 'My Family' }
          }).json<{ household: any }>();

          if (user.value) {
            user.value = { ...user.value, householdId: createResponse.household.id };
          }
        } else if (user.value) {
          user.value = { ...user.value, householdId: householdsResponse.households[0].id };
        }
      }

      if (user.value?.householdId) {
        console.log('[ChildrenStore] Syncing children to backend...');

        // Create children on backend
        for (const child of children.value) {
          await api.post('v1/children', {
            json: {
              householdId: user.value.householdId,
              name: child.name,
              avatar: child.avatar,
              displayOrder: 0
            }
          });
        }

        console.log('[ChildrenStore] Children synced to backend successfully');
      } else {
        console.error('[ChildrenStore] Still no householdId - children saved locally only');
      }
    } catch (error) {
      console.error('[ChildrenStore] Failed to sync children to backend:', error);
      // Don't throw - children are still saved locally for offline use
    }
  } else {
    console.log('[ChildrenStore] Not authenticated - children saved locally only');
  }

  // Select the first child
  if (children.value.length > 0) {
    selectedChildId.value = children.value[0]!.id;
  }
}

/**
 * Load children from cloud (after login)
 */
export async function loadChildrenFromCloud(): Promise<void> {
  if (!isAuthenticated.value) {
    return;
  }

  try {
    const syncedChildren = await syncService.syncChildren();
    children.value = syncedChildren;

    // Select first child if none selected
    if (!selectedChildId.value && children.value.length > 0) {
      selectedChildId.value = children.value[0]!.id;
    }
  } catch (error) {
    console.error('[Store] Failed to load children from cloud:', error);
  }
}

/**
 * Persist selected child to localStorage
 */
effect(() => {
  try {
    localStorage.setItem('selectedChild', selectedChildId.value);
  } catch (error) {
    console.error('[Store] Failed to persist selected child:', error);
  }
});

/**
 * Initialize from localStorage
 */
export function initializeChildStore(): void {
  try {
    // Load children first
    children.value = loadChildren();

    // Load selected child
    const stored = localStorage.getItem('selectedChild');
    if (stored) {
      // Check if the stored child ID exists in our children list
      const childExists = children.value.some(child => child.id === stored);
      if (childExists) {
        selectedChildId.value = stored as ChildId;
      } else if (children.value.length > 0) {
        // If stored child doesn't exist, select the first one
        selectedChildId.value = children.value[0]!.id;
      }
    } else if (children.value.length > 0) {
      // No stored selection, select first child
      selectedChildId.value = children.value[0]!.id;
    }
  } catch (error) {
    console.error('[Store] Failed to load selected child:', error);
  }
}
