/**
 * NumberPad Component
 * Cash App / Revolut style number pad for entering amounts
 */

import { type FunctionComponent } from 'preact';
import { clsx } from 'clsx';

export interface NumberPadProps {
  value: string;
  onChange: (value: string) => void;
  maxValue?: number;
  decimals?: number; // 2 for money, 0 for points/screen
  disabled?: boolean;
}

export const NumberPad: FunctionComponent<NumberPadProps> = ({
  value,
  onChange,
  maxValue = 9999.99,
  decimals = 2,
  disabled = false
}) => {
  const handleNumberClick = (num: string) => {
    if (disabled) return;

    let newValue = value + num;

    // Remove leading zeros unless there's a decimal point
    if (!newValue.includes('.') && newValue.length > 1) {
      newValue = newValue.replace(/^0+/, '') || '0';
    }

    // Check decimal places
    if (decimals === 0 && newValue.includes('.')) {
      return;
    }

    const decimalIndex = newValue.indexOf('.');
    if (decimalIndex !== -1 && newValue.length - decimalIndex - 1 > decimals) {
      return;
    }

    // Check max value
    const numericValue = parseFloat(newValue);
    if (!isNaN(numericValue) && numericValue > maxValue) {
      return;
    }

    // Limit total length (including decimal point)
    if (newValue.length > 10) {
      return;
    }

    onChange(newValue);
  };

  const handleDecimalClick = () => {
    if (disabled || decimals === 0) return;

    // Don't add decimal if it already exists
    if (value.includes('.')) return;

    // Add leading zero if value is empty
    const newValue = value === '' ? '0.' : value + '.';
    onChange(newValue);
  };

  const handleBackspace = () => {
    if (disabled) return;

    if (value.length > 0) {
      const newValue = value.slice(0, -1);
      onChange(newValue);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (disabled) return;

    if (e.key >= '0' && e.key <= '9') {
      e.preventDefault();
      handleNumberClick(e.key);
    } else if (e.key === '.' && decimals > 0) {
      e.preventDefault();
      handleDecimalClick();
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      handleBackspace();
    }
  };

  const buttons = [
    { label: '1', value: '1', type: 'number' as const },
    { label: '2', value: '2', type: 'number' as const },
    { label: '3', value: '3', type: 'number' as const },
    { label: '4', value: '4', type: 'number' as const },
    { label: '5', value: '5', type: 'number' as const },
    { label: '6', value: '6', type: 'number' as const },
    { label: '7', value: '7', type: 'number' as const },
    { label: '8', value: '8', type: 'number' as const },
    { label: '9', value: '9', type: 'number' as const },
    { label: '.', value: '.', type: 'decimal' as const },
    { label: '0', value: '0', type: 'number' as const },
    { label: '⌫', value: 'backspace', type: 'backspace' as const }
  ];

  return (
    <div
      class="grid grid-cols-3 gap-3 p-4"
      role="group"
      aria-label="Number pad"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {buttons.map(button => {
        const isDisabled = disabled || (button.type === 'decimal' && decimals === 0);
        const handleClick = () => {
          if (button.type === 'number') {
            handleNumberClick(button.value);
          } else if (button.type === 'decimal') {
            handleDecimalClick();
          } else if (button.type === 'backspace') {
            handleBackspace();
          }
        };

        return (
          <button
            key={button.value}
            type="button"
            onClick={handleClick}
            disabled={isDisabled}
            aria-label={
              button.type === 'backspace'
                ? 'Backspace'
                : button.type === 'decimal'
                  ? 'Decimal point'
                  : `Number ${button.value}`
            }
            class={clsx(
              'w-18 h-18 rounded-xl font-semibold text-2xl',
              'transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
              'active:scale-95',
              isDisabled
                ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                : 'bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300'
            )}
          >
            {button.label}
          </button>
        );
      })}
    </div>
  );
};
