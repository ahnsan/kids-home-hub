# Kids Home Hub - Project Structure

## Directory Structure

```
kids-home-hub/                      # Root directory
│
├── apps/                           # Application packages
│   ├── frontend/                   # Preact PWA
│   │   ├── src/
│   │   │   ├── components/         # UI Components
│   │   │   │   ├── common/         # Shared components (Button, Input, Card)
│   │   │   │   ├── features/       # Feature-specific components
│   │   │   │   └── layouts/        # Layout components (Header, Footer)
│   │   │   ├── lib/                # Core libraries
│   │   │   │   ├── api/            # API client and endpoints
│   │   │   │   ├── auth/           # Authentication logic
│   │   │   │   ├── hooks/          # Custom React hooks
│   │   │   │   ├── utils/          # Utility functions
│   │   │   │   └── stores/         # State management
│   │   │   ├── assets/             # Static assets
│   │   │   │   ├── icons/          # SVG icons
│   │   │   │   ├── images/         # Images
│   │   │   │   └── fonts/          # Web fonts
│   │   │   ├── styles/             # Global styles
│   │   │   ├── types/              # TypeScript type definitions
│   │   │   ├── config/             # App configuration
│   │   │   └── index.tsx           # Application entry point
│   │   ├── public/                 # Static files
│   │   │   ├── icons/              # PWA icons
│   │   │   └── fonts/              # Public fonts
│   │   ├── tests/                  # Test files
│   │   ├── vite.config.ts          # Vite configuration
│   │   ├── tsconfig.json           # TypeScript config
│   │   ├── package.json            # Dependencies
│   │   └── .eslintrc.json          # ESLint config
│   │
│   └── backend/                    # Cloudflare Worker
│       ├── src/
│       │   ├── handlers/           # Request handlers
│       │   │   ├── transactions.ts # Transaction endpoints
│       │   │   ├── chores.ts       # Chores endpoints
│       │   │   └── redemption.ts   # Points redemption
│       │   ├── middleware/         # Middleware functions
│       │   │   ├── auth.ts         # Authentication
│       │   │   ├── cors.ts         # CORS handling
│       │   │   └── validation.ts   # Request validation
│       │   ├── services/           # Business logic
│       │   │   ├── kv.ts           # KV operations
│       │   │   ├── points.ts       # Points calculation
│       │   │   └── currency.ts     # Currency conversion
│       │   ├── utils/              # Utility functions
│       │   ├── types/              # TypeScript types
│       │   └── index.ts            # Worker entry point
│       ├── tests/                  # Test files
│       ├── wrangler.toml           # Cloudflare config
│       ├── tsconfig.json           # TypeScript config
│       ├── package.json            # Dependencies
│       └── .eslintrc.json          # ESLint config
│
├── packages/                       # Shared packages
│   ├── shared/                     # Shared code
│   │   ├── src/
│   │   │   ├── types/              # Shared TypeScript types
│   │   │   │   ├── index.ts        # Type exports
│   │   │   │   ├── child.ts        # Child-related types
│   │   │   │   ├── transaction.ts  # Transaction types
│   │   │   │   └── chore.ts        # Chore types
│   │   │   ├── utils/              # Shared utilities
│   │   │   │   ├── index.ts        # Util exports
│   │   │   │   ├── currency.ts     # Currency helpers
│   │   │   │   ├── date.ts         # Date helpers
│   │   │   │   └── validation.ts   # Validation helpers
│   │   │   ├── constants/          # Shared constants
│   │   │   │   ├── index.ts        # Constant exports
│   │   │   │   ├── children.ts     # Child constants
│   │   │   │   ├── chores.ts       # Chore definitions
│   │   │   │   └── points.ts       # Point values
│   │   │   └── index.ts            # Package entry
│   │   ├── tests/                  # Test files
│   │   ├── tsconfig.json           # TypeScript config
│   │   └── package.json            # Dependencies
│   │
│   └── config/                     # Shared configuration
│       ├── eslint-config/          # ESLint presets
│       └── tsconfig/               # TypeScript presets
│
├── docs/                           # Documentation
│   ├── README.md                   # Documentation index
│   ├── PROJECT_SUMMARY.md          # Project overview
│   ├── QUICK_REFERENCE.md          # Quick reference guide
│   ├── INDEX.md                    # Legacy index
│   │
│   ├── architecture/               # Architecture documentation
│   │   ├── FRONTEND_BUILD_ARCHITECTURE.md
│   │   ├── OFFLINE_FIRST_ARCHITECTURE.md
│   │   └── PWA_TO_NATIVE_STRATEGY.md
│   │
│   ├── guides/                     # User guides
│   │   ├── QUICKSTART.md           # 5-minute setup
│   │   ├── GETTING_STARTED.md      # Detailed setup
│   │   ├── DEPLOYMENT_GUIDE.md     # Deployment instructions
│   │   └── MIGRATION_GUIDE.md      # Migration guide
│   │
│   ├── development/                # Development docs
│   │   ├── CLAUDE_FLOW_GUIDE.md
│   │   ├── BUILD_SYSTEM_COMPARISON.md
│   │   ├── COMPONENT_EXAMPLES.md
│   │   ├── IMPLEMENTATION_EXAMPLES.md
│   │   ├── FRONTEND_BUILD_INDEX.md
│   │   ├── OFFLINE_IMPLEMENTATION_SUMMARY.md
│   │   └── OFFLINE_INDEX.md
│   │
│   └── api/                        # API documentation
│       └── (Generated from code)
│
├── scripts/                        # Build and utility scripts
│   ├── build/                      # Build scripts
│   ├── deploy/                     # Deployment scripts
│   └── ci/                         # CI/CD scripts
│
├── .github/                        # GitHub configuration
│   └── workflows/                  # GitHub Actions
│       ├── ci.yml                  # CI pipeline
│       ├── deploy.yml              # Deployment pipeline
│       └── security.yml            # Security scanning
│
├── .husky/                         # Git hooks
│   ├── pre-commit                  # Pre-commit hook
│   └── pre-push                    # Pre-push hook
│
├── .claude/                        # Claude Flow configuration
│   ├── workflows/                  # Workflow definitions
│   ├── hooks/                      # Lifecycle hooks
│   ├── swarms/                     # Agent swarm configs
│   └── flows/                      # Flow definitions
│
├── Configuration Files             # Root-level config
│   ├── package.json                # Root package.json (monorepo)
│   ├── pnpm-workspace.yaml         # pnpm workspace config
│   ├── tsconfig.json               # Root TypeScript config
│   ├── tsconfig.base.json          # Base TypeScript config
│   ├── .eslintrc.json              # ESLint configuration
│   ├── .prettierrc.json            # Prettier configuration
│   ├── .prettierignore             # Prettier ignore rules
│   ├── .gitignore                  # Git ignore rules
│   ├── .env.example                # Environment variables example
│   └── .npmrc                      # npm/pnpm configuration
│
├── Documentation Files
│   ├── README.md                   # Main README (this file)
│   ├── STRUCTURE.md                # This structure document
│   ├── LICENSE                     # MIT License
│   └── DIRECTORY_STRUCTURE.txt     # Legacy structure file
│
└── Other Files
    ├── worker.js                   # Legacy worker (to be migrated)
    ├── wrangler.toml              # Legacy Cloudflare config
    ├── sync-manager.js            # Sync manager (to be migrated)
    └── ui-sync-integration.js     # UI sync (to be migrated)
```

## Key Design Decisions

### Monorepo Structure
- **pnpm workspaces** - Efficient package management with hard links
- **TypeScript project references** - Fast incremental builds
- **Shared packages** - Code reuse between frontend and backend

### Frontend Architecture
- **Component-driven** - Organized by feature and common components
- **Lib directory** - Centralized location for core functionality
- **Path aliases** - Clean imports using @ prefix
- **Assets organization** - Separate icons, images, fonts

### Backend Architecture
- **Handlers** - Route handlers for different endpoints
- **Middleware** - Reusable middleware (auth, CORS, validation)
- **Services** - Business logic separated from handlers
- **Utilities** - Helper functions and common code

### Shared Package
- **Types** - Shared TypeScript types between apps
- **Utils** - Common utilities (currency, date, validation)
- **Constants** - Shared configuration and constants

### Documentation
- **Organized by category** - Architecture, guides, development
- **Clear navigation** - README.md as index with links
- **Clean root** - Main docs in /docs, root has only main README

### Configuration
- **Strict TypeScript** - Maximum type safety
- **ESLint + Prettier** - Code quality enforcement
- **Git hooks** - Pre-commit validation
- **Environment variables** - No secrets in code

## File Naming Conventions

### TypeScript/JavaScript Files
- **Components**: PascalCase (e.g., `Button.tsx`, `UserCard.tsx`)
- **Utilities**: camelCase (e.g., `currency.ts`, `validation.ts`)
- **Constants**: UPPER_SNAKE_CASE exported from camelCase files
- **Types**: PascalCase for types, camelCase for files

### Directories
- **kebab-case**: For multi-word directories (e.g., `user-profile/`)
- **camelCase**: For single-word directories (e.g., `components/`)

### Test Files
- **Unit tests**: `*.test.ts` or `*.spec.ts`
- **E2E tests**: `*.e2e.ts`
- **Integration tests**: `*.integration.ts`

## Import Order

Following enterprise best practices:

```typescript
// 1. External dependencies
import { h } from 'preact';
import { useState } from 'preact/hooks';

// 2. Internal packages
import type { Child, Transaction } from '@kids-home-hub/shared';
import { formatCurrency } from '@kids-home-hub/shared/utils';

// 3. Relative imports (path aliases)
import { Button } from '@/components/common/Button';
import { useAuth } from '@/lib/hooks/useAuth';
import { api } from '@/lib/api';

// 4. Types (if not using type imports above)
import type { Props } from './types';

// 5. Styles
import './styles.css';
```

## Build Process

### Development
1. **pnpm dev** - Starts all services in parallel
2. **Hot Module Replacement** - Instant updates during development
3. **TypeScript watch** - Continuous type checking

### Production Build
1. **Shared package** - Built first (dependency)
2. **Frontend** - Vite build with optimizations
3. **Backend** - esbuild with Workers optimization
4. **Validation** - Type checking, linting, tests

### Deployment
1. **Frontend** - Cloudflare Pages
2. **Backend** - Cloudflare Workers
3. **Rollback** - Version-tagged deployments

## Security Measures

### Code Level
- **Input sanitization** - All user input sanitized
- **Output encoding** - XSS prevention
- **CSP headers** - Content Security Policy
- **Rate limiting** - API protection

### Build Level
- **Dependency audits** - Automated security scanning
- **No secrets in code** - Environment variables only
- **Strict TypeScript** - Type safety prevents bugs
- **ESLint security** - Security-focused linting rules

### Deployment Level
- **HTTPS only** - All connections encrypted
- **Edge deployment** - DDoS protection via Cloudflare
- **KV security** - Data encryption at rest
- **Access control** - Environment-based access

## Performance Optimization

### Bundle Size
- **Code splitting** - Automatic route-based splitting
- **Tree shaking** - Unused code removal
- **Minification** - Terser for production
- **Compression** - Gzip and Brotli

### Runtime Performance
- **Lazy loading** - Components loaded on demand
- **Memoization** - Expensive calculations cached
- **Service Worker** - Offline-first with Workbox
- **Edge caching** - Cloudflare edge cache

### Development Experience
- **Fast refresh** - Instant updates during dev
- **Incremental builds** - TypeScript project references
- **Parallel execution** - pnpm parallel scripts
- **Watch mode** - Continuous testing and type checking

## Maintenance

### Code Quality
- **Pre-commit hooks** - Automated quality checks
- **CI/CD pipeline** - Continuous integration
- **Test coverage** - Minimum 80% coverage
- **Documentation** - Keep docs up to date

### Dependencies
- **Regular updates** - Monthly dependency updates
- **Security patches** - Immediate security updates
- **Deprecation tracking** - Monitor deprecated packages
- **Version locking** - Exact versions in production

### Monitoring
- **Error tracking** - Production error monitoring
- **Performance metrics** - Lighthouse scores
- **Bundle analysis** - Regular bundle size checks
- **Dependency audits** - Weekly security scans

---

**Last Updated**: 2025-11-23
