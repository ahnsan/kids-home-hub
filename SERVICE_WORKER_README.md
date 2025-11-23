# Service Worker Implementation Guide
## Kids Home Hub PWA - Production-Grade Offline Support

---

## Overview

This implementation provides a **production-grade service worker** with comprehensive offline support, intelligent caching strategies, background synchronization, and automatic update management for the Kids Home Hub PWA.

### Key Features

✅ **100% Offline Functionality** - Core features work without internet
✅ **Intelligent Caching** - Cache-first for static, network-first for dynamic
✅ **Background Sync** - Automatic retry with exponential backoff
✅ **Security** - HTTPS enforcement, origin validation, content validation
✅ **Auto-Updates** - Smart update detection and user notification
✅ **IndexedDB Storage** - Structured offline data with Dexie.js
✅ **Conflict Resolution** - Multi-device sync with version tracking

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interaction                         │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              Optimistic UI Update                            │
│         (Instant feedback, no waiting)                       │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│         Write to IndexedDB (db.js)                          │
│         Add to Sync Queue                                    │
└─────────────────┬───────────────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
    [ONLINE]            [OFFLINE]
        │                   │
        ▼                   │
  Background Sync           │
  via Service Worker        │
  (sw.js)                   │
        │                   │
        ▼                   ▼
  Update IndexedDB      Queue waits
  Mark as synced        Retry when online
        │                   │
        └─────────┬─────────┘
                  │
                  ▼
         UI Sync Status Update
```

---

## File Structure

```
kids-home-hub/
├── sw.js                      # Production service worker
├── sw-registration.js         # SW registration & update management
├── db.js                      # IndexedDB wrapper (Dexie.js)
├── sync-manager.js            # Background sync orchestration
├── offline.html               # Offline fallback page
├── workbox-config.js          # Workbox build configuration
└── SERVICE_WORKER_README.md   # This file
```

---

## Implementation Details

### 1. Service Worker (sw.js)

The service worker implements **7 caching strategies** for different resource types:

#### Strategy 1: HTML - Network First
```javascript
// Serve from network, fallback to cache, then offline page
GET /index.html → Network → Cache → /offline.html
```

**Why**: HTML changes frequently, users should get latest version

#### Strategy 2: Static Assets (CSS/JS) - Cache First
```javascript
// Serve from cache immediately, revalidate in background
GET /styles.css → Cache → Network (background update)
```

**Why**: Static assets rarely change, instant load improves UX

#### Strategy 3: Images - Cache First with 30-day expiration
```javascript
// Cache images for 30 days
GET /image.png → Cache (if < 30 days) → Network
```

**Why**: Images are large and rarely change

#### Strategy 4: Fonts - Cache First (immutable)
```javascript
// Cache fonts indefinitely
GET /font.woff2 → Cache → Network (only if not cached)
```

**Why**: Fonts never change, avoid re-downloads

#### Strategy 5: API - Network First with 5-minute cache
```javascript
// Try network first, fallback to cache if fresh
GET /api/data → Network → Cache (if < 5 min) → Error
```

**Why**: API data can change, but short cache prevents excess requests

#### Strategy 6: Dynamic Content - Stale While Revalidate
```javascript
// Serve stale cache while fetching fresh data
GET /dynamic → Cache + Network (update cache)
```

**Why**: Fast response with eventual consistency

#### Strategy 7: Mutations (POST/PUT/DELETE) - Network with Background Sync
```javascript
// Send to network, queue if offline
POST /transaction → Network → Queue for Background Sync
```

**Why**: Critical operations must eventually reach server

---

### 2. Background Sync with Exponential Backoff

#### Retry Schedule

| Attempt | Delay      | Cumulative Time |
|---------|------------|-----------------|
| 1       | 1 second   | 1s              |
| 2       | 2 seconds  | 3s              |
| 3       | 4 seconds  | 7s              |
| 4       | 8 seconds  | 15s             |
| 5       | 16 seconds | 31s             |
| 6       | 32 seconds | 1m 3s           |
| Max     | 5 minutes  | -               |

#### Implementation (db.js)

```javascript
async markSyncFailed(itemId, error) {
  const item = await this.syncQueue.get(itemId);
  item.retryCount += 1;

  if (item.retryCount >= item.maxRetries) {
    item.status = 'failed';
  } else {
    const backoffMs = Math.min(
      1000 * Math.pow(2, item.retryCount),
      300000 // Max 5 minutes
    );
    item.nextRetryAt = Date.now() + backoffMs;
  }

  await this.syncQueue.put(item);
}
```

---

### 3. IndexedDB Schema (db.js)

#### Tables

**transactions**
- Stores money, points, and screen time operations
- Indexes: `childId`, `type`, `syncStatus`, `timestamp`

**chores**
- Completed chores with point rewards
- Indexes: `childId`, `syncStatus`, `timestamp`

**syncQueue**
- Pending operations waiting for network
- Indexes: `status`, `priority`, `nextRetryAt`
- Priority system: deductions (10), additions (5), default (1)

**metadata**
- Cached totals, settings, device info
- Key-value store for quick lookups

**conflicts**
- Version conflicts between local and server
- Used for multi-device conflict resolution

---

### 4. Update Strategy (sw-registration.js)

#### Update Types

**Critical Updates** (Security fixes)
- Auto-update after 3-second notification
- User sees: "Critical update installing..."
- No user action required

**Major Updates** (New features)
- Show notification with "Update Now" button
- User decides when to update
- Updates on next page load if dismissed

**Minor/Patch Updates**
- Auto-update on next page load
- Silent, no notification
- Seamless experience

#### Implementation

```javascript
determineUpdateType(oldVersion, newVersion) {
  // Critical: marked explicitly
  if (newVersion.includes('critical')) return 'critical';

  // Major: first number changes (v1 → v2)
  if (oldParts[0] !== newParts[0]) return 'major';

  // Minor: second number changes (v2.1 → v2.2)
  if (oldParts[1] !== newParts[1]) return 'minor';

  // Patch: third number changes (v2.1.1 → v2.1.2)
  return 'patch';
}
```

---

### 5. Security Features

#### HTTPS Enforcement
```javascript
if (url.protocol !== 'https:' && !url.hostname.includes('localhost')) {
  return new Response('HTTPS required', { status: 403 });
}
```

#### Origin Validation
```javascript
const ALLOWED_ORIGINS = [
  'https://kids-home-hub.pages.dev',
  'http://localhost:8787'
];

if (!isAllowedOrigin(url.origin)) {
  console.warn('Blocked request from unauthorized origin');
  return;
}
```

#### Method Whitelist
```javascript
if (!['GET', 'POST', 'PUT', 'DELETE'].includes(request.method)) {
  return; // Block other methods
}
```

---

## Usage

### Installation

1. **Install dependencies**:
```bash
npm install --save workbox-window dexie uuid
npm install --save-dev workbox-build workbox-cli
```

2. **Add to your HTML** (in worker.js or index.html):
```html
<script type="module">
  import swManager from './sw-registration.js';
  import db from './db.js';

  // Service worker will auto-register on page load
  // Database will auto-initialize

  // Listen for sync events
  swManager.on('sync-success', () => {
    console.log('Background sync completed!');
  });

  // Listen for update events
  swManager.on('update-available', ({ type, version }) => {
    console.log(`Update available: ${type} - ${version}`);
  });
</script>
```

3. **Update manifest.webmanifest**:
```json
{
  "name": "Kids Home Hub",
  "short_name": "Kids Hub",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#6366f1",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## API Reference

### ServiceWorkerManager (sw-registration.js)

```javascript
// Initialize
await swManager.init();

// Trigger manual sync
await swManager.triggerSync();

// Apply update
swManager.applyUpdate();

// Clear caches
await swManager.clearCaches();

// Cache specific URLs
await swManager.cacheUrls(['/page1.html', '/page2.html']);

// Events
swManager.on('sync-success', (data) => console.log('Synced:', data));
swManager.on('update-available', ({ type }) => console.log('Update:', type));
swManager.on('activated', ({ version }) => console.log('Version:', version));
```

### Database (db.js)

```javascript
import db from './db.js';

// Add transaction
const transaction = await db.addTransaction({
  childId: 'adam',
  type: 'money',
  action: 'add',
  amount: 10.00,
  currency: 'GBP',
  reason: 'Allowance',
  timestamp: new Date().toISOString(),
});

// Add chore
const chore = await db.addChore({
  childId: 'sami',
  chores: [
    { id: 'tidy_room', label: 'Tidy bedroom', points: 10 }
  ],
  totalPoints: 10,
  timestamp: new Date().toISOString(),
});

// Get transactions
const transactions = await db.getTransactions('adam', 'money', 50);

// Get total
const moneyTotal = await db.getTotal('money', 'adam');

// Get pending sync count
const pendingCount = await db.getPendingChangesCount();

// Export/Import
const backup = await db.exportData();
await db.importData(backup);
```

---

## Testing

### Offline Testing

#### Chrome DevTools
1. Open DevTools → Application → Service Workers
2. Check "Offline" checkbox
3. Reload page
4. Verify app still works

#### Network Throttling
1. Open DevTools → Network tab
2. Select "Slow 3G" or "Offline"
3. Test all features

### Background Sync Testing

```javascript
// Manually trigger sync
navigator.serviceWorker.ready.then((registration) => {
  registration.sync.register('sync-queue');
});

// Check sync queue
import db from './db.js';
const pending = await db.getPendingSyncItems();
console.log('Pending sync items:', pending);
```

### Update Testing

```javascript
// Force update check
swManager.registration.update();

// Simulate version change
// 1. Update CACHE_VERSION in sw.js
// 2. Reload page
// 3. Check for update notification
```

---

## Monitoring & Debugging

### Service Worker Logs

```javascript
// In service worker (sw.js)
console.log('[SW] Event:', eventName, data);

// In client
navigator.serviceWorker.addEventListener('message', (event) => {
  console.log('[Client] SW Message:', event.data);
});
```

### IndexedDB Inspection

**Chrome DevTools**:
1. Application → Storage → IndexedDB
2. Expand "kidsHomeHub"
3. View tables and data

**Programmatic**:
```javascript
import db from './db.js';

// View all tables
console.log('Transactions:', await db.transactions.toArray());
console.log('Sync Queue:', await db.syncQueue.toArray());
console.log('Metadata:', await db.metadata.toArray());
```

### Performance Monitoring

```javascript
// Measure cache hit rate
let cacheHits = 0;
let cacheMisses = 0;

self.addEventListener('fetch', (event) => {
  caches.match(event.request).then((response) => {
    if (response) {
      cacheHits++;
    } else {
      cacheMisses++;
    }
  });
});

// Log stats every 5 minutes
setInterval(() => {
  console.log('Cache hit rate:',
    (cacheHits / (cacheHits + cacheMisses) * 100).toFixed(2) + '%'
  );
}, 5 * 60 * 1000);
```

---

## Troubleshooting

### Service Worker Not Registering

**Check**:
- HTTPS enabled (or localhost)
- Service worker file in root directory
- No syntax errors in sw.js
- Browser supports service workers

**Fix**:
```javascript
if ('serviceWorker' in navigator) {
  console.log('Service workers supported');
} else {
  console.error('Service workers not supported');
}
```

### Background Sync Not Working

**Check**:
- Online event fired
- Sync registered successfully
- No errors in sync handler

**Fix**:
```javascript
// Fallback to manual sync
if (!('sync' in registration)) {
  console.log('Background Sync not supported, using manual sync');
  setInterval(() => swManager.triggerSync(), 30000);
}
```

### IndexedDB Quota Exceeded

**Check**:
```javascript
if (navigator.storage && navigator.storage.estimate) {
  const estimate = await navigator.storage.estimate();
  console.log('Storage used:',
    (estimate.usage / estimate.quota * 100).toFixed(2) + '%'
  );
}
```

**Fix**:
```javascript
// Clear old data
await db.transaction('rw', db.transactions, async () => {
  const oldTransactions = await db.transactions
    .where('createdAt')
    .below(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90 days old
    .toArray();

  await db.transactions.bulkDelete(oldTransactions.map(t => t.id));
});
```

---

## Performance Optimization

### 1. Precache Critical Assets

```javascript
// In sw.js
const PRECACHE_URLS = [
  '/',
  '/offline.html',
  '/styles.css',
  '/app.js',
  '/logo.svg',
];
```

### 2. Limit Cache Size

```javascript
// In sw.js
expiration: {
  maxEntries: 50,
  maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
}
```

### 3. Batch Sync Operations

```javascript
// In db.js
async getPendingSyncItems(limit = 10) {
  // Only sync 10 items at a time
  return this.syncQueue
    .where('status').equals('pending')
    .limit(limit)
    .toArray();
}
```

---

## Security Best Practices

✅ **HTTPS Only** - Service workers require HTTPS (except localhost)
✅ **Origin Validation** - Only allow requests from trusted origins
✅ **Content Security Policy** - Add CSP headers to prevent XSS
✅ **Sanitize Input** - Validate all data before storing in IndexedDB
✅ **Version Control** - Track versions to prevent cache poisoning
✅ **Secure Headers** - Add security headers to all responses

---

## Browser Support

| Browser | Service Worker | Background Sync | IndexedDB | Push Notifications |
|---------|----------------|-----------------|-----------|-------------------|
| Chrome  | ✅             | ✅              | ✅        | ✅                |
| Firefox | ✅             | ✅              | ✅        | ✅                |
| Safari  | ✅             | ❌              | ✅        | ✅                |
| Edge    | ✅             | ✅              | ✅        | ✅                |

**Note**: For Safari, fallback to manual sync is automatically handled.

---

## Next Steps

### Future Enhancements

1. **Push Notifications**
   - Notify users of sync completion
   - Alert on low balance
   - Chore reminders

2. **Periodic Background Sync**
   - Sync every hour even if app is closed
   - Requires Periodic Background Sync API

3. **Conflict Resolution UI**
   - Show conflicts to user
   - Allow manual resolution
   - Merge strategies

4. **Advanced Caching**
   - Predictive prefetch
   - Smart cache eviction
   - Network quality adaptation

5. **Analytics**
   - Track offline usage
   - Monitor sync performance
   - Cache hit rates

---

## Resources

- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Workbox Documentation](https://developer.chrome.com/docs/workbox/)
- [Dexie.js Documentation](https://dexie.org/)
- [PWA Best Practices](https://web.dev/pwa/)
- [Background Sync](https://developer.chrome.com/docs/workbox/modules/workbox-background-sync/)

---

## License

MIT License - Kids Home Hub PWA

---

## Support

For issues or questions:
- Check the [troubleshooting section](#troubleshooting)
- Review browser console logs
- Inspect service worker in DevTools
- Check IndexedDB data

**Happy Offline-First Development!** 🚀
