# API Reference and External Integrations

## Table of Contents
1. [API Routes Documentation](#api-routes-documentation)
2. [External Integrations](#external-integrations)

## API Routes Documentation

### Authentication
All API routes require authentication via Clerk. Include the session cookie or Authorization header.

### Rate Limiting
- **Default**: 10 requests per 10 seconds per user
- **Implemented via**: Upstash Redis
- **Error Response**: 429 Too Many Requests

### API Endpoints

#### User Management

##### POST /api/admin/users/create
Create a new user in Volumetrica and local database.

**Request**:
```json
{
  "email": "trader@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "country": "USA",
  "phone": "+1234567890"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "clk123...",
    "volumetricaId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "trader@example.com"
  },
  "message": "User created successfully"
}
```

##### POST /api/users/login-url
Generate a one-time login URL for a user.

**Request**:
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "loginUrl": "https://app.volumetrica.com/auth/login/token/abc123..."
  }
}
```

#### Account Management

##### POST /api/accounts/create
Create a new trading account.

**Request**:
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "header": "Main Trading Account",
  "initialBalance": 100000,
  "currency": 1,  // 0=EUR, 1=USD
  "portfolioMode": 0,
  "tradingRuleId": "rule123"
}
```

##### GET /api/accounts
Get cached account list with recent sync data.

**Response**:
```json
{
  "success": true,
  "accounts": [
    {
      "accountId": "acc123",
      "name": "Main Trading Account",
      "balance": "100000.00",
      "currency": "USD",
      "status": 1,
      "lastSync": "2024-01-27T10:00:00Z"
    }
  ],
  "user": {
    "volumetricaId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

##### GET /api/accounts/list
Get full account details from Volumetrica (non-cached).

**Query Parameters**:
- `userId`: Filter by user ID
- `status`: Filter by account status
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

##### POST /api/accounts/{accountId}/enable
Enable a disabled account.

##### POST /api/accounts/{accountId}/disable
Disable an active account.

**Request**:
```json
{
  "reason": "Risk limit exceeded"
}
```

#### Trading Rules

##### POST /api/trading-rules/create
Create a new trading rule configuration.

**Request**:
```json
{
  "name": "Conservative Strategy",
  "maxDrawdown": {
    "enabled": true,
    "percentage": 10,
    "action": 0  // Disable account
  },
  "intradayDrawdown": {
    "enabled": true,
    "percentage": 5,
    "action": 1  // Alert only
  },
  "maxDailyTrades": 50
}
```

##### GET /api/trading-rules/{ruleId}
Get trading rule details.

#### System Operations

##### GET /api/cron/sync-accounts
Trigger account synchronization (protected by cron secret).

**Headers**:
```
Authorization: Bearer {CRON_SECRET}
```

### Error Responses

Standard error format:
```json
{
  "success": false,
  "message": "Human-readable error message",
  "details": ["Additional error details"],
  "code": "ERROR_CODE"
}
```

Common status codes:
- 400: Bad Request (validation errors)
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Too Many Requests
- 500: Internal Server Error

## External Integrations

### Volumetrica API Integration

#### Client Configuration
Located in `/src/lib/volumetrica/client.ts`:

```typescript
const client = axios.create({
  baseURL: process.env.VOLUMETRICA_API_URL,
  timeout: 30000,
  headers: {
    'x-api-key': process.env.VOLUMETRICA_API_KEY,
    'Content-Type': 'application/json'
  }
});
```

#### Key Features

1. **Retry Logic**:
   - Exponential backoff: 1s, 2s, 4s
   - Max 3 retry attempts
   - Retries on network errors and 5xx responses

2. **Error Handling**:
   ```typescript
   class VolumetricaError extends Error {
     statusCode: number;
     details: any;
     code?: string;
   }
   ```

3. **Request/Response Logging**:
   - Logs all requests and responses
   - Sanitizes sensitive data (API keys, passwords)
   - Tracks request duration

#### Available Methods

```typescript
volumetricaApi.users.create(userData)
volumetricaApi.users.loginUrl({ userId })
volumetricaApi.users.get(userId)

volumetricaApi.accounts.create(accountData)
volumetricaApi.accounts.list({ userId, page, limit })
volumetricaApi.accounts.get(accountId)
volumetricaApi.accounts.enable(accountId)
volumetricaApi.accounts.disable(accountId, reason)

volumetricaApi.tradingRules.create(ruleData)
volumetricaApi.tradingRules.get(ruleId)
```

### Clerk Authentication

#### Middleware Protection
```typescript
import { auth } from '@clerk/nextjs/server';

export function requireAuth(): string {
  const { userId } = auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }
  return userId;
}
```

#### User Mapping
- Clerk ID → Local User ID → Volumetrica User ID
- Mapping stored in local database
- Created during user registration

### Webhook Handling

Future implementation for real-time updates:
```typescript
// Expected webhook events
interface WebhookEvent {
  id: string;
  type: 'account.updated' | 'account.status_changed' | 'trade.executed';
  timestamp: string;
  data: any;
}
```