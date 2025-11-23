/**
 * Child switch component
 */

import { type FunctionComponent } from 'preact';
import { selectedChildId, selectChild } from '../../../stores';
import { clsx } from 'clsx';
import type { ChildId } from '@kids-home-hub/shared';

interface ChildTab {
  id: ChildId;
  name: string;
}

const tabs: ChildTab[] = [
  { id: 'adam', name: 'Adam' },
  { id: 'sami', name: 'Sami' }
];

export const ChildSwitch: FunctionComponent = () => {
  const selected = selectedChildId.value;

  return (
    <div
      class="inline-flex p-1 rounded-full bg-surface-100 shadow-sm"
      role="tablist"
      aria-label="Choose child"
    >
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => selectChild(tab.id)}
          role="tab"
          aria-selected={selected === tab.id}
          aria-label={`${tab.name} tab`}
          class={clsx(
            'px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
            'inline-flex items-center gap-2',
            selected === tab.id
              ? 'bg-white text-primary-500 font-semibold shadow-md'
              : 'text-surface-500 hover:text-surface-600'
          )}
        >
          <span
            class={clsx(
              'w-2 h-2 rounded-full',
              selected === tab.id ? 'bg-primary-500' : 'bg-surface-300'
            )}
            aria-hidden="true"
          />
          <span>{tab.name}</span>
        </button>
      ))}
    </div>
  );
};
