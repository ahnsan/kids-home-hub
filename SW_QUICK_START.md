# Service Worker - Quick Start Guide
## Get Your PWA Offline-Ready in 5 Minutes

---

## Step 1: Install Dependencies (30 seconds)

```bash
npm install --save workbox-window dexie uuid
npm install --save-dev workbox-build workbox-cli
```

Or with the package.json updates:

```json
{
  "dependencies": {
    "workbox-window": "^7.3.0",
    "dexie": "^3.2.4",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "workbox-build": "^7.3.0",
    "workbox-cli": "^7.3.0"
  }
}
```

---

## Step 2: Add Files to Your Project (1 minute)

All files are already created in your project root:

```
kids-home-hub/
├── sw.js                    ✅ Service worker
├── sw-registration.js       ✅ SW manager
├── db.js                    ✅ Database wrapper
├── offline.html            ✅ Offline fallback
├── workbox-config.js       ✅ Build config
└── manifest.webmanifest    ⚠️ Update this
```

---

## Step 3: Update Your HTML (2 minutes)

### Option A: Update `worker.js` (Cloudflare Worker)

Find the `serveUI()` function and add this to the HTML head:

```javascript
function serveUI(env) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#6366f1">
  <title>Kids Home Hub</title>

  <!-- PWA Manifest -->
  <link rel="manifest" href="/manifest.webmanifest">

  <!-- Add this for iOS -->
  <link rel="apple-touch-icon" href="/icons/icon-192.png">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">

  <style>
    /* Your existing styles */
  </style>
</head>
<body>
  <!-- Your existing content -->

  <!-- ADD THIS BEFORE CLOSING </body> -->
  <script type="module">
    import swManager from './sw-registration.js';
    import db from './db.js';

    // Service worker auto-registers
    // Database auto-initializes

    // Listen for sync events (optional)
    swManager.on('sync-success', () => {
      console.log('Data synced!');
      // Refresh your UI here
    });

    // Listen for offline/online (optional)
    window.addEventListener('online', () => {
      console.log('Back online!');
      showNotification('Connected!', 'success');
    });

    window.addEventListener('offline', () => {
      console.log('You are offline');
      showNotification('Offline mode', 'info');
    });
  </script>
</body>
</html>
  `;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}
```

---

## Step 4: Update Manifest (1 minute)

Create or update `/manifest.webmanifest`:

```json
{
  "name": "Kids Home Hub",
  "short_name": "Kids Hub",
  "description": "Money, Points, Chores & Screen Time Tracker",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#6366f1",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/home.png",
      "sizes": "540x720",
      "type": "image/png",
      "label": "Home Screen"
    }
  ],
  "categories": ["finance", "lifestyle", "utilities"],
  "prefer_related_applications": false
}
```

---

## Step 5: Update Your Transaction/Chore Functions (1 minute)

Replace your existing transaction/chore handling with database calls:

### Before:
```javascript
async function handleTransaction(formData) {
  // Direct API call
  const response = await fetch('/transaction', {
    method: 'POST',
    body: formData
  });
  // ...
}
```

### After:
```javascript
import db from './db.js';
import swManager from './sw-registration.js';

async function handleTransaction(formData) {
  // Save to database (works offline!)
  const transaction = await db.addTransaction({
    childId: formData.child,
    type: formData.feature,
    action: formData.action,
    amount: parseFloat(formData.amount),
    currency: formData.currency,
    reason: formData.reason,
    timestamp: new Date().toISOString(),
  });

  // Optimistic UI update
  updateUIImmediately(transaction);

  // Trigger sync (happens automatically, but you can force it)
  if (navigator.onLine) {
    await swManager.triggerSync();
  } else {
    showNotification('Saved offline, will sync when online', 'info');
  }

  return transaction;
}
```

---

## Step 6: Test Offline Mode (30 seconds)

1. **Open Chrome DevTools**
2. **Go to Application tab**
3. **Check "Offline" checkbox**
4. **Try adding a transaction**
5. **It should work!** ✅

---

## Step 7: Deploy (Already Done!)

Your Cloudflare Worker already serves all files. Just deploy:

```bash
npm run deploy
```

---

## Common Integration Patterns

### Pattern 1: Optimistic UI Update

```javascript
async function addMoney(childId, amount, reason) {
  // 1. Update UI immediately
  updateBalanceDisplay(childId, amount, 'add');
  showLoadingIndicator();

  // 2. Save to database
  try {
    await db.addTransaction({
      childId,
      type: 'money',
      action: 'add',
      amount,
      reason,
      timestamp: new Date().toISOString(),
    });

    // 3. Show success
    showSuccessMessage('Money added!');
    hideLoadingIndicator();

  } catch (error) {
    // 4. Rollback UI on error
    updateBalanceDisplay(childId, -amount, 'add');
    showErrorMessage('Failed to add money');
  }
}
```

### Pattern 2: Check Online/Offline Status

```javascript
function showSyncStatus() {
  const isOnline = navigator.onLine;
  const statusEl = document.querySelector('#sync-status');

  if (isOnline) {
    statusEl.textContent = 'Online';
    statusEl.className = 'status-online';
  } else {
    statusEl.textContent = 'Offline';
    statusEl.className = 'status-offline';

    // Show pending sync count
    db.getPendingChangesCount().then(count => {
      if (count > 0) {
        statusEl.textContent += ` (${count} pending)`;
      }
    });
  }
}
```

### Pattern 3: Listen for Sync Events

```javascript
import swManager from './sw-registration.js';

// Listen for sync success
swManager.on('sync-success', ({ url }) => {
  console.log('Synced:', url);
  refreshUI();
  showNotification('Changes synced!', 'success');
});

// Listen for sync failure
swManager.on('sync-failed', ({ error }) => {
  console.error('Sync failed:', error);
  showNotification('Sync failed, will retry', 'warning');
});

// Listen for updates
swManager.on('update-available', ({ type, version }) => {
  if (type === 'major') {
    showUpdatePrompt(`New version ${version} available!`);
  }
});
```

### Pattern 4: Manual Sync Trigger

```javascript
// Add a "Sync Now" button
document.querySelector('#sync-button').addEventListener('click', async () => {
  if (!navigator.onLine) {
    showNotification('You are offline', 'error');
    return;
  }

  showLoadingIndicator();

  try {
    await swManager.triggerSync();
    showNotification('Sync complete!', 'success');
  } catch (error) {
    showNotification('Sync failed', 'error');
  } finally {
    hideLoadingIndicator();
  }
});
```

---

## Verify Installation

### Checklist

Open your browser console and run:

```javascript
// 1. Check service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistration().then(reg => {
    console.log('✅ Service Worker:', reg ? 'Registered' : 'Not registered');
  });
}

// 2. Check database
import db from './db.js';
db.metadata.get('initialized').then(data => {
  console.log('✅ Database:', data ? 'Initialized' : 'Not initialized');
});

// 3. Check pending sync
db.getPendingChangesCount().then(count => {
  console.log('✅ Pending sync items:', count);
});

// 4. Check cache
caches.keys().then(names => {
  console.log('✅ Active caches:', names);
});
```

**All should show ✅**

---

## Troubleshooting

### Service Worker Not Registering?

**Check:**
- Are you on HTTPS or localhost?
- Is sw.js in the root directory?
- Any console errors?

**Fix:**
```javascript
// Add error handling
navigator.serviceWorker.register('/sw.js')
  .then(reg => console.log('SW registered'))
  .catch(err => console.error('SW registration failed:', err));
```

### Database Not Initializing?

**Check:**
- Is Dexie installed?
- Are you importing db.js?
- Any console errors?

**Fix:**
```javascript
import db from './db.js';

// Force initialization
db.open()
  .then(() => console.log('DB opened'))
  .catch(err => console.error('DB failed:', err));
```

### Offline Not Working?

**Check:**
- Is service worker active?
- Are assets cached?
- Is offline.html available?

**Fix:**
```javascript
// Check service worker status
navigator.serviceWorker.ready.then(registration => {
  console.log('Service Worker ready:', registration.active.state);
});

// Check cache
caches.open('kids-hub-v2.0.0-static').then(cache => {
  cache.keys().then(keys => {
    console.log('Cached:', keys.length, 'items');
  });
});
```

---

## Next Steps

Once you have the basics working:

1. **Customize offline.html** - Add your branding
2. **Add icons** - Create PWA icons for all sizes
3. **Test on mobile** - Install as PWA on phone
4. **Monitor analytics** - Track offline usage
5. **Add push notifications** - Engage users

---

## Need Help?

- Read: `/SERVICE_WORKER_README.md` - Full documentation
- Run: `/sw-integration-example.html` - Interactive demo
- Check: `/SERVICE_WORKER_IMPLEMENTATION_SUMMARY.md` - Technical details

---

## That's It! 🎉

You now have a **production-grade, offline-first PWA** in under 5 minutes!

**What You Get:**
✅ Works 100% offline
✅ Automatic background sync
✅ Smart caching strategies
✅ Automatic updates
✅ Secure and performant

**Test it:**
1. Open your app
2. Turn off WiFi
3. Add a transaction
4. It works! ✨
5. Turn WiFi back on
6. Data syncs automatically! 🚀

---

**Happy Coding!** 💻
