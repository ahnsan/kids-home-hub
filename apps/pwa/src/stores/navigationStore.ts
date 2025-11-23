/**
 * Navigation state management
 */

import { signal, effect } from '@preact/signals';

export type ViewId = 'bank' | 'points' | 'chores' | 'screen';

/**
 * Active view
 */
export const activeView = signal<ViewId>('bank');

/**
 * Navigate to a view
 */
export function navigateTo(viewId: ViewId): void {
  activeView.value = viewId;
}

/**
 * Persist active view to localStorage
 */
effect(() => {
  try {
    localStorage.setItem('activeView', activeView.value);
  } catch (error) {
    console.error('[Store] Failed to persist active view:', error);
  }
});

/**
 * Initialize from localStorage
 */
export function initializeNavigationStore(): void {
  try {
    const stored = localStorage.getItem('activeView');
    if (stored && ['bank', 'points', 'chores', 'screen'].includes(stored)) {
      activeView.value = stored as ViewId;
    }
  } catch (error) {
    console.error('[Store] Failed to load active view:', error);
  }
}
