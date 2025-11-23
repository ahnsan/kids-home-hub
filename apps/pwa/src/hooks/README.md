# React Hooks for Kids Home Hub

This directory contains custom Preact hooks for the application.

## Available Hooks

### useSync

Manages data synchronization with the backend API.

```typescript
import { useSync } from '../hooks';

function MyComponent() {
  const { syncStatus, lastSyncTime, pendingActionsCount, sync } = useSync();

  return (
    <div>
      <p>Status: {syncStatus.value}</p>
      <p>Pending: {pendingActionsCount.value}</p>
      <button onClick={sync}>Sync Now</button>
    </div>
  );
}
```

**Returns:**
- `syncStatus`: Current sync status ('idle' | 'syncing' | 'synced' | 'error' | 'offline')
- `lastSyncTime`: Last successful sync timestamp
- `pendingActionsCount`: Number of actions in sync queue
- `sync`: Function to trigger immediate sync

**Features:**
- Automatic periodic sync (every 5 minutes)
- Sync on network reconnection
- Sync status updates in real-time
- Pending actions tracking

### useNetworkStatus

Monitors network connectivity status.

```typescript
import { useNetworkStatus } from '../hooks';

function MyComponent() {
  const isOnline = useNetworkStatus();

  return (
    <div>
      {isOnline.value ? '🟢 Online' : '🔴 Offline'}
    </div>
  );
}
```

**Returns:**
- `isOnline`: Signal<boolean> indicating network status

**Features:**
- Real-time network status monitoring
- Automatic updates on online/offline events
- Works with service worker sync

## Usage Examples

### Sync Indicator Component

```typescript
import { useSync, useNetworkStatus } from '../hooks';

function SyncIndicator() {
  const { syncStatus, pendingActionsCount } = useSync();
  const isOnline = useNetworkStatus();

  if (!isOnline.value) {
    return <span className="badge badge-warning">Offline</span>;
  }

  if (syncStatus.value === 'syncing') {
    return <span className="badge badge-info">Syncing...</span>;
  }

  if (pendingActionsCount.value > 0) {
    return (
      <span className="badge badge-warning">
        {pendingActionsCount.value} pending
      </span>
    );
  }

  return <span className="badge badge-success">Synced</span>;
}
```

### Network Status Banner

```typescript
import { useNetworkStatus } from '../hooks';

function NetworkBanner() {
  const isOnline = useNetworkStatus();

  if (isOnline.value) {
    return null; // Don't show banner when online
  }

  return (
    <div className="banner banner-warning">
      <p>You're offline. Changes will sync when you're back online.</p>
    </div>
  );
}
```

## Integration with Stores

The hooks work seamlessly with the app's stores:

```typescript
import { updateChildData } from '../stores/childrenStore';
import { useSync } from '../hooks';

function PointsEditor({ childId }) {
  const { pendingActionsCount } = useSync();

  const handleUpdate = (points: number) => {
    // This automatically queues the action for sync
    updateChildData(childId, { pointsTotal: points });
  };

  return (
    <div>
      <button onClick={() => handleUpdate(100)}>
        Award 100 points
      </button>
      {pendingActionsCount.value > 0 && (
        <p className="text-sm text-gray-500">
          Syncing changes...
        </p>
      )}
    </div>
  );
}
```

## Best Practices

1. **Use useSync in root component**: Start periodic sync at app initialization
2. **Show sync status**: Always inform users of sync state
3. **Handle offline gracefully**: Display offline indicator and reassure users
4. **Don't block on sync**: All sync operations are non-blocking
5. **Trust the queue**: Changes are safely queued and will sync eventually

## Troubleshooting

### Sync not working

1. Check authentication: User must be logged in
2. Check network: Device must be online
3. Check console: Look for error messages
4. Check queue: Use `pendingActionsCount` to verify actions queued

### Multiple sync hooks

It's safe to use `useSync` in multiple components - the underlying service is a singleton, so there's no performance penalty.

### Manual sync

To trigger sync outside a component:

```typescript
import { syncService } from '../services/sync';

// Trigger full sync
await syncService.fullSync();
```
