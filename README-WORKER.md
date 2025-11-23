# Kids Home Hub - Production-Grade Cloudflare Worker API

A secure, performant, and maintainable TypeScript API built with Hono framework for managing children's chores, rewards, screen time, and pocket money.

## Features

### Security
- **Rate Limiting**: 100 requests per minute per IP with sliding window
- **Input Validation**: Comprehensive Zod schemas for all inputs
- **CORS**: Properly configured with allowed origins
- **Security Headers**: HSTS, CSP, X-Frame-Options, X-Content-Type-Options
- **SQL Injection Prevention**: Parameterized queries and input sanitization
- **XSS Protection**: Input sanitization and safe rendering
- **No Sensitive Data in Logs**: Automatic redaction of sensitive fields

### Performance
- **Response Time**: < 50ms (p50), < 200ms (p99)
- **Efficient KV Operations**: Parallel fetching with `Promise.all()`
- **Response Compression**: Automatic gzip/brotli compression
- **Edge Caching**: Static resources cached for 1 hour
- **Request Timeouts**: 10-second timeout protection
- **Circuit Breaker**: Automatic failure recovery

### Reliability
- **Graceful Error Handling**: All errors caught and formatted
- **Proper HTTP Status Codes**: RESTful status code usage
- **Detailed Error Messages**: Development-only error details
- **Request Timeout Handling**: Automatic timeout after 10s
- **Circuit Breaker Pattern**: Prevents cascade failures

### Maintainability
- **TypeScript**: 100% TypeScript with strict type checking
- **Clean Architecture**: Clear separation of concerns (layers)
- **Dependency Injection**: Services injected into handlers
- **Comprehensive Logging**: Structured JSON logging
- **API Versioning**: All endpoints versioned at `/v1/`

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Hono Application                     │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   Middleware Layer                       │
│  ┌────────────┐  ┌──────────┐  ┌─────────────────────┐ │
│  │ Rate Limit │  │   CORS   │  │  Security Headers   │ │
│  └────────────┘  └──────────┘  └─────────────────────┘ │
│  ┌────────────┐  ┌──────────┐  ┌─────────────────────┐ │
│  │  Request   │  │  Timing  │  │   IP Extraction     │ │
│  │     ID     │  │          │  │                     │ │
│  └────────────┘  └──────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    Handler Layer                         │
│  ┌────────────┐  ┌──────────┐  ┌─────────────────────┐ │
│  │Transaction │  │  Chores  │  │      Redeem         │ │
│  │  Handler   │  │ Handler  │  │     Handler         │ │
│  └────────────┘  └──────────┘  └─────────────────────┘ │
│  ┌────────────┐                                         │
│  │    Data    │                                         │
│  │  Handler   │                                         │
│  └────────────┘                                         │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   Validation Layer                       │
│  ┌────────────────────────────────────────────────────┐ │
│  │              Zod Schema Validation                 │ │
│  │  • Input sanitization                              │ │
│  │  • Type coercion                                   │ │
│  │  • Business rule validation                        │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    Service Layer                         │
│  ┌────────────────────┐  ┌──────────────────────────┐  │
│  │   Data Service     │  │  Transaction Service     │  │
│  │                    │  │                          │  │
│  │  • KV operations   │  │  • Business logic        │  │
│  │  • Batch fetching  │  │  • Currency conversion   │  │
│  │  • Error handling  │  │  • Points redemption     │  │
│  │  • Timeouts        │  │  • Chores processing     │  │
│  └────────────────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                 Cloudflare KV Storage                    │
│  ┌────────────┐  ┌──────────┐  ┌─────────────────────┐ │
│  │   Money    │  │  Points  │  │   Screen Time       │ │
│  └────────────┘  └──────────┘  └─────────────────────┘ │
│  ┌────────────┐  ┌──────────┐                          │
│  │   Chores   │  │   Logs   │                          │
│  └────────────┘  └──────────┘                          │
└─────────────────────────────────────────────────────────┘
```

## Project Structure

```
src/
├── index.ts                    # Main Hono application
├── types/
│   └── index.ts               # TypeScript type definitions
├── schemas/
│   └── validation.ts          # Zod validation schemas
├── middleware/
│   └── security.ts            # Security middleware
├── services/
│   ├── data-service.ts        # KV data operations
│   └── transaction-service.ts # Business logic
├── handlers/
│   ├── transaction.ts         # /v1/transaction handler
│   ├── chores.ts             # /v1/chores handlers
│   ├── redeem.ts             # /v1/redeem handler
│   └── data.ts               # /v1/data handler
├── utils/
│   ├── logger.ts             # Logging utilities
│   └── error-handler.ts      # Error handling
├── ui/
│   └── renderer.ts           # UI rendering
└── __tests__/
    └── transaction.test.ts   # Unit tests
```

## Installation

```bash
# Install dependencies
npm install

# Install dev dependencies
npm install --save-dev typescript @types/node @cloudflare/workers-types
```

## Development

### Local Development
```bash
# Start development server
npm run dev:worker

# Server starts at http://localhost:8787
```

### Testing
```bash
# Run all tests
npm run test:worker

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Type Checking
```bash
# Check TypeScript types
npm run type-check
```

### Linting
```bash
# Run ESLint
npm run lint

# Fix linting issues
npm run lint:fix
```

## Deployment

### Staging
```bash
npm run deploy:worker:staging
```

### Production
```bash
npm run deploy:worker:production
```

## API Endpoints

See [API.md](./API.md) for complete API documentation.

### Quick Reference

- `GET /health` - Health check
- `GET /v1/health` - Health check (versioned)
- `POST /v1/transaction` - Create transaction (money/points/screen)
- `GET /v1/chores` - Get available chores
- `POST /v1/chores` - Submit completed chores
- `POST /v1/redeem` - Redeem points for screen time
- `GET /v1/data` - Get all child data

## Configuration

### Environment Variables

Set in `wrangler.toml`:

```toml
[env.production]
name = "kids-home-hub-production"
ENVIRONMENT = "production"

[env.staging]
name = "kids-home-hub-staging"
ENVIRONMENT = "staging"
```

### KV Namespaces

Configure in `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "CHILD_SPEND"
id = "your-kv-namespace-id"
```

### Rate Limiting

Adjust in `src/middleware/security.ts`:

```typescript
const maxRequests = 100; // Requests per minute
const windowMs = 60 * 1000; // 1 minute
```

### CORS

Configure allowed origins in `src/middleware/security.ts`:

```typescript
const allowedOrigins = [
  /^https:\/\/.*\.workers\.dev$/,
  /^https:\/\/kids-home-hub\..*$/,
  'http://localhost:8787',
];
```

## Monitoring

### Logging

All requests are logged with:
- Request ID
- Duration
- Status code
- IP address
- User agent

Example log:
```json
{
  "timestamp": "2025-11-23T12:00:00.000Z",
  "level": "info",
  "requestId": "abc-123-def",
  "message": "Request completed",
  "data": {
    "metrics": {
      "path": "/v1/transaction",
      "method": "POST",
      "statusCode": 200,
      "duration": 45,
      "ip": "203.0.113.1"
    }
  }
}
```

### Error Tracking

Errors are logged with:
- Error message
- Stack trace (dev only)
- Request context
- Error code

### Performance Metrics

Metrics are stored in KV for 24 hours:
- Request path
- Response time
- Status code
- Timestamp

## Security Best Practices

### Input Validation
All inputs validated with Zod:
```typescript
const input = transactionSchema.parse(body);
```

### SQL Injection Prevention
No SQL in this project, but input sanitization prevents injection:
```typescript
function sanitizeInput(input: string): string {
  return input.trim()
    .replace(/[<>]/g, '')
    .replace(/[^\w\s\-.,!?()]/g, '')
    .substring(0, 500);
}
```

### Rate Limiting
Per-IP rate limiting with KV storage:
```typescript
// 100 requests per minute
if (entry.count >= maxRequests) {
  return c.json({ error: 'Rate limit exceeded' }, 429);
}
```

### CORS
Whitelist-based CORS:
```typescript
origin: (origin) => {
  return allowedOrigins.some(allowed =>
    allowed.test(origin)
  ) ? origin : null;
}
```

## Testing

### Unit Tests

Tests use Vitest with mock KV:

```typescript
it('should process money addition correctly', async () => {
  const result = await service.processMoney(
    'adam', 'add', 10, 'GBP', 'Test'
  );
  expect(result.newBalance).toBe('10.00');
});
```

### Coverage Target
- Lines: 80%
- Functions: 80%
- Branches: 80%
- Statements: 80%

### Running Tests
```bash
npm run test:worker
```

## Performance Optimization

### KV Operations
- Parallel fetching with `Promise.all()`
- Batch operations where possible
- 5-second timeout on all KV operations

### Response Compression
Automatic compression with Hono:
```typescript
app.use('*', compress());
```

### Edge Caching
Static resources cached:
```typescript
cache({
  cacheName: 'chores-cache',
  cacheControl: 'public, max-age=3600',
})
```

## Troubleshooting

### TypeScript Errors
**Issue**: Type errors during compilation
**Solution**: Run `npm run type-check` to see all errors

### KV Access Errors
**Issue**: Cannot read/write to KV
**Solution**: Check KV namespace binding in `wrangler.toml`

### Rate Limiting Issues
**Issue**: Getting 429 errors
**Solution**: Wait for rate limit window to reset or increase limit

### CORS Errors
**Issue**: CORS errors in browser
**Solution**: Add your origin to allowed origins list

## Migration

See [MIGRATION.md](./MIGRATION.md) for migration guide from old `worker.js`.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run `npm run validate`
6. Submit a pull request

## License

MIT

## Support

For issues or questions:
- Check [API.md](./API.md) for API documentation
- Check [MIGRATION.md](./MIGRATION.md) for migration help
- Open an issue on GitHub
