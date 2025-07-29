import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';

type RouteHandler = (
  req: NextRequest,
  context?: any
) => Promise<NextResponse> | NextResponse;

/**
 * Wraps API route handlers with Sentry error capture
 * Catches and reports errors to Sentry before re-throwing them
 */
export const withErrorCapture = (handler: RouteHandler) => {
  return async (req: NextRequest, ctx?: any) => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      // Capture the exception in Sentry
      Sentry.captureException(error, {
        tags: {
          section: 'api',
          path: req.nextUrl.pathname,
          method: req.method,
        },
        extra: {
          url: req.url,
          headers: Object.fromEntries(req.headers.entries()),
        },
      });
      
      // Re-throw the error to maintain original behavior
      throw error;
    }
  };
};

/**
 * Initialize Sentry for the application
 * This should be called in instrumentation.ts
 */
export const initSentry = () => {
  const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
  
  if (!SENTRY_DSN) {
    console.warn('Sentry DSN not found. Error tracking is disabled.');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    environment: process.env.NODE_ENV || 'development',
    integrations: [
      // Default integrations will be included automatically
    ],
    beforeSend(event, hint) {
      // Filter out certain errors if needed
      if (event.exception) {
        const error = hint.originalException;
        
        // Don't send 404 errors to Sentry
        if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
          return null;
        }
      }
      
      return event;
    },
  });
};