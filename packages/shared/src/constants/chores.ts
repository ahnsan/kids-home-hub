/**
 * Chore constants
 */

import type { Chore } from '../types';

export const CHORES: readonly Chore[] = [
  { id: 'tidy_room', label: 'Tidy bedroom', points: 10 },
  { id: 'homework', label: 'Finish homework', points: 8 },
  { id: 'set_table', label: 'Set / clear the table', points: 5 },
  { id: 'feed_pet', label: 'Feed pet / help pet', points: 6 },
  { id: 'help_laundry', label: 'Help with laundry', points: 7 }
] as const;
