# Kids Home Hub - Documentation

Complete documentation for the Kids Home Hub PWA platform.

## Quick Links

- [Project Summary](./PROJECT_SUMMARY.md) - Overview of the entire project
- [Quick Reference](./QUICK_REFERENCE.md) - Cheat sheet for common tasks
- [Original Documentation Index](./INDEX.md) - Legacy documentation index

## Documentation Structure

### Getting Started

- [Quickstart Guide](./guides/QUICKSTART.md) - Get up and running in 5 minutes
- [Getting Started](./guides/GETTING_STARTED.md) - Comprehensive setup guide
- [Deployment Guide](./guides/DEPLOYMENT_GUIDE.md) - Production deployment instructions
- [Migration Guide](./guides/MIGRATION_GUIDE.md) - Upgrading and migration strategies

### Architecture

- [Frontend Build Architecture](./architecture/FRONTEND_BUILD_ARCHITECTURE.md) - Frontend architecture and build system
- [Offline-First Architecture](./architecture/OFFLINE_FIRST_ARCHITECTURE.md) - Offline capabilities and PWA design
- [PWA to Native Strategy](./architecture/PWA_TO_NATIVE_STRATEGY.md) - Path to native mobile apps

### Development

- [Claude Flow Guide](./development/CLAUDE_FLOW_GUIDE.md) - AI-powered development workflows
- [Build System Comparison](./development/BUILD_SYSTEM_COMPARISON.md) - Build tool analysis and decisions
- [Component Examples](./development/COMPONENT_EXAMPLES.md) - Reusable component patterns
- [Implementation Examples](./development/IMPLEMENTATION_EXAMPLES.md) - Code examples and best practices
- [Frontend Build Index](./development/FRONTEND_BUILD_INDEX.md) - Frontend build documentation
- [Offline Implementation Summary](./development/OFFLINE_IMPLEMENTATION_SUMMARY.md) - Offline feature implementation
- [Offline Index](./development/OFFLINE_INDEX.md) - Offline documentation index

### API Reference

API documentation will be generated from TypeScript types and JSDoc comments.

Run `pnpm run docs:api` to generate API documentation.

## Contributing

See the main [README](../README.md) for contribution guidelines.

## Directory Structure

```
docs/
├── README.md                    # This file
├── PROJECT_SUMMARY.md           # Project overview
├── QUICK_REFERENCE.md           # Quick reference guide
├── INDEX.md                     # Legacy index
│
├── architecture/                # Architecture documentation
│   ├── FRONTEND_BUILD_ARCHITECTURE.md
│   ├── OFFLINE_FIRST_ARCHITECTURE.md
│   └── PWA_TO_NATIVE_STRATEGY.md
│
├── guides/                      # User guides
│   ├── QUICKSTART.md
│   ├── GETTING_STARTED.md
│   ├── DEPLOYMENT_GUIDE.md
│   └── MIGRATION_GUIDE.md
│
├── development/                 # Development documentation
│   ├── CLAUDE_FLOW_GUIDE.md
│   ├── BUILD_SYSTEM_COMPARISON.md
│   ├── COMPONENT_EXAMPLES.md
│   ├── IMPLEMENTATION_EXAMPLES.md
│   ├── FRONTEND_BUILD_INDEX.md
│   ├── OFFLINE_IMPLEMENTATION_SUMMARY.md
│   └── OFFLINE_INDEX.md
│
└── api/                         # API documentation
    └── (Generated from code)
```

## Need Help?

- Check the [Quick Reference](./QUICK_REFERENCE.md) for common commands
- Read the [Getting Started Guide](./guides/GETTING_STARTED.md) for setup help
- Review the [Architecture Documentation](./architecture/) to understand the system design

## License

MIT - See [LICENSE](../LICENSE) file
