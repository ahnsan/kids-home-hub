/**
 * Child switch component
 */

import { type FunctionComponent } from 'preact';
import { selectedChildId, selectChild, children } from '../../../stores';
import { clsx } from 'clsx';

export const ChildSwitch: FunctionComponent = () => {
  const selected = selectedChildId.value;
  const childrenList = children.value;

  return (
    <div
      class="inline-flex p-1 rounded-full bg-surface-100 shadow-sm"
      role="tablist"
      aria-label="Choose child"
    >
      {childrenList.map(child => (
        <button
          key={child.id}
          onClick={() => selectChild(child.id)}
          role="tab"
          aria-selected={selected === child.id}
          aria-label={`${child.name} tab`}
          class={clsx(
            'px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
            'inline-flex items-center gap-2',
            selected === child.id
              ? 'bg-white text-primary-500 font-semibold shadow-md'
              : 'text-surface-500 hover:text-surface-600'
          )}
        >
          <span
            class={clsx(
              'w-2 h-2 rounded-full',
              selected === child.id ? 'bg-primary-500' : 'bg-surface-300'
            )}
            aria-hidden="true"
          />
          <span>{child.name}</span>
        </button>
      ))}
    </div>
  );
};
