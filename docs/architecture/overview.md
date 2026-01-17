# Crypto-Volumetrica Architecture Documentation

## Table of Contents
1. [Project Structure](#project-structure)
2. [Architecture Overview](#architecture-overview)
3. [Core Components](#core-components)
4. [Configuration](#configuration)

## Project Structure

The project follows a well-organized Next.js 15 application structure with TypeScript:

```
crypto-vol-integration/
├── src/                           # Source code
│   ├── app/                      # Next.js App Router pages and API routes
│   │   ├── admin/               # Admin dashboard pages
│   │   ├── api/                 # API route handlers
│   │   ├── trader/              # Trader dashboard pages
│   │   ├── sign-in/             # Clerk authentication pages
│   │   └── sign-up/
│   ├── components/              # React components
│   │   ├── admin/              # Admin-specific components
│   │   ├── trader/             # Trader-specific components
│   │   └── ui/                 # Reusable UI components (shadcn/ui)
│   ├── hooks/                   # Custom React hooks
│   ├── lib/                     # Utilities and services
│   │   ├── data/               # Static data (countries, states)
│   │   └── volumetrica/        # Volumetrica API client
│   └── types/                   # TypeScript type definitions
├── prisma/                      # Database schema and migrations
├── public/                      # Static assets
├── tests/                       # Test suites
│   ├── unit/                   # Unit tests
│   ├── integration/            # Integration tests
│   └── e2e/                    # End-to-end tests
├── volumetrica/                 # API documentation
├── rules-docs-agents/           # Project documentation
└── Protos/                      # Protocol buffer definitions
```

### Key Directories

- `src/app/`: Uses Next.js 15's App Router for routing and API endpoints
- `src/components/ui/`: Shared UI components based on shadcn/ui design system
- `src/lib/volumetrica/`: Contains the custom Volumetrica API client with retry logic
- `prisma/`: Database schema for local user management and caching

## Architecture Overview

### Tech Stack

**Frontend:**
- **Next.js 15.4.4**: React framework with App Router
- **TypeScript 5**: Type-safe development
- **Tailwind CSS 4**: Utility-first CSS framework
- **shadcn/ui**: Pre-built accessible UI components
- **React Query (TanStack Query)**: Server state management
- **React Hook Form + Zod**: Form handling and validation
- **Recharts**: Data visualization
- **TanStack Table**: Advanced table functionality

**Backend/Services:**
- **Next.js API Routes**: Backend API endpoints
- **Prisma ORM**: Database abstraction layer
- **PostgreSQL**: Primary database
- **Clerk**: Authentication service
- **Volumetrica API**: External trading platform integration
- **Sentry**: Error tracking and monitoring
- **Upstash**: Rate limiting with Redis

### Design Patterns

1. **Component Architecture**:
   - Server Components by default (Next.js 15)
   - Client Components marked with `'use client'`
   - Compound component pattern for complex UI (forms, tables)
   - Composition over inheritance

2. **State Management**:
   - React Query for server state
   - Local state with React hooks
   - Form state with React Hook Form
   - No global client state management (Redux/Zustand not used)

3. **API Design**:
   - RESTful API routes in `/api`
   - Consistent response format with `success`, `data`, `message`
   - Error handling with custom `VolumetricaError` class
   - Rate limiting on all endpoints

4. **Type Safety**:
   - Comprehensive TypeScript types in `/src/types`
   - Zod schemas for runtime validation
   - Prisma-generated types for database models

### Data Flow Architecture

1. **Client → API Route → Volumetrica API**:
   ```
   React Component
     ↓ (React Query hook)
   API Route Handler
     ↓ (Volumetrica Client)
   Volumetrica API
     ↓
   Response Processing
     ↓
   UI Update
   ```

2. **Authentication Flow**:
   - Clerk handles user authentication
   - API routes verify auth with `requireAuth()`
   - User mapping between Clerk and Volumetrica IDs

3. **Caching Strategy**:
   - React Query handles client-side caching
   - 1-minute stale time, 10-minute cache time
   - Real-time data refreshes every 30 seconds for accounts

## Core Components

### Server vs Client Components

**Server Components** (default):
- Page components (`page.tsx`)
- Layout components (`layout.tsx`)
- Data fetching components
- Static UI components

**Client Components** (`'use client'`):
- Interactive forms (`AccountCreationForm.tsx`)
- Charts and visualizations (`PerformanceMetrics.tsx`)
- Tables with sorting/filtering (`AccountsTable.tsx`)
- Components using hooks or browser APIs

### Shared Components (`/src/components/ui/`)

Based on shadcn/ui, providing consistent design:
- **button.tsx**: Configurable button with variants
- **card.tsx**: Container component for content sections
- **dialog.tsx**: Modal dialogs
- **form.tsx**: Form wrapper with React Hook Form integration
- **table.tsx**: Responsive table component
- **alert.tsx**: Alert messages and notifications
- **loading-spinner.tsx**: Loading states
- **error-boundary.tsx**: Error handling wrapper

### Custom Hooks (`/src/hooks/`)

1. **use-accounts.ts**:
   - `useAccount()`: Fetch single account
   - `useAccounts()`: Fetch account list with filters
   - `useCreateAccount()`: Create new account mutation
   - `useEnableAccount()`: Enable account mutation
   - `useDisableAccount()`: Disable account mutation

2. **use-users.ts**:
   - `useUser()`: Fetch user details
   - `useUsers()`: Fetch user list
   - `useCreateUser()`: Create user mutation

3. **use-trading-rules.ts**:
   - `useTradingRules()`: Fetch trading rules
   - `useCreateTradingRule()`: Create rule mutation

### Type Definitions (`/src/types/volumetrica.ts`)

Comprehensive TypeScript types for:
- API response wrappers
- User management types
- Trading account types
- Trading rules and risk parameters
- Enums for statuses, modes, and actions
- Webhook event types
- Utility types for pagination

## Configuration

### Environment Variables

Required environment variables (`.env.local`):
```bash
# Database
DATABASE_URL="postgresql://..."

# Volumetrica API
VOLUMETRICA_API_URL="https://staging.volumetrica.com"
VOLUMETRICA_API_KEY="your-api-key"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Sentry Monitoring
SENTRY_DSN="https://..."
SENTRY_ORG="your-org"
SENTRY_PROJECT="your-project"

# Redis (Upstash)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."
```

### Build Configuration

**next.config.ts**:
- Sentry integration for error tracking
- Instrumentation hook enabled
- Source map configuration for production

**tsconfig.json**:
- Strict mode enabled
- Path alias `@/*` for `src/*`
- Target ES2017 for compatibility

**tailwind.config.js**:
- Custom theme extensions
- shadcn/ui preset
- Responsive breakpoints

### Package Dependencies

Key dependencies:
- **@clerk/nextjs**: Authentication
- **@prisma/client**: Database ORM
- **@radix-ui/***: Headless UI components
- **@tanstack/react-query**: Server state management
- **@sentry/nextjs**: Error monitoring
- **axios**: HTTP client for API calls
- **zod**: Schema validation

## Best Practices and Conventions

1. **File Naming**:
   - Components: PascalCase (`AccountCreationForm.tsx`)
   - Utilities: camelCase (`volumetricaClient.ts`)
   - API routes: lowercase (`route.ts`)

2. **Component Structure**:
   - Props interfaces defined above component
   - Destructured props in function parameters
   - Explicit return types for complex components

3. **Error Handling**:
   - Custom error classes for API errors
   - Consistent error response format
   - User-friendly error messages with toast notifications

4. **Code Organization**:
   - Related components grouped in folders
   - Shared utilities in `/lib`
   - Type definitions centralized in `/types`

5. **Performance**:
   - Server components used by default
   - Client components only when necessary
   - Optimistic updates with React Query
   - Debounced search inputs

This architecture provides a scalable, maintainable foundation for the crypto trading portal, with clear separation of concerns, type safety, and excellent developer experience.