/**
 * Modal component - Accessible modal dialog
 */

import { type FunctionComponent, type ComponentChildren } from 'preact';
import { useEffect } from 'preact/hooks';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ComponentChildren;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: FunctionComponent<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md'
}) => {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <div
      class="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div class="flex min-h-full items-center justify-center p-4">
        <div
          class={`relative bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} transform transition-all`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div class="flex items-center justify-between p-6 border-b border-gray-200">
            <h2
              id="modal-title"
              class="text-xl font-semibold text-gray-900"
            >
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              class="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg p-1"
              aria-label="Close modal"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div class="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
