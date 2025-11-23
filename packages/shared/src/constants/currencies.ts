/**
 * Currency constants
 */

import type { Currency } from '../types';

/**
 * Conversion rates to GBP
 * Base currency: GBP = 1
 */
export const CONVERSION_RATES: Record<Currency, number> = {
  GBP: 1,
  AUD: 0.56
} as const;

/**
 * Currency symbols
 */
export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  GBP: '£',
  AUD: 'A$'
} as const;
