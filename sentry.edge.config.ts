import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    environment: process.env.NODE_ENV || 'development',
    
    // Edge runtime specific configuration
    // Note: Some integrations may not be available in edge runtime
    
    beforeSend(event, hint) {
      // Filter out middleware-specific errors if needed
      if (event.request?.url?.includes('/_next/')) {
        return null;
      }
      
      return event;
    },
  });
}