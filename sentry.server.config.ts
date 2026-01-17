import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    environment: process.env.NODE_ENV || 'development',
    
    // Capture unhandled promise rejections
    onUncaughtException: 'warn',
    
    integrations: [
      // Automatically instrument Prisma
      Sentry.prismaIntegration(),
    ],
    
    // Filter out certain errors
    beforeSend(event, hint) {
      // Don't send health check errors
      if (event.request?.url?.includes('/api/health')) {
        return null;
      }
      
      // Filter out expected errors
      if (event.exception) {
        const error = hint.originalException;
        
        // Don't send 404s or validation errors
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as any).status;
          if (status === 404 || status === 400 || status === 401) {
            return null;
          }
        }
      }
      
      return event;
    },
  });
}