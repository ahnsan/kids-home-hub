/**
 * Application entry point
 */

import { render } from 'preact';
import { App } from './app';
import { initializeStores } from './stores';
import { initDatabase, getDeviceId } from './db/schema';
import { startPeriodicSync } from './db/sync';
import './assets/styles/globals.css';

/**
 * Initialize application
 */
async function init(): Promise<void> {
  try {
    // Initialize database
    await initDatabase();

    // Get or create device ID
    const deviceId = await getDeviceId();
    localStorage.setItem('deviceId', deviceId);

    // Initialize stores
    initializeStores();

    // Start periodic sync
    startPeriodicSync();

    // Register service worker
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      window.addEventListener('load', () => {
        void navigator.serviceWorker.register('/sw.js').catch((error) => {
          console.error('[SW] Registration failed:', error);
        });
      });
    }

    // Render app
    const app = document.getElementById('app');
    if (app) {
      render(<App />, app);
    }
  } catch (error) {
    console.error('[Main] Initialization failed:', error);

    // Show error UI
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100vh; padding: 2rem; text-align: center; font-family: system-ui;">
          <div>
            <h1 style="color: #d32f2f; font-size: 1.5rem; margin-bottom: 1rem;">Failed to initialize app</h1>
            <p style="color: #666; margin-bottom: 1rem;">Please refresh the page to try again.</p>
            <button onclick="location.reload()" style="padding: 0.5rem 1rem; background: #01579b; color: white; border: none; border-radius: 0.5rem; cursor: pointer;">
              Refresh
            </button>
          </div>
        </div>
      `;
    }
  }
}

// Start app
void init();
