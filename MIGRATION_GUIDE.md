# Migration Guide: Worker to Modern PWA

This guide provides step-by-step instructions for migrating Kids Home Hub from a monolithic Cloudflare Worker to a modern PWA architecture.

---

## Prerequisites

```bash
# Install pnpm (faster, more efficient than npm)
npm install -g pnpm@8.12.0

# Verify Node.js version (18+)
node --version  # Should be 18.0.0 or higher
```

---

## Step 1: Create Monorepo Structure

### 1.1 Initialize Root Workspace

```bash
# From project root
mkdir -p apps/{pwa,worker} packages/shared scripts

# Create pnpm workspace config
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'apps/*'
  - 'packages/*'
EOF

# Create root package.json
cat > package.json << 'EOF'
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
    "dev:all": "pnpm --parallel --filter pwa --filter worker dev",
    "build": "pnpm --filter shared build && pnpm --filter pwa build && pnpm --filter worker build",
    "build:pwa": "pnpm --filter pwa build",
    "build:worker": "pnpm --filter worker build",
    "deploy:pwa": "pnpm --filter pwa deploy",
    "deploy:worker": "pnpm --filter worker deploy",
    "deploy": "pnpm build && pnpm deploy:pwa && pnpm deploy:worker",
    "type-check": "pnpm --recursive type-check",
    "lint": "pnpm --recursive lint"
  },
  "devDependencies": {
    "@types/node": "^20.10.5",
    "typescript": "^5.3.3"
  },
  "packageManager": "pnpm@8.12.0",
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  }
}
EOF

# Install root dependencies
pnpm install
```

---

## Step 2: Setup Shared Package

### 2.1 Initialize Shared Package

```bash
cd packages/shared

# Create package.json
cat > package.json << 'EOF'
{
  "name": "@kids-hub/shared",
  "version": "2.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  }
}
EOF

# Create TypeScript config
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],
    "moduleResolution": "bundler",
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# Create source structure
mkdir -p src/{types,constants,utils}
```

### 2.2 Extract Types from Worker

```bash
# Create src/types/child.ts
cat > src/types/child.ts << 'EOF'
export interface Child {
  id: 'adam' | 'sami';
  name: string;
  avatar: string;
  moneyTotal: number;
  pointsTotal: number;
  screenTotal: number;
}
EOF

# Create src/types/transaction.ts
cat > src/types/transaction.ts << 'EOF'
export type TransactionFeature = 'money' | 'points' | 'screen';
export type TransactionAction = 'add' | 'deduct';
export type Currency = 'GBP' | 'AUD';

export interface TransactionRequest {
  feature: TransactionFeature;
  child: 'adam' | 'sami';
  action: TransactionAction;
  amount: number;
  currency?: Currency;
  reason?: string;
}

export interface MoneyTransaction {
  timestamp: string;
  action: TransactionAction;
  rawAmount: string;
  currency: Currency;
  converted: string;
  reason: string;
}

export interface PointsTransaction {
  timestamp: string;
  action: TransactionAction;
  amount: number;
  reason: string;
  source: 'manual' | 'chores' | 'redeem_to_screen';
}

export interface ScreenTransaction {
  timestamp: string;
  action: TransactionAction;
  minutes: number;
  reason: string;
}
EOF

# Create src/types/chore.ts
cat > src/types/chore.ts << 'EOF'
export interface Chore {
  id: string;
  label: string;
  points: number;
}

export interface ChoresRequest {
  child: 'adam' | 'sami';
  chore: string[];
}

export interface ChoreSession {
  timestamp: string;
  items: Chore[];
}
EOF

# Create src/types/api.ts
cat > src/types/api.ts << 'EOF'
export interface RedeemRequest {
  child: 'adam' | 'sami';
  points: number;
  reason: string;
}

export interface QueuedAction {
  id?: number;
  url: string;
  method: string;
  body: string;
  timestamp: string;
  synced: boolean;
  retries?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
EOF

# Create src/types/index.ts
cat > src/types/index.ts << 'EOF'
export * from './child';
export * from './transaction';
export * from './chore';
export * from './api';
EOF
```

### 2.3 Extract Constants

```bash
# Create src/constants/children.ts
cat > src/constants/children.ts << 'EOF'
export const CHILDREN = ['adam', 'sami'] as const;

export const CHILD_AVATARS = {
  adam: 'https://m.media-amazon.com/images/I/61GlRO63gBL.__AC_SX300_SY300_QL70_ML2_.jpg',
  sami: 'https://www.positivepromotions.com/images/1000/OSA-324.jpg'
} as const;
EOF

# Create src/constants/chores.ts
cat > src/constants/chores.ts << 'EOF'
import type { Chore } from '../types';

export const CHORES: Chore[] = [
  { id: 'tidy_room', label: 'Tidy bedroom', points: 10 },
  { id: 'homework', label: 'Finish homework', points: 8 },
  { id: 'set_table', label: 'Set / clear the table', points: 5 },
  { id: 'feed_pet', label: 'Feed pet / help pet', points: 6 },
  { id: 'help_laundry', label: 'Help with laundry', points: 7 }
];
EOF

# Create src/constants/currencies.ts
cat > src/constants/currencies.ts << 'EOF'
export const CONVERSION_RATES = {
  GBP: 1,
  AUD: 0.56
} as const;

export const POINT_TO_MINUTES = 1;
EOF

# Create src/constants/index.ts
cat > src/constants/index.ts << 'EOF'
export * from './children';
export * from './chores';
export * from './currencies';
EOF
```

### 2.4 Add Utility Functions

```bash
# Create src/utils/formatters.ts
cat > src/utils/formatters.ts << 'EOF'
export function formatCurrency(amount: number, currency: 'GBP' | 'AUD'): string {
  const symbol = currency === 'GBP' ? '£' : 'A$';
  return `${symbol}${amount.toFixed(2)}`;
}

export function formatDate(timestamp: string): string {
  try {
    return new Date(timestamp).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch {
    return timestamp;
  }
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}
EOF

# Create src/utils/validators.ts
cat > src/utils/validators.ts << 'EOF'
import { CHILDREN } from '../constants';
import type { TransactionAction, Currency } from '../types';

export function isValidChild(child: string): child is 'adam' | 'sami' {
  return CHILDREN.includes(child as any);
}

export function isValidAction(action: string): action is TransactionAction {
  return action === 'add' || action === 'deduct';
}

export function isValidCurrency(currency: string): currency is Currency {
  return currency === 'GBP' || currency === 'AUD';
}

export function isValidAmount(amount: number): boolean {
  return Number.isFinite(amount) && amount > 0;
}
EOF

# Create src/utils/index.ts
cat > src/utils/index.ts << 'EOF'
export * from './formatters';
export * from './validators';
EOF

# Create src/index.ts
cat > src/index.ts << 'EOF'
export * from './types';
export * from './constants';
export * from './utils';
EOF

# Build shared package
cd ../.. # Back to root
pnpm --filter shared build
```

---

## Step 3: Setup PWA with Vite + Preact

### 3.1 Initialize PWA

```bash
cd apps/pwa

# Create package.json
cat > package.json << 'EOF'
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
    "ky": "^1.1.3",
    "dexie": "^3.2.4",
    "clsx": "^2.0.0"
  },
  "devDependencies": {
    "@preact/preset-vite": "^2.7.0",
    "@types/node": "^20.10.5",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.0",
    "@tailwindcss/forms": "^0.5.7",
    "typescript": "^5.3.3",
    "vite": "^5.0.10",
    "vite-plugin-pwa": "^0.17.4",
    "workbox-precaching": "^7.0.0",
    "workbox-routing": "^7.0.0",
    "workbox-strategies": "^7.0.0",
    "wrangler": "^3.22.1"
  }
}
EOF

# Install dependencies
pnpm install

# Create directory structure
mkdir -p src/{components/{common,features/{money,points,chores,screen,child},layout},views,api,stores,db,utils,hooks,types,assets/styles}
mkdir -p public/icons
```

### 3.2 Create Vite Config

```bash
cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'Kids Home Hub',
        short_name: 'KidsHub',
        description: 'Pocket money, chores & screen time tracker',
        theme_color: '#01579b',
        background_color: '#f5f7fa',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.kidshub\.com\/.*$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 86400
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
    sourcemap: true
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
  }
});
EOF
```

### 3.3 Setup Tailwind CSS

```bash
# Create Tailwind config
cat > tailwind.config.ts << 'EOF'
import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          500: '#01579b',
          600: '#014170',
        }
      }
    }
  },
  plugins: [require('@tailwindcss/forms')]
} satisfies Config;
EOF

# Create PostCSS config
cat > postcss.config.js << 'EOF'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
EOF

# Create global CSS
cat > src/assets/styles/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    @apply box-border;
  }

  body {
    @apply m-0 bg-gray-50 font-sans text-gray-900;
  }
}
EOF
```

### 3.4 Create TypeScript Config

```bash
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "jsxImportSource": "preact",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOF

cat > tsconfig.node.json << 'EOF'
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
EOF

cat > src/vite-env.d.ts << 'EOF'
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
EOF
```

### 3.5 Create Entry Files

```bash
# Create index.html
cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#01579b" />
    <meta name="description" content="Track pocket money, chores & screen time for kids" />
    <title>Kids Home Hub</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF

# Create main.tsx
cat > src/main.tsx << 'EOF'
import { render } from 'preact';
import { App } from './app';
import './assets/styles/globals.css';

render(<App />, document.getElementById('app')!);
EOF

# Create app.tsx
cat > src/app.tsx << 'EOF'
export function App() {
  return (
    <div class="min-h-screen bg-gray-50">
      <h1 class="text-2xl font-bold text-primary-500 p-4">
        Kids Home Hub
      </h1>
      <p class="px-4 text-gray-600">PWA is ready! Start building components.</p>
    </div>
  );
}
EOF
```

### 3.6 Test PWA Setup

```bash
# Run dev server
pnpm dev

# Should open http://localhost:3000
# You should see "Kids Home Hub" with Tailwind styling
```

---

## Step 4: Refactor Worker to TypeScript + Hono

### 4.1 Setup Worker Package

```bash
cd ../worker

# Create package.json
cat > package.json << 'EOF'
{
  "name": "@kids-hub/worker",
  "version": "2.0.0",
  "type": "module",
  "scripts": {
    "dev": "wrangler dev",
    "build": "esbuild src/index.ts --bundle --outfile=dist/worker.js --format=esm --platform=browser --target=es2020 --external:cloudflare:*",
    "deploy": "pnpm build && wrangler deploy",
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
EOF

pnpm install

# Create TypeScript config
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],
    "moduleResolution": "bundler",
    "types": ["@cloudflare/workers-types"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
EOF

# Create source structure
mkdir -p src/{handlers,utils,types}
```

### 4.2 Move worker.js to src/index.ts

```bash
# This will be done manually - convert the worker.js to TypeScript
# using Hono for routing and handlers in separate files

# For now, create a basic structure
cat > src/index.ts << 'EOF'
import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Bindings = {
  CHILD_SPEND: KVNamespace;
  ALLOWED_ORIGINS?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('/*', async (c, next) => {
  const corsMiddleware = cors({
    origin: c.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    credentials: true
  });
  return corsMiddleware(c, next);
});

app.get('/health', (c) => c.json({ status: 'ok' }));

// TODO: Add handlers for /transaction, /chores, /redeem

export default app;
EOF

# Update wrangler.toml
cat > wrangler.toml << 'EOF'
name = "kids-home-hub-api"
main = "dist/worker.js"
compatibility_date = "2024-11-27"

[[kv_namespaces]]
binding = "CHILD_SPEND"
id = "your-kv-namespace-id"
preview_id = "your-preview-kv-id"

[env.production]
name = "kids-home-hub-api-production"
vars = { ALLOWED_ORIGINS = "https://kids-hub.pages.dev" }

[env.development]
name = "kids-home-hub-api-dev"
vars = { ALLOWED_ORIGINS = "http://localhost:3000" }
EOF
```

---

## Step 5: Component Migration Strategy

### 5.1 Extract First Component (MoneyCard)

This demonstrates the pattern for all other components:

```bash
cd ../pwa

# 1. Create stores/childrenStore.ts
cat > src/stores/childrenStore.ts << 'EOF'
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
EOF

# 2. Create common/Card.tsx
cat > src/components/common/Card.tsx << 'EOF'
import type { ComponentChildren } from 'preact';

interface CardProps {
  children: ComponentChildren;
}

export function Card({ children }: CardProps) {
  return (
    <section class="bg-white rounded-2xl p-4 shadow-lg">
      {children}
    </section>
  );
}
EOF

# 3. Create features/money/MoneyCard.tsx
cat > src/components/features/money/MoneyCard.tsx << 'EOF'
import { currentChild } from '../../../stores/childrenStore';
import { Card } from '../../common/Card';
import { formatCurrency } from '@kids-hub/shared';

export function MoneyCard() {
  const child = currentChild.value;

  if (!child) return null;

  return (
    <Card>
      <h3 class="text-lg font-semibold mb-2">
        {child.name}'s Bank
      </h3>
      <div class="text-2xl font-bold text-primary-500">
        {formatCurrency(child.moneyTotal, 'GBP')}
      </div>
    </Card>
  );
}
EOF

# 4. Update app.tsx to use MoneyCard
cat > src/app.tsx << 'EOF'
import { MoneyCard } from './components/features/money/MoneyCard';

export function App() {
  return (
    <div class="min-h-screen bg-gray-50 p-4">
      <h1 class="text-2xl font-bold text-primary-500 mb-4">
        Kids Home Hub
      </h1>
      <MoneyCard />
    </div>
  );
}
EOF
```

### 5.2 Repeat for Other Components

Follow the same pattern for:
- PointsCard
- ChoresCard
- ScreenCard
- ChildSwitch
- BottomNav

---

## Step 6: Testing Migration

### 6.1 Local Testing

```bash
# Terminal 1: Run PWA
cd apps/pwa
pnpm dev

# Terminal 2: Run Worker
cd apps/worker
pnpm dev

# Visit http://localhost:3000
# All API calls should proxy to http://localhost:8787
```

### 6.2 Build Test

```bash
# From root
pnpm build

# Check outputs:
# - apps/pwa/dist/ (PWA static files)
# - apps/worker/dist/worker.js (Worker bundle)
```

---

## Step 7: Deploy to Production

### 7.1 Deploy PWA to Cloudflare Pages

```bash
cd apps/pwa

# First deploy
wrangler pages deploy dist --project-name kids-home-hub-pwa

# Get custom domain (in Cloudflare Dashboard)
# Add: www.kidshub.com → kids-home-hub-pwa.pages.dev
```

### 7.2 Deploy Worker

```bash
cd apps/worker

# Deploy to production
wrangler deploy --env production

# Add custom route (in Cloudflare Dashboard)
# api.kidshub.com/* → kids-home-hub-api-production
```

---

## Rollback Plan

If migration causes issues:

### Quick Rollback

```bash
# Keep old worker.js as worker.backup.js
cp worker.js worker.backup.js

# If needed, redeploy old version:
wrangler deploy worker.backup.js
```

### Gradual Migration

1. Deploy new Worker alongside old one
2. Use feature flags to gradually switch users
3. Monitor errors before full cutover
4. Keep old Worker running for 1 week

---

## Troubleshooting

### Issue: TypeScript errors in Preact

```bash
# Add to tsconfig.json
"jsxImportSource": "preact"
```

### Issue: Vite proxy not working

```bash
# Check worker is running on port 8787
# Update vite.config.ts proxy target if needed
```

### Issue: Shared package not resolving

```bash
# Rebuild shared package
cd packages/shared
pnpm build

# Reinstall dependencies in consuming packages
cd ../../apps/pwa
pnpm install
```

### Issue: PWA not installing

```bash
# Check manifest.webmanifest is served
# Verify Service Worker registered in DevTools
# Must be served over HTTPS (or localhost)
```

---

## Next Steps

After successful migration:

1. Add remaining components
2. Implement offline sync
3. Add unit tests
4. Setup CI/CD pipeline
5. Create native app wrapper (Capacitor)
6. Implement push notifications
7. Add analytics

---

## Resources

- [Preact Documentation](https://preactjs.com/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Hono](https://hono.dev/)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [PWA Builder](https://www.pwabuilder.com/)
