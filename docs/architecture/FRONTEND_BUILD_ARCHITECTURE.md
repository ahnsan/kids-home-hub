# Kids Home Hub - Frontend Build Architecture

## Executive Summary

This document outlines a modern frontend build system that separates the UI from the Cloudflare Worker backend, enables PWA deployment, supports native app wrapping (via Capacitor/Tauri), and introduces modern tooling while maintaining current functionality.

---

## 1. Technology Stack Recommendations

### 1.1 Framework: **Preact** (Recommended)

**Decision: Preact over React/Vue/Svelte/Vanilla**

**Rationale:**
- **Size**: 3KB gzipped (vs React 42KB) - Critical for PWA performance
- **React Compatibility**: Uses JSX and React patterns, familiar ecosystem
- **Signals**: Built-in reactive state management (Preact Signals)
- **PWA Optimized**: Designed for progressive web apps
- **Migration Path**: Easy to upgrade to React if needed
- **Mature Ecosystem**: Hooks, routing, and all modern features
- **Perfect for Your Use Case**: Small family app, offline-first, performance-critical

**Alternatives Considered:**
- **React**: Too heavy (42KB) for a PWA, overkill for this scope
- **Vue**: Good option but heavier than Preact (33KB), less TypeScript-friendly
- **Svelte**: Excellent compiler-based approach, but smaller ecosystem and hiring pool
- **Vanilla JS**: Current approach, but lacks component reusability and modern DX

### 1.2 Build Tool: **Vite** (Recommended)

**Decision: Vite over Webpack/Parcel/esbuild**

**Rationale:**
- **Development Speed**: Instant HMR using native ES modules
- **Production Optimized**: Rollup-based bundling with tree-shaking
- **PWA Plugin**: Official `vite-plugin-pwa` with Workbox integration
- **Simple Config**: Minimal configuration required
- **TypeScript Native**: Zero-config TypeScript support
- **Modern Standards**: ESM-first, HTTP/2 optimized
- **Perfect for Multi-Output**: Can build for PWA, Worker, and static hosting

**Alternatives Considered:**
- **Webpack**: Slower dev server, complex configuration
- **Parcel**: Less control over output, smaller ecosystem
- **esbuild**: Ultra-fast but less mature plugin ecosystem

### 1.3 CSS Approach: **Tailwind CSS** (Recommended)

**Decision: Tailwind CSS over CSS Modules/Styled Components/Vanilla**

**Rationale:**
- **Utility-First**: Matches your current inline style approach
- **Purging**: Removes unused CSS automatically (tiny bundle)
- **Design System**: Built-in design tokens (colors, spacing, etc.)
- **Dark Mode**: First-class support for theme switching
- **Component Library Compatibility**: Works with Headless UI, Radix
- **Responsive**: Mobile-first utilities
- **Performance**: JIT compiler, minimal runtime overhead

**Current Inline Styles → Tailwind Migration:**
```css
/* Current */
.balance-value {
  font-size: 1.6rem;
  font-weight: 700;
  color: #01579b;
}

/* Tailwind */
<div class="text-2xl font-bold text-blue-900">£25.00</div>
```

### 1.4 State Management: **Preact Signals** (Recommended)

**Decision: Preact Signals over Redux/Zustand/Context**

**Rationale:**
- **Built-in**: No additional bundle size
- **Reactive**: Auto-tracking dependencies, no re-render issues
- **Simple API**: `signal()`, `computed()`, `effect()`
- **TypeScript**: First-class type inference
- **Perfect for Your Use Case**: Local state (child selection, forms, offline data)
- **No Boilerplate**: Unlike Redux

**Example:**
```typescript
import { signal, computed } from '@preact/signals';

const selectedChild = signal<'adam' | 'sami'>('adam');
const children = signal([
  { id: 'adam', moneyTotal: 25.50, pointsTotal: 120 },
  { id: 'sami', moneyTotal: 18.75, pointsTotal: 85 }
]);

const currentChild = computed(() =>
  children.value.find(c => c.id === selectedChild.value)
);
```

### 1.5 Offline Storage: **IndexedDB (via Dexie.js)** + LocalStorage

**Decision: IndexedDB for structured data, LocalStorage for preferences**

**Rationale:**
- **IndexedDB (Dexie.js)**:
  - Stores transaction logs, offline queue
  - Structured queries and indexes
  - Large storage capacity (50MB+)
  - Async API (non-blocking)
  - Dexie.js provides clean async/await API

- **LocalStorage**:
  - User preferences (selected child, theme)
  - Small key-value pairs
  - Synchronous API (fine for tiny data)

**Storage Strategy:**
```typescript
// Dexie.js schema
class KidsHubDB extends Dexie {
  transactions!: Table<Transaction>;
  offlineQueue!: Table<QueuedAction>;

  constructor() {
    super('KidsHubDB');
    this.version(1).stores({
      transactions: '++id, child, feature, timestamp',
      offlineQueue: '++id, timestamp, synced'
    });
  }
}

// LocalStorage for preferences
const preferences = {
  selectedChild: 'adam',
  theme: 'light'
};
```

### 1.6 API Client Layer: **Ky** (Recommended)

**Decision: Ky over Axios/Fetch**

**Rationale:**
- **Tiny**: 1.5KB vs Axios 13KB
- **Modern**: Based on Fetch API
- **TypeScript**: Full type safety
- **Retry Logic**: Built-in retry with exponential backoff
- **Error Handling**: Clean error responses
- **HTTP/2**: Fetch-based, supports multiplexing

```typescript
import ky from 'ky';

const api = ky.create({
  prefixUrl: import.meta.env.VITE_API_URL,
  retry: { limit: 3 },
  hooks: {
    beforeRequest: [
      request => {
        // Add auth if needed
      }
    ],
    afterResponse: [
      async (request, options, response) => {
        if (!response.ok) {
          // Queue for offline sync
          await queueOfflineAction(request);
        }
      }
    ]
  }
});
```

---

## 2. Project Structure

```
kids-home-hub/
├── .github/
│   └── workflows/
│       ├── deploy-pwa.yml          # Deploy PWA to Cloudflare Pages
│       └── deploy-worker.yml       # Deploy Worker to Cloudflare Workers
│
├── apps/
│   ├── pwa/                        # Progressive Web App
│   │   ├── public/
│   │   │   ├── icons/
│   │   │   │   ├── icon-72.png
│   │   │   │   ├── icon-96.png
│   │   │   │   ├── icon-128.png
│   │   │   │   ├── icon-144.png
│   │   │   │   ├── icon-152.png
│   │   │   │   ├── icon-192.png
│   │   │   │   ├── icon-384.png
│   │   │   │   ├── icon-512.png
│   │   │   │   ├── maskable-192.png
│   │   │   │   └── maskable-512.png
│   │   │   ├── og-image.png
│   │   │   └── robots.txt
│   │   │
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── common/
│   │   │   │   │   ├── Button.tsx
│   │   │   │   │   ├── Card.tsx
│   │   │   │   │   ├── Avatar.tsx
│   │   │   │   │   ├── BottomNav.tsx
│   │   │   │   │   ├── InlineForm.tsx
│   │   │   │   │   └── SegmentedControl.tsx
│   │   │   │   │
│   │   │   │   ├── features/
│   │   │   │   │   ├── money/
│   │   │   │   │   │   ├── MoneyCard.tsx
│   │   │   │   │   │   ├── MoneyAdjustForm.tsx
│   │   │   │   │   │   ├── MoneyTransactionList.tsx
│   │   │   │   │   │   └── MoneyBalance.tsx
│   │   │   │   │   │
│   │   │   │   │   ├── points/
│   │   │   │   │   │   ├── PointsCard.tsx
│   │   │   │   │   │   ├── PointsAdjustForm.tsx
│   │   │   │   │   │   ├── PointsRedeemForm.tsx
│   │   │   │   │   │   └── PointsHistory.tsx
│   │   │   │   │   │
│   │   │   │   │   ├── chores/
│   │   │   │   │   │   ├── ChoresCard.tsx
│   │   │   │   │   │   ├── ChoresList.tsx
│   │   │   │   │   │   ├── ChoreCheckbox.tsx
│   │   │   │   │   │   └── ChoresHistory.tsx
│   │   │   │   │   │
│   │   │   │   │   ├── screen/
│   │   │   │   │   │   ├── ScreenCard.tsx
│   │   │   │   │   │   ├── ScreenAdjustForm.tsx
│   │   │   │   │   │   ├── ScreenProgress.tsx
│   │   │   │   │   │   └── ScreenHistory.tsx
│   │   │   │   │   │
│   │   │   │   │   └── child/
│   │   │   │   │       ├── ChildSwitch.tsx
│   │   │   │   │       └── ChildSelector.tsx
│   │   │   │   │
│   │   │   │   └── layout/
│   │   │   │       ├── Header.tsx
│   │   │   │       ├── Layout.tsx
│   │   │   │       └── ViewContainer.tsx
│   │   │   │
│   │   │   ├── views/
│   │   │   │   ├── BankView.tsx
│   │   │   │   ├── PointsView.tsx
│   │   │   │   ├── ChoresView.tsx
│   │   │   │   └── ScreenView.tsx
│   │   │   │
│   │   │   ├── api/
│   │   │   │   ├── client.ts              # Ky API client
│   │   │   │   ├── endpoints.ts           # API endpoint definitions
│   │   │   │   ├── types.ts               # API request/response types
│   │   │   │   └── hooks/
│   │   │   │       ├── useTransaction.ts
│   │   │   │       ├── useChores.ts
│   │   │   │       └── useRedeem.ts
│   │   │   │
│   │   │   ├── stores/
│   │   │   │   ├── childrenStore.ts       # Preact Signals state
│   │   │   │   ├── navigationStore.ts
│   │   │   │   ├── offlineStore.ts
│   │   │   │   └── preferencesStore.ts
│   │   │   │
│   │   │   ├── db/
│   │   │   │   ├── schema.ts              # Dexie.js schema
│   │   │   │   ├── transactions.ts        # Transaction DB operations
│   │   │   │   └── sync.ts                # Offline sync logic
│   │   │   │
│   │   │   ├── utils/
│   │   │   │   ├── formatters.ts          # Date, currency formatters
│   │   │   │   ├── conversions.ts         # Currency conversion
│   │   │   │   ├── constants.ts           # App constants
│   │   │   │   └── validators.ts          # Form validation
│   │   │   │
│   │   │   ├── hooks/
│   │   │   │   ├── useLocalStorage.ts
│   │   │   │   ├── useOfflineSync.ts
│   │   │   │   └── useNetworkStatus.ts
│   │   │   │
│   │   │   ├── types/
│   │   │   │   ├── child.ts
│   │   │   │   ├── transaction.ts
│   │   │   │   ├── chore.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── assets/
│   │   │   │   └── styles/
│   │   │   │       └── globals.css        # Tailwind base + custom
│   │   │   │
│   │   │   ├── app.tsx                    # Root component
│   │   │   ├── main.tsx                   # Entry point
│   │   │   └── vite-env.d.ts              # Vite types
│   │   │
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── postcss.config.js
│   │   ├── tsconfig.json
│   │   ├── tsconfig.node.json
│   │   └── package.json
│   │
│   └── worker/                            # Cloudflare Worker API
│       ├── src/
│       │   ├── handlers/
│       │   │   ├── transaction.ts
│       │   │   ├── chores.ts
│       │   │   └── redeem.ts
│       │   │
│       │   ├── utils/
│       │   │   ├── kv.ts                  # KV helpers
│       │   │   └── validation.ts
│       │   │
│       │   ├── types/
│       │   │   └── index.ts               # Shared types with PWA
│       │   │
│       │   ├── index.ts                   # Worker entry point
│       │   └── router.ts                  # Hono router
│       │
│       ├── wrangler.toml
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   └── shared/                            # Shared code between PWA & Worker
│       ├── src/
│       │   ├── types/
│       │   │   ├── child.ts
│       │   │   ├── transaction.ts
│       │   │   ├── chore.ts
│       │   │   ├── api.ts
│       │   │   └── index.ts
│       │   │
│       │   ├── constants/
│       │   │   ├── children.ts
│       │   │   ├── chores.ts
│       │   │   ├── currencies.ts
│       │   │   └── index.ts
│       │   │
│       │   ├── utils/
│       │   │   ├── formatters.ts
│       │   │   ├── validators.ts
│       │   │   └── index.ts
│       │   │
│       │   └── index.ts
│       │
│       ├── package.json
│       └── tsconfig.json
│
├── native/                                # Native app (optional future)
│   ├── capacitor/                         # iOS/Android via Capacitor
│   │   └── capacitor.config.ts
│   │
│   └── tauri/                             # Desktop via Tauri
│       └── tauri.conf.json
│
├── scripts/
│   ├── build-all.sh                       # Build all targets
│   ├── deploy-pwa.sh                      # Deploy PWA
│   └── deploy-worker.sh                   # Deploy Worker
│
├── .env.example
├── .gitignore
├── package.json                           # Root workspace
├── pnpm-workspace.yaml                    # pnpm monorepo config
├── turbo.json                             # Turborepo config (optional)
└── README.md
```

---

## 3. Configuration Files

### 3.1 Root Package.json (Workspace)

```json
{
  "name": "kids-home-hub-monorepo",
  "version": "2.0.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "pnpm --filter pwa dev",
    "dev:worker": "pnpm --filter worker dev",
    "dev:all": "pnpm --parallel dev",
    "build": "pnpm --filter shared build && pnpm --filter pwa build && pnpm --filter worker build",
    "build:pwa": "pnpm --filter pwa build",
    "build:worker": "pnpm --filter worker build",
    "preview:pwa": "pnpm --filter pwa preview",
    "deploy:pwa": "pnpm --filter pwa deploy",
    "deploy:worker": "pnpm --filter worker deploy",
    "deploy": "pnpm build && pnpm deploy:pwa && pnpm deploy:worker",
    "type-check": "pnpm --recursive type-check",
    "lint": "pnpm --recursive lint",
    "test": "pnpm --recursive test"
  },
  "devDependencies": {
    "@changesets/cli": "^2.27.1",
    "@types/node": "^20.10.5",
    "typescript": "^5.3.3"
  },
  "packageManager": "pnpm@8.12.0",
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  }
}
```

### 3.2 PWA Package.json

```json
{
  "name": "@kids-hub/pwa",
  "version": "2.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "deploy": "wrangler pages deploy dist --project-name kids-home-hub-pwa",
    "type-check": "tsc --noEmit",
    "lint": "eslint src --ext ts,tsx"
  },
  "dependencies": {
    "@kids-hub/shared": "workspace:*",
    "preact": "^10.19.3",
    "@preact/signals": "^1.2.2",
    "preact-render-to-string": "^6.3.1",
    "ky": "^1.1.3",
    "dexie": "^3.2.4",
    "clsx": "^2.0.0",
    "date-fns": "^3.0.6"
  },
  "devDependencies": {
    "@preact/preset-vite": "^2.7.0",
    "@types/node": "^20.10.5",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.3",
    "vite": "^5.0.10",
    "vite-plugin-pwa": "^0.17.4",
    "workbox-precaching": "^7.0.0",
    "workbox-routing": "^7.0.0",
    "workbox-strategies": "^7.0.0",
    "wrangler": "^3.22.1"
  }
}
```

### 3.3 Vite Config (apps/pwa/vite.config.ts)

```typescript
import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'og-image.png'],
      manifest: {
        name: 'Kids Home Hub',
        short_name: 'KidsHub',
        description: 'Pocket money, chores & screen time tracker for kids',
        theme_color: '#01579b',
        background_color: '#f5f7fa',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-72.png',
            sizes: '72x72',
            type: 'image/png'
          },
          {
            src: '/icons/icon-96.png',
            sizes: '96x96',
            type: 'image/png'
          },
          {
            src: '/icons/icon-128.png',
            sizes: '128x128',
            type: 'image/png'
          },
          {
            src: '/icons/icon-144.png',
            sizes: '144x144',
            type: 'image/png'
          },
          {
            src: '/icons/icon-152.png',
            sizes: '152x152',
            type: 'image/png'
          },
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-384.png',
            sizes: '384x384',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icons/maskable-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.kidshub\.com\/.*$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.(png|jpg|jpeg|svg|gif)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ]
      }
    })
  ],
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['preact', '@preact/signals'],
          'db': ['dexie'],
          'api': ['ky']
        }
      }
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(
      process.env.NODE_ENV === 'production'
        ? 'https://api.kidshub.com'
        : 'http://localhost:8787'
    )
  }
});
```

### 3.4 Tailwind Config (apps/pwa/tailwind.config.ts)

```typescript
import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e3f2fd',
          100: '#bbdefb',
          200: '#90caf9',
          300: '#64b5f6',
          400: '#42a5f5',
          500: '#01579b', // Main brand color
          600: '#014170',
          700: '#013a5f',
          800: '#01324d',
          900: '#012a3c'
        },
        surface: {
          50: '#f5f7fa',
          100: '#e5edf9',
          200: '#cbd5e1',
          300: '#94a3b8'
        }
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'sans-serif'
        ]
      },
      borderRadius: {
        '4xl': '2rem'
      },
      boxShadow: {
        card: '0 10px 30px rgba(15, 23, 42, 0.08)',
        'card-hover': '0 20px 40px rgba(15, 23, 42, 0.12)'
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms')
  ]
} satisfies Config;
```

### 3.5 Worker Package.json (apps/worker/package.json)

```json
{
  "name": "@kids-hub/worker",
  "version": "2.0.0",
  "type": "module",
  "scripts": {
    "dev": "wrangler dev",
    "build": "tsc && esbuild src/index.ts --bundle --outfile=dist/worker.js --format=esm --platform=browser --target=es2020",
    "deploy": "wrangler deploy",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@kids-hub/shared": "workspace:*",
    "hono": "^3.12.2"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20241127.0",
    "esbuild": "^0.19.11",
    "typescript": "^5.3.3",
    "wrangler": "^3.22.1"
  }
}
```

### 3.6 Updated Worker Config (apps/worker/wrangler.toml)

```toml
name = "kids-home-hub-api"
main = "dist/worker.js"
compatibility_date = "2024-11-27"
workers_dev = true

# KV Namespace
[[kv_namespaces]]
binding = "CHILD_SPEND"
id = "your-kv-namespace-id-here"
preview_id = "your-preview-kv-namespace-id-here"

# CORS headers for PWA
[env.production]
name = "kids-home-hub-api-production"
vars = { ALLOWED_ORIGINS = "https://kids-hub.pages.dev,https://www.kidshub.com" }

[[env.production.kv_namespaces]]
binding = "CHILD_SPEND"
id = "your-production-kv-namespace-id-here"

[env.development]
name = "kids-home-hub-api-dev"
vars = { ALLOWED_ORIGINS = "http://localhost:3000" }

[[env.development.kv_namespaces]]
binding = "CHILD_SPEND"
id = "your-dev-kv-namespace-id-here"
```

### 3.7 Shared Package (packages/shared/package.json)

```json
{
  "name": "@kids-hub/shared",
  "version": "2.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  }
}
```

### 3.8 pnpm Workspace (pnpm-workspace.yaml)

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

---

## 4. Key Implementation Examples

### 4.1 Preact Signals State Management

**apps/pwa/src/stores/childrenStore.ts**
```typescript
import { signal, computed } from '@preact/signals';
import type { Child } from '@kids-hub/shared';

export const selectedChildId = signal<'adam' | 'sami'>('adam');

export const children = signal<Child[]>([
  {
    id: 'adam',
    name: 'Adam',
    avatar: 'https://m.media-amazon.com/images/I/61GlRO63gBL.__AC_SX300_SY300_QL70_ML2_.jpg',
    moneyTotal: 0,
    pointsTotal: 0,
    screenTotal: 0
  },
  {
    id: 'sami',
    name: 'Sami',
    avatar: 'https://www.positivepromotions.com/images/1000/OSA-324.jpg',
    moneyTotal: 0,
    pointsTotal: 0,
    screenTotal: 0
  }
]);

export const currentChild = computed(() =>
  children.value.find(c => c.id === selectedChildId.value)
);

export function selectChild(childId: 'adam' | 'sami') {
  selectedChildId.value = childId;
  localStorage.setItem('selectedChild', childId);
}

export function updateChildData(childId: string, updates: Partial<Child>) {
  children.value = children.value.map(child =>
    child.id === childId ? { ...child, ...updates } : child
  );
}
```

### 4.2 API Client with Ky

**apps/pwa/src/api/client.ts**
```typescript
import ky from 'ky';
import { queueOfflineAction } from '../db/sync';

const api = ky.create({
  prefixUrl: import.meta.env.VITE_API_URL,
  timeout: 10000,
  retry: {
    limit: 3,
    methods: ['get', 'post'],
    statusCodes: [408, 413, 429, 500, 502, 503, 504]
  },
  hooks: {
    beforeRequest: [
      request => {
        // Add timestamp for request tracking
        request.headers.set('X-Request-Time', Date.now().toString());
      }
    ],
    afterResponse: [
      async (_request, _options, response) => {
        // Log successful responses
        if (response.ok) {
          console.log(`✓ API call succeeded: ${response.url}`);
        }
        return response;
      }
    ],
    beforeError: [
      async error => {
        // Queue for offline sync if network error
        if (error.name === 'TimeoutError' || !navigator.onLine) {
          const { request } = error;
          await queueOfflineAction({
            url: request.url,
            method: request.method,
            body: await request.text()
          });
          console.log('📴 Queued action for offline sync');
        }
        return error;
      }
    ]
  }
});

export default api;
```

**apps/pwa/src/api/endpoints.ts**
```typescript
import api from './client';
import type {
  TransactionRequest,
  ChoresRequest,
  RedeemRequest
} from '@kids-hub/shared';

export async function submitTransaction(data: TransactionRequest) {
  return api.post('transaction', {
    json: data
  }).json();
}

export async function submitChores(data: ChoresRequest) {
  return api.post('chores', {
    json: data
  }).json();
}

export async function redeemPoints(data: RedeemRequest) {
  return api.post('redeem', {
    json: data
  }).json();
}

export async function getChildData(childId: string) {
  return api.get(`child/${childId}`).json();
}
```

### 4.3 IndexedDB with Dexie

**apps/pwa/src/db/schema.ts**
```typescript
import Dexie, { Table } from 'dexie';
import type { Transaction, QueuedAction } from '@kids-hub/shared';

export class KidsHubDB extends Dexie {
  transactions!: Table<Transaction, number>;
  offlineQueue!: Table<QueuedAction, number>;

  constructor() {
    super('KidsHubDB');

    this.version(1).stores({
      transactions: '++id, child, feature, timestamp, synced',
      offlineQueue: '++id, timestamp, synced, retries'
    });
  }
}

export const db = new KidsHubDB();
```

**apps/pwa/src/db/sync.ts**
```typescript
import { db } from './schema';
import api from '../api/client';
import type { QueuedAction } from '@kids-hub/shared';

export async function queueOfflineAction(action: Omit<QueuedAction, 'id' | 'timestamp' | 'synced'>) {
  await db.offlineQueue.add({
    ...action,
    timestamp: new Date().toISOString(),
    synced: false,
    retries: 0
  });
}

export async function syncOfflineQueue() {
  const pending = await db.offlineQueue.where('synced').equals(0).toArray();

  for (const action of pending) {
    try {
      await api(action.url, {
        method: action.method as any,
        body: action.body
      });

      await db.offlineQueue.update(action.id!, { synced: true });
      console.log(`✓ Synced offline action: ${action.url}`);
    } catch (error) {
      const retries = (action.retries || 0) + 1;

      if (retries > 5) {
        console.error(`✗ Failed to sync after ${retries} retries:`, error);
        await db.offlineQueue.delete(action.id!);
      } else {
        await db.offlineQueue.update(action.id!, { retries });
      }
    }
  }
}

// Sync every 30 seconds when online
if (typeof window !== 'undefined') {
  setInterval(() => {
    if (navigator.onLine) {
      syncOfflineQueue();
    }
  }, 30000);

  window.addEventListener('online', syncOfflineQueue);
}
```

### 4.4 Component Example (MoneyCard)

**apps/pwa/src/components/features/money/MoneyCard.tsx**
```typescript
import { useState } from 'preact/hooks';
import { currentChild } from '../../../stores/childrenStore';
import { Card } from '../../common/Card';
import { Avatar } from '../../common/Avatar';
import { Button } from '../../common/Button';
import { MoneyAdjustForm } from './MoneyAdjustForm';
import { MoneyTransactionList } from './MoneyTransactionList';
import { formatCurrency } from '@kids-hub/shared';

export function MoneyCard() {
  const [showForm, setShowForm] = useState(false);
  const child = currentChild.value;

  if (!child) return null;

  const gbpDisplay = formatCurrency(child.moneyTotal, 'GBP');
  const audDisplay = formatCurrency(child.moneyTotal / 0.56, 'AUD');

  return (
    <Card>
      <div class="flex items-center gap-3 mb-4">
        <Avatar src={child.avatar} alt={child.name} />
        <div>
          <h3 class="text-base font-semibold text-gray-900">
            {child.name}'s bank
          </h3>
          <p class="text-sm text-gray-500">Pocket money & gifts</p>
        </div>
      </div>

      <div class="mb-4">
        <div class="text-2xl font-bold text-primary-500">{gbpDisplay}</div>
        <div class="text-sm text-gray-500 mt-1">≈ {audDisplay}</div>
      </div>

      <Button
        onClick={() => setShowForm(!showForm)}
        variant="primary"
        fullWidth={false}
      >
        Adjust balance
      </Button>

      {showForm && (
        <MoneyAdjustForm
          childId={child.id}
          onClose={() => setShowForm(false)}
        />
      )}

      <MoneyTransactionList childId={child.id} />
    </Card>
  );
}
```

### 4.5 Hono Router for Worker

**apps/worker/src/index.ts**
```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { handleTransaction } from './handlers/transaction';
import { handleChores } from './handlers/chores';
import { handleRedeem } from './handlers/redeem';

type Bindings = {
  CHILD_SPEND: KVNamespace;
  ALLOWED_ORIGINS: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// CORS middleware
app.use('/*', async (c, next) => {
  const corsMiddleware = cors({
    origin: c.env.ALLOWED_ORIGINS.split(','),
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'X-Request-Time'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true
  });
  return corsMiddleware(c, next);
});

// Routes
app.post('/transaction', handleTransaction);
app.post('/chores', handleChores);
app.post('/redeem', handleRedeem);

app.get('/child/:childId', async (c) => {
  const childId = c.req.param('childId');

  const [moneyTotal, pointsTotal, screenTotal] = await Promise.all([
    c.env.CHILD_SPEND.get(`total_${childId}`),
    c.env.CHILD_SPEND.get(`points:total:${childId}`),
    c.env.CHILD_SPEND.get(`screen:total:${childId}`)
  ]);

  return c.json({
    id: childId,
    moneyTotal: parseFloat(moneyTotal || '0'),
    pointsTotal: parseInt(pointsTotal || '0', 10),
    screenTotal: parseInt(screenTotal || '0', 10)
  });
});

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: Date.now() }));

export default app;
```

---

## 5. Migration Plan

### Phase 1: Setup (Week 1)

1. **Create monorepo structure**
   ```bash
   mkdir -p apps/{pwa,worker} packages/shared
   pnpm init
   # Setup pnpm workspace
   ```

2. **Initialize PWA with Vite + Preact**
   ```bash
   cd apps/pwa
   pnpm create vite . --template preact-ts
   pnpm add @preact/signals ky dexie tailwindcss
   pnpm add -D vite-plugin-pwa @tailwindcss/forms
   ```

3. **Setup shared package**
   - Extract types from worker.js
   - Create constants (CHILDREN, CHORES, conversion rates)
   - Add validators and formatters

### Phase 2: Extract UI Components (Week 2)

1. **Create base components**
   - Button, Card, Avatar, SegmentedControl
   - Layout components (Header, BottomNav)

2. **Convert each feature card to component**
   - MoneyCard + forms
   - PointsCard + forms
   - ChoresCard + list
   - ScreenCard + progress

3. **Setup Tailwind classes**
   - Replace inline styles with utilities
   - Create custom theme colors
   - Add responsive breakpoints

### Phase 3: Implement State & API (Week 3)

1. **Preact Signals stores**
   - childrenStore
   - navigationStore
   - offlineStore

2. **API client layer**
   - Setup Ky with retry logic
   - Create endpoint functions
   - Add error handling

3. **IndexedDB with Dexie**
   - Define schema
   - Implement offline queue
   - Add sync logic

### Phase 4: Refactor Worker (Week 4)

1. **Convert to TypeScript**
   - Add types from shared package
   - Use Hono for routing

2. **Extract handlers**
   - Separate transaction/chores/redeem logic
   - Add input validation
   - Improve error responses

3. **Add CORS**
   - Configure allowed origins
   - Handle preflight requests

### Phase 5: PWA Features (Week 5)

1. **Configure vite-plugin-pwa**
   - Generate manifest
   - Setup Workbox strategies
   - Add offline page

2. **Add install prompt**
   - Detect if installable
   - Show custom install UI
   - Track install events

3. **Implement offline sync**
   - Queue failed requests
   - Sync when online
   - Show sync status

### Phase 6: Testing & Deployment (Week 6)

1. **Test offline functionality**
   - Disable network in DevTools
   - Verify queue works
   - Test sync after reconnect

2. **Deploy PWA to Cloudflare Pages**
   ```bash
   pnpm build:pwa
   wrangler pages deploy apps/pwa/dist
   ```

3. **Deploy Worker API**
   ```bash
   pnpm build:worker
   cd apps/worker && wrangler deploy
   ```

4. **Setup CI/CD**
   - GitHub Actions for auto-deploy
   - Preview deployments for PRs

---

## 6. Build Outputs

### 6.1 PWA Deployment (Cloudflare Pages)

**Build Command:** `pnpm build:pwa`

**Output Directory:** `apps/pwa/dist/`

**Structure:**
```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js         # Main bundle (tree-shaken)
│   ├── vendor-[hash].js        # Preact + Signals
│   ├── db-[hash].js            # Dexie
│   ├── api-[hash].js           # Ky
│   ├── index-[hash].css        # Tailwind (purged)
│   └── *.woff2                 # Fonts
├── icons/
│   └── *.png                   # PWA icons
├── manifest.webmanifest
├── sw.js                       # Service worker (generated by Workbox)
├── workbox-*.js                # Workbox runtime
└── robots.txt
```

**Deployment:**
```bash
wrangler pages deploy apps/pwa/dist --project-name kids-home-hub-pwa
```

**Custom Domain:** `www.kidshub.com`

### 6.2 Cloudflare Worker Integration

**Build Command:** `pnpm build:worker`

**Output:** `apps/worker/dist/worker.js`

**Deployment:**
```bash
cd apps/worker && wrangler deploy
```

**Custom Route:** `api.kidshub.com/*`

### 6.3 Native App Packaging (Future)

#### Option A: Capacitor (iOS/Android)

**Setup:**
```bash
cd apps/pwa
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios @capacitor/android

npx cap init
npx cap add ios
npx cap add android
```

**Build:**
```bash
pnpm build:pwa
npx cap sync
npx cap open ios    # Opens Xcode
npx cap open android # Opens Android Studio
```

#### Option B: Tauri (Desktop)

**Setup:**
```bash
cd apps/pwa
pnpm add -D @tauri-apps/cli
pnpm add @tauri-apps/api
```

**Build:**
```bash
pnpm tauri build  # Outputs .dmg (macOS), .exe (Windows), .deb (Linux)
```

---

## 7. Development Workflow

### 7.1 Local Development

```bash
# Terminal 1: Run PWA dev server
cd apps/pwa
pnpm dev
# Opens http://localhost:3000

# Terminal 2: Run Worker locally
cd apps/worker
pnpm dev
# Opens http://localhost:8787

# Terminal 3: Watch shared package
cd packages/shared
pnpm build --watch
```

### 7.2 Hot Module Replacement

Vite provides instant HMR:
- Edit a component → instant update
- Edit Tailwind classes → instant update
- Edit Signals → state preserved
- No full page reload needed

### 7.3 TypeScript Type Checking

```bash
# Check all packages
pnpm type-check

# Watch mode
pnpm --filter pwa type-check --watch
```

---

## 8. Performance Optimizations

### 8.1 Bundle Size Targets

- **Initial Load (gzipped):**
  - HTML: ~3 KB
  - JS (main): ~15 KB
  - JS (vendor): ~8 KB (Preact + Signals)
  - CSS: ~5 KB (Tailwind purged)
  - **Total: ~31 KB** ✓ (Target: <50 KB)

- **Code Splitting:**
  - Lazy load views (BankView, PointsView, etc.)
  - Split Dexie.js (only load when needed)
  - Split heavy formatters (date-fns)

### 8.2 Caching Strategy

**Workbox Strategies:**
- **App Shell:** Precache (HTML, CSS, JS)
- **API Calls:** NetworkFirst (24hr cache)
- **Images:** CacheFirst (30 day cache)
- **Fonts:** CacheFirst (1 year cache)

### 8.3 Lighthouse Targets

- **Performance:** 95+ (Mobile)
- **Accessibility:** 100
- **Best Practices:** 95+
- **SEO:** 100
- **PWA:** 100

---

## 9. Security Considerations

### 9.1 Content Security Policy

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'wasm-unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' https: data:;
  connect-src 'self' https://api.kidshub.com;
  font-src 'self' data:;
  manifest-src 'self';
">
```

### 9.2 CORS Configuration

Worker only accepts requests from:
- `https://www.kidshub.com`
- `https://kids-hub.pages.dev`
- `http://localhost:3000` (dev only)

### 9.3 Input Validation

All user inputs validated on both:
1. Client-side (instant feedback)
2. Worker-side (security boundary)

---

## 10. Future Enhancements

### 10.1 Native App Features

**Capacitor Plugins:**
- Push Notifications (chore reminders)
- Local Notifications (screen time alerts)
- Biometric Auth (unlock app)
- Camera (upload receipts)

### 10.2 Advanced PWA Features

- **Background Sync:** Sync when app closed
- **Periodic Background Sync:** Daily data refresh
- **Web Share API:** Share achievements
- **Badging API:** Show pending chores count

### 10.3 Analytics & Monitoring

- **Cloudflare Web Analytics** (privacy-friendly)
- **Sentry** (error tracking)
- **LogRocket** (session replay for bugs)

---

## 11. Summary

This architecture provides:

1. **Modern DX**: Vite HMR, TypeScript, Tailwind
2. **Performance**: <50KB initial load, instant navigation
3. **Offline-First**: IndexedDB + Service Worker
4. **Type Safety**: Shared types between frontend/backend
5. **Scalability**: Monorepo ready for mobile apps
6. **Maintainability**: Component-based, clear separation
7. **PWA-Ready**: Installable, offline, native-like

**Next Steps:**
1. Review this architecture
2. Approve tech stack choices
3. Begin Phase 1 (setup monorepo)
4. Extract first component (MoneyCard)
5. Test offline functionality
6. Deploy to staging environment

Let me know if you'd like me to start implementing any phase or create specific example components!
