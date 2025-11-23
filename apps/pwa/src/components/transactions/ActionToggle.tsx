/**
 * ActionToggle Component
 * Segmented control for Add/Remove actions with smooth animations
 */

import { type FunctionComponent } from 'preact';
import { clsx } from 'clsx';

export interface ActionToggleProps {
  value: 'add' | 'remove';
  onChange: (value: 'add' | 'remove') => void;
  disabled?: boolean;
}

export const ActionToggle: FunctionComponent<ActionToggleProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  return (
    <div
      class="relative flex w-full h-11 bg-gray-100 rounded-xl p-1"
      role="radiogroup"
      aria-label="Transaction action"
    >
      {/* Sliding background indicator */}
      <div
        class={clsx(
          'absolute top-1 bottom-1 w-[calc(50%-0.25rem)] rounded-lg transition-all duration-300 ease-out',
          value === 'add' ? 'left-1 bg-success-600' : 'left-[calc(50%+0.125rem)] bg-error-600'
        )}
        aria-hidden="true"
      />

      {/* Add button */}
      <button
        type="button"
        role="radio"
        aria-checked={value === 'add'}
        disabled={disabled}
        onClick={() => onChange('add')}
        class={clsx(
          'relative flex-1 flex items-center justify-center gap-2',
          'font-semibold text-base rounded-lg transition-colors duration-300',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          value === 'add' ? 'text-white' : 'text-gray-700'
        )}
      >
        <svg
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2.5"
            d="M12 4v16m8-8H4"
          />
        </svg>
        <span>Add</span>
      </button>

      {/* Remove button */}
      <button
        type="button"
        role="radio"
        aria-checked={value === 'remove'}
        disabled={disabled}
        onClick={() => onChange('remove')}
        class={clsx(
          'relative flex-1 flex items-center justify-center gap-2',
          'font-semibold text-base rounded-lg transition-colors duration-300',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          value === 'remove' ? 'text-white' : 'text-gray-700'
        )}
      >
        <svg
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M20 12H4" />
        </svg>
        <span>Remove</span>
      </button>
    </div>
  );
};
