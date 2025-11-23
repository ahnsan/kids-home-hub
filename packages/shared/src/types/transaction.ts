/**
 * Transaction types for money, points, and screen time
 */

import type { ChildId } from './child';

export type TransactionAction = 'add' | 'deduct';
export type TransactionFeature = 'money' | 'points' | 'screen';
export type Currency = 'GBP' | 'AUD';
export type SyncStatus = 'pending' | 'synced' | 'conflict' | 'failed';

/**
 * Base transaction structure
 */
export interface BaseTransaction {
  id: string;
  childId: ChildId;
  action: TransactionAction;
  timestamp: string;
  reason: string;
  syncStatus?: SyncStatus;
  createdAt?: number;
  syncedAt?: number;
  deviceId?: string;
  localVersion?: number;
  serverVersion?: number;
}

/**
 * Money transaction
 */
export interface MoneyTransaction extends BaseTransaction {
  type: 'money';
  rawAmount: number;
  currency: Currency;
  converted: number;
}

/**
 * Points transaction
 */
export interface PointsTransaction extends BaseTransaction {
  type: 'points';
  amount: number;
  source: 'manual' | 'chores' | 'redeem_to_screen';
}

/**
 * Screen time transaction
 */
export interface ScreenTransaction extends BaseTransaction {
  type: 'screen';
  minutes: number;
}

/**
 * Union type for all transactions
 */
export type Transaction = MoneyTransaction | PointsTransaction | ScreenTransaction;

/**
 * Transaction log entry (simplified for display)
 */
export interface TransactionLogEntry {
  timestamp: string;
  action: TransactionAction;
  reason: string;
}

export interface MoneyLogEntry extends TransactionLogEntry {
  rawAmount: string;
  currency: Currency;
  converted: string;
}

export interface PointsLogEntry extends TransactionLogEntry {
  amount: number;
  source: string;
}

export interface ScreenLogEntry extends TransactionLogEntry {
  minutes: number;
}
