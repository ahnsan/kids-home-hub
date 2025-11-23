# Quick Start Guide - Production-Grade Worker API

Get up and running with the new TypeScript Worker API in 5 minutes.

## Prerequisites

- Node.js 18+
- npm or pnpm
- Cloudflare account
- Wrangler CLI installed

## Step 1: Install Dependencies (30 seconds)

```bash
npm install
```

This installs:
- `hono` - Web framework
- `zod` - Schema validation
- TypeScript and types

## Step 2: Configure KV Namespace (1 minute)

1. Create a KV namespace in Cloudflare dashboard
2. Copy the namespace ID
3. Update `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "CHILD_SPEND"
id = "your-kv-namespace-id-here"  # ← Paste your ID here
```

## Step 3: Start Development Server (10 seconds)

```bash
npm run dev:worker
```

Server starts at: `http://localhost:8787`

## Step 4: Test the API (2 minutes)

### Health Check
```bash
curl http://localhost:8787/v1/health
```

Expected:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-23T12:00:00.000Z",
  "version": "v1"
}
```

### Create a Transaction
```bash
curl -X POST http://localhost:8787/v1/transaction \
  -H "Content-Type: application/json" \
  -d '{
    "feature": "money",
    "child": "adam",
    "action": "add",
    "amount": 10.50,
    "currency": "GBP",
    "reason": "Pocket money"
  }'
```

Expected:
```json
{
  "success": true,
  "data": {
    "child": "adam",
    "feature": "money",
    "newBalance": "10.50",
    "transaction": {
      "action": "add",
      "amount": 10.5,
      "reason": "Pocket money"
    }
  },
  "meta": {
    "timestamp": "2025-11-23T12:00:00.000Z",
    "version": "v1",
    "requestId": "..."
  }
}
```

### Submit Chores
```bash
curl -X POST http://localhost:8787/v1/chores \
  -H "Content-Type: application/json" \
  -d '{
    "child": "sami",
    "chore": ["tidy_room", "homework"]
  }'
```

Expected:
```json
{
  "success": true,
  "data": {
    "child": "sami",
    "totalPoints": 18,
    "choresCompleted": [
      {"id": "tidy_room", "label": "Tidy bedroom", "points": 10},
      {"id": "homework", "label": "Finish homework", "points": 8}
    ],
    "newPointsBalance": 18
  },
  ...
}
```

### Redeem Points
```bash
curl -X POST http://localhost:8787/v1/redeem \
  -H "Content-Type: application/json" \
  -d '{
    "child": "adam",
    "points": 15,
    "reason": "Movie night"
  }'
```

### Get All Data
```bash
curl http://localhost:8787/v1/data
```

Or for specific child:
```bash
curl http://localhost:8787/v1/data?child=adam
```

## Step 5: Run Tests (30 seconds)

```bash
npm run test:worker
```

Expected output:
```
✓ Transaction Schema Validation (10 tests)
✓ Transaction Service - Money (3 tests)
✓ Transaction Service - Points (3 tests)
✓ Transaction Service - Chores (3 tests)
✓ Transaction Service - Redeem (2 tests)

Test Files  1 passed (1)
     Tests  21 passed (21)
```

## Step 6: Deploy (1 minute)

### Deploy to Staging
```bash
npm run deploy:worker:staging
```

### Deploy to Production
```bash
npm run deploy:worker:production
```

## Common Commands

```bash
# Development
npm run dev:worker              # Start dev server
npm run test:worker             # Run tests
npm run test:watch              # Run tests in watch mode
npm run type-check              # Check TypeScript types
npm run lint                    # Run linter
npm run lint:fix                # Fix linting issues

# Deployment
npm run deploy:worker           # Deploy to default
npm run deploy:worker:staging   # Deploy to staging
npm run deploy:worker:production # Deploy to production
```

## API Endpoints Quick Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/v1/health` | Health check (versioned) |
| POST | `/v1/transaction` | Create transaction |
| GET | `/v1/chores` | Get available chores |
| POST | `/v1/chores` | Submit chores |
| POST | `/v1/redeem` | Redeem points |
| GET | `/v1/data` | Get all data |

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 8787
lsof -ti:8787 | xargs kill -9

# Or use a different port
wrangler dev --port 8788
```

### KV Namespace Not Found
```
Error: KV namespace not bound
```

**Solution**: Update `wrangler.toml` with your KV namespace ID

### TypeScript Errors
```bash
# Rebuild TypeScript
npm run type-check
```

### Rate Limited (429 Error)
```
Error: Rate limit exceeded
```

**Solution**: Wait 60 seconds or increase rate limit in development:

Edit `src/middleware/security.ts`:
```typescript
const maxRequests = process.env.ENVIRONMENT === 'development' ? 1000 : 100;
```

### CORS Errors
```
Access-Control-Allow-Origin error
```

**Solution**: Add your origin to allowed origins in `src/middleware/security.ts`:
```typescript
const allowedOrigins = [
  'http://localhost:3000',  // Add your frontend
  // ...
];
```

## Next Steps

1. **Read the Docs**:
   - [API.md](./API.md) - Complete API documentation
   - [MIGRATION.md](./MIGRATION.md) - Migration guide
   - [README-WORKER.md](./README-WORKER.md) - Detailed README

2. **Customize**:
   - Update CORS origins in `src/middleware/security.ts`
   - Adjust rate limits in `src/middleware/security.ts`
   - Add authentication if needed

3. **Monitor**:
   - Check Cloudflare dashboard for metrics
   - Review logs in Cloudflare dashboard
   - Monitor response times

4. **Test**:
   - Write additional tests
   - Run load tests
   - Test in production-like environment

## Example: Complete Workflow

```bash
# 1. Install
npm install

# 2. Configure KV (edit wrangler.toml)
vim wrangler.toml

# 3. Start dev server
npm run dev:worker

# 4. In another terminal, test
curl http://localhost:8787/v1/health

# 5. Run tests
npm run test:worker

# 6. Type check
npm run type-check

# 7. Deploy to staging
npm run deploy:worker:staging

# 8. Test staging
curl https://kids-home-hub-staging.workers.dev/v1/health

# 9. Deploy to production
npm run deploy:worker:production

# 10. Test production
curl https://kids-home-hub.workers.dev/v1/health
```

## Quick Links

- **API Docs**: [API.md](./API.md)
- **Migration Guide**: [MIGRATION.md](./MIGRATION.md)
- **Architecture**: [README-WORKER.md](./README-WORKER.md)
- **Summary**: [REFACTOR-SUMMARY.md](./REFACTOR-SUMMARY.md)

## Need Help?

1. Check the documentation files above
2. Review error logs in Cloudflare dashboard
3. Run tests: `npm run test:worker`
4. Check type errors: `npm run type-check`
5. Open an issue on GitHub

---

**Congratulations!** You now have a production-grade TypeScript Worker API running with:
- ✅ Security (rate limiting, validation, CORS)
- ✅ Performance (<50ms response time)
- ✅ Monitoring (logging, metrics)
- ✅ Type safety (100% TypeScript)
- ✅ Tests (comprehensive coverage)
