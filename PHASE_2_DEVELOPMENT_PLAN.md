# Phase 2: Feature Implementation - Development Plan

**Date**: November 23, 2025
**Current Status**: 95% Infrastructure Complete
**Next Phase**: Feature Implementation (4-5 weeks)
**Goal**: Transform infrastructure into fully functional PWA

---

## Executive Summary

The Kids Home Hub PWA has **world-class infrastructure** (95% complete) but **zero functional features**. All four views (Bank, Points, Chores, Screen) are UI shells awaiting implementation.

### Current Status

✅ **Infrastructure (100%)**
- Monorepo with pnpm workspaces
- Preact + Vite PWA with service worker
- TypeScript strict mode throughout
- Security hardening (CSP, rate limiting, XSS protection)
- IndexedDB with offline sync queue
- PWA icons and manifest (27 assets)
- CI/CD pipeline with quality gates
- Comprehensive documentation

✅ **Backend API (100%)**
- TypeScript Worker with Hono framework
- All 7 endpoints implemented and tested
- Zod schema validation
- 20 passing unit tests
- Production-ready

⚠️ **Frontend Features (0%)**
- UI shells exist (Bank, Points, Chores, Screen)
- No functional components
- No API integration
- Static placeholder data only

---

## Critical Issues Found

### 🚨 MUST FIX BEFORE DEVELOPMENT (1 hour)

#### 1. TypeScript Build Errors (3 errors)
**Impact**: Blocks production builds

**Error 1-2**: Missing Vite environment types
```typescript
// Create: /Users/Karim/kids-home-hub/apps/pwa/src/vite-env.d.ts
/// <reference types="vite/client" />
```

**Error 3**: Unused import in sync.ts
```typescript
// Remove: import { QueuePriority } from '../types'
```

**Error 4**: Implicit any type in ChoresView
```typescript
// Add explicit type annotation
chores.map((chore: ChoreItem) => ...)
```

#### 2. CORS Configuration
**Impact**: Frontend cannot connect to backend

**Current**: Backend only allows `http://localhost:8787`
**Fix**: Add frontend dev server to allowed origins

```typescript
// /Users/Karim/kids-home-hub/src/middleware/security.ts (line 98)
const allowedOrigins = [
  /^https:\/\/.*\.workers\.dev$/,
  /^https:\/\/kids-home-hub\..*$/,
  'http://localhost:8787',
  'http://127.0.0.1:8787',
  'http://localhost:3000',      // ADD THIS
  'http://127.0.0.1:3000',      // ADD THIS
];
```

#### 3. API Request Format Mismatch
**Impact**: Frontend sends FormData, backend expects JSON

**Frontend** (`apps/pwa/src/api/endpoints.ts`):
```typescript
// Currently sends FormData
const formData = new FormData();
await api.post('transaction', { body: formData });
```

**Backend** (`src/handlers/transaction.ts`):
```typescript
// Expects JSON
const body = await c.req.json();
```

**Fix**: Update frontend to send JSON:
```typescript
await api.post('v1/transaction', { json: data });
```

#### 4. API Path Versioning
**Frontend**: Calls `/transaction`, `/chores`, `/redeem`
**Backend**: Expects `/v1/transaction`, `/v1/chores`, `/v1/redeem`

**Fix**: Add `/v1/` prefix to all frontend API calls

#### 5. Missing Endpoint
**Frontend**: Calls `GET /child/{id}`
**Backend**: No such endpoint exists (only `GET /v1/data?child={id}`)

**Fix**: Update frontend to use query parameter format

---

## Development Phases

### Phase 2A: Critical Fixes (Week 1, Day 1 - 2 hours)

**Tasks**:
1. ✅ Create `vite-env.d.ts`
2. ✅ Remove unused imports
3. ✅ Fix type annotations
4. ✅ Update CORS configuration
5. ✅ Fix API client (JSON instead of FormData)
6. ✅ Add `/v1/` prefix to API calls
7. ✅ Fix endpoint mismatch
8. ✅ Test build: `pnpm build`
9. ✅ Verify no TypeScript/ESLint errors

**Deliverable**: Clean production build with no errors

---

### Phase 2B: Money Management (Week 1, Days 1-2 - 12 hours)

**Goal**: Fully functional bank account feature

#### Components to Build

1. **MoneyTransactionForm** (4 hours)
   - Path: `src/components/features/money/MoneyTransactionForm.tsx`
   - Features:
     - Amount input (number, max 10,000)
     - Currency selector (GBP/AUD)
     - Reason textarea (1-200 chars)
     - Add/Deduct toggle
     - Submit button with loading state
   - Validation:
     - Positive amounts only
     - Insufficient balance check (deduct)
     - Required fields
   - API: `POST /v1/transaction`

2. **MoneyBalanceCard** (2 hours)
   - Path: `src/components/features/money/MoneyBalanceCard.tsx`
   - Features:
     - Current balance display (large, prominent)
     - Currency conversion (GBP ↔ AUD @ 0.56 rate)
     - Currency toggle button
     - Last updated timestamp
   - State: `moneyBalance` signal

3. **TransactionHistory** (3 hours)
   - Path: `src/components/features/money/TransactionHistory.tsx`
   - Features:
     - List of last 20 transactions
     - Color-coded (green +, red -)
     - Amount, currency, reason, timestamp
     - Empty state with illustration
   - State: `moneyTransactions` signal

4. **BankView Integration** (2 hours)
   - Update: `src/views/BankView.tsx`
   - Wire up components
   - Add loading states
   - Implement optimistic updates
   - Connect to IndexedDB
   - Test offline sync

5. **Testing** (1 hour)
   - Unit: Validation logic
   - Component: Form submission
   - Integration: Full transaction flow
   - E2E: Offline transaction + sync

**Success Criteria**:
- ✅ Can add/deduct money with reason
- ✅ Balance updates instantly (optimistic UI)
- ✅ Currency conversion accurate
- ✅ Works offline, syncs when online
- ✅ Error handling for all edge cases

---

### Phase 2C: Points Management (Week 1, Days 3-4 - 10 hours)

**Goal**: Points system with redemption

#### Components to Build

1. **PointsAdjustForm** (3 hours)
   - Manual add/deduct points
   - Reason required
   - API: `POST /v1/transaction` (feature: "points")

2. **RedeemPointsForm** (3 hours)
   - Redeem points for screen time (1:1 ratio)
   - Preview screen time minutes
   - API: `POST /v1/redeem`

3. **PointsHistory** (2 hours)
   - Transaction log with source indicators
   - Manual, chores, redemption badges

4. **PointsView Integration** (1 hour)

5. **Testing** (1 hour)

**Success Criteria**:
- ✅ Manual points adjustment works
- ✅ Redeem creates both points & screen transactions
- ✅ History shows source type
- ✅ Insufficient points handled gracefully

---

### Phase 2D: Chores System (Week 1, Day 5 - 8 hours)

**Goal**: Interactive chore submission with auto-points

#### Components to Build

1. **ChoreCheckboxList** (3 hours)
   - Interactive checkboxes
   - 5 chores from shared constants
   - Points display per chore
   - Selection state management

2. **ChoreSubmitButton** (2 hours)
   - Shows total points preview
   - Disabled when no selection
   - Loading state during submit
   - Success animation

3. **ChoreHistory** (2 hours)
   - Previous chore sessions
   - Date + chores + total points

4. **ChoresView Integration** (1 hour)
   - API: `POST /v1/chores`
   - Auto-create points transaction

**Success Criteria**:
- ✅ Select multiple chores
- ✅ Points preview updates live
- ✅ Submission creates points transaction
- ✅ Weekly reset logic (future)

---

### Phase 2E: Screen Time (Week 2, Days 1-2 - 8 hours)

**Goal**: Screen time banking and usage

#### Components to Build

1. **ScreenTimeForm** (3 hours)
   - Add/deduct minutes
   - Time input (or minutes)
   - API: `POST /v1/transaction` (feature: "screen")

2. **ScreenTimeDisplay** (2 hours)
   - Balance in hours:minutes format
   - Progress bar (0-120 min recommended)
   - Usage stats (today, week)

3. **ScreenTimeHistory** (2 hours)
   - Additions (redeemed, parent)
   - Deductions (usage)

4. **ScreenView Integration** (1 hour)

**Success Criteria**:
- ✅ Add/deduct screen time
- ✅ Format: "1h 30m" display
- ✅ Progress bar visualization
- ✅ Redemption integration

---

### Phase 2F: Data Sync & Loading (Week 2, Days 3-4 - 10 hours)

**Goal**: Seamless data synchronization

#### Features to Implement

1. **Initial Data Load** (3 hours)
   - `useDataSync` hook
   - Load from IndexedDB immediately
   - Background fetch from API
   - Merge strategy

2. **Sync Status UI** (3 hours)
   - SyncIndicator component
   - Last sync timestamp
   - Pending changes count
   - Manual sync button

3. **Loading States** (2 hours)
   - Skeleton loaders
   - Shimmer animations
   - Empty states

4. **Error Handling** (2 hours)
   - Toast notifications
   - Retry logic UI
   - Error boundaries

**Success Criteria**:
- ✅ App loads instantly from cache
- ✅ Background sync automatic
- ✅ Sync status always visible
- ✅ Offline works 100%

---

### Phase 2G: Testing & Polish (Week 2, Day 5 - 8 hours)

**Tasks**:
1. Write comprehensive tests (80%+ coverage)
2. Fix all bugs found
3. Accessibility audit (WCAG 2.1 AA)
4. Performance optimization
5. Cross-browser testing
6. Mobile device testing

---

### Phase 2H: Enhanced Features (Week 3 - Optional)

#### Transaction History & Filtering (6 hours)
- Unified history view
- Filter by type/date
- Search functionality

#### Parent Controls (8 hours)
- 4-digit PIN protection
- Child mode toggle
- Settings page
- Data export

#### Offline Indicators (4 hours)
- Offline banner
- Pending changes badge
- Sync progress

---

## Technical Implementation Guide

### Component Template

```typescript
// Example: MoneyTransactionForm.tsx
import { signal } from '@preact/signals';
import { submitTransaction } from '../../api/endpoints';
import { Button } from '../common/Button';

interface MoneyTransactionFormProps {
  childId: string;
  onSuccess: () => void;
}

export function MoneyTransactionForm({ childId, onSuccess }: MoneyTransactionFormProps) {
  const amount = signal('');
  const currency = signal<'GBP' | 'AUD'>('GBP');
  const reason = signal('');
  const action = signal<'add' | 'deduct'>('add');
  const isLoading = signal(false);
  const error = signal<string | null>(null);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    isLoading.value = true;
    error.value = null;

    try {
      await submitTransaction({
        feature: 'money',
        child: childId,
        action: action.value,
        amount: parseFloat(amount.value),
        currency: currency.value,
        reason: reason.value,
      });

      // Optimistic update in store
      // Clear form
      amount.value = '';
      reason.value = '';
      onSuccess();
    } catch (err) {
      error.value = err.message;
    } finally {
      isLoading.value = false;
    }
  };

  return (
    <form onSubmit={handleSubmit} class="space-y-4">
      {/* Form fields */}
      <Button type="submit" loading={isLoading.value}>
        {action.value === 'add' ? 'Add Money' : 'Deduct Money'}
      </Button>
      {error.value && <p class="text-error">{error.value}</p>}
    </form>
  );
}
```

### API Integration Pattern

```typescript
// In stores/childrenStore.ts
import { signal, computed } from '@preact/signals';
import { db } from '../db/schema';
import { addToSyncQueue } from '../db/sync';

export const moneyBalance = signal(0);
export const moneyTransactions = signal<Transaction[]>([]);

export async function addMoneyTransaction(data: TransactionData) {
  // 1. Optimistic update
  moneyBalance.value += data.amount;

  // 2. Save to IndexedDB
  const transaction = {
    id: nanoid(),
    childId: data.child,
    type: 'money',
    amount: data.amount,
    currency: data.currency,
    reason: data.reason,
    timestamp: Date.now(),
    syncStatus: 'pending',
  };

  await db.transactions.add(transaction);
  moneyTransactions.value = [transaction, ...moneyTransactions.value];

  // 3. Add to sync queue
  await addToSyncQueue({
    type: 'transaction',
    data,
    priority: data.action === 'deduct' ? 10 : 5,
  });

  // 4. Sync happens automatically in background
}
```

---

## File Structure

```
apps/pwa/src/
├── components/
│   ├── common/
│   │   ├── Button.tsx ✅ EXISTS
│   │   ├── Card.tsx ✅ EXISTS
│   │   ├── Avatar.tsx ✅ EXISTS
│   │   ├── LoadingState.tsx ⚠️ CREATE
│   │   ├── EmptyState.tsx ⚠️ CREATE
│   │   └── Toast.tsx ⚠️ CREATE
│   ├── features/
│   │   ├── money/
│   │   │   ├── MoneyTransactionForm.tsx ⚠️ CREATE
│   │   │   ├── MoneyBalanceCard.tsx ⚠️ CREATE
│   │   │   └── TransactionHistory.tsx ⚠️ CREATE
│   │   ├── points/
│   │   │   ├── PointsAdjustForm.tsx ⚠️ CREATE
│   │   │   ├── RedeemPointsForm.tsx ⚠️ CREATE
│   │   │   └── PointsHistory.tsx ⚠️ CREATE
│   │   ├── chores/
│   │   │   ├── ChoreCheckboxList.tsx ⚠️ CREATE
│   │   │   ├── ChoreSubmitButton.tsx ⚠️ CREATE
│   │   │   └── ChoreHistory.tsx ⚠️ CREATE
│   │   └── screen/
│   │       ├── ScreenTimeForm.tsx ⚠️ CREATE
│   │       ├── ScreenTimeDisplay.tsx ⚠️ CREATE
│   │       └── ScreenTimeHistory.tsx ⚠️ CREATE
│   └── layout/
│       ├── Header.tsx ✅ EXISTS
│       ├── BottomNav.tsx ✅ EXISTS
│       ├── SyncIndicator.tsx ⚠️ CREATE
│       └── OfflineIndicator.tsx ⚠️ CREATE
├── views/
│   ├── BankView.tsx ✅ EXISTS (UI shell only)
│   ├── PointsView.tsx ✅ EXISTS (UI shell only)
│   ├── ChoresView.tsx ✅ EXISTS (UI shell only)
│   └── ScreenView.tsx ✅ EXISTS (UI shell only)
├── hooks/
│   ├── useDataSync.ts ⚠️ CREATE
│   └── useOfflineStatus.ts ⚠️ CREATE
├── api/
│   ├── client.ts ✅ EXISTS (needs fixes)
│   └── endpoints.ts ✅ EXISTS (needs fixes)
├── stores/
│   ├── childrenStore.ts ✅ EXISTS (needs enhancement)
│   ├── navigationStore.ts ✅ EXISTS
│   └── offlineStore.ts ✅ EXISTS
├── db/
│   ├── schema.ts ✅ EXISTS
│   └── sync.ts ✅ EXISTS
└── utils/
    ├── formatters.ts ⚠️ CREATE (currency, time)
    └── validators.ts ⚠️ CREATE (amount, reason)
```

---

## Testing Strategy

### Unit Tests (Vitest)

```typescript
// Example: formatters.test.ts
import { describe, it, expect } from 'vitest';
import { formatCurrency, formatTime } from './formatters';

describe('formatCurrency', () => {
  it('formats GBP correctly', () => {
    expect(formatCurrency(25.5, 'GBP')).toBe('£25.50');
  });

  it('converts GBP to AUD', () => {
    expect(formatCurrency(100, 'GBP', 'AUD')).toBe('A$178.57');
  });
});
```

### Component Tests

```typescript
// Example: MoneyTransactionForm.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/preact';
import { MoneyTransactionForm } from './MoneyTransactionForm';

describe('MoneyTransactionForm', () => {
  it('submits valid transaction', async () => {
    const onSuccess = vi.fn();
    const { getByLabelText, getByText } = render(
      <MoneyTransactionForm childId="adam" onSuccess={onSuccess} />
    );

    fireEvent.input(getByLabelText('Amount'), { target: { value: '10' } });
    fireEvent.input(getByLabelText('Reason'), { target: { value: 'Pocket money' } });
    fireEvent.click(getByText('Add Money'));

    expect(onSuccess).toHaveBeenCalled();
  });
});
```

### E2E Tests (Playwright)

```typescript
// Example: bank.spec.ts
import { test, expect } from '@playwright/test';

test('add money transaction', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Select Adam
  await page.click('text=Adam');

  // Navigate to Bank
  await page.click('[aria-label="Bank"]');

  // Add money
  await page.click('text=Add Money');
  await page.fill('[name="amount"]', '10');
  await page.fill('[name="reason"]', 'Test transaction');
  await page.click('button[type="submit"]');

  // Verify balance updated
  await expect(page.locator('text=£10.00')).toBeVisible();
});
```

---

## Deployment Checklist

### Before Development
- [ ] Fix 3 TypeScript errors
- [ ] Update CORS configuration
- [ ] Fix API client (JSON format)
- [ ] Add `/v1/` prefix to API paths
- [ ] Fix endpoint mismatch
- [ ] Test production build

### Before Phase 2B (Money)
- [ ] Create KV namespaces
- [ ] Update `wrangler.toml` with namespace IDs
- [ ] Start backend Worker: `pnpm dev:worker`
- [ ] Test API endpoints with curl

### Before Phase 2G (Testing)
- [ ] Run linter: `pnpm lint`
- [ ] Run type-check: `pnpm type-check`
- [ ] Run all tests: `pnpm test`
- [ ] Check bundle size: `pnpm build:analyze`

### Before Production
- [ ] E2E tests pass on mobile
- [ ] Lighthouse score 95+
- [ ] Accessibility audit passes
- [ ] Security audit clean
- [ ] Load testing complete
- [ ] Deploy to staging
- [ ] Test on real devices
- [ ] Deploy to production

---

## Success Metrics

**By End of Week 1**:
- ✅ Money feature 100% functional
- ✅ Points feature 100% functional
- ✅ Chores feature 100% functional

**By End of Week 2**:
- ✅ Screen time feature 100% functional
- ✅ Data sync working seamlessly
- ✅ All tests passing (80%+ coverage)

**By End of Week 3** (optional):
- ✅ Enhanced features (history, settings, offline indicators)

**By End of Week 4** (optional):
- ✅ Analytics, animations, notifications

---

## Next Immediate Actions

1. **Fix critical issues** (2 hours)
   - Create `vite-env.d.ts`
   - Update CORS config
   - Fix API client
   - Test build

2. **Setup backend** (30 minutes)
   - Create KV namespaces
   - Update `wrangler.toml`
   - Start Worker: `pnpm dev:worker`

3. **Start Money feature** (Day 1-2)
   - Create `MoneyTransactionForm`
   - Create `MoneyBalanceCard`
   - Create `TransactionHistory`
   - Update `BankView`

---

## Conclusion

The Kids Home Hub PWA has **exceptional infrastructure** ready for feature development. With 4-5 focused weeks, we can transform it from a beautiful shell into a **fully functional, production-ready application**.

**Start Date**: Next available
**Target Launch**: 4-5 weeks from start
**Confidence Level**: HIGH (infrastructure proven, plan detailed, risks mitigated)

---

**Document Version**: 1.0
**Last Updated**: November 23, 2025
**Next Review**: After Week 1 completion
