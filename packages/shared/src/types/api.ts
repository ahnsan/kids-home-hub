/**
 * API request/response types
 */

import type { ChildId } from './child';
import type { TransactionAction, TransactionFeature, Currency } from './transaction';
import type { ChoreId } from './chore';

/**
 * Transaction request (money, points, screen)
 */
export interface TransactionRequest {
  feature: TransactionFeature;
  child: ChildId;
  action: TransactionAction;
  amount: number;
  currency?: Currency;
  reason: string;
}

/**
 * Chores request
 */
export interface ChoresRequest {
  child: ChildId;
  chores: ChoreId[];
}

/**
 * Redeem points to screen time request
 */
export interface RedeemRequest {
  child: ChildId;
  points: number;
  reason: string;
}

/**
 * Get child data request
 */
export interface GetChildDataRequest {
  childId: ChildId;
}

/**
 * API response types
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Child data response
 */
export interface ChildDataResponse {
  id: ChildId;
  moneyTotal: number;
  pointsTotal: number;
  screenTotal: number;
  moneyLog?: unknown[];
  pointsLog?: unknown[];
  screenLog?: unknown[];
  choresLog?: unknown[];
}

/**
 * Sync conflict response
 */
export interface ConflictResponse {
  conflict: true;
  currentVersion: number;
  serverData: unknown;
  message: string;
}

/**
 * Error response
 */
export interface ErrorResponse {
  error: string;
  message: string;
  code?: string;
  status: number;
}
