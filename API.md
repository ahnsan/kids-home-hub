# Kids Home Hub API Documentation

## Production-Grade Cloudflare Worker API v1

### Base URL
```
https://kids-home-hub.workers.dev
```

### Authentication
Currently, the API does not require authentication. In production, consider implementing:
- API keys
- JWT tokens
- IP whitelisting

---

## Security Features

### Rate Limiting
- **Limit**: 100 requests per minute per IP
- **Headers**:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining in current window
  - `X-RateLimit-Reset`: Timestamp when the rate limit resets
  - `Retry-After`: Seconds to wait before retrying (on 429)

### CORS
- Configured for specific origins
- Supports credentials
- Preflight caching enabled (24 hours)

### Security Headers
- `Strict-Transport-Security`: HSTS enabled
- `Content-Security-Policy`: Restrictive CSP
- `X-Frame-Options`: DENY
- `X-Content-Type-Options`: nosniff
- `Referrer-Policy`: strict-origin-when-cross-origin

### Input Validation
- All inputs validated with Zod schemas
- SQL injection prevention
- XSS protection through input sanitization
- Maximum field lengths enforced

---

## API Endpoints

### Health Check

#### `GET /health`
Check API health status.

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-23T12:00:00.000Z",
  "version": "v1"
}
```

---

### Transactions

#### `POST /v1/transaction`
Create a transaction for money, points, or screen time.

**Request Body**:
```json
{
  "feature": "money" | "points" | "screen",
  "child": "adam" | "sami",
  "action": "add" | "deduct",
  "amount": number,
  "currency": "GBP" | "AUD",  // Required for money
  "reason": string             // Required for all
}
```

**Validation Rules**:
- `amount`: Must be positive, max 10,000 for money/points, max 1,440 for screen
- `reason`: 1-200 characters, alphanumeric only
- Money transactions require both `currency` and `reason`
- Points/screen transactions require `reason`

**Example - Money**:
```bash
curl -X POST https://kids-home-hub.workers.dev/v1/transaction \
  -H "Content-Type: application/json" \
  -d '{
    "feature": "money",
    "child": "adam",
    "action": "add",
    "amount": 10.50,
    "currency": "GBP",
    "reason": "Birthday gift"
  }'
```

**Example - Points**:
```bash
curl -X POST https://kids-home-hub.workers.dev/v1/transaction \
  -H "Content-Type: application/json" \
  -d '{
    "feature": "points",
    "child": "sami",
    "action": "add",
    "amount": 15,
    "reason": "Good behavior"
  }'
```

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "child": "adam",
    "feature": "money",
    "newBalance": "10.50",
    "transaction": {
      "action": "add",
      "amount": 10.50,
      "reason": "Birthday gift"
    }
  },
  "meta": {
    "timestamp": "2025-11-23T12:00:00.000Z",
    "version": "v1",
    "requestId": "abc-123-def"
  }
}
```

**Error Response (400 - Insufficient Balance)**:
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "Insufficient money balance. Current: £5.00, Required: £10.00"
  },
  "meta": {
    "timestamp": "2025-11-23T12:00:00.000Z",
    "version": "v1",
    "requestId": "abc-123-def"
  }
}
```

---

### Chores

#### `GET /v1/chores`
Get list of available chores.

**Response (200)**:
```json
{
  "success": true,
  "data": [
    { "id": "tidy_room", "label": "Tidy bedroom", "points": 10 },
    { "id": "homework", "label": "Finish homework", "points": 8 },
    { "id": "set_table", "label": "Set / clear the table", "points": 5 },
    { "id": "feed_pet", "label": "Feed pet / help pet", "points": 6 },
    { "id": "help_laundry", "label": "Help with laundry", "points": 7 }
  ],
  "meta": {
    "timestamp": "2025-11-23T12:00:00.000Z",
    "version": "v1",
    "requestId": "abc-123-def"
  }
}
```

**Cache**: 1 hour (public cache)

---

#### `POST /v1/chores`
Submit completed chores and earn points.

**Request Body**:
```json
{
  "child": "adam" | "sami",
  "chore": ["chore_id_1", "chore_id_2", ...]
}
```

**Validation Rules**:
- `chore`: Array of 1-10 valid chore IDs
- At least one chore must be selected

**Example**:
```bash
curl -X POST https://kids-home-hub.workers.dev/v1/chores \
  -H "Content-Type: application/json" \
  -d '{
    "child": "adam",
    "chore": ["tidy_room", "homework"]
  }'
```

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "child": "adam",
    "totalPoints": 18,
    "choresCompleted": [
      { "id": "tidy_room", "label": "Tidy bedroom", "points": 10 },
      { "id": "homework", "label": "Finish homework", "points": 8 }
    ],
    "newPointsBalance": 68
  },
  "meta": {
    "timestamp": "2025-11-23T12:00:00.000Z",
    "version": "v1",
    "requestId": "abc-123-def"
  }
}
```

---

### Redeem Points

#### `POST /v1/redeem`
Redeem points for screen time (1 point = 1 minute).

**Request Body**:
```json
{
  "child": "adam" | "sami",
  "points": number,
  "reason": string
}
```

**Validation Rules**:
- `points`: Positive integer, max 10,000
- `reason`: 1-200 characters, alphanumeric only
- Must have sufficient points balance

**Example**:
```bash
curl -X POST https://kids-home-hub.workers.dev/v1/redeem \
  -H "Content-Type: application/json" \
  -d '{
    "child": "sami",
    "points": 30,
    "reason": "Movie night"
  }'
```

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "child": "sami",
    "pointsSpent": 30,
    "minutesAdded": 30,
    "newPointsBalance": 38,
    "newScreenBalance": 90
  },
  "meta": {
    "timestamp": "2025-11-23T12:00:00.000Z",
    "version": "v1",
    "requestId": "abc-123-def"
  }
}
```

---

### Data Retrieval

#### `GET /v1/data`
Get all data for one or all children.

**Query Parameters**:
- `child` (optional): `adam` | `sami` - Filter by specific child

**Examples**:
```bash
# Get all children's data
curl https://kids-home-hub.workers.dev/v1/data

# Get specific child's data
curl https://kids-home-hub.workers.dev/v1/data?child=adam
```

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "children": {
      "adam": {
        "money": {
          "total": "25.50",
          "totalAUD": "45.54",
          "log": [
            {
              "timestamp": "2025-11-23T12:00:00.000Z",
              "action": "add",
              "rawAmount": "10.00",
              "currency": "GBP",
              "converted": "10.00",
              "reason": "Pocket money"
            }
          ]
        },
        "points": {
          "total": 68,
          "log": [
            {
              "timestamp": "2025-11-23T12:00:00.000Z",
              "action": "add",
              "amount": 18,
              "reason": "Chores: Tidy bedroom, Finish homework",
              "source": "chores"
            }
          ]
        },
        "screen": {
          "total": 60,
          "log": [
            {
              "timestamp": "2025-11-23T12:00:00.000Z",
              "action": "add",
              "minutes": 30,
              "reason": "From points: 30 pts → 30 min (Movie night)"
            }
          ]
        },
        "chores": {
          "log": [
            {
              "timestamp": "2025-11-23T12:00:00.000Z",
              "items": [
                { "id": "tidy_room", "label": "Tidy bedroom", "points": 10 },
                { "id": "homework", "label": "Finish homework", "points": 8 }
              ]
            }
          ]
        }
      },
      "sami": {
        // Same structure
      }
    }
  },
  "meta": {
    "timestamp": "2025-11-23T12:00:00.000Z",
    "version": "v1",
    "requestId": "abc-123-def"
  }
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      // Additional error details (dev mode only)
    }
  },
  "meta": {
    "timestamp": "2025-11-23T12:00:00.000Z",
    "version": "v1",
    "requestId": "abc-123-def"
  }
}
```

### Common Error Codes

| Status | Code | Description |
|--------|------|-------------|
| 400 | `VALIDATION_ERROR` | Invalid input data |
| 400 | `INSUFFICIENT_BALANCE` | Not enough balance for operation |
| 404 | `NOT_FOUND` | Resource not found |
| 415 | `INVALID_CONTENT_TYPE` | Invalid Content-Type header |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Server error |
| 500 | `KV_READ_ERROR` | KV read operation failed |
| 500 | `KV_WRITE_ERROR` | KV write operation failed |
| 504 | `TIMEOUT` | Request timeout |

---

## Performance Targets

### Response Times
- **p50**: < 50ms
- **p99**: < 200ms

### Monitoring Headers
All responses include:
- `X-Request-ID`: Unique request identifier
- `X-Response-Time`: Response time in milliseconds

---

## Rate Limiting

### Strategy
- **Window**: 1 minute sliding window
- **Limit**: 100 requests per IP
- **Storage**: Cloudflare KV with 2-minute TTL

### Response Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 85
X-RateLimit-Reset: 2025-11-23T12:01:00.000Z
```

### 429 Response
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "details": {
      "limit": 100,
      "window": "1 minute",
      "retryAfter": 42
    }
  },
  "meta": {
    "timestamp": "2025-11-23T12:00:00.000Z",
    "version": "v1"
  }
}
```

---

## Data Storage

### KV Keys Structure

#### Money
- `total_{child}`: Current balance in GBP (string)
- `log_{child}`: Transaction history (JSON array, max 100 entries)

#### Points
- `points:total:{child}`: Current points balance (string)
- `points:log:{child}`: Points history (JSON array, max 100 entries)

#### Screen Time
- `screen:total:{child}`: Total minutes (string)
- `screen:log:{child}`: Screen time history (JSON array, max 100 entries)

#### Chores
- `chores:log:{child}`: Chores history (JSON array, max 50 entries)

#### Rate Limiting
- `ratelimit:{ip}`: Rate limit state (JSON, 2-minute TTL)

---

## Best Practices

### Request Headers
```
Content-Type: application/json
Accept: application/json
```

### Error Handling
Always check the `success` field in responses:
```javascript
const response = await fetch('/v1/transaction', {...});
const data = await response.json();

if (!data.success) {
  console.error(`Error: ${data.error.code} - ${data.error.message}`);
  return;
}

// Handle success
console.log('Transaction successful:', data.data);
```

### Idempotency
POST endpoints are **not** idempotent. Duplicate requests will create duplicate transactions.

### Timeouts
All requests have a 10-second timeout. Long-running operations will return 504.

---

## Development

### Local Development
```bash
npm run dev:worker
```

### Testing
```bash
npm run test:worker
```

### Deployment
```bash
# Staging
npm run deploy:worker:staging

# Production
npm run deploy:worker:production
```

---

## Versioning

Current version: **v1**

All endpoints are prefixed with `/v1/` for future compatibility.

### Legacy Support
Old endpoints redirect to v1:
- `/transaction` → `/v1/transaction` (301)
- `/chores` → `/v1/chores` (301)
- `/redeem` → `/v1/redeem` (301)

---

## Support

For issues or questions, please open an issue on GitHub.
