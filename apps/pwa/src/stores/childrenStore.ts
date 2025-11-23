/**
 * Children state management with Preact Signals
 * Enhanced with cloud sync support
 */

import { signal, computed, effect } from '@preact/signals';
import type { Child, ChildId } from '@kids-home-hub/shared';
import { isAuthenticated } from './authStore';
import { syncService } from '../services/sync';

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
  children.value = children.value.map(child =>
    child.id === childId ? { ...child, ...updates } : child
  );
  void saveChildren(children.value);

  // Queue sync action if authenticated
  if (isAuthenticated.value) {
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

  children.value = [...children.value, newChild];
  void saveChildren(children.value);

  // Select the first child if none selected
  if (!selectedChildId.value && children.value.length > 0) {
    selectedChildId.value = children.value[0]!.id;
  }

  // Queue sync action if authenticated
  if (isAuthenticated.value) {
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
  children.value = children.value.filter(child => child.id !== childId);
  void saveChildren(children.value);

  // If the removed child was selected, select the first available child
  if (selectedChildId.value === childId && children.value.length > 0) {
    selectedChildId.value = children.value[0]!.id;
  }

  // Queue sync action if authenticated
  if (isAuthenticated.value) {
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
export function setChildren(newChildren: Array<{ name: string; avatar: string }>): void {
  children.value = newChildren.map((child) => ({
    id: child.name.toLowerCase().replace(/\s+/g, '_') as ChildId,
    name: child.name,
    avatar: child.avatar,
    moneyTotal: 0,
    pointsTotal: 0,
    screenTotal: 0
  }));
  void saveChildren(children.value);

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
