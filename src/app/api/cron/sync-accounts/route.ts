import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { syncUserAccounts } from '@/lib/sync-accounts';
import { logger } from '@/lib/volumetrica/client-logger';

/**
 * GET /api/cron/sync-accounts
 * 
 * Cron endpoint to sync all user accounts that haven't been synced in the last 5 minutes.
 * Protected by CRON_SECRET in the authorization header.
 */
export async function GET(request: NextRequest) {
  try {
    // Verify CRON_SECRET authorization
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      logger.error('CRON_SECRET environment variable is not set');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      logger.warn('Unauthorized cron sync attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    logger.info('Starting cron sync for all users');

    // Find all users with accounts that need syncing (lastSync > 5 minutes old)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const usersToSync = await prisma.user.findMany({
      where: {
        accounts: {
          some: {
            OR: [
              { lastSync: { lt: fiveMinutesAgo } },
              { lastSync: null }
            ]
          }
        }
      },
      select: {
        volumetricaId: true,
        email: true
      }
    });

    logger.info(`Found ${usersToSync.length} users with accounts needing sync`);

    // Track sync results
    const results = {
      total: usersToSync.length,
      successful: 0,
      failed: 0,
      errors: [] as Array<{ userId: string; email: string; error: string }>
    };

    // Sync each user's accounts
    for (const user of usersToSync) {
      try {
        logger.info(`Syncing accounts for user: ${user.volumetricaId} (${user.email})`);
        await syncUserAccounts(user.volumetricaId);
        results.successful++;
        logger.info(`Successfully synced accounts for user: ${user.volumetricaId}`);
      } catch (error) {
        results.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        results.errors.push({
          userId: user.volumetricaId,
          email: user.email,
          error: errorMessage
        });
        
        logger.error(`Failed to sync accounts for user: ${user.volumetricaId}`, {
          error: errorMessage,
          email: user.email
        });
      }
    }

    // Log final results
    logger.info('Cron sync completed', {
      total: results.total,
      successful: results.successful,
      failed: results.failed
    });

    // Return sync statistics
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats: {
        total: results.total,
        successful: results.successful,
        failed: results.failed
      },
      ...(results.failed > 0 && {
        errors: results.errors
      })
    });

  } catch (error) {
    logger.error('Unexpected error in cron sync endpoint', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}