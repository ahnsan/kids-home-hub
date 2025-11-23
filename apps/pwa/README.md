# Kids Home Hub - PWA Frontend

World-class Progressive Web App built with Preact, TypeScript, Tailwind CSS, and modern web standards.

## Features

- **Performance**: Lighthouse 100 score target, < 150KB bundle, code-split routes
- **Offline-First**: IndexedDB with Dexie, background sync, optimistic updates
- **Type-Safe**: TypeScript strict mode, zero `any` types
- **Accessible**: WCAG 2.1 AA compliant, keyboard navigation, screen reader support
- **Secure**: CSP-compliant, XSS protection, input sanitization
- **Tested**: 80%+ coverage, unit + integration + E2E tests

## Tech Stack

- **Framework**: Preact 10.19+ (3KB)
- **State**: Preact Signals (reactive, auto-tracking)
- **Styling**: Tailwind CSS (JIT, purged)
- **API**: Ky (1.5KB HTTP client)
- **Storage**: Dexie (IndexedDB wrapper)
- **Build**: Vite 5+ (instant HMR, optimized builds)
- **Testing**: Vitest + Testing Library + Playwright

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+

### Installation

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Run tests
pnpm test

# Type check
pnpm type-check

# Lint
pnpm lint
```

## Project Structure

```
src/
├── components/       # Reusable components
│   ├── common/      # Base components (Button, Card, etc.)
│   ├── features/    # Feature-specific components
│   ├── layout/      # Layout components
├── views/           # Page-level components
├── stores/          # Preact Signals stores
├── api/             # API client & endpoints
├── db/              # Dexie schema & operations
├── hooks/           # Custom hooks
├── utils/           # Utility functions
├── assets/          # Static assets
└── types/           # TypeScript types
```

## Performance Targets

### Lighthouse Metrics

- Performance: 100
- Accessibility: 100
- Best Practices: 95+
- SEO: 100
- PWA: 100

### Bundle Sizes (gzipped)

- Initial JS: < 50KB
- Initial CSS: < 10KB
- Total: < 150KB

### Loading Times

- First Contentful Paint: < 1.2s
- Time to Interactive: < 2.5s
- Largest Contentful Paint: < 2.5s

## Security

- Content Security Policy (CSP) enforced
- No inline scripts or styles
- Input validation and sanitization
- HTTPS-only in production
- Secure storage (IndexedDB, no localStorage for sensitive data)

## Accessibility

- Semantic HTML
- ARIA labels where needed
- Keyboard navigation (Tab, Enter, Escape)
- Screen reader tested
- Focus management
- Sufficient color contrast

## Testing

```bash
# Run all tests
pnpm test

# Run with UI
pnpm test:ui

# Run with coverage
pnpm test:coverage

# Run E2E tests
pnpm test:e2e
```

## Deployment

### Cloudflare Pages

```bash
# Build
pnpm build

# Deploy
pnpm deploy
```

### Environment Variables

Create `.env.production`:

```env
VITE_API_URL=https://kids-home-hub-api.workers.dev
```

## Development

### Code Quality

- TypeScript strict mode enabled
- ESLint with strict rules
- Prettier for formatting
- No `any` types allowed
- Maximum function complexity: 10

### State Management

Uses Preact Signals for reactive state:

```typescript
import { signal, computed } from '@preact/signals';

const count = signal(0);
const double = computed(() => count.value * 2);

// Auto-updates when count changes
count.value++;
```

### API Client

Type-safe HTTP client with retry logic:

```typescript
import { api } from '@/api/client';

const data = await api.post('transaction', {
  json: { child: 'adam', amount: 10 }
}).json();
```

### Offline Storage

Dexie for structured data:

```typescript
import { db } from '@/db/schema';

await db.transactions.add({ ... });
const transactions = await db.transactions
  .where('childId').equals('adam')
  .toArray();
```

## License

MIT
