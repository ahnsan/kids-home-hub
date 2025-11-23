/**
 * Card component
 */

import { type FunctionComponent, type ComponentChildren } from 'preact';
import { clsx } from 'clsx';

export interface CardProps {
  children: ComponentChildren;
  interactive?: boolean;
  class?: string;
}

export const Card: FunctionComponent<CardProps> = ({
  children,
  interactive = false,
  class: className
}) => {
  return (
    <section
      class={clsx(
        'bg-white rounded-2xl p-4 shadow-card',
        interactive && 'card-interactive cursor-pointer',
        className
      )}
    >
      {children}
    </section>
  );
};
