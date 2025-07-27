import { NextResponse } from 'next/server';
import { withErrorCapture } from '@/lib/sentry';

export const GET = withErrorCapture(async () => {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});