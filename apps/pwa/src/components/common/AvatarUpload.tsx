/**
 * AvatarUpload component - Avatar with optional image upload functionality
 */

import { type FunctionComponent } from 'preact';
import { useState } from 'preact/hooks';
import { Avatar } from './Avatar';

export interface AvatarUploadProps {
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  onImageChange?: (imageData: string) => void;
  editable?: boolean;
  class?: string;
}

export const AvatarUpload: FunctionComponent<AvatarUploadProps> = ({
  src,
  alt,
  size = 'md',
  onImageChange,
  editable = false,
  class: className
}) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setIsUploading(true);

    try {
      // Read file as base64
      const reader = new FileReader();

      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        onImageChange?.(base64);
        setIsUploading(false);
      };

      reader.onerror = () => {
        alert('Failed to read image');
        setIsUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('Failed to upload image');
      setIsUploading(false);
    }
  };

  return (
    <div class="relative inline-block">
      <Avatar src={src} alt={alt} size={size} class={className} />

      {editable && (
        <label class="absolute bottom-0 right-0 bg-primary-500 text-white rounded-full w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-primary-600 transition-colors shadow-lg">
          <input
            type="file"
            accept="image/*"
            class="hidden"
            onChange={(e) => { void handleFileSelect(e); }}
            disabled={isUploading}
          />
          {isUploading ? (
            <span class="text-xs">...</span>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          )}
        </label>
      )}
    </div>
  );
};
