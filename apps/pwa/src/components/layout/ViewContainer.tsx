/**
 * View container component
 */

import { type FunctionComponent, type ComponentChildren } from 'preact';

export interface ViewContainerProps {
  children: ComponentChildren;
}

export const ViewContainer: FunctionComponent<ViewContainerProps> = ({ children }) => {
  return (
    <div class="max-w-3xl mx-auto px-4 py-2 animate-fade-in">
      {children}
    </div>
  );
};
