/**
 * Formatting utilities
 */

import type { Currency } from '../types';
import { CURRENCY_SYMBOLS, CONVERSION_RATES } from '../constants';

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: Currency = 'GBP'): string {
  const symbol = CURRENCY_SYMBOLS[currency];
  const formatted = Math.abs(amount).toFixed(2);
  const sign = amount < 0 ? '-' : '';
  return `${sign}${symbol}${formatted}`;
}

/**
 * Convert currency to GBP
 */
export function convertToGBP(amount: number, fromCurrency: Currency): number {
  if (fromCurrency === 'GBP') return amount;
  const rate = CONVERSION_RATES[fromCurrency];
  return parseFloat((amount * rate).toFixed(2));
}

/**
 * Convert GBP to target currency
 */
export function convertFromGBP(amountInGBP: number, toCurrency: Currency): number {
  if (toCurrency === 'GBP') return amountInGBP;
  const rate = CONVERSION_RATES[toCurrency];
  return parseFloat((amountInGBP / rate).toFixed(2));
}

/**
 * Format date/time
 */
export function formatDate(timestamp: string | number, options?: Intl.DateTimeFormatOptions): string {
  try {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);

    const defaultOptions: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    };

    return date.toLocaleString('en-GB', options || defaultOptions);
  } catch {
    return String(timestamp);
  }
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(timestamp: string | number): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;

  return formatDate(timestamp, { day: '2-digit', month: 'short' });
}

/**
 * Format screen time minutes to readable format
 */
export function formatScreenTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} h`;
  return `${hours} h ${mins} min`;
}

/**
 * Format points
 */
export function formatPoints(points: number): string {
  const sign = points >= 0 ? '+' : '−';
  return `${sign}${Math.abs(points)} pts`;
}

/**
 * Sanitize user input (XSS protection)
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

/**
 * Truncate text
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}
