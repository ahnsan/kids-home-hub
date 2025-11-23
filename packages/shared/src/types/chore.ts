/**
 * Chore types
 */

import type { ChildId } from './child';

export type ChoreId = 'tidy_room' | 'homework' | 'set_table' | 'feed_pet' | 'help_laundry';

/**
 * Chore definition
 */
export interface Chore {
  id: ChoreId;
  label: string;
  points: number;
}

/**
 * Completed chore session
 */
export interface ChoreSession {
  id?: string;
  childId: ChildId;
  timestamp: string;
  items: Chore[];
  totalPoints: number;
  syncStatus?: 'pending' | 'synced' | 'conflict' | 'failed';
  createdAt?: number;
  deviceId?: string;
}

/**
 * Chore log entry
 */
export interface ChoreLogEntry {
  timestamp: string;
  items: Chore[];
}
