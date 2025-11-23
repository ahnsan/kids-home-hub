/**
 * Chore Management Modal - Add, edit, and delete custom chores
 */

import { type FunctionComponent } from 'preact';
import { useSignal } from '@preact/signals';
import { Modal } from '../../common/Modal';
import { Button } from '../../common/Button';
import {
  customChores,
  addCustomChore,
  updateCustomChore,
  deleteCustomChore,
  type CustomChore
} from '../../../stores/customChoresStore';

export interface ChoreManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChoreManagementModal: FunctionComponent<ChoreManagementModalProps> = ({
  isOpen,
  onClose
}) => {
  const editingChore = useSignal<CustomChore | null>(null);
  const showAddForm = useSignal(false);
  const choreLabel = useSignal('');
  const chorePoints = useSignal('');
  const formError = useSignal<string | null>(null);

  const handleAddNew = () => {
    showAddForm.value = true;
    editingChore.value = null;
    choreLabel.value = '';
    chorePoints.value = '';
    formError.value = null;
  };

  const handleEdit = (chore: CustomChore) => {
    editingChore.value = chore;
    showAddForm.value = true;
    choreLabel.value = chore.label;
    chorePoints.value = chore.points.toString();
    formError.value = null;
  };

  const handleDelete = (chore: CustomChore) => {
    if (chore.isDefault) {
      formError.value = 'Cannot delete default chores';
      return;
    }

    if (confirm(`Are you sure you want to delete "${chore.label}"?`)) {
      deleteCustomChore(chore.id);
    }
  };

  const handleSave = () => {
    // Validation
    const label = choreLabel.value.trim();
    const points = parseInt(chorePoints.value, 10);

    if (!label || label.length < 2) {
      formError.value = 'Chore name must be at least 2 characters';
      return;
    }

    if (!points || points < 1 || points > 100) {
      formError.value = 'Points must be between 1 and 100';
      return;
    }

    if (editingChore.value) {
      // Update existing chore
      updateCustomChore(editingChore.value.id, { label, points });
    } else {
      // Add new chore
      addCustomChore(label, points);
    }

    // Reset form
    showAddForm.value = false;
    editingChore.value = null;
    choreLabel.value = '';
    chorePoints.value = '';
    formError.value = null;
  };

  const handleCancel = () => {
    showAddForm.value = false;
    editingChore.value = null;
    choreLabel.value = '';
    chorePoints.value = '';
    formError.value = null;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Chores" size="lg">
      <div class="space-y-6">
        {/* Add New Button */}
        {!showAddForm.value && (
          <div class="flex justify-end">
            <Button variant="primary" onClick={handleAddNew}>
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Add New Chore
            </Button>
          </div>
        )}

        {/* Add/Edit Form */}
        {showAddForm.value && (
          <div class="bg-gray-50 p-6 rounded-lg border-2 border-primary-200">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">
              {editingChore.value ? 'Edit Chore' : 'Add New Chore'}
            </h3>

            <div class="space-y-4">
              {/* Chore Name */}
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Chore Name <span class="text-error-500">*</span>
                </label>
                <input
                  type="text"
                  value={choreLabel.value}
                  onInput={(e) => { choreLabel.value = (e.currentTarget as HTMLInputElement).value; }}
                  placeholder="e.g., Clean room, Wash dishes..."
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  maxLength={50}
                  required
                />
                <p class="text-xs text-gray-500 mt-1">
                  {choreLabel.value.length}/50 characters
                </p>
              </div>

              {/* Points */}
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Points <span class="text-error-500">*</span>
                </label>
                <input
                  type="number"
                  value={chorePoints.value}
                  onInput={(e) => { chorePoints.value = (e.currentTarget as HTMLInputElement).value; }}
                  placeholder="1-100"
                  min="1"
                  max="100"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
                <p class="text-xs text-gray-500 mt-1">
                  How many points should this chore be worth?
                </p>
              </div>

              {/* Error Message */}
              {formError.value && (
                <div class="p-3 bg-error-50 border border-error-200 rounded-lg">
                  <p class="text-sm text-error-700">{formError.value}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div class="flex gap-3">
                <Button variant="primary" onClick={handleSave} fullWidth>
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  {editingChore.value ? 'Update Chore' : 'Add Chore'}
                </Button>
                <Button variant="ghost" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Chores List */}
        <div class="space-y-2">
          <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Your Chores ({customChores.value.length})
          </h3>

          {customChores.value.length === 0 ? (
            <div class="text-center py-12 bg-gray-50 rounded-lg">
              <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p class="text-gray-600 font-medium">No chores yet</p>
              <p class="text-gray-500 text-sm mt-1">Click "Add New Chore" to get started</p>
            </div>
          ) : (
            <div class="space-y-2">
              {customChores.value.map((chore) => (
                <div
                  key={chore.id}
                  class="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-sm transition-all"
                >
                  <div class="flex-1">
                    <div class="flex items-center gap-2">
                      <h4 class="font-semibold text-gray-900">{chore.label}</h4>
                      {chore.isDefault && (
                        <span class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                          Default
                        </span>
                      )}
                    </div>
                    <p class="text-sm text-gray-500 mt-0.5">
                      <span class="font-semibold text-primary-600">{chore.points}</span> points
                    </p>
                  </div>

                  <div class="flex gap-2 ml-4">
                    {/* Edit Button */}
                    <button
                      onClick={() => handleEdit(chore)}
                      class="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="Edit chore"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>

                    {/* Delete Button (only for custom chores) */}
                    {!chore.isDefault && (
                      <button
                        onClick={() => handleDelete(chore)}
                        class="p-2 text-error-600 hover:bg-error-50 rounded-lg transition-colors"
                        title="Delete chore"
                      >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div class="pt-4 border-t border-gray-200">
          <p class="text-xs text-gray-500 text-center">
            Default chores can be edited but not deleted. Custom chores are saved to your device.
          </p>
        </div>
      </div>
    </Modal>
  );
};
