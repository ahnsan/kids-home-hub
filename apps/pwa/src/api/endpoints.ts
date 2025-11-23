/**
 * Type-safe API endpoints
 */

import { api } from './client';
import type {
  TransactionRequest,
  ChoresRequest,
  RedeemRequest,
  ChildDataResponse,
  ChildId
} from '@kids-home-hub/shared';

/**
 * Submit transaction (money, points, screen time)
 */
export async function submitTransaction(data: TransactionRequest): Promise<void> {
  await api.post('v1/transaction', {
    json: data
  });
}

/**
 * Submit completed chores
 */
export async function submitChores(data: ChoresRequest): Promise<void> {
  await api.post('v1/chores', {
    json: data
  });
}

/**
 * Redeem points for screen time
 */
export async function redeemPoints(data: RedeemRequest): Promise<void> {
  await api.post('v1/redeem', {
    json: data
  });
}

/**
 * Get child data (totals and logs)
 */
export async function getChildData(childId: ChildId): Promise<ChildDataResponse> {
  return api.get('v1/data', { searchParams: { child: childId } }).json();
}

/**
 * Health check
 */
export async function healthCheck(): Promise<{ status: string; timestamp: number }> {
  return api.get('v1/health').json();
}
