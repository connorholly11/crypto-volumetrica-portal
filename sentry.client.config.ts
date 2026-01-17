import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    environment: process.env.NODE_ENV || 'development',
    
    // Replay configuration for session recording
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    integrations: [
      // Automatically capture console errors
      Sentry.captureConsoleIntegration({
        levels: ['error', 'warn'],
      }),
      
      // Session replay
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    
    // Filter out certain errors
    beforeSend(event, hint) {
      // Filter out network errors that are expected
      if (event.exception) {
        const error = hint.originalException;
        
        // Don't send cancelled requests
        if (error && error.name === 'AbortError') {
          return null;
        }
        
        // Don't send network errors in development
        if (process.env.NODE_ENV === 'development' && error && error.name === 'NetworkError') {
          return null;
        }
      }
      
      return event;
    },
  });
}