# Multi-Device Data Synchronization Implementation

## Overview

This document describes the comprehensive synchronization system implemented for the Kids Home Hub PWA. The system enables seamless multi-device data sync with offline support, conflict resolution, and background synchronization.

## Architecture

### Components

1. **SyncService** (`/src/services/sync.ts`)
   - Main synchronization engine
   - Manages sync queue and conflict resolution
   - Handles periodic sync and network events

2. **Sync Utilities** (`/src/lib/syncUtils.ts`)
   - Conflict resolution algorithms
   - Data merging functions
   - Diff calculation and application
   - Backoff calculation for retries

3. **Hooks** (`/src/hooks/`)
   - `useSync`: Component integration for sync status
   - `useNetworkStatus`: Network state detection

4. **Store Integration**
   - `childrenStore`: Queue child CRUD operations
   - `customChoresStore`: Queue chore CRUD operations

## Data Flow

### 1. Local Changes

```
User Action → Store Update → Queue Action → IndexedDB
                    ↓
              localStorage (immediate)
                    ↓
            Trigger Background Sync (if online)
```

### 2. Sync Process

```
Periodic Trigger / Network Online Event
            ↓
    Check Authentication
            ↓
    Get Pending Actions from Queue
            ↓
    Get Local Data (children, chores)
            ↓
    POST to /v1/sync
            ↓
    Receive Server Response
            ↓
    Apply Remote Changes
            ↓
    Merge with Last-Write-Wins
            ↓
    Update localStorage
            ↓
    Mark Actions as Synced
            ↓
    Update Last Sync Time
```

### 3. Conflict Resolution

The system uses a **Last-Write-Wins** strategy:

```typescript
function resolveConflict(local, remote) {
  const localTime = local.updatedAt || 0;
  const remoteTime = remote.updatedAt || 0;

  return remoteTime > localTime ? remote : local;
}
```

Conflicts are also logged to IndexedDB for review:

```typescript
await db.conflicts.add({
  id: crypto.randomUUID(),
  entityType: 'child',
  entityId: conflict.id,
  localVersion: conflict.local,
  serverVersion: conflict.remote,
  timestamp: Date.now(),
  resolved: false
});
```

## API Endpoints

### POST /v1/sync

**Request:**
```json
{
  "lastSyncedAt": 1234567890,
  "deviceId": "device_abc123",
  "changes": {
    "children": [
      {
        "id": "alice",
        "name": "Alice",
        "avatar": "👧",
        "moneyTotal": 10,
        "pointsTotal": 50,
        "screenTotal": 30
      }
    ],
    "chores": [
      {
        "id": "chore-1",
        "label": "Clean room",
        "points": 10,
        "createdAt": 1234567890,
        "updatedAt": 1234567890
      }
    ],
    "queuedActions": [
      {
        "type": "update_child",
        "entityType": "child",
        "entityId": "alice",
        "data": { "pointsTotal": 55 },
        "timestamp": 1234567890
      }
    ]
  }
}
```

**Response:**
```json
{
  "children": [
    {
      "id": "alice",
      "name": "Alice",
      "avatar": "👧",
      "moneyTotal": 10,
      "pointsTotal": 55,
      "screenTotal": 30,
      "updatedAt": 1234567895
    }
  ],
  "chores": [
    {
      "id": "chore-1",
      "label": "Clean room",
      "points": 10,
      "createdAt": 1234567890,
      "updatedAt": 1234567890
    }
  ],
  "serverTime": 1234567900,
  "conflicts": []
}
```

### GET /v1/children

**Response:**
```json
{
  "children": [
    {
      "id": "alice",
      "name": "Alice",
      "avatar": "👧",
      "moneyTotal": 10,
      "pointsTotal": 50,
      "screenTotal": 30
    }
  ]
}
```

### GET /v1/chores

**Response:**
```json
{
  "chores": [
    {
      "id": "chore-1",
      "label": "Clean room",
      "points": 10,
      "createdAt": 1234567890,
      "updatedAt": 1234567890
    }
  ]
}
```

### POST /v1/households

Used for initial data migration:

**Request:**
```json
{
  "name": "My Household",
  "children": [
    {
      "name": "Alice",
      "avatar": "👧",
      "moneyTotal": 10,
      "pointsTotal": 50,
      "screenTotal": 30
    }
  ],
  "chores": [
    {
      "label": "Clean room",
      "points": 10
    }
  ],
  "transactions": []
}
```

## Usage Examples

### In Components

```typescript
import { useSync, useNetworkStatus } from '../hooks';

function MyComponent() {
  const { syncStatus, lastSyncTime, pendingActionsCount, sync } = useSync();
  const isOnline = useNetworkStatus();

  return (
    <div>
      {syncStatus.value === 'syncing' && <p>Syncing...</p>}
      {syncStatus.value === 'synced' && <p>Synced!</p>}
      {syncStatus.value === 'offline' && <p>Offline</p>}

      {pendingActionsCount.value > 0 && (
        <p>{pendingActionsCount.value} changes pending sync</p>
      )}

      <button onClick={sync}>Force Sync</button>
    </div>
  );
}
```

### Manual Sync

```typescript
import { syncService } from '../services/sync';

// Full sync
await syncService.fullSync();

// Sync only children
await syncService.syncChildren();

// Upload local data (migration)
await syncService.uploadLocalData();

// Check sync status
const status = syncService.getSyncStatus(); // 'synced' | 'syncing' | 'pending' | 'offline'

// Get pending actions count
const count = await syncService.getPendingActionsCount();
```

### Queue Actions Manually

```typescript
import { syncService } from '../services/sync';

await syncService.queueAction({
  type: 'update_child',
  entityType: 'child',
  entityId: 'alice',
  data: { pointsTotal: 55 }
});
```

## Sync Triggers

The sync system is triggered in the following scenarios:

1. **Periodic Sync**: Every 5 minutes (configurable)
2. **Network Online**: When connection is restored
3. **After Queue Action**: Immediately after queuing (if online)
4. **Manual Trigger**: Via `useSync` hook or direct call

## Offline Support

The system gracefully handles offline scenarios:

1. **Queue Actions**: All changes are queued in IndexedDB
2. **Local-First**: Data is immediately saved to localStorage
3. **Background Sync**: Queued actions are synced when online
4. **Retry Logic**: Failed syncs are retried with exponential backoff

## Performance Considerations

### Optimizations

1. **Batching**: Actions are batched for sync
2. **Debouncing**: Periodic sync respects last sync time
3. **Partial Sync**: Can sync individual resources (children, chores)
4. **Merge Strategy**: Efficient last-write-wins merging

### Storage Strategy

- **localStorage**: Immediate data (children, chores)
- **IndexedDB**: Queue, metadata, conflicts, transactions
- **Service Worker Cache**: Static assets, API responses

## Testing

Run the comprehensive test suite:

```bash
npm test src/services/sync.test.ts
npm test src/lib/syncUtils.test.ts
```

Test scenarios covered:
- Full sync with no conflicts
- Full sync with conflicts (last-write-wins)
- Offline changes queued correctly
- Online event triggers sync
- Periodic sync runs every 5 minutes
- Migration uploads all data
- Sync respects authentication status
- Conflict resolution algorithms
- Data merging functions

## Error Handling

### Network Errors

```typescript
try {
  await syncService.fullSync();
} catch (error) {
  // Error is logged and sync status updated
  // Actions remain queued for retry
}
```

### Conflict Errors

Conflicts are stored in IndexedDB and can be reviewed:

```typescript
const conflicts = await db.conflicts.where('resolved').equals(false).toArray();
```

## Future Enhancements

1. **User-Driven Conflict Resolution**: UI for reviewing and resolving conflicts
2. **Optimistic Updates**: Show UI changes before server confirmation
3. **Real-time Sync**: WebSocket connection for instant updates
4. **Compression**: Compress sync payloads for large datasets
5. **Selective Sync**: Allow users to choose what to sync
6. **Sync Analytics**: Track sync success rates and performance

## Migration Path

For existing users with local data:

```typescript
import { syncService } from '../services/sync';

// After login
if (!localStorage.getItem('migrated_to_cloud')) {
  await syncService.uploadLocalData();
  // Flag is set automatically
}
```

## Security Considerations

1. **Authentication**: All sync requests require valid JWT token
2. **Device ID**: Each device has unique identifier
3. **HTTPS**: All communication over encrypted connection
4. **Data Validation**: Server validates all incoming data

## Monitoring

Key metrics to monitor:

- Sync success rate
- Average sync duration
- Queue length over time
- Conflict frequency
- Network availability

## Troubleshooting

### Sync Not Working

1. Check authentication status
2. Verify network connection
3. Check browser console for errors
4. Review pending actions count

### Conflicts Not Resolving

1. Check conflict table in IndexedDB
2. Verify timestamps on conflicting items
3. Review conflict resolution strategy

### Performance Issues

1. Check queue size (large queues slow sync)
2. Monitor network speed
3. Review sync interval (too frequent?)
4. Check IndexedDB size

## Support

For issues or questions, consult:
- API documentation: `/docs/api`
- Developer guide: `/docs/dev-guide`
- GitHub issues: `github.com/your-repo/issues`
