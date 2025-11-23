/**
 * Children Setup Screen - Step 2 of onboarding
 */

import { type FunctionComponent } from 'preact';
import { useSignal } from '@preact/signals';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import type { OnboardingChild } from '../../../stores/onboardingStore';

export interface ChildrenSetupScreenProps {
  children: OnboardingChild[];
  onAddChild: (name: string, emoji: string) => void;
  onRemoveChild: (id: string) => void;
  onUpdateChild: (id: string, updates: Partial<Omit<OnboardingChild, 'id'>>) => void;
  onNext: () => void;
  onBack: () => void;
}

const EMOJI_OPTIONS = ['😊', '😎', '🤓', '🥳', '🌟', '🎨', '⚽', '🎮', '📚', '🎵', '🦄', '🐱', '🐶', '🦊', '🐼', '🦁'];

export const ChildrenSetupScreen: FunctionComponent<ChildrenSetupScreenProps> = ({
  children,
  onAddChild,
  onRemoveChild,
  onUpdateChild,
  onNext,
  onBack
}) => {
  const newChildName = useSignal('');
  const selectedEmoji = useSignal('😊');
  const isEditing = useSignal<string | null>(null);
  const editName = useSignal('');
  const editEmoji = useSignal('😊');

  const handleAddChild = () => {
    const name = newChildName.value.trim();
    if (!name) return;

    if (children.length >= 6) {
      alert('Maximum 6 children allowed');
      return;
    }

    onAddChild(name, selectedEmoji.value);
    newChildName.value = '';
    selectedEmoji.value = '😊';
  };

  const handleSubmitEdit = (childId: string) => {
    const name = editName.value.trim();
    if (!name) return;

    onUpdateChild(childId, { name, emoji: editEmoji.value });
    isEditing.value = null;
  };

  const handleStartEdit = (child: OnboardingChild) => {
    isEditing.value = child.id;
    editName.value = child.name;
    editEmoji.value = child.emoji;
  };

  const handleCancelEdit = () => {
    isEditing.value = null;
    editName.value = '';
    editEmoji.value = '😊';
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (isEditing.value) {
        handleSubmitEdit(isEditing.value);
      } else {
        handleAddChild();
      }
    }
  };

  return (
    <div class="max-w-2xl mx-auto px-6 py-8">
      {/* Header */}
      <div class="text-center mb-8">
        <h2 class="text-2xl font-bold text-gray-900 mb-2">
          Add Your Children
        </h2>
        <p class="text-gray-600">
          Add at least one child to get started (up to 6)
        </p>
      </div>

      {/* Add Child Form */}
      <Card class="mb-6">
        <div class="space-y-4">
          <div>
            <label htmlFor="child-name" class="block text-sm font-medium text-gray-700 mb-2">
              Child's Name
            </label>
            <input
              id="child-name"
              type="text"
              value={newChildName.value}
              onInput={(e) => (newChildName.value = (e.target as HTMLInputElement).value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter name..."
              maxLength={20}
              class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-base"
              aria-label="Child's name"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Choose an Avatar
            </label>
            <div class="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => (selectedEmoji.value = emoji)}
                  class={`w-12 h-12 text-2xl rounded-lg border-2 transition-all ${
                    selectedEmoji.value === emoji
                      ? 'border-primary-500 bg-primary-50 scale-110'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  aria-label={`Select ${emoji} emoji`}
                  aria-pressed={selectedEmoji.value === emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <Button
            variant="primary"
            fullWidth
            onClick={handleAddChild}
            disabled={!newChildName.value.trim() || children.length >= 6}
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Child
          </Button>
        </div>
      </Card>

      {/* Children List */}
      {children.length > 0 && (
        <div class="space-y-3 mb-8">
          <h3 class="text-sm font-medium text-gray-700 mb-3">
            Your Children ({children.length}/6)
          </h3>
          {children.map((child) => (
            <Card key={child.id} class="transition-all hover:shadow-md">
              {isEditing.value === child.id ? (
                // Edit Mode
                <div class="space-y-3">
                  <div class="flex gap-3 items-center">
                    <input
                      type="text"
                      value={editName.value}
                      onInput={(e) => (editName.value = (e.target as HTMLInputElement).value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Enter name..."
                      maxLength={20}
                      class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      aria-label="Edit child name"
                      autoFocus
                    />
                  </div>
                  <div class="flex flex-wrap gap-2">
                    {EMOJI_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => (editEmoji.value = emoji)}
                        class={`w-10 h-10 text-xl rounded-lg border-2 transition-all ${
                          editEmoji.value === emoji
                            ? 'border-primary-500 bg-primary-50 scale-110'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        aria-label={`Select ${emoji} emoji`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <div class="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleSubmitEdit(child.id)}
                      class="flex-1"
                    >
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelEdit}
                      class="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                // Display Mode
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-2xl">
                      {child.emoji}
                    </div>
                    <span class="font-medium text-gray-900">{child.name}</span>
                  </div>
                  <div class="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(child)}
                      class="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      aria-label={`Edit ${child.name}`}
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveChild(child.id)}
                      class="p-2 text-gray-500 hover:text-error-600 hover:bg-error-50 rounded-lg transition-colors"
                      aria-label={`Remove ${child.name}`}
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Info Message */}
      {children.length === 0 && (
        <div class="text-center py-8 text-gray-500">
          <svg class="w-16 h-16 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p>Add at least one child to continue</p>
        </div>
      )}

      {/* Navigation */}
      <div class="flex gap-3 pt-6">
        <Button
          variant="ghost"
          onClick={onBack}
          class="flex-1"
        >
          Back
        </Button>
        <Button
          variant="primary"
          onClick={onNext}
          disabled={children.length === 0}
          class="flex-1"
        >
          Continue
        </Button>
      </div>
    </div>
  );
};
