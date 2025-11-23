# Offline-First Architecture for Kids Home Hub

## Executive Summary

This document outlines a robust offline-first architecture for Kids Home Hub, enabling seamless operation even when network connectivity is unreliable or unavailable. The architecture supports multi-device scenarios, conflict resolution, and graceful synchronization.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Local Storage Strategy](#local-storage-strategy)
3. [Service Worker Implementation](#service-worker-implementation)
4. [Background Sync System](#background-sync-system)
5. [Conflict Resolution](#conflict-resolution)
6. [Technology Stack](#technology-stack)
7. [Critical Scenarios](#critical-scenarios)
8. [Native App Considerations](#native-app-considerations)
9. [Implementation Guide](#implementation-guide)

---

## Architecture Overview

### Core Principles

1. **Offline-First**: App works fully offline; network is enhancement
2. **Optimistic UI**: Instant feedback, sync in background
3. **Eventual Consistency**: All devices converge to same state
4. **Conflict-Aware**: Detect and resolve data conflicts intelligently
5. **Queue-Based**: Reliable operation queuing with retry logic

### Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                    User Interaction                      │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│              Optimistic UI Update                        │
│              (Instant feedback)                          │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│          Write to IndexedDB (Local)                      │
│          + Add to Sync Queue                             │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ├───────────────┬──────────────────────┐
                   │               │                      │
                   ▼               ▼                      ▼
              [ONLINE]         [OFFLINE]            [CONFLICT]
                   │               │                      │
                   ▼               │                      ▼
         Background Sync           │              Conflict
         to Cloudflare KV          │              Resolution
                   │               │                      │
                   ▼               ▼                      ▼
         Update Local DB    Stay in Queue        Merge Strategy
         Mark as Synced     Retry Later          Applied
                   │               │                      │
                   └───────────────┴──────────────────────┘
                                   │
                                   ▼
                          UI Sync Status Update
```

---

## Local Storage Strategy

### IndexedDB Schema

We use IndexedDB as the primary local storage mechanism because:
- Large storage capacity (50MB+)
- Structured data with indexes
- Async API (non-blocking)
- Transaction support
- Wide browser support

#### Database: `kidsHomeHub`
Version: 1

#### Object Stores

```javascript
// 1. Children data
{
  name: "children",
  keyPath: "id",
  indexes: [
    { name: "name", keyPath: "name", unique: true }
  ]
}

// 2. Transactions (money, points, screen time)
{
  name: "transactions",
  keyPath: "id",
  indexes: [
    { name: "childId", keyPath: "childId" },
    { name: "timestamp", keyPath: "timestamp" },
    { name: "type", keyPath: "type" }, // 'money' | 'points' | 'screen'
    { name: "syncStatus", keyPath: "syncStatus" }, // 'pending' | 'synced' | 'conflict'
    { name: "createdAt", keyPath: "createdAt" }
  ]
}

// 3. Chores
{
  name: "chores",
  keyPath: "id",
  indexes: [
    { name: "childId", keyPath: "childId" },
    { name: "timestamp", keyPath: "timestamp" },
    { name: "syncStatus", keyPath: "syncStatus" }
  ]
}

// 4. Sync Queue
{
  name: "syncQueue",
  keyPath: "id",
  indexes: [
    { name: "priority", keyPath: "priority" },
    { name: "createdAt", keyPath: "createdAt" },
    { name: "status", keyPath: "status" }, // 'pending' | 'processing' | 'failed'
    { name: "retryCount", keyPath: "retryCount" }
  ]
}

// 5. Metadata (totals, last sync, etc.)
{
  name: "metadata",
  keyPath: "key",
  // Stores current totals for each child/feature
}

// 6. Conflicts
{
  name: "conflicts",
  keyPath: "id",
  indexes: [
    { name: "timestamp", keyPath: "timestamp" },
    { name: "resolved", keyPath: "resolved" }
  ]
}
```

#### Data Models

```typescript
// Transaction Model
interface Transaction {
  id: string;                    // UUID
  childId: 'adam' | 'sami';
  type: 'money' | 'points' | 'screen';
  action: 'add' | 'deduct';
  amount: number;
  currency?: 'GBP' | 'AUD';      // for money only
  reason: string;
  timestamp: string;             // ISO 8601
  createdAt: number;             // Unix timestamp
  syncStatus: 'pending' | 'synced' | 'conflict';
  localVersion: number;          // For conflict detection
  serverVersion?: number;        // From KV
  deviceId: string;              // Device identifier
  metadata?: any;                // Extra context
}

// Chore Model
interface ChoreEntry {
  id: string;
  childId: 'adam' | 'sami';
  chores: Array<{
    id: string;
    label: string;
    points: number;
  }>;
  totalPoints: number;
  timestamp: string;
  createdAt: number;
  syncStatus: 'pending' | 'synced' | 'conflict';
  deviceId: string;
}

// Sync Queue Item
interface SyncQueueItem {
  id: string;
  operation: 'create' | 'update' | 'delete';
  entityType: 'transaction' | 'chore' | 'redeem';
  entityId: string;
  data: any;
  priority: number;              // Higher = more important
  createdAt: number;
  status: 'pending' | 'processing' | 'failed';
  retryCount: number;
  maxRetries: number;
  lastError?: string;
  nextRetryAt?: number;
}

// Metadata Model
interface Metadata {
  key: string;                   // e.g., "money:total:adam"
  value: number;
  lastUpdated: number;
  lastSyncedAt?: number;
  pendingChanges: number;        // Count of unsynced changes
}

// Conflict Model
interface Conflict {
  id: string;
  entityType: string;
  entityId: string;
  localVersion: Transaction | ChoreEntry;
  serverVersion: Transaction | ChoreEntry;
  timestamp: number;
  resolved: boolean;
  resolution?: 'local' | 'server' | 'merge';
  mergedVersion?: any;
}
```

### Storage Hierarchy

```
Application State
    ├─ In-Memory Cache (Session)
    │   └─ Active view data, UI state
    │
    ├─ IndexedDB (Persistent)
    │   ├─ Primary source of truth locally
    │   ├─ Transaction history
    │   ├─ Sync queue
    │   └─ Metadata
    │
    ├─ LocalStorage (Small data)
    │   ├─ User preferences
    │   ├─ Selected child
    │   └─ Device ID
    │
    └─ Cloudflare KV (Server)
        └─ Source of truth globally
```

---

## Service Worker Implementation

### Technology Choice: Workbox

**Recommendation**: Use Workbox 7+ for robust service worker management.

**Why Workbox?**
- Battle-tested by Google
- Pre-built caching strategies
- Background sync support
- Excellent debugging
- Regular updates

### Installation

```javascript
// package.json additions
{
  "dependencies": {
    "workbox-window": "^7.0.0"
  },
  "devDependencies": {
    "workbox-build": "^7.0.0",
    "workbox-cli": "^7.0.0"
  }
}
```

### Service Worker Structure

```javascript
// sw.js (Service Worker)
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { NetworkFirst, StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';
import { BackgroundSyncPlugin } from 'workbox-background-sync';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

const CACHE_VERSION = 'v1';
const CACHE_NAME = `kids-hub-${CACHE_VERSION}`;

// Precache static assets (generated by build)
precacheAndRoute(self.__WB_MANIFEST);

// ===============================================
// CACHING STRATEGIES
// ===============================================

// 1. App Shell: Cache First (HTML)
registerRoute(
  ({ request }) => request.destination === 'document',
  new CacheFirst({
    cacheName: `${CACHE_NAME}-shell`,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
      }),
    ],
  })
);

// 2. Static Assets: Cache First (CSS, JS, Images)
registerRoute(
  ({ request }) =>
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image',
  new CacheFirst({
    cacheName: `${CACHE_NAME}-assets`,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// 3. API Data: Network First with Offline Fallback
const bgSyncPlugin = new BackgroundSyncPlugin('dataSync', {
  maxRetentionTime: 24 * 60, // Retry for up to 24 hours (in minutes)
  onSync: async ({ queue }) => {
    let entry;
    while ((entry = await queue.shiftRequest())) {
      try {
        await fetch(entry.request.clone());
        console.log('Replay successful for', entry.request.url);
      } catch (error) {
        console.error('Replay failed for', entry.request.url, error);
        // Re-add to queue
        await queue.unshiftRequest(entry);
        throw error;
      }
    }
  },
});

registerRoute(
  ({ url }) => url.pathname.startsWith('/api/') ||
                url.pathname === '/transaction' ||
                url.pathname === '/chores' ||
                url.pathname === '/redeem',
  new NetworkFirst({
    cacheName: `${CACHE_NAME}-data`,
    networkTimeoutSeconds: 5,
    plugins: [
      bgSyncPlugin,
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  }),
  'POST'
);

// 4. Read Operations: Stale While Revalidate
registerRoute(
  ({ request }) => request.method === 'GET',
  new StaleWhileRevalidate({
    cacheName: `${CACHE_NAME}-dynamic`,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
      }),
    ],
  })
);

// ===============================================
// BACKGROUND SYNC
// ===============================================

self.addEventListener('sync', async (event) => {
  console.log('Background sync triggered:', event.tag);

  if (event.tag === 'sync-transactions') {
    event.waitUntil(syncTransactions());
  }

  if (event.tag === 'sync-chores') {
    event.waitUntil(syncChores());
  }
});

async function syncTransactions() {
  // Open IndexedDB
  const db = await openDB();
  const tx = db.transaction('syncQueue', 'readonly');
  const queue = await tx.objectStore('syncQueue')
    .index('status')
    .getAll('pending');

  for (const item of queue) {
    try {
      await processQueueItem(item);
    } catch (error) {
      console.error('Sync failed for item:', item.id, error);
    }
  }
}

async function processQueueItem(item) {
  const response = await fetch(`/${item.entityType}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Sync-Id': item.id,
      'X-Device-Id': await getDeviceId(),
    },
    body: JSON.stringify(item.data),
  });

  if (!response.ok) {
    throw new Error(`Sync failed: ${response.statusText}`);
  }

  // Update queue item status
  await markQueueItemSynced(item.id);
}

// ===============================================
// OFFLINE DETECTION
// ===============================================

self.addEventListener('fetch', (event) => {
  // Add custom header for offline requests
  if (!navigator.onLine) {
    const request = event.request.clone();
    const headers = new Headers(request.headers);
    headers.append('X-Offline', 'true');

    const newRequest = new Request(request, { headers });
    event.respondWith(fetch(newRequest).catch(() => {
      return caches.match(request);
    }));
  }
});

// ===============================================
// PUSH NOTIFICATIONS (Future)
// ===============================================

self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};

  const options = {
    body: data.message || 'New update available',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge.png',
    tag: 'kids-hub-notification',
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Kids Home Hub', options)
  );
});

// ===============================================
// MESSAGE HANDLING
// ===============================================

self.addEventListener('message', (event) => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'SYNC_NOW') {
    self.registration.sync.register('sync-transactions');
  }

  if (event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});

// ===============================================
// UTILITIES
// ===============================================

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('kidsHomeHub', 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getDeviceId() {
  // Retrieve from IndexedDB or generate new one
  const db = await openDB();
  const tx = db.transaction('metadata', 'readonly');
  const metadata = await tx.objectStore('metadata').get('deviceId');
  return metadata?.value || 'unknown';
}

async function markQueueItemSynced(itemId) {
  const db = await openDB();
  const tx = db.transaction('syncQueue', 'readwrite');
  const item = await tx.objectStore('syncQueue').get(itemId);

  if (item) {
    item.status = 'synced';
    item.syncedAt = Date.now();
    await tx.objectStore('syncQueue').put(item);
  }
}
```

### Client-Side Registration

```javascript
// main.js (in worker.js HTML)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('Service Worker registered:', registration.scope);

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker available
            showUpdateNotification();
          }
        });
      });

      // Listen for messages from SW
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'SYNC_COMPLETE') {
          updateUIAfterSync();
        }
      });

    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  });
}

// Trigger manual sync
async function triggerSync() {
  if ('serviceWorker' in navigator && 'sync' in registration) {
    try {
      await registration.sync.register('sync-transactions');
      console.log('Background sync registered');
    } catch (error) {
      console.error('Background sync registration failed:', error);
      // Fallback to immediate sync
      await manualSync();
    }
  }
}

// Show update notification
function showUpdateNotification() {
  const notification = document.createElement('div');
  notification.className = 'update-notification';
  notification.innerHTML = `
    <div class="notification-content">
      <span>New version available!</span>
      <button onclick="updateServiceWorker()">Update Now</button>
    </div>
  `;
  document.body.appendChild(notification);
}

// Update service worker
function updateServiceWorker() {
  navigator.serviceWorker.getRegistration().then((registration) => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  });
}
```

---

## Background Sync System

### Queue Management

```javascript
// syncManager.js - Local Queue Manager

class SyncManager {
  constructor() {
    this.db = null;
    this.deviceId = null;
    this.isOnline = navigator.onLine;
    this.syncInProgress = false;

    // Monitor online/offline status
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }

  async init() {
    this.db = await this.openDatabase();
    this.deviceId = await this.getOrCreateDeviceId();
  }

  openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('kidsHomeHub', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object stores
        if (!db.objectStoreNames.contains('transactions')) {
          const txStore = db.createObjectStore('transactions', { keyPath: 'id' });
          txStore.createIndex('childId', 'childId', { unique: false });
          txStore.createIndex('syncStatus', 'syncStatus', { unique: false });
          txStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('syncQueue')) {
          const queueStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          queueStore.createIndex('status', 'status', { unique: false });
          queueStore.createIndex('priority', 'priority', { unique: false });
          queueStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }

        if (!db.objectStoreNames.contains('conflicts')) {
          const conflictStore = db.createObjectStore('conflicts', { keyPath: 'id' });
          conflictStore.createIndex('resolved', 'resolved', { unique: false });
        }
      };
    });
  }

  async getOrCreateDeviceId() {
    const tx = this.db.transaction('metadata', 'readwrite');
    const store = tx.objectStore('metadata');

    let deviceIdRecord = await this.promisifyRequest(store.get('deviceId'));

    if (!deviceIdRecord) {
      const deviceId = this.generateDeviceId();
      deviceIdRecord = { key: 'deviceId', value: deviceId };
      await this.promisifyRequest(store.put(deviceIdRecord));
    }

    return deviceIdRecord.value;
  }

  generateDeviceId() {
    return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ===============================================
  // TRANSACTION OPERATIONS
  // ===============================================

  async addTransaction(transaction) {
    const tx = this.db.transaction(['transactions', 'syncQueue', 'metadata'], 'readwrite');

    // Generate ID
    transaction.id = this.generateId();
    transaction.createdAt = Date.now();
    transaction.syncStatus = 'pending';
    transaction.deviceId = this.deviceId;
    transaction.localVersion = 1;

    // Store transaction
    await this.promisifyRequest(tx.objectStore('transactions').add(transaction));

    // Add to sync queue
    const queueItem = {
      id: this.generateId(),
      operation: 'create',
      entityType: 'transaction',
      entityId: transaction.id,
      data: transaction,
      priority: this.calculatePriority(transaction),
      createdAt: Date.now(),
      status: 'pending',
      retryCount: 0,
      maxRetries: 5,
    };

    await this.promisifyRequest(tx.objectStore('syncQueue').add(queueItem));

    // Update metadata (totals)
    await this.updateMetadata(tx, transaction);

    await this.promisifyRequest(tx.complete);

    // Trigger sync if online
    if (this.isOnline) {
      this.triggerSync();
    }

    return transaction;
  }

  calculatePriority(transaction) {
    // Higher priority for deductions (prevent overspending)
    if (transaction.action === 'deduct') return 10;
    // Medium priority for additions
    if (transaction.action === 'add') return 5;
    // Default
    return 1;
  }

  async updateMetadata(tx, transaction) {
    const metadataKey = `${transaction.type}:total:${transaction.childId}`;
    const store = tx.objectStore('metadata');

    let metadata = await this.promisifyRequest(store.get(metadataKey));

    if (!metadata) {
      metadata = {
        key: metadataKey,
        value: 0,
        lastUpdated: Date.now(),
        pendingChanges: 0,
      };
    }

    // Update value
    const delta = transaction.action === 'add' ? transaction.amount : -transaction.amount;
    metadata.value += delta;
    metadata.lastUpdated = Date.now();
    metadata.pendingChanges += 1;

    await this.promisifyRequest(store.put(metadata));
  }

  // ===============================================
  // SYNC OPERATIONS
  // ===============================================

  async triggerSync() {
    if (this.syncInProgress) {
      console.log('Sync already in progress');
      return;
    }

    this.syncInProgress = true;

    try {
      await this.processQueue();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  async processQueue() {
    const tx = this.db.transaction('syncQueue', 'readwrite');
    const store = tx.objectStore('syncQueue');
    const index = store.index('status');

    // Get all pending items, sorted by priority
    const pendingItems = await this.promisifyRequest(
      index.getAll('pending')
    );

    // Sort by priority (descending)
    pendingItems.sort((a, b) => b.priority - a.priority);

    for (const item of pendingItems) {
      try {
        await this.syncQueueItem(item);
      } catch (error) {
        console.error(`Failed to sync item ${item.id}:`, error);
        await this.handleSyncFailure(item, error);
      }
    }
  }

  async syncQueueItem(item) {
    // Update status to processing
    await this.updateQueueItemStatus(item.id, 'processing');

    // Determine endpoint
    const endpoint = this.getEndpoint(item.entityType);

    // Send to server
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sync-Id': item.id,
        'X-Device-Id': this.deviceId,
        'X-Local-Version': item.data.localVersion?.toString() || '1',
      },
      body: JSON.stringify(item.data),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    // Handle response
    await this.handleSyncSuccess(item, result);
  }

  getEndpoint(entityType) {
    const endpoints = {
      transaction: '/transaction',
      chore: '/chores',
      redeem: '/redeem',
    };
    return endpoints[entityType] || '/transaction';
  }

  async handleSyncSuccess(item, serverResponse) {
    const tx = this.db.transaction(['syncQueue', 'transactions', 'metadata'], 'readwrite');

    // Remove from queue
    await this.promisifyRequest(
      tx.objectStore('syncQueue').delete(item.id)
    );

    // Update transaction status
    const transaction = await this.promisifyRequest(
      tx.objectStore('transactions').get(item.entityId)
    );

    if (transaction) {
      transaction.syncStatus = 'synced';
      transaction.serverVersion = serverResponse.version || transaction.localVersion;
      await this.promisifyRequest(
        tx.objectStore('transactions').put(transaction)
      );
    }

    // Update metadata
    const metadataKey = `${transaction.type}:total:${transaction.childId}`;
    const metadata = await this.promisifyRequest(
      tx.objectStore('metadata').get(metadataKey)
    );

    if (metadata) {
      metadata.pendingChanges = Math.max(0, metadata.pendingChanges - 1);
      metadata.lastSyncedAt = Date.now();
      await this.promisifyRequest(
        tx.objectStore('metadata').put(metadata)
      );
    }

    await this.promisifyRequest(tx.complete);

    // Notify UI
    this.notifyUI('sync-success', { itemId: item.id });
  }

  async handleSyncFailure(item, error) {
    const tx = this.db.transaction('syncQueue', 'readwrite');
    const store = tx.objectStore('syncQueue');

    const queueItem = await this.promisifyRequest(store.get(item.id));

    if (!queueItem) return;

    queueItem.retryCount += 1;
    queueItem.lastError = error.message;

    if (queueItem.retryCount >= queueItem.maxRetries) {
      // Max retries exceeded - mark as failed
      queueItem.status = 'failed';
      await this.promisifyRequest(store.put(queueItem));

      // Notify user
      this.notifyUI('sync-failed', {
        itemId: item.id,
        error: error.message
      });
    } else {
      // Calculate next retry with exponential backoff
      const backoffMs = Math.min(
        1000 * Math.pow(2, queueItem.retryCount),
        300000 // Max 5 minutes
      );

      queueItem.status = 'pending';
      queueItem.nextRetryAt = Date.now() + backoffMs;
      await this.promisifyRequest(store.put(queueItem));

      // Schedule retry
      setTimeout(() => this.triggerSync(), backoffMs);
    }

    await this.promisifyRequest(tx.complete);
  }

  async updateQueueItemStatus(itemId, status) {
    const tx = this.db.transaction('syncQueue', 'readwrite');
    const store = tx.objectStore('syncQueue');

    const item = await this.promisifyRequest(store.get(itemId));
    if (item) {
      item.status = status;
      await this.promisifyRequest(store.put(item));
    }

    await this.promisifyRequest(tx.complete);
  }

  // ===============================================
  // CONFLICT DETECTION & RESOLUTION
  // ===============================================

  async detectConflicts() {
    // Fetch latest data from server
    const serverData = await this.fetchServerData();

    const tx = this.db.transaction(['transactions', 'conflicts'], 'readwrite');
    const transactionStore = tx.objectStore('transactions');
    const conflictStore = tx.objectStore('conflicts');

    const localTransactions = await this.promisifyRequest(
      transactionStore.getAll()
    );

    for (const localTx of localTransactions) {
      const serverTx = serverData.find(t => t.id === localTx.id);

      if (serverTx && serverTx.version !== localTx.serverVersion) {
        // Conflict detected
        const conflict = {
          id: this.generateId(),
          entityType: 'transaction',
          entityId: localTx.id,
          localVersion: localTx,
          serverVersion: serverTx,
          timestamp: Date.now(),
          resolved: false,
        };

        await this.promisifyRequest(conflictStore.add(conflict));

        // Update transaction status
        localTx.syncStatus = 'conflict';
        await this.promisifyRequest(transactionStore.put(localTx));

        // Notify UI
        this.notifyUI('conflict-detected', { conflictId: conflict.id });
      }
    }

    await this.promisifyRequest(tx.complete);
  }

  async resolveConflict(conflictId, strategy = 'server') {
    const tx = this.db.transaction(['conflicts', 'transactions'], 'readwrite');
    const conflictStore = tx.objectStore('conflicts');
    const transactionStore = tx.objectStore('transactions');

    const conflict = await this.promisifyRequest(conflictStore.get(conflictId));

    if (!conflict) return;

    let resolvedVersion;

    switch (strategy) {
      case 'local':
        resolvedVersion = conflict.localVersion;
        break;

      case 'server':
        resolvedVersion = conflict.serverVersion;
        break;

      case 'merge':
        resolvedVersion = this.mergeVersions(
          conflict.localVersion,
          conflict.serverVersion
        );
        break;

      default:
        resolvedVersion = conflict.serverVersion;
    }

    // Update transaction
    resolvedVersion.syncStatus = 'synced';
    await this.promisifyRequest(transactionStore.put(resolvedVersion));

    // Mark conflict as resolved
    conflict.resolved = true;
    conflict.resolution = strategy;
    conflict.mergedVersion = resolvedVersion;
    conflict.resolvedAt = Date.now();
    await this.promisifyRequest(conflictStore.put(conflict));

    await this.promisifyRequest(tx.complete);

    // Notify UI
    this.notifyUI('conflict-resolved', { conflictId });
  }

  mergeVersions(local, server) {
    // Custom merge logic - prefer newer timestamp
    return local.timestamp > server.timestamp ? local : server;
  }

  // ===============================================
  // ONLINE/OFFLINE HANDLERS
  // ===============================================

  handleOnline() {
    console.log('Device is online');
    this.isOnline = true;
    this.notifyUI('online');

    // Trigger sync
    setTimeout(() => this.triggerSync(), 1000);
  }

  handleOffline() {
    console.log('Device is offline');
    this.isOnline = false;
    this.notifyUI('offline');
  }

  // ===============================================
  // READ OPERATIONS
  // ===============================================

  async getTransactions(childId, options = {}) {
    const tx = this.db.transaction('transactions', 'readonly');
    const store = tx.objectStore('transactions');
    const index = store.index('childId');

    let transactions = await this.promisifyRequest(index.getAll(childId));

    // Filter by type if specified
    if (options.type) {
      transactions = transactions.filter(t => t.type === options.type);
    }

    // Sort by timestamp (newest first)
    transactions.sort((a, b) =>
      new Date(b.timestamp) - new Date(a.timestamp)
    );

    // Limit results
    if (options.limit) {
      transactions = transactions.slice(0, options.limit);
    }

    return transactions;
  }

  async getMetadata(key) {
    const tx = this.db.transaction('metadata', 'readonly');
    const store = tx.objectStore('metadata');
    const metadata = await this.promisifyRequest(store.get(key));
    return metadata?.value || 0;
  }

  async getPendingSyncCount() {
    const tx = this.db.transaction('syncQueue', 'readonly');
    const store = tx.objectStore('syncQueue');
    const index = store.index('status');
    const pending = await this.promisifyRequest(index.getAll('pending'));
    return pending.length;
  }

  // ===============================================
  // UTILITIES
  // ===============================================

  generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  promisifyRequest(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async fetchServerData() {
    const response = await fetch('/api/transactions', {
      headers: {
        'X-Device-Id': this.deviceId,
      },
    });
    return response.json();
  }

  notifyUI(event, data = {}) {
    window.dispatchEvent(new CustomEvent('sync-manager', {
      detail: { event, data }
    }));
  }
}

// Export singleton
export const syncManager = new SyncManager();
```

---

## Conflict Resolution

### Strategies

#### 1. Last-Write-Wins (LWW)
**When to use**: Simple scenarios, single user per child

```javascript
function resolveConflictLWW(local, server) {
  return new Date(local.timestamp) > new Date(server.timestamp)
    ? local
    : server;
}
```

**Pros**: Simple, deterministic
**Cons**: May lose data

#### 2. Server-Wins
**When to use**: Server is source of truth, prevent local corruption

```javascript
function resolveConflictServerWins(local, server) {
  return server;
}
```

**Pros**: Consistent, safe
**Cons**: Discards local changes

#### 3. Custom Merge (Recommended for Kids Home Hub)
**When to use**: Financial data, need to preserve all changes

```javascript
class ConflictResolver {
  resolve(local, server, entityType) {
    switch (entityType) {
      case 'transaction':
        return this.resolveTransaction(local, server);

      case 'chore':
        return this.resolveChore(local, server);

      default:
        return this.defaultResolve(local, server);
    }
  }

  resolveTransaction(local, server) {
    // For financial transactions, prefer server to prevent double-spend
    // But if local is newer and server hasn't synced it, keep local

    if (local.id === server.id) {
      // Same transaction, different versions
      return server; // Server is source of truth
    }

    // Different transactions - keep both
    return { keepBoth: true, local, server };
  }

  resolveChore(local, server) {
    // Merge completed chores - union of both
    const localChores = new Set(local.chores.map(c => c.id));
    const serverChores = new Set(server.chores.map(c => c.id));

    const merged = {
      ...local,
      chores: [
        ...local.chores,
        ...server.chores.filter(c => !localChores.has(c.id))
      ],
    };

    // Recalculate total points
    merged.totalPoints = merged.chores.reduce((sum, c) => sum + c.points, 0);

    return merged;
  }

  defaultResolve(local, server) {
    // Use timestamp-based resolution
    return new Date(local.timestamp) > new Date(server.timestamp)
      ? local
      : server;
  }
}
```

#### 4. Operational Transformation (Advanced)
**When to use**: Real-time collaboration, multiple users editing simultaneously

```javascript
// Example for balance adjustments
class OperationalTransform {
  transform(localOps, serverOps) {
    // Convert operations to deltas
    const localDelta = this.opsToDeltas(localOps);
    const serverDelta = this.opsToDeltas(serverOps);

    // Merge deltas
    const mergedDelta = {
      money: localDelta.money + serverDelta.money,
      points: localDelta.points + serverDelta.points,
      screen: localDelta.screen + serverDelta.screen,
    };

    return mergedDelta;
  }

  opsToDeltas(ops) {
    return ops.reduce((deltas, op) => {
      const key = op.type;
      const value = op.action === 'add' ? op.amount : -op.amount;
      deltas[key] = (deltas[key] || 0) + value;
      return deltas;
    }, {});
  }
}
```

### Conflict UI Component

```javascript
// conflictResolver.js - UI Component

class ConflictResolverUI {
  constructor(syncManager) {
    this.syncManager = syncManager;
    this.init();
  }

  init() {
    window.addEventListener('sync-manager', (event) => {
      if (event.detail.event === 'conflict-detected') {
        this.showConflictDialog(event.detail.data.conflictId);
      }
    });
  }

  async showConflictDialog(conflictId) {
    const conflict = await this.syncManager.getConflict(conflictId);

    const dialog = document.createElement('div');
    dialog.className = 'conflict-dialog';
    dialog.innerHTML = `
      <div class="dialog-overlay"></div>
      <div class="dialog-content">
        <h2>Data Conflict Detected</h2>
        <p>The same data was changed on multiple devices. How would you like to resolve this?</p>

        <div class="conflict-versions">
          <div class="version local">
            <h3>Your Changes (This Device)</h3>
            ${this.renderVersion(conflict.localVersion)}
            <button onclick="resolveConflict('${conflictId}', 'local')">
              Use My Changes
            </button>
          </div>

          <div class="version server">
            <h3>Server Version (Other Device)</h3>
            ${this.renderVersion(conflict.serverVersion)}
            <button onclick="resolveConflict('${conflictId}', 'server')">
              Use Server Version
            </button>
          </div>
        </div>

        <div class="dialog-actions">
          <button class="btn-merge" onclick="resolveConflict('${conflictId}', 'merge')">
            Merge Both
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);
  }

  renderVersion(version) {
    return `
      <div class="version-details">
        <p><strong>Type:</strong> ${version.type}</p>
        <p><strong>Action:</strong> ${version.action}</p>
        <p><strong>Amount:</strong> ${version.amount}</p>
        <p><strong>Reason:</strong> ${version.reason}</p>
        <p><strong>Time:</strong> ${new Date(version.timestamp).toLocaleString()}</p>
      </div>
    `;
  }
}

// Global function for onclick handlers
window.resolveConflict = async (conflictId, strategy) => {
  await syncManager.resolveConflict(conflictId, strategy);

  // Close dialog
  const dialog = document.querySelector('.conflict-dialog');
  if (dialog) {
    dialog.remove();
  }

  // Refresh UI
  window.location.reload();
};
```

---

## Technology Stack

### Recommended Technologies

#### 1. **Workbox** (Service Worker)
- **Version**: 7.0+
- **Why**: Industry standard, excellent debugging, battle-tested
- **Alternatives**: Custom SW, sw-toolbox (deprecated)

#### 2. **Dexie.js** (IndexedDB Wrapper)
- **Version**: 3.2+
- **Why**: Simpler API than raw IndexedDB, TypeScript support, excellent docs
- **Alternatives**: idb, PouchDB, localForage

```javascript
// Using Dexie.js

import Dexie from 'dexie';

class KidsHubDatabase extends Dexie {
  constructor() {
    super('kidsHomeHub');

    this.version(1).stores({
      transactions: '++id, childId, type, syncStatus, timestamp',
      chores: '++id, childId, syncStatus, timestamp',
      syncQueue: '++id, status, priority, createdAt',
      metadata: 'key',
      conflicts: '++id, resolved, timestamp',
    });

    this.transactions = this.table('transactions');
    this.chores = this.table('chores');
    this.syncQueue = this.table('syncQueue');
    this.metadata = this.table('metadata');
    this.conflicts = this.table('conflicts');
  }
}

const db = new KidsHubDatabase();

// Usage
await db.transactions.add({
  childId: 'adam',
  type: 'money',
  action: 'add',
  amount: 10,
  // ...
});

const adamTransactions = await db.transactions
  .where('childId').equals('adam')
  .and(t => t.type === 'money')
  .reverse()
  .sortBy('timestamp');
```

#### 3. **uuid** (ID Generation)
- **Version**: 9.0+
- **Why**: RFC4122 compliant, cryptographically secure

```javascript
import { v4 as uuidv4 } from 'uuid';

const transactionId = uuidv4(); // e.g., '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'
```

#### 4. **date-fns** (Timestamp Handling)
- **Version**: 2.30+
- **Why**: Lightweight, immutable, tree-shakeable

```javascript
import { formatISO, parseISO, isBefore } from 'date-fns';

const timestamp = formatISO(new Date());
const parsed = parseISO(timestamp);
```

### Full Package.json

```json
{
  "dependencies": {
    "dexie": "^3.2.4",
    "uuid": "^9.0.0",
    "date-fns": "^2.30.0",
    "workbox-window": "^7.0.0"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20241127.0",
    "wrangler": "^3.94.0",
    "workbox-build": "^7.0.0",
    "workbox-cli": "^7.0.0",
    "vitest": "^2.1.8"
  }
}
```

---

## Critical Scenarios

### Scenario 1: Child Completes Chores Offline

**Flow**:
```
1. Child opens app (offline)
2. Selects chores completed
3. Clicks "Save chores & add points"
   ↓
4. UI updates immediately (optimistic)
   - Points balance increases
   - Chores appear in history
   - "Syncing..." indicator shown
   ↓
5. Transaction saved to IndexedDB
6. Added to sync queue (priority: 5)
7. Service worker caches UI state
   ↓
8. [Later] Device comes online
9. Background sync triggers
10. Queue processed
11. Sent to Cloudflare Worker
12. KV updated
13. Local record marked as synced
14. UI updated: "Synced ✓"
```

**Implementation**:

```javascript
// choresHandler.js

async function handleChoreSubmission(childId, selectedChores) {
  const totalPoints = selectedChores.reduce((sum, c) => sum + c.points, 0);

  const choreEntry = {
    id: uuidv4(),
    childId,
    chores: selectedChores,
    totalPoints,
    timestamp: formatISO(new Date()),
    createdAt: Date.now(),
    syncStatus: 'pending',
    deviceId: await getDeviceId(),
  };

  // 1. Optimistic UI update
  updateUIOptimistically(choreEntry);
  showSyncIndicator('syncing');

  try {
    // 2. Save to IndexedDB
    await db.chores.add(choreEntry);

    // 3. Update points metadata
    const currentPoints = await db.metadata.get(`points:total:${childId}`);
    await db.metadata.put({
      key: `points:total:${childId}`,
      value: (currentPoints?.value || 0) + totalPoints,
      lastUpdated: Date.now(),
      pendingChanges: (currentPoints?.pendingChanges || 0) + 1,
    });

    // 4. Add to sync queue
    await db.syncQueue.add({
      id: uuidv4(),
      operation: 'create',
      entityType: 'chore',
      entityId: choreEntry.id,
      data: choreEntry,
      priority: 5,
      createdAt: Date.now(),
      status: 'pending',
      retryCount: 0,
      maxRetries: 5,
    });

    // 5. Trigger sync if online
    if (navigator.onLine) {
      await syncManager.triggerSync();
    } else {
      showSyncIndicator('offline');
    }

  } catch (error) {
    console.error('Failed to save chore:', error);
    revertUIUpdate(choreEntry);
    showError('Failed to save chores. Please try again.');
  }
}

function updateUIOptimistically(choreEntry) {
  // Update points display
  const pointsElement = document.querySelector(`#points-${choreEntry.childId}`);
  if (pointsElement) {
    const current = parseInt(pointsElement.textContent);
    pointsElement.textContent = current + choreEntry.totalPoints;
  }

  // Add to chores history
  const historyElement = document.querySelector(`#chores-history-${choreEntry.childId}`);
  if (historyElement) {
    const entry = createChoreHistoryElement(choreEntry);
    historyElement.prepend(entry);
  }
}

function showSyncIndicator(status) {
  const indicator = document.querySelector('#sync-indicator');

  switch (status) {
    case 'syncing':
      indicator.textContent = 'Syncing...';
      indicator.className = 'sync-indicator syncing';
      break;

    case 'synced':
      indicator.textContent = 'Synced ✓';
      indicator.className = 'sync-indicator synced';
      setTimeout(() => indicator.className = 'sync-indicator hidden', 2000);
      break;

    case 'offline':
      indicator.textContent = 'Offline - will sync when online';
      indicator.className = 'sync-indicator offline';
      break;

    case 'error':
      indicator.textContent = 'Sync failed';
      indicator.className = 'sync-indicator error';
      break;
  }
}
```

### Scenario 2: Parent Adds Money While Offline

**Flow**:
```
1. Parent opens app (offline)
2. Fills transaction form
3. Clicks "Save"
   ↓
4. UI updates immediately
   - Balance increases
   - Transaction appears in history
   - "Will sync when online" message
   ↓
5. Transaction saved to IndexedDB
6. Added to sync queue (priority: 5 for add, 10 for deduct)
   ↓
7. [Later] Device comes online
8. Queue processed by priority
9. Deductions processed first (prevent overspending)
10. Server validates balance
11. If valid: Success
    If invalid: Conflict resolution
```

**Implementation**:

```javascript
// transactionHandler.js

async function handleMoneyTransaction(formData) {
  const transaction = {
    id: uuidv4(),
    childId: formData.child,
    type: 'money',
    action: formData.action,
    amount: parseFloat(formData.amount),
    currency: formData.currency,
    reason: formData.reason,
    timestamp: formatISO(new Date()),
    createdAt: Date.now(),
    syncStatus: 'pending',
    deviceId: await getDeviceId(),
    localVersion: 1,
  };

  // Convert to GBP
  const rate = conversionRates[transaction.currency];
  const convertedAmount = parseFloat((transaction.amount * rate).toFixed(2));

  // Optimistic update
  updateMoneyBalance(transaction.childId, convertedAmount, transaction.action);

  // Save locally
  await db.transactions.add(transaction);

  // Update metadata
  await updateMoneyMetadata(transaction.childId, convertedAmount, transaction.action);

  // Queue for sync
  await db.syncQueue.add({
    id: uuidv4(),
    operation: 'create',
    entityType: 'transaction',
    entityId: transaction.id,
    data: transaction,
    priority: transaction.action === 'deduct' ? 10 : 5, // Deductions have higher priority
    createdAt: Date.now(),
    status: 'pending',
    retryCount: 0,
    maxRetries: 5,
  });

  // Trigger sync
  if (navigator.onLine) {
    await syncManager.triggerSync();
  } else {
    showToast('Saved locally. Will sync when online.', 'info');
  }
}
```

### Scenario 3: Multiple Devices Syncing Same Child's Data

**Challenge**: Parent's phone adds £10, Dad's tablet deducts £5, simultaneously

**Solution**: Server-side validation + conflict detection

**Flow**:
```
Device A (Phone)              Server (KV)              Device B (Tablet)
     │                            │                          │
     ├─ Add £10 (offline)         │                          │
     │  Balance: £20 → £30        │                          │
     │                            │                          ├─ Deduct £5 (offline)
     │                            │                          │  Balance: £20 → £15
     │                            │                          │
     ├─ Online, sync starts       │                          │
     │  POST /transaction         │                          │
     │  X-Local-Version: 1    ────┼──>                       │
     │  X-Device-Id: phone        │                          │
     │                            │                          │
     │                         Receive:                      │
     │                         - Current balance: £20        │
     │                         - Apply +£10                  │
     │                         - New balance: £30            │
     │                         - Version: 2                  │
     │                            │                          │
     │                    <───────┼─  200 OK                 │
     │                            │  { version: 2 }          │
     ├─ Update local              │                          │
     │  serverVersion: 2          │                          │
     │                            │                          │
     │                            │                          ├─ Online, sync starts
     │                            │                          │  POST /transaction
     │                            │                          │  X-Local-Version: 1
     │                            │      <───────────────────┤  X-Device-Id: tablet
     │                            │                          │
     │                         Receive:                      │
     │                         - Current: £30 (version 2)    │
     │                         - Requested: -£5 from v1      │
     │                         - CONFLICT DETECTED           │
     │                            │                          │
     │                            │  409 Conflict ──────────>│
     │                            │  { currentVersion: 2,    │
     │                            │    localVersion: 1,      │
     │                            │    currentBalance: £30 } │
     │                            │                          │
     │                            │                          ├─ Detect conflict
     │                            │                          │  Fetch latest: £30
     │                            │                          │  Recalculate: £30 - £5 = £25
     │                            │                          │  Retry with version 2
     │                            │                          │
     │                            │      <───────────────────┤ POST /transaction
     │                            │                          │ X-Local-Version: 2
     │                         Apply:                        │
     │                         - £30 - £5 = £25             │
     │                         - Version: 3                  │
     │                            │                          │
     │                            │  200 OK ─────────────────>│
     │                            │  { version: 3 }          │
     │                            │                          ├─ Update local
     │                            │                          │  serverVersion: 3
     │                            │                          │
     ├─ Background fetch          │                          │
     │  GET /api/sync             │                          │
     │                    <───────┼─  { version: 3,          │
     │                            │    balance: £25 }        │
     ├─ Detect version mismatch   │                          │
     │  Local: v2, Server: v3     │                          │
     │  Fetch and update          │                          │
     │                            │                          │
```

**Implementation**:

```javascript
// Server-side (Cloudflare Worker)

async function handleTransaction(request, env) {
  const data = await request.json();
  const headers = {
    syncId: request.headers.get('X-Sync-Id'),
    deviceId: request.headers.get('X-Device-Id'),
    localVersion: parseInt(request.headers.get('X-Local-Version') || '1'),
  };

  // Get current state from KV
  const totalKey = `${data.type}:total:${data.childId}`;
  const versionKey = `${data.type}:version:${data.childId}`;

  const currentTotal = parseFloat(await env.CHILD_SPEND.get(totalKey) || '0');
  const currentVersion = parseInt(await env.CHILD_SPEND.get(versionKey) || '0');

  // Check for version conflict
  if (headers.localVersion < currentVersion) {
    return new Response(JSON.stringify({
      error: 'Conflict detected',
      currentVersion,
      localVersion: headers.localVersion,
      currentBalance: currentTotal,
    }), {
      status: 409,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Apply transaction
  const delta = data.action === 'add' ? data.amount : -data.amount;
  const newTotal = currentTotal + delta;

  // Validate (prevent negative balances for deductions)
  if (data.action === 'deduct' && newTotal < 0) {
    return new Response(JSON.stringify({
      error: 'Insufficient balance',
      currentBalance: currentTotal,
      requested: data.amount,
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Increment version
  const newVersion = currentVersion + 1;

  // Write to KV
  await env.CHILD_SPEND.put(totalKey, newTotal.toFixed(2));
  await env.CHILD_SPEND.put(versionKey, String(newVersion));

  // Store transaction log
  const logKey = `${data.type}:log:${data.childId}`;
  let log = JSON.parse(await env.CHILD_SPEND.get(logKey) || '[]');
  log.unshift({
    ...data,
    serverVersion: newVersion,
    syncedAt: new Date().toISOString(),
    deviceId: headers.deviceId,
  });
  await env.CHILD_SPEND.put(logKey, JSON.stringify(log));

  return new Response(JSON.stringify({
    success: true,
    version: newVersion,
    balance: newTotal,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

```javascript
// Client-side conflict handler

async function handleSyncConflict(queueItem, serverResponse) {
  console.log('Conflict detected:', serverResponse);

  // Fetch latest server data
  const latestData = await fetchLatestServerData(
    queueItem.data.type,
    queueItem.data.childId
  );

  // Update local version
  queueItem.data.localVersion = serverResponse.currentVersion;

  // Recalculate based on server balance
  const delta = queueItem.data.action === 'add'
    ? queueItem.data.amount
    : -queueItem.data.amount;

  const newBalance = serverResponse.currentBalance + delta;

  // Validate again
  if (queueItem.data.action === 'deduct' && newBalance < 0) {
    // Insufficient funds - mark as failed
    await db.syncQueue.update(queueItem.id, {
      status: 'failed',
      lastError: 'Insufficient balance on server',
    });

    showToast('Transaction failed: Insufficient balance', 'error');
    return;
  }

  // Retry with updated version
  queueItem.retryCount += 1;
  queueItem.status = 'pending';
  await db.syncQueue.put(queueItem);

  // Trigger immediate retry
  await syncManager.triggerSync();
}
```

### Scenario 4: Network Interruption During Transaction

**Flow**:
```
1. User submits transaction
2. Request sent to server
3. Network drops mid-request
   ↓
4. Fetch API throws error
5. Caught by sync manager
6. Item marked as failed (retry 1/5)
7. Exponential backoff calculated (2s)
   ↓
8. After 2s, retry
9. If still offline: retry 2/5, backoff 4s
10. If online: success, queue item removed
```

**Implementation**:

```javascript
// Retry logic with exponential backoff

async function syncWithRetry(queueItem) {
  const maxRetries = queueItem.maxRetries || 5;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Attempt sync
      const response = await fetch(getEndpoint(queueItem.entityType), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sync-Id': queueItem.id,
          'X-Device-Id': await getDeviceId(),
          'X-Local-Version': queueItem.data.localVersion?.toString() || '1',
        },
        body: JSON.stringify(queueItem.data),
        signal: AbortSignal.timeout(10000), // 10s timeout
      });

      if (response.ok) {
        // Success
        const result = await response.json();
        await handleSyncSuccess(queueItem, result);
        return true;
      }

      if (response.status === 409) {
        // Conflict - handle separately
        const conflict = await response.json();
        await handleSyncConflict(queueItem, conflict);
        return false;
      }

      // Server error - retry
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);

    } catch (error) {
      console.error(`Sync attempt ${attempt + 1} failed:`, error);

      // Update retry count
      queueItem.retryCount = attempt + 1;
      queueItem.lastError = error.message;
      await db.syncQueue.put(queueItem);

      // Check if should retry
      if (attempt < maxRetries - 1) {
        // Calculate backoff (2^attempt seconds, max 5 minutes)
        const backoffMs = Math.min(
          1000 * Math.pow(2, attempt),
          300000
        );

        console.log(`Retrying in ${backoffMs}ms...`);
        await sleep(backoffMs);

      } else {
        // Max retries exceeded
        queueItem.status = 'failed';
        await db.syncQueue.put(queueItem);

        showToast('Failed to sync after multiple attempts. Please check your connection.', 'error');
        return false;
      }
    }
  }

  return false;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### Scenario 5: Data Conflicts Between Devices

**Strategy**: Operational Transformation for balance reconciliation

**Example**: Both devices add transactions while offline

```javascript
// Conflict reconciliation

async function reconcileConflicts(childId, type) {
  // 1. Fetch server state
  const serverData = await fetchServerData(childId, type);

  // 2. Get local unsynced transactions
  const localTxs = await db.transactions
    .where(['childId', 'type', 'syncStatus'])
    .equals([childId, type, 'pending'])
    .toArray();

  // 3. Calculate deltas
  const serverBalance = serverData.balance;
  const serverVersion = serverData.version;

  const localDelta = localTxs.reduce((sum, tx) => {
    const amount = tx.action === 'add' ? tx.amount : -tx.amount;
    return sum + amount;
  }, 0);

  // 4. Expected balance after applying local changes
  const expectedBalance = serverBalance + localDelta;

  // 5. Get current local balance
  const localBalance = await db.metadata.get(`${type}:total:${childId}`);

  // 6. Check for discrepancy
  if (Math.abs(localBalance.value - expectedBalance) > 0.01) {
    console.warn('Balance discrepancy detected!', {
      local: localBalance.value,
      expected: expectedBalance,
      server: serverBalance,
      localDelta,
    });

    // 7. Correct local balance
    await db.metadata.put({
      key: `${type}:total:${childId}`,
      value: expectedBalance,
      lastUpdated: Date.now(),
      corrected: true,
    });

    // 8. Update UI
    updateBalanceDisplay(childId, type, expectedBalance);
  }

  // 9. Sync local transactions
  for (const tx of localTxs) {
    tx.localVersion = serverVersion;
    await db.transactions.put(tx);

    // Re-queue with correct version
    await db.syncQueue.add({
      id: uuidv4(),
      operation: 'create',
      entityType: 'transaction',
      entityId: tx.id,
      data: tx,
      priority: tx.action === 'deduct' ? 10 : 5,
      createdAt: Date.now(),
      status: 'pending',
      retryCount: 0,
      maxRetries: 5,
    });
  }

  // 10. Trigger sync
  await syncManager.triggerSync();
}
```

---

## Native App Considerations

### Platform Differences

#### Web (PWA)
- Service Workers
- IndexedDB
- Background Sync API
- Limited background execution

#### iOS (React Native / Capacitor)
- No Service Workers
- SQLite or AsyncStorage
- Background Fetch / Background Modes
- Strict battery management

#### Android (React Native / Capacitor)
- WorkManager for background tasks
- SQLite or Realm
- Foreground Services for sync
- More flexible background execution

### Native Storage Options

#### 1. **SQLite** (Recommended for Native)

```javascript
// Using react-native-sqlite-storage

import SQLite from 'react-native-sqlite-storage';

const db = SQLite.openDatabase(
  { name: 'kidsHomeHub.db', location: 'default' },
  () => console.log('Database opened'),
  error => console.error('Database error:', error)
);

// Create tables
db.transaction(tx => {
  tx.executeSql(
    `CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      childId TEXT NOT NULL,
      type TEXT NOT NULL,
      action TEXT NOT NULL,
      amount REAL NOT NULL,
      reason TEXT,
      timestamp TEXT NOT NULL,
      syncStatus TEXT DEFAULT 'pending',
      localVersion INTEGER DEFAULT 1,
      serverVersion INTEGER,
      deviceId TEXT,
      createdAt INTEGER
    )`
  );

  tx.executeSql(
    `CREATE INDEX idx_sync_status ON transactions(syncStatus)`
  );

  tx.executeSql(
    `CREATE INDEX idx_child_type ON transactions(childId, type)`
  );
});

// Insert transaction
function addTransaction(tx) {
  return new Promise((resolve, reject) => {
    db.transaction(txn => {
      txn.executeSql(
        `INSERT INTO transactions
         (id, childId, type, action, amount, reason, timestamp, deviceId, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tx.id,
          tx.childId,
          tx.type,
          tx.action,
          tx.amount,
          tx.reason,
          tx.timestamp,
          tx.deviceId,
          tx.createdAt,
        ],
        (_, result) => resolve(result),
        (_, error) => reject(error)
      );
    });
  });
}

// Query transactions
function getTransactions(childId, type) {
  return new Promise((resolve, reject) => {
    db.transaction(txn => {
      txn.executeSql(
        `SELECT * FROM transactions
         WHERE childId = ? AND type = ?
         ORDER BY timestamp DESC
         LIMIT 50`,
        [childId, type],
        (_, result) => {
          const rows = [];
          for (let i = 0; i < result.rows.length; i++) {
            rows.push(result.rows.item(i));
          }
          resolve(rows);
        },
        (_, error) => reject(error)
      );
    });
  });
}
```

#### 2. **Realm** (Alternative)

```javascript
// Using Realm

import Realm from 'realm';

const TransactionSchema = {
  name: 'Transaction',
  primaryKey: 'id',
  properties: {
    id: 'string',
    childId: 'string',
    type: 'string',
    action: 'string',
    amount: 'double',
    reason: 'string?',
    timestamp: 'string',
    syncStatus: { type: 'string', default: 'pending' },
    localVersion: { type: 'int', default: 1 },
    serverVersion: 'int?',
    deviceId: 'string',
    createdAt: 'int',
  },
};

const realm = await Realm.open({
  schema: [TransactionSchema],
  schemaVersion: 1,
});

// Add transaction
realm.write(() => {
  realm.create('Transaction', {
    id: uuidv4(),
    childId: 'adam',
    type: 'money',
    action: 'add',
    amount: 10.0,
    reason: 'Birthday gift',
    timestamp: new Date().toISOString(),
    deviceId: await getDeviceId(),
    createdAt: Date.now(),
  });
});

// Query transactions
const transactions = realm
  .objects('Transaction')
  .filtered('childId = "adam" AND type = "money"')
  .sorted('timestamp', true)
  .slice(0, 50);
```

### Background Sync on iOS

```javascript
// Using Capacitor + Background Fetch

import { BackgroundFetch } from '@capacitor-community/background-fetch';

// Configure background fetch (iOS)
BackgroundFetch.configure({
  minimumFetchInterval: 15, // minutes
}, async (taskId) => {
  console.log('[BackgroundFetch] Event received:', taskId);

  try {
    // Perform sync
    await syncManager.triggerSync();

    // Finish task
    BackgroundFetch.finish(taskId);
  } catch (error) {
    console.error('[BackgroundFetch] Sync failed:', error);
    BackgroundFetch.finish(taskId);
  }
});

// Register background fetch
BackgroundFetch.status((status) => {
  console.log('[BackgroundFetch] Status:', status);
});
```

### Background Sync on Android

```javascript
// Using WorkManager (Android)

import { Plugins } from '@capacitor/core';
const { WorkManager } = Plugins;

// Schedule periodic sync
await WorkManager.schedulePeriodicWork({
  workName: 'sync-transactions',
  interval: 15 * 60 * 1000, // 15 minutes
  constraints: {
    requiresNetworkType: 'connected',
    requiresBatteryNotLow: true,
  },
});

// Worker implementation (native Android)
// app/src/main/java/com/yourapp/SyncWorker.kt

class SyncWorker(
  context: Context,
  params: WorkerParameters
) : CoroutineWorker(context, params) {

  override suspend fun doWork(): Result {
    Log.d("SyncWorker", "Starting background sync")

    return try {
      // Call sync API
      val response = syncTransactions()

      if (response.isSuccessful) {
        Result.success()
      } else {
        Result.retry()
      }
    } catch (e: Exception) {
      Log.e("SyncWorker", "Sync failed", e)
      Result.retry()
    }
  }
}
```

### Battery & Data Usage Optimization

```javascript
// Native sync manager with battery awareness

class NativeSyncManager {
  constructor() {
    this.batteryLevel = 100;
    this.isCharging = false;
    this.networkType = 'wifi';

    this.initBatteryMonitoring();
    this.initNetworkMonitoring();
  }

  async initBatteryMonitoring() {
    // Using Capacitor Battery API
    const { Battery } = Plugins;

    const info = await Battery.getInfo();
    this.batteryLevel = info.batteryLevel * 100;
    this.isCharging = info.isCharging;

    Battery.addListener('batteryLevelChanged', (info) => {
      this.batteryLevel = info.batteryLevel * 100;
    });

    Battery.addListener('chargingChanged', (info) => {
      this.isCharging = info.isCharging;
    });
  }

  async initNetworkMonitoring() {
    // Using Capacitor Network API
    const { Network } = Plugins;

    const status = await Network.getStatus();
    this.networkType = status.connectionType;

    Network.addListener('networkStatusChange', (status) => {
      this.networkType = status.connectionType;

      if (status.connected) {
        this.onNetworkAvailable();
      }
    });
  }

  async shouldSync() {
    // Don't sync if battery is low and not charging
    if (this.batteryLevel < 20 && !this.isCharging) {
      console.log('Skipping sync: Low battery');
      return false;
    }

    // Only sync large data on WiFi
    if (this.networkType !== 'wifi') {
      const queueSize = await this.getQueueSize();

      if (queueSize > 10) {
        console.log('Skipping sync: Not on WiFi and queue is large');
        return false;
      }
    }

    return true;
  }

  async triggerSync() {
    if (!(await this.shouldSync())) {
      return;
    }

    // Proceed with sync
    await super.triggerSync();
  }

  async onNetworkAvailable() {
    // Network became available
    console.log('Network available, triggering sync');

    // Wait a bit for network to stabilize
    setTimeout(() => this.triggerSync(), 2000);
  }
}
```

### Push Notifications for Sync Status

```javascript
// Using Capacitor Push Notifications

import { PushNotifications } from '@capacitor/push-notifications';

class SyncNotificationManager {
  async init() {
    // Request permission
    const permission = await PushNotifications.requestPermissions();

    if (permission.receive === 'granted') {
      await PushNotifications.register();
    }

    // Listen for registration
    PushNotifications.addListener('registration', (token) => {
      console.log('Push token:', token.value);
      // Send to server
      this.sendTokenToServer(token.value);
    });

    // Listen for push notifications
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received:', notification);

      if (notification.data.type === 'sync-required') {
        syncManager.triggerSync();
      }
    });
  }

  async notifySyncComplete(count) {
    await PushNotifications.schedule({
      notifications: [
        {
          title: 'Sync Complete',
          body: `${count} transaction${count === 1 ? '' : 's'} synced successfully`,
          id: Date.now(),
          schedule: { at: new Date(Date.now() + 1000) },
        },
      ],
    });
  }

  async notifySyncFailed(count) {
    await PushNotifications.schedule({
      notifications: [
        {
          title: 'Sync Failed',
          body: `Failed to sync ${count} transaction${count === 1 ? '' : 's'}. Will retry later.`,
          id: Date.now(),
          schedule: { at: new Date(Date.now() + 1000) },
        },
      ],
    });
  }
}
```

---

## Implementation Guide

### Phase 1: Setup IndexedDB (Week 1)

**Tasks**:
1. Install Dexie.js
2. Define database schema
3. Implement basic CRUD operations
4. Migrate existing localStorage data

**Code**:

```javascript
// db.js

import Dexie from 'dexie';

export class KidsHubDB extends Dexie {
  constructor() {
    super('kidsHomeHub');

    this.version(1).stores({
      transactions: '++id, childId, type, syncStatus, timestamp, createdAt',
      chores: '++id, childId, syncStatus, timestamp, createdAt',
      syncQueue: '++id, status, priority, createdAt, nextRetryAt',
      metadata: 'key',
      conflicts: '++id, resolved, timestamp',
    });
  }
}

export const db = new KidsHubDB();

// Initialize
await db.open();

// Migrate from localStorage
async function migrateFromLocalStorage() {
  const selectedChild = localStorage.getItem('selectedChild');

  if (selectedChild) {
    await db.metadata.put({
      key: 'selectedChild',
      value: selectedChild,
    });
  }
}
```

### Phase 2: Implement Sync Manager (Week 2)

**Tasks**:
1. Create SyncManager class
2. Implement queue management
3. Add retry logic with exponential backoff
4. Implement online/offline detection

**Code**: See [Background Sync System](#background-sync-system) section

### Phase 3: Service Worker with Workbox (Week 3)

**Tasks**:
1. Install Workbox
2. Configure caching strategies
3. Implement background sync
4. Add offline fallback pages

**Code**: See [Service Worker Implementation](#service-worker-implementation) section

### Phase 4: Optimistic UI Updates (Week 4)

**Tasks**:
1. Update UI immediately on user actions
2. Add sync status indicators
3. Implement rollback on failures
4. Add loading states

**Code**:

```javascript
// ui.js

class OptimisticUI {
  async updateBalance(childId, type, delta, action) {
    const element = document.querySelector(`#${type}-balance-${childId}`);
    const currentValue = parseFloat(element.textContent);

    // Optimistic update
    const newValue = action === 'add' ? currentValue + delta : currentValue - delta;
    element.textContent = newValue.toFixed(2);

    // Add pending indicator
    element.classList.add('pending');

    // Store original value for rollback
    element.dataset.originalValue = currentValue;
  }

  async rollbackBalance(childId, type) {
    const element = document.querySelector(`#${type}-balance-${childId}`);
    const originalValue = parseFloat(element.dataset.originalValue);

    // Rollback
    element.textContent = originalValue.toFixed(2);
    element.classList.remove('pending');
    element.classList.add('error');

    // Remove error state after animation
    setTimeout(() => element.classList.remove('error'), 1000);
  }

  async confirmBalance(childId, type) {
    const element = document.querySelector(`#${type}-balance-${childId}`);
    element.classList.remove('pending');
    element.classList.add('synced');

    // Remove synced indicator
    setTimeout(() => element.classList.remove('synced'), 2000);
  }
}
```

### Phase 5: Conflict Resolution (Week 5)

**Tasks**:
1. Implement conflict detection
2. Add resolution UI
3. Implement merge strategies
4. Test multi-device scenarios

**Code**: See [Conflict Resolution](#conflict-resolution) section

### Phase 6: Testing & Optimization (Week 6)

**Tasks**:
1. Test offline scenarios
2. Test multi-device sync
3. Performance optimization
4. Battery usage testing (native)

**Testing Checklist**:

```markdown
## Offline Tests
- [ ] Complete transaction offline
- [ ] Complete chores offline
- [ ] View history offline
- [ ] Switch between children offline
- [ ] Multiple transactions offline
- [ ] Come back online and verify sync

## Multi-Device Tests
- [ ] Same transaction on two devices
- [ ] Different transactions on two devices
- [ ] Conflict resolution works correctly
- [ ] Version tracking is accurate
- [ ] Balances match after sync

## Edge Cases
- [ ] Network drops mid-request
- [ ] Server returns 500 error
- [ ] Insufficient balance deduction
- [ ] Version conflict resolution
- [ ] Max retries exceeded
- [ ] IndexedDB quota exceeded

## Performance
- [ ] Initial load < 2s
- [ ] Offline operation instant
- [ ] Sync completes < 5s
- [ ] No UI blocking during sync
- [ ] Battery usage acceptable
```

---

## Summary

This architecture provides:

1. **Full Offline Capability**: App works 100% offline with IndexedDB
2. **Optimistic UI**: Instant feedback, background sync
3. **Conflict Resolution**: Smart handling of multi-device scenarios
4. **Reliable Sync**: Queue-based with retry and exponential backoff
5. **Production-Ready**: Battle-tested libraries (Workbox, Dexie)
6. **Native Support**: Clear path for iOS/Android apps
7. **Performance**: Optimized caching, minimal battery drain

**Next Steps**:
1. Implement Phase 1 (IndexedDB setup)
2. Test with sample data
3. Roll out Phases 2-6
4. Deploy to production
5. Monitor and iterate

This offline-first architecture ensures Kids Home Hub works reliably even with poor connectivity, providing a seamless experience for both parents and children.
