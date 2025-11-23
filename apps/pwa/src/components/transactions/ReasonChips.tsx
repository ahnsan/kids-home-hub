/**
 * ReasonChips Component
 * Horizontal scrollable list of preset reasons for transactions
 */

import { type FunctionComponent } from 'preact';
import { useState } from 'preact/hooks';
import { clsx } from 'clsx';

export interface ReasonChipsProps {
  type: 'money' | 'points' | 'screen';
  selected: string;
  onSelect: (reason: string) => void;
  disabled?: boolean;
}

interface ReasonOption {
  label: string;
  emoji: string;
}

const MONEY_REASONS: ReasonOption[] = [
  { label: 'Allowance', emoji: '💰' },
  { label: 'Chore bonus', emoji: '🏆' },
  { label: 'Good behavior', emoji: '⭐' },
  { label: 'Birthday', emoji: '🎂' },
  { label: 'Purchase', emoji: '🛍️' },
  { label: 'Other', emoji: '📝' }
];

const POINTS_REASONS: ReasonOption[] = [
  { label: 'Homework done', emoji: '📚' },
  { label: 'Helped out', emoji: '🤝' },
  { label: 'Good deed', emoji: '💝' },
  { label: 'Extra effort', emoji: '🌟' },
  { label: 'Misbehavior', emoji: '⚠️' },
  { label: 'Other', emoji: '📝' }
];

const SCREEN_REASONS: ReasonOption[] = [
  { label: 'Daily allowance', emoji: '📱' },
  { label: 'Bonus time', emoji: '🎮' },
  { label: 'Weekend extra', emoji: '🎉' },
  { label: 'Timeout', emoji: '🚫' },
  { label: 'Bedtime', emoji: '🌙' },
  { label: 'Other', emoji: '📝' }
];

export const ReasonChips: FunctionComponent<ReasonChipsProps> = ({
  type,
  selected,
  onSelect,
  disabled = false
}) => {
  const [customReason, setCustomReason] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const reasons =
    type === 'money' ? MONEY_REASONS : type === 'points' ? POINTS_REASONS : SCREEN_REASONS;

  const handleChipClick = (label: string) => {
    if (disabled) return;

    if (label === 'Other') {
      setShowCustomInput(true);
      setCustomReason('');
    } else {
      setShowCustomInput(false);
      onSelect(label);
    }
  };

  const handleCustomSubmit = () => {
    if (customReason.trim()) {
      onSelect(customReason.trim());
      setShowCustomInput(false);
    }
  };

  const handleCustomKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCustomSubmit();
    } else if (e.key === 'Escape') {
      setShowCustomInput(false);
      setCustomReason('');
    }
  };

  return (
    <div class="space-y-3">
      <label class="block text-sm font-medium text-gray-700">Reason</label>

      {/* Scrollable chips */}
      <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {reasons.map(reason => {
          const isSelected = selected === reason.label;

          return (
            <button
              key={reason.label}
              type="button"
              onClick={() => handleChipClick(reason.label)}
              disabled={disabled}
              class={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap',
                'font-medium text-sm transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
                'active:scale-95',
                isSelected
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              aria-pressed={isSelected}
            >
              <span class="text-base" aria-hidden="true">
                {reason.emoji}
              </span>
              <span>{reason.label}</span>
            </button>
          );
        })}
      </div>

      {/* Custom input */}
      {showCustomInput && (
        <div class="flex gap-2 animate-slide-down">
          <input
            type="text"
            value={customReason}
            onInput={e => setCustomReason((e.target as HTMLInputElement).value)}
            onKeyDown={handleCustomKeyDown}
            placeholder="Enter custom reason..."
            disabled={disabled}
            class={clsx(
              'flex-1 px-4 py-2 rounded-lg border border-gray-300',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            aria-label="Custom reason"
            autoFocus
          />
          <button
            type="button"
            onClick={handleCustomSubmit}
            disabled={disabled || !customReason.trim()}
            class={clsx(
              'px-4 py-2 rounded-lg bg-primary-500 text-white font-medium',
              'hover:bg-primary-600 active:scale-95',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
              'transition-all duration-150',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            OK
          </button>
        </div>
      )}
    </div>
  );
};
