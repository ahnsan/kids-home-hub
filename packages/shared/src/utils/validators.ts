/**
 * Validation utilities
 */

import type { ChildId, TransactionAction, TransactionFeature, Currency, ChoreId } from '../types';
import { CHILDREN, CHORES } from '../constants';

/**
 * Validate child ID
 */
export function isValidChildId(value: unknown): value is ChildId {
  return typeof value === 'string' && CHILDREN.includes(value as ChildId);
}

/**
 * Validate transaction action
 */
export function isValidAction(value: unknown): value is TransactionAction {
  return value === 'add' || value === 'deduct';
}

/**
 * Validate transaction feature
 */
export function isValidFeature(value: unknown): value is TransactionFeature {
  return value === 'money' || value === 'points' || value === 'screen';
}

/**
 * Validate currency
 */
export function isValidCurrency(value: unknown): value is Currency {
  return value === 'GBP' || value === 'AUD';
}

/**
 * Validate chore ID
 */
export function isValidChoreId(value: unknown): value is ChoreId {
  return typeof value === 'string' && CHORES.some(chore => chore.id === value);
}

/**
 * Validate positive number
 */
export function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && value > 0 && Number.isFinite(value);
}

/**
 * Validate non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validate amount (must be positive number)
 */
export function validateAmount(amount: unknown): number {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    throw new Error('Amount must be a positive number');
  }
  return amount;
}

/**
 * Validate reason (must be non-empty string, max 200 chars)
 */
export function validateReason(reason: unknown): string {
  if (typeof reason !== 'string') {
    throw new Error('Reason must be a string');
  }

  const trimmed = reason.trim();

  if (trimmed.length === 0) {
    throw new Error('Reason is required');
  }

  if (trimmed.length > 200) {
    throw new Error('Reason must be 200 characters or less');
  }

  return trimmed;
}

/**
 * Email validation
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * URL validation
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
