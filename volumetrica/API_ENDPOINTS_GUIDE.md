# Volumetrica API Endpoints Guide

**Last Updated: July 26, 2025**  
**Purpose**: Complete reference for developers and AI agents working with Volumetrica's APIs

## 🚨 Critical Information

### There is NO GET /user/{userId} endpoint!
- **This endpoint does not exist** in any Volumetrica API
- Store user data when created - don't try to fetch it later
- Use `GetUserAccounts` to get a user's trading accounts

## 📊 API Overview

Volumetrica provides THREE distinct API sets:

### 1. Management API (REST)
- **Base URL**: `https://staging-api.volumetricafx.com/api/v2/propsite`
- **Purpose**: User/account creation and management
- **Auth**: Header `x-api-key: {your-api-key}`
- **What we use**: This is our primary API

### 2. Historical API (REST)
- **Base URL**: `https://staging-api.volumetricafx.com/api/historical`
- **Purpose**: Trade history, reports, historical data
- **Auth**: Different token from trading token generation
- **Note**: Not used in our current implementation

### 3. Trading WebSocket API
- **Protocol**: WebSocket + Protobuf
- **Purpose**: Real-time trading, order placement
- **Auth**: Requires trading token from `/generateTradingToken`
- **Note**: Not used - traders use Volumetrica's platforms

## ✅ Working Endpoints (Tested & Verified)

### User Management

#### Create User
```bash
POST /api/v2/propsite/user
# Or simplified: POST /user

Body:
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "country": "US"
}

Returns:
{
  "success": true,
  "data": {
    "userId": "uuid-here",
    "username": "generated-username",
    "password": "generated-password",
    "encryptionMode": 0
  }
}
```

#### Generate Login URL
```bash
POST /api/v2/propsite/user/loginurl
# Or simplified: POST /user/loginurl

Body:
{
  "userId": "user-uuid"
}

Returns:
{
  "success": true,
  "data": {
    "loginUrl": "https://..." # May be empty in staging
  }
}
```

#### Get User's Accounts
```bash
GET /api/Propsite/GetUserAccounts?userId={userId}

Returns: Array of trading accounts
[]  # Empty if no accounts
```

### Trading Account Management

#### List All Accounts
```bash
GET /api/v2/propsite/tradingAccount
# Or simplified: GET /tradingAccount

Query params:
- page: number (optional)
- pageSize: number (optional)

Returns:
{
  "success": true,
  "data": {
    "totalCount": 10,
    "accounts": [...]
  }
}
```

#### Create Trading Account
```bash
POST /api/v2/propsite/tradingAccount
# Or simplified: POST /tradingAccount

Body:
{
  "userId": "user-uuid",
  "balance": 100000,
  "currency": 1,  # 0=EUR, 1=USD
  "mode": 0,      # 0=Evaluation, 1=SimFunded, etc.
  "accountRuleId": "rule-uuid"  # Or use accountCustomRule
}

Returns:
{
  "success": true,
  "data": {
    "accountId": "account-uuid",
    "status": 1,  # 1=Enabled
    ...
  }
}
```

#### Enable/Disable Account
```bash
POST /api/v2/propsite/tradingAccount/Enable
POST /api/v2/propsite/tradingAccount/Disable

Body:
{
  "accountId": "account-uuid",
  "forceClose": true,  # For disable
  "reason": "Manual disable"
}
```

### Trading Rules

#### Get Templates
```bash
GET /trading-rules/templates  # Custom endpoint we created

Returns pre-configured templates for quick setup
```

#### List Trading Rules
```bash
GET /api/v2/propsite/tradingRule
# Or simplified: GET /tradingRule
```

#### Create Trading Rule
```bash
POST /api/v2/propsite/tradingRule
# Or simplified: POST /tradingRule

Body: Complex object with risk parameters
```

## ❌ Non-Existent Endpoints (Don't Use!)

These endpoints **DO NOT EXIST** - don't waste time trying:

1. `GET /user/{userId}` - No user profile fetch endpoint
2. `PUT /user/{userId}` - No user update endpoint
3. `DELETE /user/{userId}` - No user deletion endpoint

## 🔄 Response Format

All Volumetrica API responses follow this format:

```json
{
  "success": boolean,
  "data": object,      // Only if success=true
  "statusCode": number,  // Only if success=false
  "message": string,     // Only if success=false
  "details": string[]    // Only if success=false, optional
}
```

## 🛠️ Implementation Notes

### Our API Client Location
- File: `/src/lib/volumetrica/client.ts`
- Handles auth headers automatically
- Implements retry logic
- Parses response wrapper

### API Routes Pattern
All our API routes follow this pattern:
```
/src/app/api/[resource]/[action]/route.ts
```

Examples:
- `/api/users/create/route.ts`
- `/api/accounts/list/route.ts`
- `/api/trading-rules/templates/route.ts`

### Error Handling

Common error responses:

1. **401 Unauthorized**
   - Invalid or missing API key
   - Check `.env.local` for `VOLUMETRICA_API_KEY`

2. **400 Bad Request**
   - Invalid request body
   - Check Zod validation schemas

3. **404 Not Found**
   - Endpoint doesn't exist
   - Check you're using correct base URL

4. **500 Internal Server Error**
   - Volumetrica server issue
   - Or unexpected response format

## 📝 Key Learnings

1. **Store User Data on Creation**
   - There's no way to fetch user profile later
   - Save userId, username, password when created

2. **Use Correct Base URLs**
   - Some endpoints need `/api/v2/propsite` prefix
   - Some work without it (our client handles this)

3. **Account Status Values**
   ```
   0 = Initialized
   1 = Enabled
   2 = ChallengeSuccess
   4 = ChallengeFailed
   8 = Disabled
   ```

4. **Currency Codes**
   ```
   0 = EUR
   1 = USD (recommended)
   ```

5. **Account Modes**
   ```
   0 = Evaluation (what we use)
   1 = SimFunded
   2 = Funded
   3 = Live
   4 = Trial
   5 = Contest
   100 = Training
   ```

## 🧪 Testing Tips

### Quick Test Commands

Test user creation:
```bash
curl -X POST http://localhost:3000/api/users/create \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@example.com","country":"US"}'
```

Test environment:
```bash
curl http://localhost:3000/api/test
```

### Integration Test Location
- `/tests/integration/api/volumetrica-integration.test.ts`
- Run: `npm run test:integration`

## 🚀 Next Steps for Developers

1. **Don't implement user profile fetching** - it doesn't exist
2. **Focus on account and trading rule management** - all endpoints work
3. **Use the test suite** to verify endpoints
4. **Check `/volumetrica/platform.md`** for detailed field descriptions
5. **Store critical data locally** when received from creation endpoints

## 📞 Support

If you discover new endpoints or issues:
1. Test with curl first
2. Check the live Swagger: https://staging-api.volumetricafx.com/swagger
3. Update this document
4. Commit changes with clear description

Remember: When in doubt, test with curl!