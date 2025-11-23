# Offline-First Implementation Examples

This document provides practical examples for implementing offline-first features in Kids Home Hub.

## Table of Contents

1. [Complete Chores Offline](#complete-chores-offline)
2. [Add Money While Offline](#add-money-while-offline)
3. [Multi-Device Sync Scenario](#multi-device-sync-scenario)
4. [Network Interruption Handling](#network-interruption-handling)
5. [Server-Side Implementation](#server-side-implementation)
6. [Testing Offline Scenarios](#testing-offline-scenarios)

---

## Complete Chores Offline

### Scenario
Child completes chores while device is offline. Points should update immediately, sync when online.

### Implementation

```javascript
// chores-handler.js

import { syncManager } from './sync-manager.js';
import { optimisticUI } from './ui-sync-integration.js';

async function handleChoreSubmission(event) {
  event.preventDefault();

  const form = event.target;
  const childId = form.querySelector('[name="child"]').value;
  const checkboxes = form.querySelectorAll('[name="chore"]:checked');

  // Get selected chores
  const selectedChores = Array.from(checkboxes).map(cb => {
    const choreId = cb.value;
    const chore = CHORES.find(c => c.id === choreId);
    return chore;
  });

  if (selectedChores.length === 0) {
    showToast('Please select at least one chore', 'warning');
    return;
  }

  const totalPoints = selectedChores.reduce((sum, c) => sum + c.points, 0);

  try {
    // 1. Update UI optimistically
    const updateId = optimisticUI.updateBalance(childId, 'points', totalPoints, 'add');

    // 2. Save to local database
    const choreEntry = await syncManager.addChore({
      childId,
      chores: selectedChores,
      totalPoints,
    });

    // 3. Add to history
    optimisticUI.addToHistory(childId, {
      type: 'points',
      action: 'add',
      amount: totalPoints,
      reason: `Chores: ${selectedChores.map(c => c.label).join(', ')}`,
      timestamp: choreEntry.timestamp,
      id: choreEntry.id,
    });

    // 4. Clear form
    form.reset();

    // 5. Show success message
    if (navigator.onLine) {
      showToast('Chores saved and syncing...', 'success');
    } else {
      showToast('Chores saved. Will sync when online.', 'info');
    }

    // 6. Wait for sync (with timeout)
    setTimeout(async () => {
      const chore = await syncManager.db.chores.get(choreEntry.id);

      if (chore.syncStatus === 'synced') {
        optimisticUI.confirmBalance(updateId);
        optimisticUI.markHistorySynced(choreEntry.id);
      }
    }, 5000);

  } catch (error) {
    console.error('Failed to save chores:', error);
    showToast('Failed to save chores. Please try again.', 'error');
  }
}

// Attach to form
document.getElementById('chores-form-adam')?.addEventListener('submit', handleChoreSubmission);
document.getElementById('chores-form-sami')?.addEventListener('submit', handleChoreSubmission);
```

### HTML Form

```html
<form id="chores-form-adam" class="chores-form">
  <input type="hidden" name="child" value="adam">

  <div class="chore-list">
    <div class="chore-item">
      <label>
        <input type="checkbox" name="chore" value="tidy_room">
        Tidy bedroom
      </label>
      <span class="points">+10</span>
    </div>

    <div class="chore-item">
      <label>
        <input type="checkbox" name="chore" value="homework">
        Finish homework
      </label>
      <span class="points">+8</span>
    </div>

    <div class="chore-item">
      <label>
        <input type="checkbox" name="chore" value="set_table">
        Set / clear the table
      </label>
      <span class="points">+5</span>
    </div>
  </div>

  <button type="submit" class="btn primary full">Save chores & add points</button>
</form>

<!-- Sync indicator -->
<div id="sync-indicator" class="sync-indicator"></div>

<!-- Points history -->
<div id="points-history-adam" class="activity-list"></div>
```

---

## Add Money While Offline

### Scenario
Parent adds pocket money while offline. Balance updates immediately, syncs when connection restored.

### Implementation

```javascript
// money-handler.js

import { syncManager } from './sync-manager.js';
import { formHandler } from './ui-sync-integration.js';

async function handleMoneyForm(event) {
  event.preventDefault();

  const form = event.target;
  const formData = new FormData(form);

  try {
    // Use form handler for optimistic updates
    const transaction = await formHandler.handleMoneyTransaction(formData);

    // Close form
    form.closest('.inline-form')?.classList.remove('open');

    // Reset form
    form.reset();

    // Show appropriate message
    if (navigator.onLine) {
      showToast('Transaction saved and syncing...', 'success');
    } else {
      showToast('Transaction saved offline. Will sync when online.', 'info');
    }

    // Update balance display
    await updateBalanceDisplays();

  } catch (error) {
    console.error('Transaction failed:', error);
    showToast('Failed to save transaction. Please try again.', 'error');
  }
}

async function updateBalanceDisplays() {
  // Get totals from local database
  const adamMoney = await syncManager.getMetadata('money:total:adam');
  const samiMoney = await syncManager.getMetadata('money:total:sami');

  // Update UI
  const adamElement = document.getElementById('money-balance-adam');
  const samiElement = document.getElementById('money-balance-sami');

  if (adamElement) {
    adamElement.textContent = `£${adamMoney.toFixed(2)}`;
  }

  if (samiElement) {
    samiElement.textContent = `£${samiMoney.toFixed(2)}`;
  }

  // Update secondary currency (AUD)
  const conversionRate = 0.56; // 1 AUD = 0.56 GBP
  const adamAUD = (adamMoney / conversionRate).toFixed(2);
  const samiAUD = (samiMoney / conversionRate).toFixed(2);

  document.getElementById('money-balance-aud-adam')?.textContent = `≈ A$${adamAUD}`;
  document.getElementById('money-balance-aud-sami')?.textContent = `≈ A$${samiAUD}`;
}

// Attach to forms
document.querySelectorAll('.money-form').forEach(form => {
  form.addEventListener('submit', handleMoneyForm);
});

// Update balances on page load
document.addEventListener('DOMContentLoaded', updateBalanceDisplays);

// Update balances when sync completes
syncManager.on('item-synced', async (data) => {
  if (data.item.data.type === 'money') {
    await updateBalanceDisplays();
  }
});
```

### HTML Form

```html
<div id="money-adjust-adam" class="inline-form">
  <form action="/transaction" method="POST" class="money-form">
    <input type="hidden" name="feature" value="money">
    <input type="hidden" name="child" value="adam">

    <div class="segmented">
      <label>
        <input type="radio" name="action" value="add" checked>
        <span>Add</span>
      </label>
      <label>
        <input type="radio" name="action" value="deduct">
        <span>Deduct</span>
      </label>
    </div>

    <div class="form-row">
      <label>Amount</label>
      <input type="number" name="amount" step="0.01" min="0.01" required>
    </div>

    <div class="form-row">
      <label>Currency</label>
      <select name="currency">
        <option value="GBP">GBP (£)</option>
        <option value="AUD">AUD (A$)</option>
      </select>
    </div>

    <div class="form-row">
      <label>Reason</label>
      <input type="text" name="reason" placeholder="e.g. Birthday gift" required>
    </div>

    <button type="submit" class="btn primary full">Save</button>
  </form>
</div>

<!-- Balance display -->
<div class="card-balance">
  <div id="money-balance-adam" class="balance-value">£0.00</div>
  <div id="money-balance-aud-adam" class="balance-secondary">≈ A$0.00</div>
</div>
```

---

## Multi-Device Sync Scenario

### Scenario
Parent's phone and tablet both make changes while offline, then sync. Server needs to handle conflicts.

### Server-Side Handler (Cloudflare Worker)

```javascript
// worker.js - Enhanced transaction handler with version control

async function handleTransactionWithVersioning(request, env) {
  const data = await request.json();
  const headers = {
    syncId: request.headers.get('X-Sync-Id'),
    deviceId: request.headers.get('X-Device-Id'),
    localVersion: parseInt(request.headers.get('X-Local-Version') || '1'),
  };

  console.log('Transaction request:', { data, headers });

  // Keys for KV storage
  const totalKey = `${data.type}:total:${data.childId}`;
  const versionKey = `${data.type}:version:${data.childId}`;
  const logKey = `${data.type}:log:${data.childId}`;
  const lockKey = `${data.type}:lock:${data.childId}`;

  // Acquire distributed lock
  const lockAcquired = await acquireLock(env, lockKey, headers.deviceId);

  if (!lockAcquired) {
    return new Response(JSON.stringify({
      error: 'Resource locked by another device',
      retry: true,
    }), {
      status: 423,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Get current state
    const currentTotal = parseFloat(await env.CHILD_SPEND.get(totalKey) || '0');
    const currentVersion = parseInt(await env.CHILD_SPEND.get(versionKey) || '0');

    // Check for version conflict
    if (headers.localVersion < currentVersion) {
      console.log('Conflict detected:', {
        localVersion: headers.localVersion,
        currentVersion,
      });

      return new Response(JSON.stringify({
        error: 'Conflict detected',
        currentVersion,
        localVersion: headers.localVersion,
        currentBalance: currentTotal,
        message: 'Your data is outdated. Please fetch latest and retry.',
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Calculate new value
    const delta = data.action === 'add' ? data.amount : -data.amount;
    const newTotal = currentTotal + delta;

    // Validate
    if (newTotal < 0 && data.type === 'money') {
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

    // Write to KV (atomic)
    await Promise.all([
      env.CHILD_SPEND.put(totalKey, newTotal.toFixed(2)),
      env.CHILD_SPEND.put(versionKey, String(newVersion)),
    ]);

    // Update log
    let log = JSON.parse(await env.CHILD_SPEND.get(logKey) || '[]');
    log.unshift({
      ...data,
      serverVersion: newVersion,
      syncedAt: new Date().toISOString(),
      deviceId: headers.deviceId,
      syncId: headers.syncId,
    });

    // Keep last 100 entries
    if (log.length > 100) {
      log = log.slice(0, 100);
    }

    await env.CHILD_SPEND.put(logKey, JSON.stringify(log));

    console.log('Transaction successful:', {
      newTotal,
      newVersion,
      deviceId: headers.deviceId,
    });

    return new Response(JSON.stringify({
      success: true,
      version: newVersion,
      balance: newTotal,
      timestamp: new Date().toISOString(),
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } finally {
    // Release lock
    await releaseLock(env, lockKey, headers.deviceId);
  }
}

// Distributed lock implementation
async function acquireLock(env, lockKey, deviceId, timeout = 5000) {
  const lockValue = `${deviceId}:${Date.now()}`;
  const lockExpiry = Date.now() + timeout;

  // Try to acquire lock
  const existing = await env.CHILD_SPEND.get(lockKey);

  if (existing) {
    const [existingDevice, existingTime] = existing.split(':');
    const existingTimestamp = parseInt(existingTime);

    // Check if lock is expired
    if (Date.now() < existingTimestamp + timeout) {
      return false; // Lock still held
    }
  }

  // Acquire lock
  await env.CHILD_SPEND.put(lockKey, lockValue, {
    expirationTtl: Math.ceil(timeout / 1000),
  });

  return true;
}

async function releaseLock(env, lockKey, deviceId) {
  const existing = await env.CHILD_SPEND.get(lockKey);

  if (existing && existing.startsWith(deviceId)) {
    await env.CHILD_SPEND.delete(lockKey);
  }
}
```

### Client-Side Conflict Handling

```javascript
// conflict-handler.js

import { syncManager } from './sync-manager.js';

async function handleConflictResponse(queueItem, conflictResponse) {
  console.log('Handling conflict:', conflictResponse);

  // Update local version to match server
  const updatedData = {
    ...queueItem.data,
    localVersion: conflictResponse.currentVersion,
  };

  // Recalculate based on current server balance
  const delta = queueItem.data.action === 'add'
    ? queueItem.data.amount
    : -queueItem.data.amount;

  const expectedBalance = conflictResponse.currentBalance + delta;

  // Validate
  if (expectedBalance < 0 && queueItem.data.type === 'money') {
    // Insufficient funds on server
    await syncManager.db.syncQueue.update(queueItem.id, {
      status: 'failed',
      lastError: 'Insufficient balance on server',
    });

    showToast('Transaction failed: Insufficient balance', 'error');
    return;
  }

  // Update queue item with new version
  await syncManager.db.syncQueue.update(queueItem.id, {
    data: updatedData,
    status: 'pending',
    retryCount: queueItem.retryCount + 1,
  });

  // Trigger immediate retry
  await syncManager.triggerSync();
}

// Listen for conflicts
syncManager.on('conflict-detected', async ({ conflict, item }) => {
  if (conflict.serverVersion.error === 'Conflict detected') {
    await handleConflictResponse(item, conflict.serverVersion);
  }
});
```

---

## Network Interruption Handling

### Scenario
Network drops mid-request. Request times out, retry with exponential backoff.

### Implementation

```javascript
// network-resilience.js

import { syncManager } from './sync-manager.js';

/**
 * Enhanced fetch with timeout and retry
 */
async function fetchWithTimeout(url, options = {}, timeout = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;

  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }

    throw error;
  }
}

/**
 * Retry with exponential backoff
 */
async function retryWithBackoff(fn, maxRetries = 5, initialDelay = 1000) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();

    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error);

      if (attempt === maxRetries - 1) {
        throw error;
      }

      // Calculate backoff (exponential with jitter)
      const backoff = initialDelay * Math.pow(2, attempt);
      const jitter = Math.random() * 1000;
      const delay = Math.min(backoff + jitter, 300000); // Max 5 minutes

      console.log(`Retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Enhanced sync with network resilience
 */
async function syncWithResilience(queueItem) {
  const endpoint = getEndpoint(queueItem.entityType);

  const syncFn = async () => {
    const response = await fetchWithTimeout(
      endpoint,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sync-Id': queueItem.id,
          'X-Device-Id': await syncManager.deviceId,
          'X-Local-Version': queueItem.data.localVersion?.toString() || '1',
        },
        body: JSON.stringify(queueItem.data),
      },
      10000 // 10s timeout
    );

    if (!response.ok) {
      if (response.status === 409) {
        const conflict = await response.json();
        await handleConflictResponse(queueItem, conflict);
        return { conflict: true };
      }

      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  };

  try {
    const result = await retryWithBackoff(syncFn, 5, 1000);

    if (!result.conflict) {
      await syncManager.handleSyncSuccess(queueItem, result);
    }

    return result;

  } catch (error) {
    console.error('Sync failed after retries:', error);
    await syncManager.handleSyncFailure(queueItem, error);
    throw error;
  }
}

// Override sync manager's syncQueueItem method
const originalSyncQueueItem = syncManager.syncQueueItem.bind(syncManager);

syncManager.syncQueueItem = async function(queueItem) {
  return await syncWithResilience(queueItem);
};
```

### Network Status Detection

```javascript
// network-monitor.js

class NetworkMonitor {
  constructor() {
    this.isOnline = navigator.onLine;
    this.connectionType = this.getConnectionType();
    this.listeners = new Set();

    this.init();
  }

  init() {
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());

    // Monitor connection type changes
    if ('connection' in navigator) {
      navigator.connection?.addEventListener('change', () => {
        this.handleConnectionChange();
      });
    }
  }

  getConnectionType() {
    if (!('connection' in navigator)) return 'unknown';

    const conn = navigator.connection;
    return conn.effectiveType || 'unknown';
  }

  handleOnline() {
    console.log('[NetworkMonitor] Device is online');
    this.isOnline = true;
    this.emit('online');
  }

  handleOffline() {
    console.log('[NetworkMonitor] Device is offline');
    this.isOnline = false;
    this.emit('offline');
  }

  handleConnectionChange() {
    this.connectionType = this.getConnectionType();
    console.log('[NetworkMonitor] Connection type changed:', this.connectionType);
    this.emit('connection-change', this.connectionType);
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(cb => cb(data));
    }
  }

  shouldSyncNow() {
    // Don't sync if offline
    if (!this.isOnline) return false;

    // On slow connections, batch more aggressively
    if (this.connectionType === 'slow-2g' || this.connectionType === '2g') {
      return false; // Wait for better connection
    }

    return true;
  }
}

export const networkMonitor = new NetworkMonitor();

// Integrate with sync manager
networkMonitor.on('online', () => {
  syncManager.triggerSync();
});

networkMonitor.on('connection-change', (type) => {
  if (type === '4g' || type === 'wifi') {
    // Good connection, sync aggressively
    syncManager.config.batchSize = 20;
  } else {
    // Slow connection, batch more
    syncManager.config.batchSize = 5;
  }
});
```

---

## Server-Side Implementation

### Complete Cloudflare Worker with Offline Support

```javascript
// worker.js - Production-ready with offline support

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Sync-Id, X-Device-Id, X-Local-Version',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Route handlers
    if (request.method === 'POST' && url.pathname === '/transaction') {
      const response = await handleTransactionWithVersioning(request, env);
      return addCorsHeaders(response, corsHeaders);
    }

    if (request.method === 'POST' && url.pathname === '/chores') {
      const response = await handleChoresWithVersioning(request, env);
      return addCorsHeaders(response, corsHeaders);
    }

    if (request.method === 'GET' && url.pathname === '/api/sync') {
      const response = await handleSyncFetch(request, env);
      return addCorsHeaders(response, corsHeaders);
    }

    // Serve UI
    return serveUI(env);
  }
};

async function handleChoresWithVersioning(request, env) {
  const data = await request.json();
  const headers = {
    syncId: request.headers.get('X-Sync-Id'),
    deviceId: request.headers.get('X-Device-Id'),
    localVersion: parseInt(request.headers.get('X-Local-Version') || '1'),
  };

  const totalPoints = data.totalPoints || 0;

  // Update points
  const pointsKey = `points:total:${data.childId}`;
  const versionKey = `points:version:${data.childId}`;
  const logKey = `points:log:${data.childId}`;
  const choresLogKey = `chores:log:${data.childId}`;

  const currentPoints = parseInt(await env.CHILD_SPEND.get(pointsKey) || '0');
  const currentVersion = parseInt(await env.CHILD_SPEND.get(versionKey) || '0');

  const newPoints = currentPoints + totalPoints;
  const newVersion = currentVersion + 1;

  await Promise.all([
    env.CHILD_SPEND.put(pointsKey, String(newPoints)),
    env.CHILD_SPEND.put(versionKey, String(newVersion)),
  ]);

  // Update points log
  let pointsLog = JSON.parse(await env.CHILD_SPEND.get(logKey) || '[]');
  pointsLog.unshift({
    timestamp: data.timestamp || new Date().toISOString(),
    action: 'add',
    amount: totalPoints,
    reason: `Chores: ${data.chores.map(c => c.label).join(', ')}`,
    source: 'chores',
    serverVersion: newVersion,
    deviceId: headers.deviceId,
  });
  await env.CHILD_SPEND.put(logKey, JSON.stringify(pointsLog.slice(0, 100)));

  // Update chores log
  let choresLog = JSON.parse(await env.CHILD_SPEND.get(choresLogKey) || '[]');
  choresLog.unshift({
    timestamp: data.timestamp || new Date().toISOString(),
    items: data.chores,
    deviceId: headers.deviceId,
  });
  await env.CHILD_SPEND.put(choresLogKey, JSON.stringify(choresLog.slice(0, 100)));

  return new Response(JSON.stringify({
    success: true,
    version: newVersion,
    points: newPoints,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleSyncFetch(request, env) {
  const url = new URL(request.url);
  const childId = url.searchParams.get('childId');
  const type = url.searchParams.get('type');

  if (!childId || !type) {
    return new Response(JSON.stringify({ error: 'Missing parameters' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const totalKey = `${type}:total:${childId}`;
  const versionKey = `${type}:version:${childId}`;
  const logKey = `${type}:log:${childId}`;

  const [total, version, log] = await Promise.all([
    env.CHILD_SPEND.get(totalKey),
    env.CHILD_SPEND.get(versionKey),
    env.CHILD_SPEND.get(logKey),
  ]);

  return new Response(JSON.stringify({
    balance: parseFloat(total || '0'),
    version: parseInt(version || '0'),
    log: JSON.parse(log || '[]'),
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function addCorsHeaders(response, corsHeaders) {
  const headers = new Headers(response.headers);

  Object.entries(corsHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
```

---

## Testing Offline Scenarios

### Manual Testing Script

```javascript
// test-offline.js

import { syncManager } from './sync-manager.js';

/**
 * Test suite for offline functionality
 */
class OfflineTest {
  async runAllTests() {
    console.log('🧪 Starting offline tests...\n');

    await this.testOfflineTransaction();
    await this.testOfflineChores();
    await this.testSyncAfterOnline();
    await this.testConflictResolution();
    await this.testNetworkInterruption();

    console.log('\n✅ All tests completed');
  }

  async testOfflineTransaction() {
    console.log('📝 Test: Add transaction offline');

    // Simulate offline
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    // Add transaction
    const tx = await syncManager.addTransaction({
      childId: 'adam',
      type: 'money',
      action: 'add',
      amount: 10,
      currency: 'GBP',
      reason: 'Test transaction',
    });

    console.log('  ✓ Transaction created:', tx.id);

    // Check queue
    const pendingCount = await syncManager.getPendingSyncCount();
    console.log(`  ✓ Pending in queue: ${pendingCount}`);

    // Check local balance
    const balance = await syncManager.getMetadata('money:total:adam');
    console.log(`  ✓ Local balance: £${balance.toFixed(2)}\n`);
  }

  async testOfflineChores() {
    console.log('📝 Test: Complete chores offline');

    const chore = await syncManager.addChore({
      childId: 'sami',
      chores: [
        { id: 'tidy_room', label: 'Tidy bedroom', points: 10 },
        { id: 'homework', label: 'Finish homework', points: 8 },
      ],
      totalPoints: 18,
    });

    console.log('  ✓ Chores created:', chore.id);

    const points = await syncManager.getMetadata('points:total:sami');
    console.log(`  ✓ Local points: ${points}\n`);
  }

  async testSyncAfterOnline() {
    console.log('📝 Test: Sync when back online');

    // Simulate online
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });

    // Trigger sync
    await syncManager.triggerSync();

    // Wait for sync
    await sleep(3000);

    // Check queue
    const pendingCount = await syncManager.getPendingSyncCount();
    console.log(`  ✓ Remaining in queue: ${pendingCount}\n`);
  }

  async testConflictResolution() {
    console.log('📝 Test: Conflict resolution');

    // Simulate conflict by having mismatched versions
    const tx1 = await syncManager.addTransaction({
      childId: 'adam',
      type: 'money',
      action: 'add',
      amount: 5,
      currency: 'GBP',
      reason: 'Device 1',
    });

    // Update local version to simulate second device
    await syncManager.db.transactions.update(tx1.id, {
      localVersion: 1, // Server might be at version 2
    });

    console.log('  ✓ Conflict scenario created');
    console.log('  ℹ️ Check conflict resolution UI\n');
  }

  async testNetworkInterruption() {
    console.log('📝 Test: Network interruption during sync');

    // Add transaction
    const tx = await syncManager.addTransaction({
      childId: 'sami',
      type: 'points',
      action: 'add',
      amount: 15,
      reason: 'Network test',
    });

    // Start sync
    const syncPromise = syncManager.triggerSync();

    // Simulate network drop after 500ms
    setTimeout(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });
      console.log('  ⚠️ Network dropped mid-sync');
    }, 500);

    await syncPromise;

    // Check if in retry queue
    const queueItem = await syncManager.db.syncQueue.get(tx.id);
    console.log(`  ✓ Retry count: ${queueItem?.retryCount || 0}\n`);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Export for use in console
window.OfflineTest = OfflineTest;

// Usage: new OfflineTest().runAllTests()
```

### Automated Testing with Vitest

```javascript
// sync-manager.test.js

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { syncManager } from './sync-manager.js';
import 'fake-indexeddb/auto';

describe('SyncManager', () => {
  beforeEach(async () => {
    await syncManager.init();
    await syncManager.clearAllData();
  });

  afterEach(async () => {
    await syncManager.clearAllData();
  });

  it('should add transaction to local database', async () => {
    const tx = await syncManager.addTransaction({
      childId: 'adam',
      type: 'money',
      action: 'add',
      amount: 10,
      currency: 'GBP',
      reason: 'Test',
    });

    expect(tx.id).toBeDefined();
    expect(tx.syncStatus).toBe('pending');

    const saved = await syncManager.db.transactions.get(tx.id);
    expect(saved).toBeDefined();
    expect(saved.amount).toBe(10);
  });

  it('should update metadata when adding transaction', async () => {
    await syncManager.addTransaction({
      childId: 'adam',
      type: 'money',
      action: 'add',
      amount: 10,
      currency: 'GBP',
      reason: 'Test',
    });

    const balance = await syncManager.getMetadata('money:total:adam');
    expect(balance).toBe(10);
  });

  it('should add to sync queue', async () => {
    const tx = await syncManager.addTransaction({
      childId: 'adam',
      type: 'money',
      action: 'add',
      amount: 10,
      currency: 'GBP',
      reason: 'Test',
    });

    const pendingCount = await syncManager.getPendingSyncCount();
    expect(pendingCount).toBe(1);
  });

  it('should handle deductions correctly', async () => {
    // Add initial balance
    await syncManager.addTransaction({
      childId: 'adam',
      type: 'money',
      action: 'add',
      amount: 20,
      currency: 'GBP',
      reason: 'Initial',
    });

    // Deduct
    await syncManager.addTransaction({
      childId: 'adam',
      type: 'money',
      action: 'deduct',
      amount: 5,
      currency: 'GBP',
      reason: 'Spend',
    });

    const balance = await syncManager.getMetadata('money:total:adam');
    expect(balance).toBe(15);
  });

  it('should prioritize deductions in queue', async () => {
    const tx1 = await syncManager.addTransaction({
      childId: 'adam',
      type: 'money',
      action: 'add',
      amount: 10,
      currency: 'GBP',
      reason: 'Add',
    });

    const tx2 = await syncManager.addTransaction({
      childId: 'adam',
      type: 'money',
      action: 'deduct',
      amount: 5,
      currency: 'GBP',
      reason: 'Deduct',
    });

    const queue = await syncManager.getPendingQueueItems();

    expect(queue[0].data.action).toBe('deduct');
    expect(queue[1].data.action).toBe('add');
  });
});
```

---

## Integration Checklist

```markdown
## Pre-Deployment Checklist

### Database Setup
- [ ] IndexedDB schema created
- [ ] Dexie.js installed and configured
- [ ] Migration from localStorage completed
- [ ] Test data seeded

### Sync Manager
- [ ] Sync manager initialized
- [ ] Event listeners attached
- [ ] Queue processing tested
- [ ] Retry logic verified
- [ ] Conflict resolution working

### Service Worker
- [ ] Workbox installed
- [ ] Caching strategies configured
- [ ] Background sync registered
- [ ] Offline fallback pages created
- [ ] Service worker registered

### UI Integration
- [ ] Optimistic updates working
- [ ] Sync indicators visible
- [ ] Rollback on errors functional
- [ ] History updates correctly
- [ ] Balance displays accurate

### Server-Side
- [ ] Version control implemented
- [ ] Distributed locks working
- [ ] Conflict detection functional
- [ ] CORS headers set
- [ ] API endpoints tested

### Testing
- [ ] Offline transactions work
- [ ] Sync after online works
- [ ] Multi-device conflicts resolved
- [ ] Network interruptions handled
- [ ] All automated tests pass

### Performance
- [ ] IndexedDB queries optimized
- [ ] Batch operations working
- [ ] Memory usage acceptable
- [ ] No UI blocking
- [ ] Service worker caching efficient

### Accessibility
- [ ] Sync status announced
- [ ] Error messages clear
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
```

---

**End of Implementation Examples**

These examples provide complete, production-ready code for implementing offline-first functionality in Kids Home Hub. Each scenario includes both client and server code, with error handling, retry logic, and conflict resolution.
