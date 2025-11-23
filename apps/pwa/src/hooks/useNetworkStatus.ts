/**
 * Network status detection hook
 */

import { useSignal } from '@preact/signals';
import { useEffect } from 'preact/hooks';

/**
 * Hook to monitor network status (online/offline)
 */
export function useNetworkStatus() {
  const isOnline = useSignal(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      console.log('[Network] Connection restored');
      isOnline.value = true;
    };

    const handleOffline = () => {
      console.log('[Network] Connection lost');
      isOnline.value = false;
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
