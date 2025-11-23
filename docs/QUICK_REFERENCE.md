# Kids Home Hub - Quick Reference Cheat Sheet

Fast reference for common tasks and commands.

---

## Getting Started

```bash
# 1. Setup monorepo (automated)
./scripts/setup-monorepo.sh

# 2. Install dependencies
pnpm install

# 3. Build shared package
pnpm --filter shared build

# 4. Start development
pnpm dev              # PWA on localhost:3000
pnpm dev:worker       # Worker on localhost:8787
pnpm dev:all          # Both in parallel
```

---

## Development Commands

### PWA Development

```bash
cd apps/pwa

pnpm dev              # Start dev server (http://localhost:3000)
pnpm build            # Build for production
pnpm preview          # Preview production build
pnpm type-check       # TypeScript type checking
```

### Worker Development

```bash
cd apps/worker

pnpm dev              # Start local worker (http://localhost:8787)
pnpm build            # Build worker
wrangler tail         # View real-time logs
```

---

## Quick Wins

### Add a Button

```typescript
import { Button } from './components/common/Button';

<Button onClick={() => alert('Clicked!')} variant="primary">
  Click me
</Button>
```

### Read a Signal

```typescript
import { currentChild } from './stores/childrenStore';

const child = currentChild.value;
console.log(child.name);
```

---

## Remember

- **HMR is instant** - just save the file
- **Types are shared** - import from `@kids-hub/shared`
- **Signals auto-update** - no need to call setState
- **Offline works** - IndexedDB + Service Worker

**See full documentation:** [FRONTEND_BUILD_INDEX.md](./FRONTEND_BUILD_INDEX.md)
