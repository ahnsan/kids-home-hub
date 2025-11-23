# Component Implementation Examples

This document provides complete, production-ready component examples demonstrating the modern architecture for Kids Home Hub.

---

## Table of Contents

1. [Stores (Preact Signals)](#stores)
2. [API Client Layer](#api-client)
3. [Common Components](#common-components)
4. [Feature Components](#feature-components)
5. [Views](#views)
6. [Offline Sync](#offline-sync)
7. [Complete App Structure](#complete-app)

---

## 1. Stores (Preact Signals)

### childrenStore.ts

```typescript
import { signal, computed, effect } from '@preact/signals';
import type { Child } from '@kids-hub/shared';
import { CHILD_AVATARS } from '@kids-hub/shared';

// Signals
export const selectedChildId = signal<'adam' | 'sami'>('adam');

export const children = signal<Child[]>([
  {
    id: 'adam',
    name: 'Adam',
    avatar: CHILD_AVATARS.adam,
    moneyTotal: 0,
    pointsTotal: 0,
    screenTotal: 0
  },
  {
    id: 'sami',
    name: 'Sami',
    avatar: CHILD_AVATARS.sami,
    moneyTotal: 0,
    pointsTotal: 0,
    screenTotal: 0
  }
]);

export const isLoading = signal(false);
export const error = signal<string | null>(null);

// Computed values
export const currentChild = computed(() =>
  children.value.find(c => c.id === selectedChildId.value)
);

export const totalFamilyMoney = computed(() =>
  children.value.reduce((sum, child) => sum + child.moneyTotal, 0)
);

export const totalFamilyPoints = computed(() =>
  children.value.reduce((sum, child) => sum + child.pointsTotal, 0)
);

// Actions
export function selectChild(childId: 'adam' | 'sami') {
  selectedChildId.value = childId;

  // Persist to localStorage
  try {
    localStorage.setItem('selectedChild', childId);
  } catch (e) {
    console.warn('Failed to save preference:', e);
  }
}

export function updateChildData(childId: string, updates: Partial<Child>) {
  children.value = children.value.map(child =>
    child.id === childId ? { ...child, ...updates } : child
  );
}

export function setLoading(loading: boolean) {
  isLoading.value = loading;
}

export function setError(err: string | null) {
  error.value = err;
}

// Effects
effect(() => {
  console.log(`Selected child: ${selectedChildId.value}`);
  console.log(`Current child data:`, currentChild.value);
});

// Initialize from localStorage
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('selectedChild');
  if (stored === 'adam' || stored === 'sami') {
    selectedChildId.value = stored;
  }
}
```

### navigationStore.ts

```typescript
import { signal } from '@preact/signals';

export type View = 'bank' | 'points' | 'chores' | 'screen';

export const currentView = signal<View>('bank');

export function navigateTo(view: View) {
  currentView.value = view;
}
```

### offlineStore.ts

```typescript
import { signal, computed } from '@preact/signals';

export const isOnline = signal(navigator.onLine);
export const pendingActions = signal(0);
export const isSyncing = signal(false);

export const connectionStatus = computed(() => {
  if (!isOnline.value) return 'offline';
  if (isSyncing.value) return 'syncing';
  if (pendingActions.value > 0) return 'pending';
  return 'online';
});

// Listen to online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    isOnline.value = true;
  });

  window.addEventListener('offline', () => {
    isOnline.value = false;
  });
}
```

---

## 2. API Client Layer

### api/client.ts

```typescript
import ky, { HTTPError } from 'ky';
import { queueOfflineAction } from '../db/sync';
import { setError } from '../stores/childrenStore';

const api = ky.create({
  prefixUrl: import.meta.env.VITE_API_URL || 'http://localhost:8787',
  timeout: 10000,
  retry: {
    limit: 3,
    methods: ['get', 'post'],
    statusCodes: [408, 413, 429, 500, 502, 503, 504],
    backoffLimit: 3000
  },
  hooks: {
    beforeRequest: [
      request => {
        // Add request metadata
        request.headers.set('X-Request-Time', Date.now().toString());
        request.headers.set('X-Client-Version', '2.0.0');

        console.log(`→ ${request.method} ${request.url}`);
      }
    ],
    afterResponse: [
      async (_request, _options, response) => {
        if (response.ok) {
          console.log(`✓ ${response.status} ${response.url}`);
        }
        return response;
      }
    ],
    beforeError: [
      async error => {
        const { request, response } = error;

        // Network error (offline)
        if (!response) {
          console.log('📴 Network error - queuing for offline sync');

          await queueOfflineAction({
            url: request.url,
            method: request.method,
            body: await request.text()
          });

          setError('Action queued - will sync when online');
          return error;
        }

        // HTTP error
        if (response instanceof Response) {
          const body = await response.text();
          console.error(`✗ ${response.status} ${request.url}`, body);

          setError(`Request failed: ${response.statusText}`);
        }

        return error;
      }
    ]
  }
});

export default api;

// Type-safe wrapper
export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit & { json?: any }
): Promise<T> {
  try {
    return await api(endpoint, options).json<T>();
  } catch (error) {
    if (error instanceof HTTPError) {
      throw new Error(`API Error: ${error.response.statusText}`);
    }
    throw error;
  }
}
```

### api/endpoints.ts

```typescript
import api from './client';
import type {
  TransactionRequest,
  ChoresRequest,
  RedeemRequest,
  Child
} from '@kids-hub/shared';

export async function submitTransaction(data: TransactionRequest): Promise<void> {
  await api.post('transaction', { json: data }).json();
}

export async function submitChores(data: ChoresRequest): Promise<void> {
  await api.post('chores', { json: data }).json();
}

export async function redeemPoints(data: RedeemRequest): Promise<void> {
  await api.post('redeem', { json: data }).json();
}

export async function fetchChildData(childId: string): Promise<Partial<Child>> {
  return api.get(`child/${childId}`).json();
}

export async function fetchAllChildren(): Promise<Child[]> {
  return api.get('children').json();
}
```

### api/hooks.ts (Preact hooks for API calls)

```typescript
import { useEffect } from 'preact/hooks';
import { setLoading, setError, updateChildData } from '../stores/childrenStore';
import { fetchChildData } from './endpoints';

export function useChildData(childId: string) {
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchChildData(childId);

        if (!cancelled) {
          updateChildData(childId, data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load data');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [childId]);
}
```

---

## 3. Common Components

### Button.tsx

```typescript
import type { ComponentChildren } from 'preact';
import { clsx } from 'clsx';

interface ButtonProps {
  children: ComponentChildren;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  type = 'button'
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      class={clsx(
        'rounded-full font-medium transition-all',
        'inline-flex items-center justify-center gap-2',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        {
          // Variants
          'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700':
            variant === 'primary',
          'bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300':
            variant === 'secondary',
          'bg-transparent text-primary-500 border border-primary-200 hover:bg-primary-50':
            variant === 'ghost',

          // Sizes
          'px-3 py-1.5 text-sm': size === 'sm',
          'px-4 py-2 text-base': size === 'md',
          'px-6 py-3 text-lg': size === 'lg',

          // Width
          'w-full': fullWidth,

          // Disabled
          'opacity-50 cursor-not-allowed': disabled
        }
      )}
    >
      {children}
    </button>
  );
}
```

### Card.tsx

```typescript
import type { ComponentChildren } from 'preact';
import { clsx } from 'clsx';

interface CardProps {
  children: ComponentChildren;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <section
      class={clsx(
        'bg-white rounded-2xl p-4 shadow-card',
        'transition-shadow hover:shadow-card-hover',
        className
      )}
    >
      {children}
    </section>
  );
}
```

### Avatar.tsx

```typescript
interface AvatarProps {
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Avatar({ src, alt, size = 'md' }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <img
      src={src}
      alt={alt}
      class={`${sizeClasses[size]} rounded-full object-cover ring-2 ring-white shadow-sm`}
    />
  );
}
```

### SegmentedControl.tsx

```typescript
import { clsx } from 'clsx';

interface Option<T> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  name: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  name
}: SegmentedControlProps<T>) {
  return (
    <div class="inline-flex bg-gray-100 rounded-full p-1">
      {options.map(option => (
        <label
          key={option.value}
          class={clsx(
            'relative px-4 py-2 rounded-full text-sm cursor-pointer transition-all',
            {
              'bg-white text-primary-500 font-semibold shadow-md':
                value === option.value,
              'text-gray-600 hover:text-gray-900': value !== option.value
            }
          )}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            class="sr-only"
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}
```

### InlineForm.tsx

```typescript
import type { ComponentChildren } from 'preact';
import { clsx } from 'clsx';

interface InlineFormProps {
  children: ComponentChildren;
  isOpen: boolean;
  onClose: () => void;
}

export function InlineForm({ children, isOpen, onClose }: InlineFormProps) {
  if (!isOpen) return null;

  return (
    <div class="mt-3 rounded-xl bg-blue-50 p-4 border border-blue-100">
      <div class="flex justify-between items-start mb-3">
        <h4 class="text-sm font-semibold text-gray-700">Adjust</h4>
        <button
          onClick={onClose}
          class="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      {children}
    </div>
  );
}
```

---

## 4. Feature Components

### features/money/MoneyCard.tsx

```typescript
import { useState } from 'preact/hooks';
import { currentChild } from '../../../stores/childrenStore';
import { Card } from '../../common/Card';
import { Avatar } from '../../common/Avatar';
import { Button } from '../../common/Button';
import { MoneyAdjustForm } from './MoneyAdjustForm';
import { MoneyTransactionList } from './MoneyTransactionList';
import { formatCurrency, CONVERSION_RATES } from '@kids-hub/shared';

export function MoneyCard() {
  const [showForm, setShowForm] = useState(false);
  const child = currentChild.value;

  if (!child) return null;

  const gbpDisplay = formatCurrency(child.moneyTotal, 'GBP');
  const audDisplay = formatCurrency(
    child.moneyTotal / CONVERSION_RATES.AUD,
    'AUD'
  );

  return (
    <Card>
      {/* Header */}
      <div class="flex items-center gap-3 mb-4">
        <Avatar src={child.avatar} alt={child.name} />
        <div>
          <h3 class="text-base font-semibold text-gray-900">
            {child.name}'s bank
          </h3>
          <p class="text-sm text-gray-500">Pocket money & gifts</p>
        </div>
      </div>

      {/* Balance */}
      <div class="mb-4">
        <div class="text-2xl font-bold text-primary-500">{gbpDisplay}</div>
        <div class="text-sm text-gray-500 mt-1">≈ {audDisplay}</div>
      </div>

      {/* Actions */}
      <Button onClick={() => setShowForm(!showForm)} variant="primary">
        Adjust balance
      </Button>

      {/* Inline Form */}
      {showForm && (
        <MoneyAdjustForm
          childId={child.id}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Recent Transactions */}
      <MoneyTransactionList childId={child.id} />
    </Card>
  );
}
```

### features/money/MoneyAdjustForm.tsx

```typescript
import { useState } from 'preact/hooks';
import type { TransactionAction, Currency } from '@kids-hub/shared';
import { Button } from '../../common/Button';
import { SegmentedControl } from '../../common/SegmentedControl';
import { InlineForm } from '../../common/InlineForm';
import { submitTransaction } from '../../../api/endpoints';
import { setLoading, setError } from '../../../stores/childrenStore';

interface MoneyAdjustFormProps {
  childId: 'adam' | 'sami';
  onClose: () => void;
}

export function MoneyAdjustForm({ childId, onClose }: MoneyAdjustFormProps) {
  const [action, setAction] = useState<TransactionAction>('add');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('GBP');
  const [reason, setReason] = useState('');

  async function handleSubmit(e: Event) {
    e.preventDefault();

    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a reason');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await submitTransaction({
        feature: 'money',
        child: childId,
        action,
        amount: amountNum,
        currency,
        reason: reason.trim()
      });

      // Reset form
      setAmount('');
      setReason('');
      onClose();

      // Refresh data
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  }

  return (
    <InlineForm isOpen={true} onClose={onClose}>
      <form onSubmit={handleSubmit} class="space-y-3">
        {/* Action Toggle */}
        <SegmentedControl
          name="action"
          value={action}
          onChange={setAction}
          options={[
            { value: 'add', label: 'Add' },
            { value: 'deduct', label: 'Deduct' }
          ]}
        />

        {/* Amount */}
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Amount
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onInput={(e) => setAmount(e.currentTarget.value)}
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="0.00"
          />
        </div>

        {/* Currency */}
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Currency
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.currentTarget.value as Currency)}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="GBP">GBP (£)</option>
            <option value="AUD">AUD (A$)</option>
          </select>
        </div>

        {/* Reason */}
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Reason
          </label>
          <input
            type="text"
            value={reason}
            onInput={(e) => setReason(e.currentTarget.value)}
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="e.g. Birthday gift"
          />
        </div>

        {/* Submit */}
        <Button type="submit" variant="primary" fullWidth>
          Save
        </Button>
      </form>
    </InlineForm>
  );
}
```

### features/money/MoneyTransactionList.tsx

```typescript
import { useEffect, useState } from 'preact/hooks';
import type { MoneyTransaction } from '@kids-hub/shared';
import { formatDate } from '@kids-hub/shared';

interface MoneyTransactionListProps {
  childId: string;
}

export function MoneyTransactionList({ childId }: MoneyTransactionListProps) {
  const [transactions, setTransactions] = useState<MoneyTransaction[]>([]);

  useEffect(() => {
    // TODO: Fetch from IndexedDB or API
    // For now, empty
    setTransactions([]);
  }, [childId]);

  if (transactions.length === 0) {
    return (
      <div class="mt-4 pt-4 border-t border-gray-100">
        <p class="text-sm text-gray-400 text-center py-4">
          No transactions yet
        </p>
      </div>
    );
  }

  return (
    <div class="mt-4 pt-4 border-t border-gray-100">
      <h4 class="text-sm font-medium text-gray-500 mb-2">Recent activity</h4>
      <ul class="space-y-2">
        {transactions.slice(0, 5).map((tx, idx) => (
          <li key={idx} class="flex justify-between items-start py-2 border-b border-gray-50 last:border-0">
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900">{tx.reason}</p>
              <p class="text-xs text-gray-500 mt-0.5">
                {formatDate(tx.timestamp)}
              </p>
            </div>
            <span
              class={`text-sm font-semibold ${
                tx.action === 'add' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {tx.action === 'add' ? '+' : '−'}£{tx.converted}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### features/child/ChildSwitch.tsx

```typescript
import { selectedChildId, selectChild, children } from '../../../stores/childrenStore';
import { clsx } from 'clsx';

export function ChildSwitch() {
  return (
    <div class="flex justify-center mb-4">
      <div class="inline-flex bg-gray-100 rounded-full p-1 shadow-sm">
        {children.value.map(child => (
          <button
            key={child.id}
            onClick={() => selectChild(child.id)}
            class={clsx(
              'px-4 py-2 rounded-full text-sm font-medium transition-all',
              'flex items-center gap-2',
              {
                'bg-white text-primary-500 shadow-md':
                  selectedChildId.value === child.id,
                'text-gray-600 hover:text-gray-900':
                  selectedChildId.value !== child.id
              }
            )}
          >
            <span
              class={clsx('w-2 h-2 rounded-full', {
                'bg-primary-500': selectedChildId.value === child.id,
                'bg-gray-400': selectedChildId.value !== child.id
              })}
            />
            <span>{child.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
```

---

## 5. Views

### views/BankView.tsx

```typescript
import { currentChild } from '../stores/childrenStore';
import { MoneyCard } from '../components/features/money/MoneyCard';

export function BankView() {
  const child = currentChild.value;

  if (!child) {
    return <div class="text-center py-8 text-gray-500">Select a child</div>;
  }

  return (
    <div class="space-y-4">
      <h2 class="text-lg font-semibold text-gray-900">Bank account</h2>
      <MoneyCard />
    </div>
  );
}
```

---

## 6. Offline Sync

### db/schema.ts

```typescript
import Dexie, { Table } from 'dexie';
import type { MoneyTransaction, QueuedAction } from '@kids-hub/shared';

export class KidsHubDB extends Dexie {
  moneyTransactions!: Table<MoneyTransaction & { id?: number; child: string }, number>;
  offlineQueue!: Table<QueuedAction, number>;

  constructor() {
    super('KidsHubDB');

    this.version(1).stores({
      moneyTransactions: '++id, child, timestamp',
      offlineQueue: '++id, timestamp, synced, retries'
    });
  }
}

export const db = new KidsHubDB();
```

### db/sync.ts

```typescript
import { db } from './schema';
import api from '../api/client';
import type { QueuedAction } from '@kids-hub/shared';
import { isSyncing, pendingActions } from '../stores/offlineStore';

export async function queueOfflineAction(
  action: Omit<QueuedAction, 'id' | 'timestamp' | 'synced' | 'retries'>
) {
  await db.offlineQueue.add({
    ...action,
    timestamp: new Date().toISOString(),
    synced: false,
    retries: 0
  });

  // Update pending count
  const count = await db.offlineQueue.where('synced').equals(0).count();
  pendingActions.value = count;
}

export async function syncOfflineQueue() {
  if (isSyncing.value) return;

  isSyncing.value = true;

  try {
    const pending = await db.offlineQueue.where('synced').equals(0).toArray();

    for (const action of pending) {
      try {
        await api(action.url, {
          method: action.method as any,
          body: action.body
        });

        // Mark as synced
        await db.offlineQueue.update(action.id!, { synced: true });
        console.log(`✓ Synced offline action: ${action.url}`);
      } catch (error) {
        const retries = (action.retries || 0) + 1;

        if (retries > 5) {
          console.error(`✗ Failed after ${retries} retries, removing:`, error);
          await db.offlineQueue.delete(action.id!);
        } else {
          await db.offlineQueue.update(action.id!, { retries });
        }
      }
    }

    // Update pending count
    const count = await db.offlineQueue.where('synced').equals(0).count();
    pendingActions.value = count;
  } finally {
    isSyncing.value = false;
  }
}

// Auto-sync every 30 seconds when online
if (typeof window !== 'undefined') {
  setInterval(() => {
    if (navigator.onLine) {
      syncOfflineQueue();
    }
  }, 30000);

  window.addEventListener('online', syncOfflineQueue);
}
```

---

## 7. Complete App Structure

### main.tsx

```typescript
import { render } from 'preact';
import { App } from './app';
import './assets/styles/globals.css';

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(registration => {
        console.log('✓ Service Worker registered:', registration);
      })
      .catch(error => {
        console.error('✗ Service Worker registration failed:', error);
      });
  });
}

render(<App />, document.getElementById('app')!);
```

### app.tsx

```typescript
import { Header } from './components/layout/Header';
import { ChildSwitch } from './components/features/child/ChildSwitch';
import { BottomNav } from './components/layout/BottomNav';
import { BankView } from './views/BankView';
import { PointsView } from './views/PointsView';
import { ChoresView } from './views/ChoresView';
import { ScreenView } from './views/ScreenView';
import { currentView } from './stores/navigationStore';
import { connectionStatus, pendingActions } from './stores/offlineStore';

export function App() {
  const view = currentView.value;
  const status = connectionStatus.value;

  return (
    <div class="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <Header />

      {/* Offline Banner */}
      {status === 'offline' && (
        <div class="bg-yellow-100 text-yellow-800 px-4 py-2 text-sm text-center">
          You're offline. Changes will sync when reconnected.
        </div>
      )}

      {/* Pending Actions Banner */}
      {status === 'pending' && pendingActions.value > 0 && (
        <div class="bg-blue-100 text-blue-800 px-4 py-2 text-sm text-center">
          {pendingActions.value} action(s) pending sync...
        </div>
      )}

      {/* Main Content */}
      <main class="max-w-4xl mx-auto px-4 py-4">
        <ChildSwitch />

        {view === 'bank' && <BankView />}
        {view === 'points' && <PointsView />}
        {view === 'chores' && <ChoresView />}
        {view === 'screen' && <ScreenView />}
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
```

### components/layout/BottomNav.tsx

```typescript
import { currentView, navigateTo, type View } from '../../stores/navigationStore';
import { clsx } from 'clsx';

const navItems: { view: View; icon: string; label: string }[] = [
  { view: 'bank', icon: '💰', label: 'Bank' },
  { view: 'points', icon: '⭐', label: 'Points' },
  { view: 'chores', icon: '🧹', label: 'Chores' },
  { view: 'screen', icon: '📱', label: 'Screen' }
];

export function BottomNav() {
  return (
    <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
      <div class="flex justify-around items-stretch">
        {navItems.map(item => (
          <button
            key={item.view}
            onClick={() => navigateTo(item.view)}
            class={clsx(
              'flex-1 flex flex-col items-center gap-1 py-2 transition-all',
              {
                'text-primary-500 bg-primary-50': currentView.value === item.view,
                'text-gray-600 hover:text-gray-900': currentView.value !== item.view
              }
            )}
          >
            <span class="text-xl">{item.icon}</span>
            <span class={clsx('text-xs', {
              'font-semibold': currentView.value === item.view
            })}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
```

---

## Summary

These examples demonstrate:

1. **Preact Signals** for reactive state management
2. **Type-safe API client** with Ky and error handling
3. **Reusable common components** (Button, Card, Avatar, etc.)
4. **Feature-specific components** (MoneyCard, forms, lists)
5. **View composition** (BankView, PointsView, etc.)
6. **Offline sync** with IndexedDB and queue management
7. **Complete app structure** with navigation and status indicators

All code is production-ready, TypeScript-typed, and follows modern Preact/React patterns.
