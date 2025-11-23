/**
 * Header component
 */

import { type FunctionComponent } from 'preact';
import { children } from '../../stores';

export const Header: FunctionComponent = () => {
  const childrenList = children.value;

  // Generate dynamic title based on children names
  const getTitle = () => {
    if (childrenList.length === 0) return 'Kids Home Hub';
    if (childrenList.length === 1) return `${childrenList[0]!.name}'s Home Hub`;
    if (childrenList.length === 2) {
      return `${childrenList[0]!.name} & ${childrenList[1]!.name} Home Hub`;
    }
    // For 3+ children, show first two names + "and more"
    return `${childrenList[0]!.name}, ${childrenList[1]!.name} & More`;
  };

  return (
    <header class="text-center py-4 safe-top">
      <img
        src="https://upload.wikimedia.org/wikipedia/en/2/2e/Simba%28TheLionKing%29.png"
        alt="Simba"
        class="max-w-[96px] h-auto mx-auto mb-3 filter drop-shadow-lg"
        loading="eager"
      />
      <h1 class="text-primary-500 text-2xl font-bold tracking-tight">
        {getTitle()}
      </h1>
    </header>
  );
};
