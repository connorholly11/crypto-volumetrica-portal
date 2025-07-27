# Debug Notes - API Integration Issues

## Current Issues

### 1. AccountStatus Import Error ✅ FIXED
- **Error**: `ReferenceError: AccountStatus is not defined`
- **Cause**: Using `import type` instead of regular import for enum
- **Fix**: Changed to `import { AccountStatus }` in accounts/list/route.ts

### 2. User Creation Error
- **Error**: `TypeError: Cannot read properties of undefined (reading 'map')`
- **Cause**: Likely JSON parsing error or empty request body
- **Status**: Added better error handling and logging

### 3. Trading Rules API 400 Error
- **Error**: `API request failed with status 400`
- **Possible Causes**:
  - Missing required parameters
  - Invalid API endpoint
  - Authentication issue

## Testing Steps

### 1. Check API Connection
Visit: http://localhost:3000/api/test
This will show:
- API URL configuration
- API key presence
- Basic connectivity test

### 2. Check Console Logs
With the new logging, you'll see:
```
[Volumetrica Request] GET /tradingRule {params}
[Volumetrica Response] /tradingRule - Status: XXX {response}
[Volumetrica Error] Request failed: /tradingRule {error details}
```

### 3. Manual API Testing
Try these endpoints directly:
- GET http://localhost:3000/api/trading-rules/templates (should work)
- GET http://localhost:3000/api/accounts/list (check for 500)
- POST http://localhost:3000/api/users/create (with valid JSON body)

## About Real vs Placeholder Data

### REAL Data (from Volumetrica API):
- ✅ User creation - Creates real users in staging
- ✅ Account creation - Creates real accounts
- ✅ Account balances - Real account data
- ✅ Trading rules - Real rules applied to accounts
- ✅ Account status - Real-time from API

### PLACEHOLDER Data:
- ❌ Performance charts - Mock data for now
- ❌ Trade history - Not implemented yet
- ❌ Some metrics - Calculated locally

## Common Solutions

### If API returns 400:
1. Check request parameters match API docs
2. Verify API key is correct
3. Check if endpoint requires specific headers

### If API returns 500:
1. Check request body format
2. Verify all required fields present
3. Check for type mismatches

### If JSON parsing fails:
1. Ensure request has Content-Type: application/json
2. Check body is valid JSON
3. Verify body isn't empty

## Next Debugging Steps

1. **Visit /api/test** to check basic connectivity
2. **Check browser console** for detailed logs
3. **Try creating user with cURL**:
```bash
curl -X POST http://localhost:3000/api/users/create \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "country": "US"
  }'
```

4. **Check Volumetrica API directly** (if you have Postman/Insomnia):
```
GET https://staging-api.volumetricafx.com/api/v2/propsite/tradingRule
Headers: x-api-key: [your-key]
```