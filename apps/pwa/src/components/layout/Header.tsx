/**
 * Header component
 */

import { type FunctionComponent } from 'preact';

export const Header: FunctionComponent = () => {
  return (
    <header class="text-center py-4 safe-top">
      <img
        src="https://upload.wikimedia.org/wikipedia/en/2/2e/Simba%28TheLionKing%29.png"
        alt="Simba"
        class="max-w-[96px] h-auto mx-auto mb-3 filter drop-shadow-lg"
        loading="eager"
      />
      <h1 class="text-primary-500 text-2xl font-bold tracking-tight">
        Adam & Sami Home Hub
      </h1>
    </header>
  );
};
