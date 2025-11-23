/**
 * Type-safe HTTP client with retry logic and offline queue
 */

import ky, { type KyInstance } from 'ky';
import { queueOfflineAction } from '../db/sync';

/**
 * Create API client instance
 */
const createApiClient = (): KyInstance => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8787';

  return ky.create({
    prefixUrl: apiUrl,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
    retry: {
      limit: 3,
      methods: ['get', 'post'],
      statusCodes: [408, 413, 429, 500, 502, 503, 504],
      backoffLimit: 3000
    },
    hooks: {
      beforeRequest: [
        (request) => {
          // Add timestamp for request tracking
          request.headers.set('X-Request-Time', Date.now().toString());

          // Add device ID if available
          const deviceId = localStorage.getItem('deviceId');
          if (deviceId) {
            request.headers.set('X-Device-Id', deviceId);
          }
        }
      ],
      afterResponse: [
        async (_request, _options, response) => {
          if (response.ok) {
            return response;
          }

          // Handle specific error codes
          if (response.status === 409) {
            // Conflict detected - will be handled by caller
            return response;
          }

          return response;
        }
      ],
      beforeError: [
        async (error) => {
          const { request } = error;

          // Queue for offline sync if network error
          if (error.name === 'TimeoutError' || !navigator.onLine) {
            try {
              const body = await request.clone().text();
              await queueOfflineAction({
                url: request.url,
                method: request.method,
                body,
                headers: Object.fromEntries(request.headers.entries())
              });
            } catch (queueError) {
              console.error('[API] Failed to queue offline action:', queueError);
            }
          }

          return error;
        }
      ]
    }
  });
};

/**
 * API client singleton
 */
export const api = createApiClient();

/**
 * Check if client is online
 */
export const isOnline = (): boolean => {
  return navigator.onLine;
};

/**
 * Network status change event
 */
export const onNetworkStatusChange = (callback: (online: boolean) => void): (() => void) => {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};
