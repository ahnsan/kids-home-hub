/**
 * Transaction types for the PWA
 */

import type { TransactionFeature } from '@kids-home-hub/shared';

/**
 * Transaction data interface for the TransactionSheet component
 * Note: Uses 'add' | 'remove' for UI, converted to 'add' | 'deduct' for API
 */
export interface TransactionData {
  feature: TransactionFeature;
  childId: string;
  action: 'add' | 'remove';
  amount: number;
  reason: string;
  currency?: 'GBP' | 'AUD';
  timestamp?: Date;
}
