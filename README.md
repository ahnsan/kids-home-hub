# Kids Home Hub

World-class Progressive Web App for managing children's chores, rewards, screen time, and pocket money. Built with enterprise-grade development standards.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Preact](https://img.shields.io/badge/Preact-10.19-purple)](https://preactjs.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-cyan)](https://tailwindcss.com/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange)](https://workers.cloudflare.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**Status**: 85% Complete - Infrastructure ✅ | Features 🔄 | Testing ⏳

## Features

- **Bank Account Management** - Track pocket money in multiple currencies (GBP/AUD)
- **Reward Points System** - Earn points through chores and good behavior
- **Screen Time Bank** - Redeem points for screen time (1 point = 1 minute)
- **Chores Tracker** - Complete chores to earn points automatically
- **Progressive Web App** - Install on any device, works offline-first
- **Cloudflare Workers** - Lightning-fast global edge deployment
- **Enterprise Security** - CSP headers, input sanitization, secure storage

## Quick Start

```bash
# 1. Install dependencies (requires pnpm >= 8.0)
pnpm install

# 2. Build shared package
cd packages/shared && pnpm build && cd ../..

# 3. Start PWA development server
cd apps/pwa && pnpm dev

# Open http://localhost:3000
```

**Full setup instructions**: See [SETUP_GUIDE.md](./SETUP_GUIDE.md)

## Project Structure

```
kids-home-hub/
├── apps/
│   ├── pwa/                  # Progressive Web App
│   │   ├── src/
│   │   │   ├── components/   # UI components
│   │   │   │   ├── common/   # Button, Card, Avatar
│   │   │   │   ├── features/ # Money, Points, Chores, Screen
│   │   │   │   └── layout/   # Header, Nav, Container
│   │   │   ├── views/        # Bank, Points, Chores, Screen
│   │   │   ├── stores/       # Preact Signals state
│   │   │   ├── api/          # HTTP client (Ky)
│   │   │   ├── db/           # IndexedDB (Dexie)
│   │   │   ├── hooks/        # Custom hooks
│   │   │   ├── utils/        # Utilities
│   │   │   ├── assets/       # Styles, images
│   │   │   ├── main.tsx      # Entry point
│   │   │   └── app.tsx       # Root component
│   │   ├── vite.config.ts    # Vite + PWA config
│   │   ├── tailwind.config.ts # Tailwind theme
│   │   └── tsconfig.json     # TypeScript config
│   └── worker/               # Cloudflare Worker (existing)
│       ├── worker.js
│       └── wrangler.toml
├── packages/
│   └── shared/               # Shared types, utils, constants
│       ├── src/
│       │   ├── types/        # TypeScript types
│       │   ├── constants/    # App constants
│       │   └── utils/        # Formatters, validators
│       ├── dist/             # Compiled output
│       └── tsconfig.json
└── docs/
    ├── SETUP_GUIDE.md        # Installation instructions
    ├── FRONTEND_IMPLEMENTATION_COMPLETE.md
    └── BUILD_COMPLETE_SUMMARY.md
```

## Tech Stack

### Frontend (PWA)
- **Preact 10.19** - Lightweight React alternative (3KB)
- **Preact Signals** - Reactive state management (built-in)
- **TypeScript 5.3** - Strict type safety (no `any` types)
- **Vite 5** - Fast build tool with instant HMR
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **Ky 1.1** - Tiny HTTP client (1.5KB)
- **Dexie 3.2** - IndexedDB wrapper (~15KB)
- **VitePWA** - Service Worker with Workbox
- **Vitest** - Unit and component testing
- **Playwright** - End-to-end testing

### Backend
- **Supabase** - PostgreSQL database with real-time capabilities
- **Supabase Auth** - Built-in authentication with magic links
- **Row Level Security** - Database-level authorization
- **Cloudflare Workers** - Edge computing platform (legacy)
- **Cloudflare KV** - Distributed key-value storage (legacy)

### Development
- **pnpm Workspaces** - Monorepo management
- **TypeScript Strict Mode** - Maximum type safety
- **ESLint** - Code quality (zero warnings)
- **Prettier** - Code formatting
- **VSCode** - Recommended editor with extensions

## Documentation

### Getting Started
- **[Supabase Quick Start](./SUPABASE_QUICK_START.md)** - Get started in 15 minutes (RECOMMENDED)
- **[Setup Guide](./SETUP_GUIDE.md)** - Original installation instructions
- **[Build Summary](./BUILD_COMPLETE_SUMMARY.md)** - What's been built (85% complete)

### Supabase Migration (New Backend)
- **[Quick Start Guide](./SUPABASE_QUICK_START.md)** - Setup Supabase in 15 minutes
- **[Testing Guide](./SUPABASE_TESTING_GUIDE.md)** - Comprehensive testing checklist
- **[Deployment Guide](./SUPABASE_DEPLOYMENT.md)** - Production deployment instructions
- **[Migration Guide](./SUPABASE_MIGRATION_GUIDE.md)** - Complete migration documentation
- **[Final Checklist](./SUPABASE_FINAL_CHECKLIST.md)** - Pre-deployment verification

### Technical Documentation
- **[Implementation Details](./FRONTEND_IMPLEMENTATION_COMPLETE.md)** - Technical architecture
- **[PWA README](./apps/pwa/README.md)** - PWA-specific documentation
- **[API Documentation](./API.md)** - API reference

### Key Files
- `SUPABASE_QUICK_START.md` - Setup Supabase backend (START HERE!)
- `SUPABASE_TESTING_GUIDE.md` - Test everything works
- `SUPABASE_DEPLOYMENT.md` - Deploy to production
- `BUILD_COMPLETE_SUMMARY.md` - Progress summary
- `apps/pwa/README.md` - PWA features and commands

## Development

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Supabase account (for database and auth) - [Sign up free](https://supabase.com)
- Cloudflare account (for PWA deployment) - [Sign up free](https://dash.cloudflare.com/sign-up)

### Setup

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Configure Supabase** (New Backend)
   ```bash
   cd apps/pwa
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials:
   # VITE_SUPABASE_URL=https://your-project.supabase.co
   # VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Run Supabase Migrations**
   - Open Supabase Dashboard SQL Editor
   - Run migrations from `/supabase/migrations/` in order
   - See [SUPABASE_QUICK_START.md](./SUPABASE_QUICK_START.md) for details

4. **Start development**
   ```bash
   cd apps/pwa
   pnpm dev
   # Open http://localhost:3000
   ```

**Detailed Setup**: See [SUPABASE_QUICK_START.md](./SUPABASE_QUICK_START.md) for complete instructions

### Available Scripts

```bash
# Development
pnpm dev                  # Start PWA dev server
pnpm dev:worker          # Start Worker dev server
pnpm dev:all             # Start both in parallel

# Build
pnpm build               # Build all packages
pnpm build:pwa           # Build PWA only
pnpm build:worker        # Build Worker only

# Testing
pnpm test                # Run all tests
pnpm test:pwa            # PWA tests only
pnpm test:e2e            # End-to-end tests

# Code Quality
pnpm lint                # Lint all code
pnpm type-check          # TypeScript check
pnpm format              # Format all files

# Deployment
pnpm build               # Build for production
# See SUPABASE_DEPLOYMENT.md for deployment instructions
```

## Security

This project follows enterprise-grade security practices:

- **Row Level Security (RLS)** - Database-level authorization enforced by Supabase
- **Household Data Isolation** - Users can only access their own household data
- **Role-Based Access Control** - Owner, parent, and viewer roles with granular permissions
- **Supabase Auth** - Built-in authentication with secure magic links
- **Content Security Policy** - Prevents XSS attacks
- **Input Sanitization** - All user input is sanitized
- **Secure Storage** - Session persistence with Supabase Auth
- **HTTPS Only** - All connections over HTTPS
- **No Secrets in Code** - Environment variables for sensitive data
- **Dependency Audits** - Automated security scanning

**Security Features:**
- 30+ RLS policies protecting all tables
- Automatic authentication via `auth.uid()`
- Last owner protection (cannot remove last household owner)
- Balance validation (prevents negative balances)
- SQL injection protection (parameterized queries)
- XSS prevention (output escaping)

See [SUPABASE_MIGRATION_GUIDE.md](./SUPABASE_MIGRATION_GUIDE.md) for security implementation details.

## Performance

- **Bundle Size**: < 150KB total (enforced by budget)
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 2.5s
- **Lighthouse Score**: > 95
- **Offline Support**: 100% core functionality

### Bundle Optimization

- Tree shaking and minification
- Code splitting by route
- Lazy loading for heavy components
- Gzip and Brotli compression
- Asset optimization (images, fonts)

## Contributing

This is a personal project, but suggestions are welcome via issues.

### Development Workflow

1. Create a feature branch
2. Make your changes
3. Run `pnpm validate` to ensure quality
4. Submit a pull request

All commits are validated with:
- ESLint (no warnings allowed)
- Prettier formatting
- TypeScript type checking
- Unit tests passing

## License

MIT License - See [LICENSE](LICENSE) file

## Acknowledgments

Built with:
- [Cloudflare Workers](https://workers.cloudflare.com/)
- [Preact](https://preactjs.com/)
- [Vite](https://vitejs.dev/)
- Progressive Web App standards
- Enterprise-grade best practices from Vercel, Cloudflare, and Google

---

**Made with Claude Code**
