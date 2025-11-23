/**
 * Children state management with Preact Signals
 */

import { signal, computed, effect } from '@preact/signals';
import type { Child, ChildId } from '@kids-home-hub/shared';
import { CHILD_DATA } from '@kids-home-hub/shared';

/**
 * Selected child ID
 */
export const selectedChildId = signal<ChildId>('adam');

/**
 * Load children from localStorage or use defaults
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
  // Return default children if nothing stored
  return [
    {
      ...CHILD_DATA.adam,
      moneyTotal: 0,
      pointsTotal: 0,
      screenTotal: 0
    },
    {
      ...CHILD_DATA.sami,
      moneyTotal: 0,
      pointsTotal: 0,
      screenTotal: 0
    }
  ];
}

/**
 * Save children to localStorage
 */
function saveChildren(childrenData: Child[]): void {
  try {
    localStorage.setItem('children', JSON.stringify(childrenData));
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
  saveChildren(children.value);
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
  saveChildren(children.value);

  // Select the first child if none selected
  if (!selectedChildId.value && children.value.length > 0) {
    selectedChildId.value = children.value[0]!.id;
  }
}

/**
 * Remove a child
 */
export function removeChild(childId: ChildId): void {
  children.value = children.value.filter(child => child.id !== childId);
  saveChildren(children.value);

  // If the removed child was selected, select the first available child
  if (selectedChildId.value === childId && children.value.length > 0) {
    selectedChildId.value = children.value[0]!.id;
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
  saveChildren(children.value);

  // Select the first child
  if (children.value.length > 0) {
    selectedChildId.value = children.value[0]!.id;
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
