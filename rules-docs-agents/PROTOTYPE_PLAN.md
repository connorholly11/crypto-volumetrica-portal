# Volumetrica Crypto Trading Portal - Prototype Plan

## Overview
A simplified prototype portal for prop firm crypto trading management integrated with Volumetrica's platform. This prototype focuses on essential functionality without authentication or data persistence.

## Current Project Status
- ✅ Next.js project initialized with TypeScript
- ✅ Tailwind CSS configured
- ✅ Project structure set up in `/crypto-vol-integration`
- ⏳ Ready to implement API integration and UI components

## Tech Stack Decision

### Why Next.js with API Routes (No Separate Backend)
- **Simpler Architecture**: Everything in one codebase
- **Perfect for Prototype**: Faster to develop and iterate
- **API Routes Handle**: Proxying requests to Volumetrica, hiding API keys from frontend
- **Easy Deployment**: Single app to deploy on Vercel

### Why No Database (For Now)
You're correct - we don't need a database for the prototype because:
- All data comes from Volumetrica's API
- Account status, balances, metrics are fetched real-time
- No need to store user sessions without auth

**Future Considerations** (post-prototype):
- Database might be needed for: caching frequently accessed data, storing user preferences, audit logs, webhook event history

## Simplified Tech Stack

```
Frontend: Next.js 15.4.4 with TypeScript (✅ Installed)
Styling: Tailwind CSS v4 (✅ Installed) + shadcn/ui (⏳ To be added)
API Integration: Next.js API Routes
Deployment: Vercel (free tier works)
State Management: React Query for API caching (⏳ To be added)
Additional: Zod for validation, Axios for API calls (⏳ To be added)
```

## Environment Variables

Create `.env.local` file in project root:
```env
VOLUMETRICA_API_URL=https://staging-api.volumetricafx.com
VOLUMETRICA_API_KEY=rUVFBQaSQnY6QmU2HzXPeOVqfdrpiupPfmjdZSwX9eitqewTNFRQAK6LgW96RWz4
```

## Prototype Features

### 1. Trader Dashboard (/trader/[userId])
- **Account Overview Card**
  - Current Balance & Equity (real-time from Volumetrica)
  - Daily/Total P&L with percentage change
  - Drawdown status visualization (% from limit with color coding)
  - Profit target progress bar (e.g., "$8,234 / $10,000 - 82.3%")
  - Account status badge (Enabled/Challenge Success/Failed)
  - Days traded counter
  
- **Performance Metrics**
  - Win rate percentage
  - Average winning/losing trade
  - Number of trading days completed
  - Best/worst day performance
  - Total trades count
  
- **Trading Rules Display**
  - Maximum drawdown limit ($X or X%)
  - Daily loss limit with reset time
  - Profit target requirement
  - Minimum trading days (X/Y completed)
  - Overnight/overweek restrictions
  - Max position limits

- **Quick Actions**
  - Copy account number/credentials
  - Generate platform login URL (OTP)
  - Download performance report (future)

### 2. Admin Dashboard (/admin)
- **Account Creation Workflow**
  - Step 1: User creation or selection
    - Create new dedicated user (auto-generates username)
    - Input: firstName, lastName, email, country
    - Option to set custom password or auto-generate
  - Step 2: Account configuration
    - Account type: Evaluation (mode 0)
    - Starting balance (e.g., $100,000)
    - Currency: USD
    - Portfolio mode: Netting
    - Description/notes field
  - Step 3: Trading rules
    - Select from templates or create custom
    - Preview rule parameters
  - One-click creation with success notification
  
- **Active Accounts Overview**
  - Real-time data table with:
    - Account ID/Header
    - User name
    - Balance/Equity/Floating P&L
    - Daily/Total P&L
    - Drawdown % (color-coded)
    - Status (with reason if failed)
    - Last activity timestamp
  - Filters: By status, rule, date range
  - Quick actions: Enable/Disable/View details
  
- **Trading Rules Templates**
  - Pre-configured templates:
    - "$100K Standard Challenge" (10% profit, 5% daily, 10% max DD)
    - "$50K Aggressive" (8% profit, 4% daily, 8% max DD)
    - "$200K Conservative" (10% profit, 5% daily, 12% max DD)
  - Custom rule builder with all parameters
  - Visual preview of rule impact
  
- **User Management**
  - List all organization users
  - View user's associated accounts
  - Generate/reset passwords
  - Copy login credentials

## API Integration Approach

### Volumetrica API Endpoints Used
- **Base URL**: `https://staging-api.volumetricafx.com/api/v2/propsite`
- **Authentication**: Header `x-api-key: {API_KEY}`

### Next.js API Routes Structure
```
/api/
  /users/
    - create/route.ts              # POST - Create dedicated user
    - [userId]/route.ts            # GET - Get user details
    - login-url/route.ts           # POST - Generate OTP login URL
  
  /accounts/
    - create/route.ts              # POST - Create trading account
    - [accountId]/route.ts         # GET - Get account real-time data
    - list/route.ts                # GET - List all accounts
    - [accountId]/enable/route.ts  # POST - Enable account
    - [accountId]/disable/route.ts # POST - Disable account
  
  /trading-rules/
    - create/route.ts              # POST - Create trading rule
    - list/route.ts                # GET - List all rules
    - [ruleId]/route.ts            # GET/PUT - Get/update rule
    - templates/route.ts           # GET - Get rule templates
  
  /symbols/
    - list/route.ts                # GET - Get available crypto symbols
```

### Response Handling Pattern
All Volumetrica responses follow this structure:
```typescript
interface VolumetricaResponse<T> {
  success: boolean;
  data?: T;              // Present if success = true
  statusCode?: number;   // Present if success = false
  message?: string;      // Present if success = false
  details?: string[];    // Present if success = false
}

### Data Fetching Patterns

#### Client-side with React Query
```typescript
// Auto-refresh account data every 30 seconds
const { data: account, isLoading, error } = useQuery({
  queryKey: ['account', accountId],
  queryFn: () => fetch(`/api/accounts/${accountId}`).then(r => r.json()),
  refetchInterval: 30000,
  retry: 3,
  retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
});

// Manual refresh button
const { refetch, isFetching } = useQuery({...});
<Button onClick={() => refetch()} disabled={isFetching}>
  {isFetching ? 'Refreshing...' : 'Refresh'}
</Button>
```

#### Server-side in API Routes
```typescript
// Example: Get account details
export async function GET(req: Request, { params }: { params: { accountId: string } }) {
  try {
    const response = await fetch(
      `${process.env.VOLUMETRICA_API_URL}/api/v2/propsite/tradingAccount/${params.accountId}`,
      {
        headers: {
          'x-api-key': process.env.VOLUMETRICA_API_KEY!,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const data = await response.json();
    
    if (!data.success) {
      return NextResponse.json(
        { error: data.message || 'Failed to fetch account' },
        { status: data.statusCode || 400 }
      );
    }
    
    return NextResponse.json(data.data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Real-time Updates
For the prototype, we'll use:
- **Polling**: Refresh data every 30 seconds
- **Manual Refresh**: Button to fetch latest data
- **No Webhooks**: Keep it simple for prototype

Post-prototype, webhooks can be added for instant updates.

## Project Structure
```
crypto-vol-integration/
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   │   ├── users/        # User management endpoints
│   │   │   ├── accounts/     # Account management endpoints
│   │   │   ├── trading-rules/# Trading rules endpoints
│   │   │   └── symbols/      # Symbol info endpoints
│   │   ├── trader/           # Trader pages
│   │   │   └── [userId]/     # Dynamic trader dashboard
│   │   ├── admin/            # Admin pages
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Home page
│   │   └── globals.css       # Global styles
│   ├── components/           # Shared components
│   │   ├── ui/              # shadcn/ui components
│   │   ├── trader/          # Trader-specific components
│   │   └── admin/           # Admin-specific components
│   ├── lib/                 # Utilities
│   │   ├── volumetrica/     # API client & types
│   │   └── utils.ts         # Helper functions
│   └── types/               # TypeScript types
├── public/                  # Static assets
├── volumetrica/            # Documentation
├── Protos/                 # Protocol files (reference only)
├── .env.local              # Environment variables
└── package.json            # Dependencies
```

## Implementation Phases

### Phase 1: Core Setup & API Client ✅ Partially Complete
- [x] Next.js project with TypeScript initialized
- [x] Tailwind CSS configured
- [ ] Install additional dependencies (React Query, Axios, Zod, shadcn/ui)
- [ ] Create Volumetrica API client with error handling
- [ ] Define TypeScript types from API documentation
- [ ] Build basic layout components and navigation

### Phase 2: API Routes Implementation
1. **User Management Routes**
   - POST `/api/users/create` - Create dedicated user
   - GET `/api/users/[userId]` - Get user details
   - POST `/api/users/login-url` - Generate OTP login URL
   
2. **Account Management Routes**
   - POST `/api/accounts/create` - Create trading account
   - GET `/api/accounts/[accountId]` - Get account with real-time data
   - GET `/api/accounts/list` - List all accounts
   - POST `/api/accounts/[accountId]/enable` - Enable account
   - POST `/api/accounts/[accountId]/disable` - Disable account

3. **Trading Rules Routes**
   - GET `/api/trading-rules/list` - List all rules
   - POST `/api/trading-rules/create` - Create new rule
   - PUT `/api/trading-rules/[ruleId]` - Update rule

### Phase 3: Trader Dashboard
1. **Account Overview Component**
   - Balance & equity display with auto-refresh
   - P&L metrics (daily/total)
   - Drawdown visualization (progress bar to limit)
   - Account status badge (color-coded)

2. **Trading Rules Component**
   - Display all active rules for account
   - Visual indicators for risk proximity
   - Countdown for minimum trading days

3. **Performance Metrics**
   - API integration for historical data
   - Charts using lightweight library (recharts)

### Phase 4: Admin Dashboard
1. **Quick Account Creation**
   - Form with validation (Zod schemas)
   - User type selection (dedicated/shared)
   - Trading rule templates dropdown
   - Success/error notifications

2. **Account Management Table**
   - Real-time data with React Query
   - Sortable/filterable columns
   - Quick actions (enable/disable/view)
   - Risk status indicators

3. **Trading Rules Manager**
   - CRUD operations for rules
   - Template system for common setups
   - Preview rule impact

### Phase 5: Polish & Production Readiness
1. **Error Handling**
   - API error boundaries
   - User-friendly error messages
   - Retry mechanisms
   - Loading skeletons

2. **Testing & Deployment**
   - Test all API endpoints
   - Verify data accuracy
   - Deploy to Vercel
   - Environment variable setup

## Additional Resources
- 🎨 **UI Components Guide**: See `UI_COMPONENTS_GUIDE.md` for detailed component examples
- 🚀 **Quick Start**: See `QUICK_START.md` for rapid setup instructions

## Next Steps
1. Confirm this simplified approach works for your prototype
2. Start with Phase 1 implementation (install dependencies)
3. Test each feature with your staging credentials
4. Iterate based on feedback

## Potential Issues & Solutions

### API Rate Limiting
- **Issue**: Volumetrica may have rate limits
- **Solution**: Implement request caching, throttling, and exponential backoff

### CORS Issues
- **Issue**: Direct frontend calls to Volumetrica will fail
- **Solution**: All API calls go through Next.js API routes (proxy pattern)

### Data Consistency
- **Issue**: Polling may show stale data between refreshes
- **Solution**: Add manual refresh button, consider WebSocket for critical data

### Error Handling
- **Issue**: Various API errors (auth, network, validation)
- **Solution**: Comprehensive error boundaries and user-friendly messages

### Account Status Changes
- **Issue**: Missing real-time updates when accounts fail
- **Solution**: More frequent polling for at-risk accounts, webhook integration later