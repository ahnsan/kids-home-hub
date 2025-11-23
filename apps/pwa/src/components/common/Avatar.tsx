/**
 * Avatar component
 */

import { type FunctionComponent } from 'preact';
import { clsx } from 'clsx';

export interface AvatarProps {
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  class?: string;
}

export const Avatar: FunctionComponent<AvatarProps> = ({
  src,
  alt,
  size = 'md',
  class: className
}) => {
  const sizeStyles = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-12 h-12 text-2xl',
    lg: 'w-16 h-16 text-4xl'
  };

  // Check if src is an emoji (single character or emoji)
  const isEmoji = src.length <= 4 && !src.startsWith('http');

  if (isEmoji) {
    // Render emoji avatar
    return (
      <div
        class={clsx(
          'rounded-full flex items-center justify-center bg-primary-100',
          sizeStyles[size],
          className
        )}
        role="img"
        aria-label={alt}
      >
        {src}
      </div>
    );
  }

  // Render image avatar
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      class={clsx(
        'rounded-full object-cover',
        sizeStyles[size],
        className
      )}
    />
  );
};
