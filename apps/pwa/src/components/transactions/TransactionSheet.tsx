/**
 * TransactionSheet Component
 * Bottom sheet modal for creating transactions (money, points, screen time)
 */

import { type FunctionComponent } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { clsx } from 'clsx';
import type { TransactionData } from '../../types/transactions';
import { AmountDisplay } from './AmountDisplay';
import { ActionToggle } from './ActionToggle';
import { ReasonChips } from './ReasonChips';
import { NumberPad } from '../common/NumberPad';

export interface TransactionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transaction: TransactionData) => Promise<void>;
  feature: 'money' | 'points' | 'screen';
  childId: string;
  childName?: string;
}

export const TransactionSheet: FunctionComponent<TransactionSheetProps> = ({
  isOpen,
  onClose,
  onSubmit,
  feature,
  childId,
  childName
}) => {
  const [action, setAction] = useState<'add' | 'remove'>('add');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const sheetRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Get decimals based on feature type
  const decimals = feature === 'money' ? 2 : 0;

  // Get max value based on feature type
  const maxValue = feature === 'money' ? 9999.99 : feature === 'screen' ? 1440 : 99999;

  // Reset form when sheet opens
  useEffect(() => {
    if (isOpen) {
      setAction('add');
      setAmount('');
      setReason('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  // Focus trap and keyboard handling
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isSubmitting, onClose]);

  // Swipe to dismiss handlers
  const handleTouchStart = (e: TouchEvent) => {
    setStartY(e.touches[0]?.clientY ?? 0);
    setIsDragging(true);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    const y = e.touches[0]?.clientY ?? 0;
    const delta = y - startY;

    // Only allow dragging down
    if (delta > 0) {
      setCurrentY(delta);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    // Close if dragged down more than 100px
    if (currentY > 100) {
      onClose();
    }

    setCurrentY(0);
  };

  const handleSubmit = async () => {
    if (!amount || !reason || isSubmitting) return;

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) return;

    setIsSubmitting(true);

    try {
      await onSubmit({
        feature,
        childId,
        action,
        amount: numericAmount,
        reason
      });
      onClose();
    } catch (error) {
      console.error('Failed to submit transaction:', error);
      setIsSubmitting(false);
    }
  };

  const isValid = amount && parseFloat(amount) > 0 && reason;

  const getTitle = () => {
    const featureLabel =
      feature === 'money' ? 'Money' : feature === 'points' ? 'Points' : 'Screen Time';
    return childName ? `${featureLabel} - ${childName}` : featureLabel;
  };

  if (!isOpen) return null;

  return (
    <div
      class="fixed inset-0 z-50 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="transaction-sheet-title"
    >
      {/* Backdrop */}
      <div
        ref={backdropRef}
        class={clsx(
          'fixed inset-0 bg-black transition-opacity duration-300',
          isDragging ? 'backdrop-blur-sm' : 'backdrop-blur-md',
          isOpen ? 'bg-opacity-50' : 'bg-opacity-0'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        class={clsx(
          'relative w-full max-w-lg bg-white rounded-t-2xl shadow-2xl',
          'transform transition-transform duration-300 ease-out',
          isOpen && !isDragging ? 'translate-y-0' : 'translate-y-full'
        )}
        style={{
          transform: isDragging ? `translateY(${currentY}px)` : undefined,
          maxHeight: '90vh'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div class="flex justify-center pt-3 pb-2">
          <div class="w-12 h-1.5 bg-gray-300 rounded-full" aria-hidden="true" />
        </div>

        {/* Header */}
        <div class="flex items-center justify-between px-6 pb-4">
          <h2 id="transaction-sheet-title" class="text-xl font-semibold text-gray-900">
            {getTitle()}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            class={clsx(
              'text-gray-400 hover:text-gray-500 p-2 rounded-lg',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
              'transition-colors duration-150',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            aria-label="Close"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div class="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 4rem)' }}>
          {/* Amount Display */}
          <AmountDisplay value={amount} action={action} type={feature} />

          {/* Action Toggle */}
          <div class="px-6 pb-4">
            <ActionToggle value={action} onChange={setAction} disabled={isSubmitting} />
          </div>

          {/* Number Pad */}
          <NumberPad
            value={amount}
            onChange={setAmount}
            maxValue={maxValue}
            decimals={decimals}
            disabled={isSubmitting}
          />

          {/* Reason Chips */}
          <div class="px-6 pt-2 pb-4">
            <ReasonChips
              type={feature}
              selected={reason}
              onSelect={setReason}
              disabled={isSubmitting}
            />
          </div>

          {/* Submit Button */}
          <div class="px-6 pb-6">
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={!isValid || isSubmitting}
              class={clsx(
                'w-full h-12 rounded-xl font-semibold text-lg',
                'transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                'active:scale-98',
                isValid && !isSubmitting
                  ? action === 'add'
                    ? 'bg-success-600 text-white hover:bg-success-700 focus-visible:ring-success-500'
                    : 'bg-error-600 text-white hover:bg-error-700 focus-visible:ring-error-500'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              )}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? (
                <div class="flex items-center justify-center gap-2">
                  <svg
                    class="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Processing...</span>
                </div>
              ) : (
                `${action === 'add' ? 'Add' : 'Remove'} ${
                  feature === 'money' ? 'Money' : feature === 'points' ? 'Points' : 'Time'
                }`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
