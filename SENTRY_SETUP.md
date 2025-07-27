# Sentry Error Monitoring Setup

This application is configured with Sentry for comprehensive error monitoring and performance tracking.

## Configuration

### 1. Environment Variables

Copy the `.env.sentry.example` file and add your Sentry configuration:

```bash
cp .env.sentry.example .env.local
```

Then update the following variables:

- `SENTRY_DSN`: Your Sentry DSN for server-side error tracking
- `NEXT_PUBLIC_SENTRY_DSN`: Your Sentry DSN for client-side error tracking (same as above)
- `SENTRY_ORG`: Your Sentry organization slug (optional, for source maps)
- `SENTRY_PROJECT`: Your Sentry project slug (optional, for source maps)
- `SENTRY_AUTH_TOKEN`: Auth token for source map uploads (optional)

### 2. Features Implemented

#### Error Capture
- **API Routes**: All API routes can be wrapped with `withErrorCapture` utility
- **Client Components**: Global error boundary catches React errors
- **Server Components**: Error pages handle server-side errors

#### Performance Monitoring
- Automatic tracing for API routes
- Session replay for debugging user issues
- Custom tags and context for better error grouping

#### Error Filtering
- Filters out expected errors (404s, validation errors)
- Development vs production error handling
- Sensitive data masking in session replays

### 3. Usage Examples

#### Wrapping API Routes

```typescript
import { withErrorCapture } from '@/lib/sentry';

export const GET = withErrorCapture(async (request) => {
  // Your route logic here
  return NextResponse.json({ data: 'success' });
});
```

#### Manual Error Capture

```typescript
import * as Sentry from '@sentry/nextjs';

try {
  // Risky operation
} catch (error) {
  Sentry.captureException(error, {
    tags: { section: 'user-dashboard' },
    extra: { userId: user.id }
  });
}
```

### 4. Testing Sentry Integration

1. Trigger a test error in development:
   ```typescript
   // Add to any API route temporarily
   throw new Error('Test Sentry Integration');
   ```

2. Check your Sentry dashboard to confirm the error appears

3. Test client-side errors by adding to a component:
   ```typescript
   <button onClick={() => { throw new Error('Test Client Error'); }}>
     Test Error
   </button>
   ```

### 5. Best Practices

- Always wrap API routes with `withErrorCapture`
- Add meaningful context to errors (user ID, request details)
- Use appropriate error levels (error, warning, info)
- Don't log sensitive information (passwords, tokens)
- Review Sentry issues regularly and fix recurring errors

### 6. Troubleshooting

If errors aren't appearing in Sentry:
1. Check environment variables are set correctly
2. Verify DSN is valid in Sentry project settings
3. Check browser console for Sentry initialization errors
4. Ensure `NODE_ENV` is set appropriately