/**
 * Service Worker Registration & Management
 * Kids Home Hub PWA
 *
 * Features:
 * - Automatic SW registration
 * - Update detection and notification
 * - Version management
 * - Client-SW communication
 * - Sync queue management
 */

class ServiceWorkerManager {
  constructor() {
    this.registration = null;
    this.updateAvailable = false;
    this.version = null;
    this.listeners = new Set();
  }

  /**
   * Initialize and register service worker
   */
  async init() {
    if (!('serviceWorker' in navigator)) {
      console.warn('[SW Manager] Service Workers not supported');
      return false;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none', // Always check for updates
      });

      console.log('[SW Manager] Service Worker registered:', this.registration.scope);

      // Get current version
      await this.getVersion();

      // Set up update handlers
      this.setupUpdateHandlers();

      // Set up message handlers
      this.setupMessageHandlers();

      // Check for updates periodically (every hour)
      this.startUpdateCheck();

      return true;
    } catch (error) {
      console.error('[SW Manager] Registration failed:', error);
      return false;
    }
  }

  /**
   * Setup update detection handlers
   */
  setupUpdateHandlers() {
    // Handle updates found during registration
    this.registration.addEventListener('updatefound', () => {
      const newWorker = this.registration.installing;
      console.log('[SW Manager] Update found, installing new worker');

      newWorker.addEventListener('statechange', () => {
        console.log('[SW Manager] New worker state:', newWorker.state);

        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New version available
          this.updateAvailable = true;
          this.handleUpdateAvailable(newWorker);
        }

        if (newWorker.state === 'activated') {
          console.log('[SW Manager] New worker activated');
          this.emit('activated', { version: this.version });
        }
      });
    });

    // Handle controller change (new SW took over)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[SW Manager] Controller changed, reloading page');
      window.location.reload();
    });
  }

  /**
   * Setup message handlers for SW communication
   */
  setupMessageHandlers() {
    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('[SW Manager] Message from SW:', event.data);

      const { type, data } = event.data;

      switch (type) {
        case 'SYNC_SUCCESS':
          this.emit('sync-success', data);
          break;

        case 'SYNC_FAILED':
          this.emit('sync-failed', data);
          break;

        case 'CACHE_UPDATED':
          this.emit('cache-updated', data);
          break;

        case 'PROCESS_SYNC_QUEUE':
          this.processSyncQueue();
          break;

        case 'QUEUE_REQUEST':
          this.queueRequest(data);
          break;

        default:
          this.emit(type.toLowerCase(), data);
      }
    });
  }

  /**
   * Handle update available
   */
  handleUpdateAvailable(newWorker) {
    console.log('[SW Manager] New version available');

    // Determine update strategy based on version type
    this.getVersion().then((oldVersion) => {
      const updateType = this.determineUpdateType(oldVersion, this.version);

      if (updateType === 'critical') {
        // Critical update: force immediate update
        this.showUpdateNotification({
          title: 'Critical Update Available',
          message: 'A critical update is available and will be installed automatically.',
          type: 'critical',
          autoUpdate: true,
        });

        setTimeout(() => this.applyUpdate(newWorker), 3000);
      } else if (updateType === 'major') {
        // Major update: prompt user
        this.showUpdateNotification({
          title: 'Major Update Available',
          message: 'A new version of Kids Home Hub is available with new features!',
          type: 'major',
          autoUpdate: false,
        });
      } else {
        // Minor update: auto-update on next visit
        console.log('[SW Manager] Minor update available, will auto-update on next visit');
        this.emit('update-available', { type: 'minor', version: this.version });
      }
    });
  }

  /**
   * Determine update type based on version change
   */
  determineUpdateType(oldVersion, newVersion) {
    if (!oldVersion || !newVersion) return 'minor';

    // Parse semantic versions
    const oldParts = oldVersion.replace('v', '').split('.');
    const newParts = newVersion.replace('v', '').split('.');

    // Critical: marked explicitly (e.g., security fixes)
    if (newVersion.includes('critical') || newVersion.includes('security')) {
      return 'critical';
    }

    // Major: first number changes
    if (oldParts[0] !== newParts[0]) {
      return 'major';
    }

    // Minor: second number changes
    if (oldParts[1] !== newParts[1]) {
      return 'minor';
    }

    // Patch: third number changes
    return 'patch';
  }

  /**
   * Show update notification
   */
  showUpdateNotification({ title, message, type, autoUpdate }) {
    const notification = document.createElement('div');
    notification.className = `update-notification update-${type}`;
    notification.innerHTML = `
      <div class="update-content">
        <div class="update-icon">${this.getUpdateIcon(type)}</div>
        <div class="update-text">
          <h3>${title}</h3>
          <p>${message}</p>
        </div>
        <div class="update-actions">
          ${!autoUpdate ? `
            <button class="btn-update" onclick="swManager.applyUpdate()">
              Update Now
            </button>
            <button class="btn-dismiss" onclick="swManager.dismissUpdate()">
              Later
            </button>
          ` : `
            <div class="update-loader"></div>
          `}
        </div>
      </div>
    `;

    // Add styles if not already present
    if (!document.getElementById('sw-update-styles')) {
      this.injectUpdateStyles();
    }

    document.body.appendChild(notification);

    // Emit event
    this.emit('update-notification', { type, autoUpdate });
  }

  /**
   * Get icon for update type
   */
  getUpdateIcon(type) {
    const icons = {
      critical: '🚨',
      major: '🎉',
      minor: '✨',
      patch: '🔧',
    };
    return icons[type] || '📦';
  }

  /**
   * Inject update notification styles
   */
  injectUpdateStyles() {
    const style = document.createElement('style');
    style.id = 'sw-update-styles';
    style.textContent = `
      .update-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        padding: 20px;
        max-width: 400px;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
      }

      @keyframes slideIn {
        from {
          transform: translateX(120%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      .update-critical {
        border-left: 4px solid #ef4444;
      }

      .update-major {
        border-left: 4px solid #6366f1;
      }

      .update-minor {
        border-left: 4px solid #10b981;
      }

      .update-content {
        display: flex;
        gap: 16px;
        align-items: flex-start;
      }

      .update-icon {
        font-size: 32px;
        flex-shrink: 0;
      }

      .update-text h3 {
        margin: 0 0 8px 0;
        font-size: 18px;
        color: #111827;
      }

      .update-text p {
        margin: 0;
        font-size: 14px;
        color: #6b7280;
        line-height: 1.5;
      }

      .update-actions {
        display: flex;
        gap: 8px;
        margin-top: 16px;
      }

      .btn-update,
      .btn-dismiss {
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }

      .btn-update {
        background: #6366f1;
        color: white;
      }

      .btn-update:hover {
        background: #4f46e5;
      }

      .btn-dismiss {
        background: #f3f4f6;
        color: #374151;
      }

      .btn-dismiss:hover {
        background: #e5e7eb;
      }

      .update-loader {
        width: 24px;
        height: 24px;
        border: 3px solid #e5e7eb;
        border-top-color: #6366f1;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Apply update (install new service worker)
   */
  async applyUpdate(worker) {
    const waiting = worker || this.registration?.waiting;

    if (!waiting) {
      console.warn('[SW Manager] No waiting worker found');
      return;
    }

    // Tell the waiting worker to skip waiting and activate
    waiting.postMessage({ type: 'SKIP_WAITING' });

    // The controllerchange event will handle the reload
  }

  /**
   * Dismiss update notification
   */
  dismissUpdate() {
    const notification = document.querySelector('.update-notification');
    if (notification) {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }
  }

  /**
   * Get current service worker version
   */
  async getVersion() {
    if (!this.registration) return null;

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();

      messageChannel.port1.onmessage = (event) => {
        this.version = event.data.version;
        resolve(this.version);
      };

      this.registration.active?.postMessage(
        { type: 'GET_VERSION' },
        [messageChannel.port2]
      );
    });
  }

  /**
   * Start periodic update check
   */
  startUpdateCheck() {
    // Check for updates every hour
    setInterval(() => {
      console.log('[SW Manager] Checking for updates...');
      this.registration?.update();
    }, 60 * 60 * 1000);
  }

  /**
   * Send message to service worker
   */
  postMessage(message) {
    if (!this.registration?.active) {
      console.warn('[SW Manager] No active service worker');
      return;
    }

    this.registration.active.postMessage(message);
  }

  /**
   * Trigger manual sync
   */
  async triggerSync() {
    if (!this.registration) {
      console.warn('[SW Manager] No service worker registered');
      return;
    }

    if ('sync' in this.registration) {
      try {
        await this.registration.sync.register('sync-queue');
        console.log('[SW Manager] Background sync registered');
        this.emit('sync-registered');
      } catch (error) {
        console.error('[SW Manager] Background sync registration failed:', error);
        // Fallback to immediate sync
        await this.processSyncQueue();
      }
    } else {
      console.log('[SW Manager] Background Sync not supported, using manual sync');
      await this.processSyncQueue();
    }
  }

  /**
   * Process sync queue (called by SW or manually)
   */
  async processSyncQueue() {
    // This will be handled by the SyncManager instance
    // Emit event for SyncManager to handle
    this.emit('process-queue');
  }

  /**
   * Queue request for sync
   */
  async queueRequest(requestData) {
    // This will be handled by the SyncManager instance
    this.emit('queue-request', requestData);
  }

  /**
   * Clear all caches
   */
  async clearCaches() {
    this.postMessage({ type: 'CLEAR_CACHE' });
    console.log('[SW Manager] Cache clear requested');
  }

  /**
   * Cache specific URLs
   */
  async cacheUrls(urls) {
    this.postMessage({ type: 'CACHE_URLS', urls });
    console.log('[SW Manager] Cache URLs requested:', urls.length);
  }

  /**
   * Event emitter
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error('[SW Manager] Event callback error:', error);
        }
      });
    }
  }
}

// Create singleton instance
const swManager = new ServiceWorkerManager();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => swManager.init());
} else {
  swManager.init();
}

// Make available globally
window.swManager = swManager;

// Export for module usage
export default swManager;
