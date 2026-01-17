import { initSentry } from '@/lib/sentry';

export async function register() {
  // Initialize Sentry when the application starts
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    initSentry();
  }
}