#!/bin/bash

# Kids Home Hub - Monorepo Setup Script
# This script automates the initial monorepo setup from MIGRATION_GUIDE.md

set -e  # Exit on error

echo "🚀 Kids Home Hub - Monorepo Setup"
echo "================================="
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'.' -f1 | sed 's/v//')
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be 18 or higher. Current: $(node -v)"
    exit 1
fi
echo "✅ Node.js $(node -v)"

if ! command -v pnpm &> /dev/null; then
    echo "⚠️  pnpm not found. Installing pnpm..."
    npm install -g pnpm@8.12.0
fi
echo "✅ pnpm $(pnpm -v)"

# Create directory structure
echo ""
echo "📁 Creating monorepo structure..."

mkdir -p apps/{pwa,worker}
mkdir -p packages/shared
mkdir -p scripts
mkdir -p .github/workflows

echo "✅ Directories created"

# Create pnpm workspace config
echo ""
echo "📦 Creating pnpm workspace..."

cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'apps/*'
  - 'packages/*'
EOF

echo "✅ pnpm-workspace.yaml created"

# Create root package.json
echo ""
echo "📄 Creating root package.json..."

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
    "preview:pwa": "pnpm --filter pwa preview",
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

echo "✅ Root package.json created"

# Setup shared package
echo ""
echo "📦 Setting up shared package..."

cd packages/shared

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

mkdir -p src/{types,constants,utils}

cat > src/index.ts << 'EOF'
export * from './types';
export * from './constants';
export * from './utils';
EOF

echo "✅ Shared package configured"

cd ../..

# Setup PWA package
echo ""
echo "📦 Setting up PWA package..."

cd apps/pwa

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

mkdir -p src/{components/{common,features/{money,points,chores,screen,child},layout},views,api,stores,db,utils,hooks,types,assets/styles}
mkdir -p public/icons

echo "✅ PWA package configured"

cd ../..

# Setup Worker package
echo ""
echo "📦 Setting up Worker package..."

cd apps/worker

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

mkdir -p src/{handlers,utils,types}

echo "✅ Worker package configured"

cd ../..

# Install dependencies
echo ""
echo "📦 Installing dependencies (this may take a minute)..."

pnpm install

echo "✅ Dependencies installed"

# Create .gitignore
echo ""
echo "📄 Creating .gitignore..."

cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnpm-store/

# Build outputs
dist/
build/
.vite/

# Environment
.env
.env.local
.env*.local

# Logs
*.log
npm-debug.log*

# OS
.DS_Store
Thumbs.db

# IDEs
.vscode/
.idea/
*.swp
*.swo

# Wrangler
.wrangler/
.dev.vars

# TypeScript
*.tsbuildinfo
EOF

echo "✅ .gitignore created"

# Summary
echo ""
echo "✅ Monorepo setup complete!"
echo ""
echo "📁 Structure created:"
echo "   ├── apps/"
echo "   │   ├── pwa/          (Progressive Web App)"
echo "   │   └── worker/       (Cloudflare Worker API)"
echo "   ├── packages/"
echo "   │   └── shared/       (Shared types & utils)"
echo "   └── scripts/"
echo ""
echo "🎯 Next steps:"
echo "   1. Extract types to packages/shared/src/types/"
echo "   2. Setup PWA with: cd apps/pwa && pnpm dev"
echo "   3. Setup Worker with: cd apps/worker && pnpm dev"
echo ""
echo "📚 See MIGRATION_GUIDE.md for detailed instructions"
echo ""
