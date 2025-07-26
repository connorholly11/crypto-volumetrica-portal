# Testing Guide - Crypto Volumetrica Portal

## Overview

Yes, the admin portal should be fully functional! You can create accounts, manage users, and set trading rules. This guide explains how to test everything and verify data in Volumetrica.

## Current Functionality Status

### ✅ What Works
1. **User Creation** - Creates users in Volumetrica (returns userId, username, password)
2. **Account Creation** - Creates trading accounts with rules
3. **Account Management** - Enable/disable accounts
4. **Trading Rules** - Create and manage trading rules
5. **Real-time Data** - Auto-refresh every 30 seconds
6. **Account Listing** - View all accounts with balances

### ❌ What Doesn't Work (API Limitations)
1. **User Profile Fetching** - Cannot retrieve user details after creation
2. **User Updates** - Cannot modify user information
3. **User Deletion** - No delete endpoint exists
4. **User Listing** - Cannot get list of all users
5. **User Search** - No search by email/name

### ⚠️ Important Notes
- Using Volumetrica staging API (not production)
- No authentication yet (prototype phase)
- **Store user data locally** when created (Volumetrica won't return it later)
- User details (name, email) only available at creation time

## Testing Workflow

### 1. Start the Application
```bash
npm run dev
```
Visit: http://localhost:3000

### 2. Admin Portal Testing

#### Create a New User
1. Go to http://localhost:3000/admin
2. Click "User Management" tab
3. Click "Create New User"
4. Fill in:
   - First Name: Test
   - Last Name: Trader
   - Email: test@example.com
   - Country: US
5. Click "Create User"
6. **Save ALL returned data** (userId, username, password)
   - ⚠️ **IMPORTANT**: You cannot fetch user details later!
   - Store this data in your own system

#### Create a Trading Account
1. In Admin Dashboard, go to "Create Account" tab
2. Step 1 - User Details:
   - Use the userId from above OR
   - Create a new user inline
3. Step 2 - Account Configuration:
   - Balance: 100000
   - Currency: USD
   - Account Mode: Evaluation (0)
4. Step 3 - Trading Rules:
   - Select a template (e.g., "$100K Standard Challenge")
   - OR create custom rules
5. Click "Create Account"
6. **Save the returned accountId**

#### Verify Account Creation
1. Go to "Accounts Overview" tab
2. You should see your new account listed
3. Check the status, balance, and rules

### 3. Trader Portal Testing

#### View Account Details
1. Go to http://localhost:3000/trader/[userId]
   - Replace [userId] with the actual user ID
2. You should see:
   - Account balance and equity
   - P&L metrics
   - Drawdown progress
   - Trading rules

#### Test Real-time Updates
1. Keep the trader dashboard open
2. In admin portal, disable/enable the account
3. Watch the trader dashboard update (30-second refresh)

### 4. API Testing with cURL

#### Get User's Accounts
```bash
# Note: Cannot fetch user profile details
curl "http://localhost:3000/api/accounts/list?userId=[userId]"
```

#### Get Account Details
```bash
curl http://localhost:3000/api/accounts/[accountId]
```

#### List All Accounts
```bash
curl http://localhost:3000/api/accounts/list
```

#### Create User via API
```bash
curl -X POST http://localhost:3000/api/users/create \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "API",
    "lastName": "Test",
    "email": "api@test.com",
    "country": "US"
  }'
```

## Verifying Data in Volumetrica

### Using Volumetrica's Admin Panel
If you have access to Volumetrica's staging admin panel:
1. Log in to their admin dashboard
2. Check Users section for created users
3. Check Accounts section for created accounts
4. Verify trading rules are applied correctly

### Using Our API Endpoints
Working endpoints that mirror Volumetrica's data:
- `/api/accounts/[accountId]` - Real-time account data
- `/api/accounts/list` - List all accounts (with optional userId filter)
- `/api/trading-rules/list` - Shows all rules in system
- `/api/users/create` - Creates user (returns all user data)

**Note**: No endpoint to fetch user profiles - store data when created!

## Common Test Scenarios

### 1. Full Account Creation Flow
```
1. Create User → Get userId
2. Create Account with userId → Get accountId
3. View in Trader Dashboard
4. Disable in Admin
5. See status change in Trader view
```

### 2. Risk Testing
```
1. Create account with low drawdown limit (5%)
2. Note: Actual trading would trigger warnings
3. Check visual indicators change colors
```

### 3. Multi-Account Testing
```
1. Create multiple accounts for one user
2. List accounts filtered by userId
3. Verify all show in trader dashboard
```

## Troubleshooting

### "User not found" Error
- This happens when trying to fetch user profile (endpoint doesn't exist)
- Store user data locally when created
- Use the userId for account operations only

### "Account not found" Error
- Verify accountId exists
- Check account status (might be disabled)

### Templates not loading
- Fixed in this update
- Should now show 5 pre-configured templates

### API Errors
- Check browser console for details
- Verify `.env.local` has correct API key
- Ensure Volumetrica staging API is accessible

## Data Persistence

- **Trading data is stored in Volumetrica** (accounts, balances, rules)
- **User profiles are NOT retrievable** from Volumetrica after creation
- **No database** in our app (prototype phase)
- **Real-time fetching** for account data only
- **Changes persist** in Volumetrica
- **Must store user details locally** when created

## Next Steps for Full Production

1. **User Database** - Store user profiles locally (REQUIRED!)
2. **Authentication** - Add user login system
3. **Webhooks** - Real-time updates from Volumetrica
4. **Caching** - Redis for frequently accessed data
5. **Audit Logs** - Track all admin actions
6. **Production API** - Switch from staging

See `/rules-docs-agents/post-proto.md` for detailed roadmap!

## Quick Test Checklist

- [ ] Create a user - verify userId returned
- [ ] Create an account - verify accountId returned
- [ ] View account in admin table
- [ ] Access trader dashboard with userId
- [ ] Disable account in admin
- [ ] See status change in trader view
- [ ] Re-enable account
- [ ] Create custom trading rule
- [ ] Apply rule to new account

The portal is fully functional for testing with Volumetrica's staging environment!