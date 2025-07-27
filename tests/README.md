# Test Suite - Crypto Volumetrica Portal

## Overview

This directory contains all tests for the Crypto Volumetrica Portal, organized by test type and domain.

## Test Structure

```
tests/
├── unit/           # Fast, isolated unit tests
│   ├── api/        # API route unit tests
│   ├── components/ # React component tests
│   └── lib/        # Library/utility tests
├── integration/    # Tests that verify integration with external services
│   └── api/        # API integration tests with Volumetrica
├── e2e/           # End-to-end tests (future)
├── setup.ts       # Common test setup and utilities
└── README.md      # This file
```

## Running Tests

### All Tests
```bash
npm test
```

### Unit Tests Only
```bash
npm run test:unit
```

### Integration Tests Only
```bash
npm run test:integration
```

### Watch Mode (for development)
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

## Test Types

### Unit Tests
- **Purpose**: Test individual functions, components, and modules in isolation
- **Location**: `tests/unit/`
- **Characteristics**:
  - Fast execution (< 5s timeout)
  - No external dependencies
  - Mocked API calls and services
  - Focus on business logic

### Integration Tests
- **Purpose**: Verify our API routes correctly integrate with Volumetrica
- **Location**: `tests/integration/`
- **Characteristics**:
  - Slower execution (30s timeout)
  - Requires running dev server (`npm run dev`)
  - Tests real API endpoints
  - Validates data flow between services

### E2E Tests (Future)
- **Purpose**: Test complete user workflows
- **Location**: `tests/e2e/`
- **Tools**: Playwright or Cypress (TBD)

## Writing Tests

### Test File Naming
- Unit tests: `*.test.ts` or `*.spec.ts`
- Integration tests: `*-integration.test.ts`
- E2E tests: `*.e2e.test.ts`

### Common Patterns

#### Testing API Routes
```typescript
describe('API: /users/create', () => {
  it('should create user with valid data', async () => {
    const response = await fetch('/api/users/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ /* data */ })
    });
    
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});
```

#### Testing Components
```typescript
import { render, screen } from '@testing-library/react';
import { AccountCard } from '@/components/AccountCard';

describe('AccountCard', () => {
  it('should display account balance', () => {
    render(<AccountCard account={mockAccount} />);
    expect(screen.getByText('$100,000')).toBeInTheDocument();
  });
});
```

## Environment Setup

### Required Environment Variables
Create `.env.test.local` with:
```bash
VOLUMETRICA_API_KEY=your-test-api-key
VOLUMETRICA_API_URL=https://staging-api.volumetricafx.com
```

### Prerequisites
1. Install dependencies: `npm install`
2. For integration tests: Run dev server in another terminal: `npm run dev`

## Debugging Tests

### Debug Single Test
```bash
# Add console.logs and run specific test
npm test -- --testNamePattern="should create user"
```

### Debug with VS Code
1. Set breakpoints in test files
2. Use "Debug Jest Tests" launch configuration
3. Or run: `node --inspect-brk node_modules/.bin/jest --runInBand`

### Verbose Output
```bash
DEBUG_TESTS=true npm test -- --verbose
```

## CI/CD Integration

Tests are run automatically on:
- Pull requests
- Commits to main branch
- Deploy previews

CI command:
```bash
npm run test:ci
```

## Known Issues

1. **User fetch endpoint returns 500**: The Volumetrica API may not support fetching individual users via GET /user/{id}
2. **Login URL generation**: May fail for test users without proper permissions
3. **Account list 404**: The endpoint path might be different than documented

## Test Data

### Mock Users
- Use unique emails: `test${Date.now()}@example.com`
- Country codes must be 2 letters (US, UK, etc.)

### Mock Accounts
- Default balance: 100,000
- Currency: USD
- Status: 'Enabled' | 'Disabled' | 'ChallengeFailed'

## Contributing

1. Write tests for new features before implementing
2. Ensure all tests pass before committing
3. Maintain test coverage above 80%
4. Document any special test requirements
5. Follow the existing test patterns and structure