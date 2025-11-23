/**
 * Bottom navigation component
 */

import { type FunctionComponent } from 'preact';
import { navigateTo, activeView, type ViewId } from '../../stores';
import { clsx } from 'clsx';

interface NavItem {
  id: ViewId;
  icon: string;
  label: string;
}

const navItems: NavItem[] = [
  { id: 'home', icon: '🏠', label: 'Home' },
  { id: 'bank', icon: '💰', label: 'Bank' },
  { id: 'points', icon: '⭐', label: 'Points' },
  { id: 'chores', icon: '🧹', label: 'Chores' },
  { id: 'screen', icon: '📱', label: 'Screen' }
];

export const BottomNav: FunctionComponent = () => {
  const active = activeView.value;

  return (
    <nav
      class="fixed bottom-0 left-0 right-0 flex justify-around items-stretch bg-white border-t border-surface-200 shadow-nav safe-bottom z-50"
      role="tablist"
      aria-label="Main navigation"
    >
      {navItems.map(item => (
        <button
          key={item.id}
          onClick={() => navigateTo(item.id)}
          role="tab"
          aria-selected={active === item.id}
          aria-label={`${item.label} tab`}
          class={clsx(
            'flex-1 flex flex-col items-center gap-1 py-2 px-2 text-sm',
            'transition-all duration-200 rounded-full',
            active === item.id
              ? 'text-primary-500 font-semibold bg-primary-50'
              : 'text-surface-400 hover:text-surface-500'
          )}
        >
          <span class="text-xl leading-none">{item.icon}</span>
          <span class="text-xs">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};
