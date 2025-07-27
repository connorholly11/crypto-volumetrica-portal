# Testing Strategy

## Table of Contents
1. [Overview](#overview)
2. [Unit Testing](#unit-testing)
3. [Integration Testing](#integration-testing)
4. [End-to-End Testing](#end-to-end-testing)
5. [Test Data Management](#test-data-management)
6. [CI/CD Integration](#cicd-integration)
7. [Best Practices](#best-practices)

## Overview

### Testing Stack
- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: Jest + Supertest
- **E2E Tests**: Playwright
- **Mocking**: MSW (Mock Service Worker)
- **Coverage**: Jest with Istanbul

### Test Structure
```
tests/
├── unit/                    # Unit tests
│   ├── components/         # React component tests
│   ├── lib/               # Utility function tests
│   └── hooks/             # Custom hook tests
├── integration/            # Integration tests
│   ├── api/               # API endpoint tests
│   └── services/          # Service integration tests
├── e2e/                   # End-to-end tests
│   ├── auth/              # Authentication flows
│   ├── trader/            # Trader workflows
│   └── admin/             # Admin workflows
├── fixtures/              # Test data
├── mocks/                 # Mock implementations
└── utils/                 # Test utilities
```

## Unit Testing

### Setup Configuration

**jest.config.js**:
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### Component Testing Example

**AccountOverviewCard.test.tsx**:
```typescript
import { render, screen } from '@testing-library/react';
import { AccountOverviewCard } from '@/components/trader/AccountOverviewCard';
import { mockAccount } from '@/tests/fixtures/accounts';

describe('AccountOverviewCard', () => {
  it('renders account information correctly', () => {
    render(<AccountOverviewCard account={mockAccount} />);
    
    expect(screen.getByText(mockAccount.header)).toBeInTheDocument();
    expect(screen.getByText('$100,000.00')).toBeInTheDocument();
    expect(screen.getByText('Enabled')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<AccountOverviewCard isLoading />);
    
    expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();
  });

  it('displays correct status badge color', () => {
    const disabledAccount = { ...mockAccount, status: 10 };
    render(<AccountOverviewCard account={disabledAccount} />);
    
    const badge = screen.getByText('Disabled');
    expect(badge).toHaveClass('bg-red-50');
  });
});
```

### Utility Function Testing

**utils.test.ts**:
```typescript
import { formatCurrency, calculateDrawdownPercentage } from '@/lib/utils';

describe('formatCurrency', () => {
  it('formats USD correctly', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
    expect(formatCurrency('1234.56')).toBe('$1,234.56');
  });

  it('formats EUR correctly', () => {
    expect(formatCurrency(1234.56, 'EUR')).toBe('€1,234.56');
  });

  it('handles invalid input', () => {
    expect(formatCurrency('invalid')).toBe('$0.00');
    expect(formatCurrency(NaN)).toBe('$0.00');
  });
});

describe('calculateDrawdownPercentage', () => {
  it('calculates drawdown correctly', () => {
    expect(calculateDrawdownPercentage(90000, 100000)).toBe(10);
    expect(calculateDrawdownPercentage(100000, 100000)).toBe(0);
  });

  it('handles edge cases', () => {
    expect(calculateDrawdownPercentage(110000, 100000)).toBe(0);
    expect(calculateDrawdownPercentage(50000, 0)).toBe(0);
  });
});
```

### Hook Testing

**use-accounts.test.ts**:
```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAccounts } from '@/hooks/use-accounts';
import { server } from '@/tests/mocks/server';
import { rest } from 'msw';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useAccounts', () => {
  it('fetches accounts successfully', async () => {
    const { result } = renderHook(() => useAccounts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data[0].accountId).toBe('acc123');
  });

  it('handles error state', async () => {
    server.use(
      rest.get('/api/accounts', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ message: 'Server error' }));
      })
    );

    const { result } = renderHook(() => useAccounts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Server error');
  });
});
```

## Integration Testing

### API Route Testing

**create-user.test.ts**:
```typescript
import { createMocks } from 'node-mocks-http';
import handler from '@/app/api/admin/users/create/route';
import { prisma } from '@/lib/prisma';
import { volumetricaApi } from '@/lib/volumetrica/client';

jest.mock('@/lib/volumetrica/client');
jest.mock('@/lib/auth', () => ({
  requireAuth: jest.fn(() => 'user123'),
  requireAdmin: jest.fn(),
}));

describe('POST /api/admin/users/create', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates user successfully', async () => {
    const mockVolumetricaUser = {
      id: 'vol123',
      email: 'test@example.com',
    };

    (volumetricaApi.users.create as jest.Mock).mockResolvedValue(mockVolumetricaUser);

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        country: 'US',
        phone: '+1234567890',
      },
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(200);
    const json = JSON.parse(res._getData());
    expect(json.success).toBe(true);
    expect(json.data.volumetricaId).toBe('vol123');

    // Verify database record
    const user = await prisma.user.findUnique({
      where: { email: 'test@example.com' },
    });
    expect(user).toBeDefined();
    expect(user?.volumetricaId).toBe('vol123');
  });

  it('validates input data', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'invalid-email',
        firstName: 'T', // Too short
      },
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(400);
    const json = JSON.parse(res._getData());
    expect(json.success).toBe(false);
    expect(json.errors).toBeDefined();
  });

  it('handles Volumetrica API errors', async () => {
    (volumetricaApi.users.create as jest.Mock).mockRejectedValue(
      new Error('Volumetrica API error')
    );

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        country: 'US',
        phone: '+1234567890',
      },
    });

    await handler(req as any, res as any);

    expect(res._getStatusCode()).toBe(500);
    const json = JSON.parse(res._getData());
    expect(json.success).toBe(false);
  });
});
```

### Database Integration Testing

**sync-accounts.test.ts**:
```typescript
import { syncUserAccounts } from '@/lib/sync-accounts';
import { prisma } from '@/lib/prisma';
import { volumetricaApi } from '@/lib/volumetrica/client';

describe('Account Synchronization', () => {
  beforeAll(async () => {
    // Setup test database
    await prisma.$executeRaw`TRUNCATE TABLE "Account" CASCADE`;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('syncs accounts from Volumetrica', async () => {
    const mockAccounts = [
      {
        accountId: 'acc1',
        header: 'Test Account 1',
        balance: 100000,
        status: 1,
      },
      {
        accountId: 'acc2',
        header: 'Test Account 2',
        balance: 50000,
        status: 1,
      },
    ];

    (volumetricaApi.accounts.list as jest.Mock).mockResolvedValue({
      accounts: mockAccounts,
    });

    const user = await prisma.user.create({
      data: {
        clerkId: 'clerk123',
        volumetricaId: 'vol123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      },
    });

    await syncUserAccounts('vol123');

    const accounts = await prisma.account.findMany({
      where: { userId: user.id },
    });

    expect(accounts).toHaveLength(2);
    expect(accounts[0].accountId).toBe('acc1');
    expect(accounts[0].balance.toString()).toBe('100000');
  });

  it('prevents concurrent syncs for same user', async () => {
    const syncPromise1 = syncUserAccounts('vol123');
    const syncPromise2 = syncUserAccounts('vol123');

    // Both should resolve to same result
    const [result1, result2] = await Promise.all([syncPromise1, syncPromise2]);
    
    // Verify API was called only once
    expect(volumetricaApi.accounts.list).toHaveBeenCalledTimes(1);
  });
});
```

## End-to-End Testing

### Playwright Configuration

**playwright.config.ts**:
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E Test Example

**trader-dashboard.spec.ts**:
```typescript
import { test, expect } from '@playwright/test';
import { loginAsTrader } from '../utils/auth';

test.describe('Trader Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTrader(page);
  });

  test('displays account overview', async ({ page }) => {
    await page.goto('/trader/dashboard');
    
    // Wait for data to load
    await page.waitForSelector('[data-testid="account-overview"]');
    
    // Verify account information is displayed
    await expect(page.locator('h1')).toContainText('Trader Dashboard');
    await expect(page.locator('[data-testid="balance"]')).toBeVisible();
    await expect(page.locator('[data-testid="status-badge"]')).toContainText('Enabled');
  });

  test('refreshes account data', async ({ page }) => {
    await page.goto('/trader/dashboard');
    
    // Get initial balance
    const initialBalance = await page.locator('[data-testid="balance"]').textContent();
    
    // Click refresh button
    await page.click('[data-testid="refresh-button"]');
    
    // Wait for loading state
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    await expect(page.locator('[data-testid="loading-spinner"]')).not.toBeVisible();
    
    // Verify data refreshed
    await expect(page.locator('[data-testid="last-updated"]')).toContainText('just now');
  });

  test('navigates between dashboard sections', async ({ page }) => {
    await page.goto('/trader/dashboard');
    
    // Navigate to performance tab
    await page.click('[data-testid="tab-performance"]');
    await expect(page.locator('[data-testid="performance-chart"]')).toBeVisible();
    
    // Navigate to rules tab
    await page.click('[data-testid="tab-rules"]');
    await expect(page.locator('[data-testid="trading-rules"]')).toBeVisible();
  });
});
```

### Admin Workflow Test

**admin-user-creation.spec.ts**:
```typescript
import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../utils/auth';

test.describe('Admin User Creation', () => {
  test('creates new user successfully', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/users/new');
    
    // Fill out user form
    await page.fill('[name="email"]', `trader${Date.now()}@example.com`);
    await page.fill('[name="firstName"]', 'Test');
    await page.fill('[name="lastName"]', 'Trader');
    await page.selectOption('[name="country"]', 'US');
    await page.fill('[name="phone"]', '+1234567890');
    
    // Submit form
    await page.click('[type="submit"]');
    
    // Wait for success message
    await expect(page.locator('[data-testid="toast"]')).toContainText('User created successfully');
    
    // Verify redirect to user list
    await expect(page).toHaveURL('/admin/users');
    await expect(page.locator('table')).toContainText('Test Trader');
  });

  test('validates required fields', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/users/new');
    
    // Try to submit empty form
    await page.click('[type="submit"]');
    
    // Check validation messages
    await expect(page.locator('[data-testid="error-email"]')).toContainText('Email is required');
    await expect(page.locator('[data-testid="error-firstName"]')).toContainText('First name is required');
  });
});
```

## Test Data Management

### Test Factories

**factories/user.factory.ts**:
```typescript
import { faker } from '@faker-js/faker';
import { User } from '@prisma/client';

export const createUser = (overrides?: Partial<User>): User => ({
  id: faker.string.uuid(),
  clerkId: `clerk_${faker.string.alphanumeric(20)}`,
  volumetricaId: faker.string.uuid(),
  email: faker.internet.email(),
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createUserInput = () => ({
  email: faker.internet.email(),
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  country: faker.helpers.arrayElement(['US', 'GB', 'DE', 'FR']),
  phone: faker.phone.number('+1##########'),
});
```

### Database Seeding

**seed.ts**:
```typescript
import { PrismaClient } from '@prisma/client';
import { createUser } from './factories/user.factory';
import { createAccount } from './factories/account.factory';

const prisma = new PrismaClient();

async function seed() {
  // Clear existing data
  await prisma.$transaction([
    prisma.account.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  // Create test users
  const users = await Promise.all(
    Array.from({ length: 5 }, async () => {
      const user = await prisma.user.create({
        data: createUser(),
      });

      // Create accounts for each user
      await Promise.all(
        Array.from({ length: 2 }, () =>
          prisma.account.create({
            data: createAccount({ userId: user.id }),
          })
        )
      );

      return user;
    })
  );

  console.log(`Seeded ${users.length} users with accounts`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Test Database Management

**package.json scripts**:
```json
{
  "scripts": {
    "test:db:setup": "dotenv -e .env.test -- prisma migrate reset --force",
    "test:db:seed": "dotenv -e .env.test -- ts-node tests/fixtures/seed.ts",
    "test:integration": "dotenv -e .env.test -- jest tests/integration",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

## CI/CD Integration

### GitHub Actions Workflow

**.github/workflows/test.yml**:
```yaml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: testpass
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Setup test database
        run: |
          npm run test:db:setup
          npm run test:db:seed
        env:
          DATABASE_URL: postgresql://postgres:testpass@localhost:5432/test_db
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:testpass@localhost:5432/test_db

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## Best Practices

### Test Organization
1. **One test file per component/module**
2. **Group related tests with describe blocks**
3. **Use descriptive test names**
4. **Follow AAA pattern**: Arrange, Act, Assert

### Test Quality
1. **Test behavior, not implementation**
2. **Keep tests independent**
3. **Use meaningful assertions**
4. **Avoid testing framework code**

### Performance
1. **Use test.concurrent for independent tests**
2. **Mock external dependencies**
3. **Reuse test data when possible**
4. **Clean up after tests**

### Coverage Goals
- **Unit Tests**: 80% coverage minimum
- **Integration Tests**: All API endpoints
- **E2E Tests**: Critical user paths

### Mock Best Practices
```typescript
// Good: Mock at the boundary
jest.mock('@/lib/volumetrica/client');

// Bad: Mock internal implementation
jest.mock('@/lib/utils/formatCurrency');

// Good: Use MSW for API mocking
server.use(
  rest.get('/api/accounts', (req, res, ctx) => {
    return res(ctx.json({ accounts: mockAccounts }));
  })
);
```

### Data Test IDs
```tsx
// Add data-testid for E2E tests
<button data-testid="submit-button" onClick={handleSubmit}>
  Submit
</button>

// Query in tests
await page.click('[data-testid="submit-button"]');
```