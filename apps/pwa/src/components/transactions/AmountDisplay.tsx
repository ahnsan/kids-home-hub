/**
 * AmountDisplay Component
 * Large display for transaction amounts with currency formatting
 */

import { type FunctionComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { clsx } from 'clsx';

export interface AmountDisplayProps {
  value: string;
  action: 'add' | 'remove';
  currency?: string;
  type?: 'money' | 'points' | 'screen';
}

export const AmountDisplay: FunctionComponent<AmountDisplayProps> = ({
  value,
  action,
  currency = '£',
  type = 'money'
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  // Trigger scale animation on value change
  useEffect(() => {
    if (value) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 150);
      return () => clearTimeout(timer);
    }
  }, [value]);

  const formatValue = (val: string): string => {
    if (!val || val === '') return '0';

    // Handle decimal point at the end
    if (val.endsWith('.')) return val;

    const numericValue = parseFloat(val);
    if (isNaN(numericValue)) return '0';

    if (type === 'money') {
      // Format with commas and 2 decimal places
      return numericValue.toLocaleString('en-GB', {
        minimumFractionDigits: val.includes('.') ? 2 : 0,
        maximumFractionDigits: 2
      });
    } else if (type === 'screen') {
      // Screen time in minutes (no decimals)
      return Math.floor(numericValue).toString();
    } else {
      // Points (no decimals)
      return Math.floor(numericValue).toString();
    }
  };

  const getPrefix = (): string => {
    if (type === 'money') return currency;
    return '';
  };

  const getSuffix = (): string => {
    if (type === 'screen') return 'min';
    if (type === 'points') return 'pts';
    return '';
  };

  const displayValue = formatValue(value);
  const prefix = getPrefix();
  const suffix = getSuffix();

  return (
    <div class="flex items-center justify-center py-8">
      <div
        class={clsx(
          'text-6xl font-bold transition-transform duration-150',
          isAnimating && 'scale-110',
          action === 'add' ? 'text-success-600' : 'text-error-600'
        )}
        aria-live="polite"
        aria-atomic="true"
      >
        <span class="mr-1">{action === 'add' ? '+' : '-'}</span>
        {prefix && <span class="mr-1">{prefix}</span>}
        <span>{displayValue}</span>
        {suffix && <span class="ml-2 text-4xl text-gray-500">{suffix}</span>}
      </div>
    </div>
  );
};
