# Kids Home Hub - Complete Setup Guide

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Build shared package
cd packages/shared && pnpm build && cd ../..

# 3. Start PWA development server
cd apps/pwa && pnpm dev

# Open http://localhost:3000
```

## Detailed Installation

### Prerequisites

- **Node.js**: 18.0.0 or higher
- **pnpm**: 8.0.0 or higher
- **Git**: Latest version

### Step 1: Install pnpm

If you don't have pnpm installed:

```bash
# Install pnpm globally
npm install -g pnpm@8

# Verify installation
pnpm --version
```

### Step 2: Install Dependencies

```bash
# From project root
cd kids-home-hub

# Install all workspace dependencies
pnpm install
```

This will install dependencies for:
- Root workspace
- `packages/shared`
- `apps/pwa`
- `apps/worker` (if configured)

### Step 3: Build Shared Package

The shared package must be built before running the PWA:

```bash
cd packages/shared
pnpm build
```

This compiles TypeScript files to JavaScript in `packages/shared/dist/`.

**Alternative**: Watch mode for development

```bash
cd packages/shared
pnpm build:watch
```

### Step 4: Start Development Server

```bash
cd apps/pwa
pnpm dev
```

The app will open at **http://localhost:3000**

### Step 5: Verify Setup

1. Open http://localhost:3000 in your browser
2. You should see the Kids Home Hub interface
3. Try switching between Adam and Sami
4. Navigate between Bank, Points, Chores, Screen views
5. Check browser console for errors (there should be none)

## Development Workflow

### Running Multiple Services

#### Terminal 1: PWA Development Server

```bash
cd apps/pwa
pnpm dev
```

#### Terminal 2: Worker (Backend) [Optional]

```bash
cd apps/worker
pnpm dev
```

#### Terminal 3: Shared Package (Watch Mode) [Optional]

```bash
cd packages/shared
pnpm build:watch
```

#### Alternative: Run All Services

```bash
# From project root
pnpm dev:all
```

## Build for Production

### Build All Packages

```bash
# From project root
pnpm build
```

This runs:
1. `packages/shared` → TypeScript compilation
2. `apps/pwa` → Vite production build
3. `apps/worker` → Worker build (if configured)

### Build PWA Only

```bash
cd apps/pwa
pnpm build
```

Output: `apps/pwa/dist/`

### Preview Production Build

```bash
cd apps/pwa
pnpm preview
```

Opens at http://localhost:4173

## Testing

### Run All Tests

```bash
# From project root
pnpm test
```

### PWA Tests Only

```bash
cd apps/pwa

# Run tests in watch mode
pnpm test

# Run tests with UI
pnpm test:ui

# Run with coverage
pnpm test:coverage

# Run E2E tests
pnpm test:e2e
```

## Type Checking

### Check All Packages

```bash
pnpm type-check
```

### Check Specific Package

```bash
cd apps/pwa
pnpm type-check
```

## Linting & Formatting

### Lint All Code

```bash
pnpm lint
```

### Format All Code

```bash
pnpm format
```

### Fix ESLint Issues

```bash
cd apps/pwa
pnpm lint --fix
```

## Deployment

### Deploy to Cloudflare Pages (PWA)

1. Build the PWA:

```bash
cd apps/pwa
pnpm build
```

2. Deploy to Cloudflare Pages:

```bash
pnpm deploy
```

Or manually:

```bash
wrangler pages deploy dist --project-name kids-home-hub-pwa
```

### Deploy Worker (Backend)

```bash
cd apps/worker
pnpm deploy
```

## Environment Variables

### Development

Create `.env.local` in `apps/pwa/`:

```env
VITE_API_URL=http://localhost:8787
```

### Production

Create `.env.production` in `apps/pwa/`:

```env
VITE_API_URL=https://kids-home-hub-api.workers.dev
```

## Troubleshooting

### Issue: "Cannot find module '@kids-hub/shared'"

**Solution**: Build the shared package first

```bash
cd packages/shared
pnpm build
```

### Issue: "pnpm: command not found"

**Solution**: Install pnpm globally

```bash
npm install -g pnpm@8
```

### Issue: TypeScript errors in VSCode

**Solution**: Restart TypeScript server

1. Open Command Palette (Cmd+Shift+P / Ctrl+Shift+P)
2. Type "TypeScript: Restart TS Server"
3. Press Enter

### Issue: Port 3000 already in use

**Solution**: Change the port in `vite.config.ts`:

```typescript
server: {
  port: 3001, // Change to any available port
  // ...
}
```

### Issue: Hot reload not working

**Solution**: Clear Vite cache

```bash
rm -rf node_modules/.vite
pnpm dev
```

### Issue: Build fails with "out of memory"

**Solution**: Increase Node memory limit

```bash
export NODE_OPTIONS="--max_old_space_size=4096"
pnpm build
```

## Project Structure Reference

```
kids-home-hub/
├── packages/
│   └── shared/              # Shared types, utils, constants
│       ├── src/
│       │   ├── types/       # TypeScript types
│       │   ├── constants/   # App constants
│       │   └── utils/       # Utility functions
│       ├── dist/            # Compiled output (generated)
│       ├── package.json
│       └── tsconfig.json
│
├── apps/
│   └── pwa/                 # Progressive Web App
│       ├── public/          # Static assets
│       │   └── icons/       # PWA icons
│       ├── src/
│       │   ├── components/  # React components
│       │   │   ├── common/  # Base components
│       │   │   ├── features/# Feature components
│       │   │   └── layout/  # Layout components
│       │   ├── views/       # Page views
│       │   ├── stores/      # Preact Signals stores
│       │   ├── api/         # API client
│       │   ├── db/          # Dexie database
│       │   ├── hooks/       # Custom hooks
│       │   ├── utils/       # Utilities
│       │   ├── assets/      # Styles, images
│       │   ├── main.tsx     # Entry point
│       │   └── app.tsx      # Root component
│       ├── dist/            # Build output (generated)
│       ├── package.json
│       ├── vite.config.ts
│       ├── tailwind.config.ts
│       └── tsconfig.json
│
├── package.json             # Root workspace config
├── pnpm-workspace.yaml      # pnpm workspace config
└── README.md
```

## Available Scripts Reference

### Root Workspace

```bash
pnpm dev              # Start PWA dev server
pnpm dev:worker       # Start worker dev server
pnpm dev:all          # Start all services in parallel
pnpm build            # Build all packages
pnpm build:pwa        # Build PWA only
pnpm build:worker     # Build worker only
pnpm test             # Run all tests
pnpm type-check       # Type check all packages
pnpm lint             # Lint all packages
pnpm format           # Format all code
pnpm deploy           # Deploy all
pnpm deploy:pwa       # Deploy PWA
pnpm deploy:worker    # Deploy worker
```

### Shared Package

```bash
cd packages/shared
pnpm build            # Build TypeScript
pnpm build:watch      # Watch mode
pnpm type-check       # Type check
```

### PWA Package

```bash
cd apps/pwa
pnpm dev              # Dev server (http://localhost:3000)
pnpm build            # Production build
pnpm preview          # Preview production build
pnpm deploy           # Deploy to Cloudflare Pages
pnpm type-check       # Type check
pnpm lint             # Lint code
pnpm test             # Run tests
pnpm test:ui          # Run tests with UI
pnpm test:coverage    # Run tests with coverage
pnpm test:e2e         # Run E2E tests
```

## Performance Optimization

### Bundle Analysis

```bash
cd apps/pwa
pnpm build

# Analyze bundle size
npx vite-bundle-visualizer
```

### Lighthouse Audit

```bash
cd apps/pwa
pnpm build
pnpm preview

# In Chrome DevTools:
# 1. Open DevTools (F12)
# 2. Go to Lighthouse tab
# 3. Click "Generate report"
# Target: 100 across all metrics
```

## Development Tips

### 1. Hot Module Replacement (HMR)

Vite provides instant HMR. Changes to any file will update immediately without full page reload.

### 2. TypeScript Path Aliases

Use path aliases for cleaner imports:

```typescript
// Before
import { Button } from '../../components/common/Button';

// After
import { Button } from '@/components/common/Button';
```

Configured in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"],
      "@stores/*": ["./src/stores/*"]
    }
  }
}
```

### 3. Preact DevTools

Install Preact DevTools browser extension for debugging:

- [Chrome](https://chrome.google.com/webstore/detail/preact-developer-tools/ilcajpmogmhpliinlbcdebhbcanbghmd)
- [Firefox](https://addons.mozilla.org/en-US/firefox/addon/preact-devtools/)

### 4. IndexedDB Inspection

View IndexedDB data in browser DevTools:

1. Open DevTools (F12)
2. Go to Application tab (Chrome) or Storage tab (Firefox)
3. Expand IndexedDB → KidsHubDB

### 5. Service Worker Testing

Test offline functionality:

1. Build for production: `pnpm build`
2. Preview: `pnpm preview`
3. Open DevTools → Network tab
4. Check "Offline" checkbox
5. Reload page (should still work)

## Next Steps

### Phase 1: Complete Feature Components

Implement full functionality for:

1. Money transactions (add/deduct)
2. Points management (manual adjust, redeem)
3. Chores submission
4. Screen time tracking

### Phase 2: API Integration

Connect PWA to Cloudflare Worker backend:

1. Configure API endpoints
2. Implement form submissions
3. Add data fetching
4. Handle errors

### Phase 3: Offline Functionality

Enhance offline capabilities:

1. IndexedDB caching
2. Background sync
3. Conflict resolution
4. Sync indicators

### Phase 4: Testing

Write comprehensive tests:

1. Unit tests for utilities
2. Component tests
3. Integration tests
4. E2E tests with Playwright

### Phase 5: Optimization

Optimize for performance:

1. Code splitting
2. Lazy loading
3. Image optimization
4. Bundle analysis

## Resources

- [Preact Documentation](https://preactjs.com/)
- [Preact Signals](https://preactjs.com/guide/v10/signals/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Dexie.js](https://dexie.org/)
- [Ky HTTP Client](https://github.com/sindresorhus/ky)
- [Cloudflare Pages](https://pages.cloudflare.com/)
- [pnpm Workspaces](https://pnpm.io/workspaces)

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review the implementation documentation
3. Check browser console for errors
4. Verify all dependencies are installed
5. Ensure shared package is built

## License

MIT
