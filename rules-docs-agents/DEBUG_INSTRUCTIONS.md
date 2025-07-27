# Debug Instructions - API Integration

## Current Issue
"Failed to execute 'json' on 'Response': Unexpected end of JSON input"

This means the server is returning an empty response body.

## Step 1: Test Basic Connectivity

1. Open your browser console (F12)
2. Visit: http://localhost:3000/api/test
3. Check the response - it should show API configuration

## Step 2: Test User Creation Endpoint

Try this in your terminal:
```bash
curl -X POST http://localhost:3000/api/test-user \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@example.com","country":"US"}'
```

This will show:
- If body parsing works
- If environment variables are loaded
- What the server receives

## Step 3: Check Console Logs

When you try to create a user in the UI, look for these logs in your **terminal** (not browser):

```
[User Create] Request received
[User Create] Content-Type: ...
[User Create] Request body: ...
[User Create] API URL: ...
[User Create] Has API Key: ...
[Volumetrica Request] POST /user ...
[Volumetrica Response] /user - Status: ...
```

## Step 4: Common Fixes

### If API URL is undefined:
1. Check `.env.local` file exists
2. Restart the dev server: `npm run dev`
3. Make sure variables start with `VOLUMETRICA_`

### If you see "Empty response":
1. The Volumetrica API might be returning nothing
2. Check if API key is valid
3. Try the test endpoint first

### If JSON parsing fails:
1. Check what's in the response body
2. Look for HTML error pages (often CORS issues)

## Step 5: Test Volumetrica Directly

If still having issues, test Volumetrica API directly:

```bash
curl -X GET https://staging-api.volumetricafx.com/api/v2/propsite/tradingRule \
  -H "x-api-key: YOUR_API_KEY_HERE"
```

Replace YOUR_API_KEY_HERE with your actual key from .env.local

## What the Logs Tell Us

- **[AccountCreation] logs** = Frontend/UI
- **[User Create] logs** = API endpoint
- **[Volumetrica] logs** = API client
- **[Test User] logs** = Test endpoint

## Quick Test Flow

1. Try `/api/test-user` first (simplest)
2. Check environment variables are loaded
3. Try creating a user through UI
4. Check terminal logs (not browser)
5. Look for specific error messages

The extensive logging will show exactly where the process fails!