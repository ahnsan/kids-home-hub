/**
 * Custom chores store - Manages user-defined chores with localStorage persistence
 */

import { signal } from '@preact/signals';
import { nanoid } from 'nanoid';

export interface CustomChore {
  id: string;
  label: string;
  points: number;
  isDefault?: boolean; // true for built-in chores
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = 'custom_chores';

// Default chores (from shared constants)
const DEFAULT_CHORES: CustomChore[] = [
  { id: 'tidy_room', label: 'Tidy bedroom', points: 10, isDefault: true, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'homework', label: 'Finish homework', points: 8, isDefault: true, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'set_table', label: 'Set / clear the table', points: 5, isDefault: true, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'feed_pet', label: 'Feed pet / help pet', points: 6, isDefault: true, createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'help_laundry', label: 'Help with laundry', points: 7, isDefault: true, createdAt: Date.now(), updatedAt: Date.now() }
];

// Load chores from localStorage or use defaults
function loadChores(): CustomChore[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as CustomChore[];
      // Always ensure default chores are present
      const customChores = parsed.filter(c => !c.isDefault);
      return [...DEFAULT_CHORES, ...customChores];
    }
  } catch (error) {
    console.error('[CustomChores] Failed to load from localStorage:', error);
  }
  return DEFAULT_CHORES;
}

// Save chores to localStorage
function saveChores(chores: CustomChore[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chores));
  } catch (error) {
    console.error('[CustomChores] Failed to save to localStorage:', error);
  }
}

// Chores signal
export const customChores = signal<CustomChore[]>(loadChores());

/**
 * Add a new custom chore
 */
export function addCustomChore(label: string, points: number): CustomChore {
  const newChore: CustomChore = {
    id: nanoid(),
    label,
    points,
    isDefault: false,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  customChores.value = [...customChores.value, newChore];
  saveChores(customChores.value);

  return newChore;
}

/**
 * Update an existing chore
 */
export function updateCustomChore(id: string, updates: { label?: string; points?: number }): boolean {
  const choreIndex = customChores.value.findIndex(c => c.id === id);

  if (choreIndex === -1) {
    return false;
  }

  const chore = customChores.value[choreIndex];
  if (!chore) {
    return false;
  }

  // Don't allow editing default chores' IDs, but allow editing their labels/points
  const updatedChore: CustomChore = {
    id: chore.id,
    label: updates.label ?? chore.label,
    points: updates.points ?? chore.points,
    isDefault: chore.isDefault,
    createdAt: chore.createdAt,
    updatedAt: Date.now()
  };

  const newChores = [...customChores.value];
  newChores[choreIndex] = updatedChore;

  customChores.value = newChores;
  saveChores(customChores.value);

  return true;
}

/**
 * Delete a custom chore (cannot delete default chores)
 */
export function deleteCustomChore(id: string): boolean {
  const chore = customChores.value.find(c => c.id === id);

  if (!chore || chore.isDefault) {
    return false; // Cannot delete default chores
  }

  customChores.value = customChores.value.filter(c => c.id !== id);
  saveChores(customChores.value);

  return true;
}

/**
 * Reset to default chores (removes all custom chores)
 */
export function resetToDefaultChores(): void {
  customChores.value = DEFAULT_CHORES;
  saveChores(customChores.value);
}

/**
 * Initialize the custom chores store
 */
export function initializeCustomChoresStore(): void {
  customChores.value = loadChores();
}
