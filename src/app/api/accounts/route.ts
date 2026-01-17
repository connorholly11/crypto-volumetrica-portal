import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { syncUserAccounts, needsSync } from '@/lib/sync-accounts';
import { checkRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/volumetrica/client-logger';

/**
 * GET /api/accounts
 * 
 * Returns the current user's trading accounts from the database cache.
 * If the cache is stale (>5 minutes), triggers a sync from Volumetrica.
 */
export async function GET(request: NextRequest) {
  try {
    // Check rate limit first
    const { success, headers } = await checkRateLimit(request);
    if (!success) {
      return new NextResponse('Too Many Requests', { 
        status: 429,
        headers 
      });
    }
    
    // 1. Require authentication and get Clerk user ID
    const clerkUserId = requireAuth();
    
    // 2. Find the corresponding database user by clerkId
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: {
        id: true,
        volumetricaId: true,
        email: true,
      },
    });

    // 3. Handle case where user might not exist in database yet
    if (!user) {
      logger.warn(`User with Clerk ID ${clerkUserId} not found in database`);
      return NextResponse.json(
        { 
          error: 'User not found',
          message: 'Your account is still being set up. Please try again in a few moments.'
        },
        { status: 404 }
      );
    }

    // 4. Check if accounts need syncing (cache is stale after 5 minutes)
    const shouldSync = await needsSync(user.volumetricaId, 5);
    
    if (shouldSync) {
      logger.info(`Cache is stale for user ${user.volumetricaId}, triggering sync`);
      
      try {
        // Trigger sync from Volumetrica
        await syncUserAccounts(user.volumetricaId);
        logger.info(`Successfully synced accounts for user ${user.volumetricaId}`);
      } catch (syncError) {
        // Log sync error but continue to return cached data
        logger.error(`Failed to sync accounts for user ${user.volumetricaId}:`, syncError);
        // Don't throw - we'll return whatever cached data we have
      }
    }

    // 5. Fetch accounts from database (either freshly synced or cached)
    const accounts = await prisma.account.findMany({
      where: { userId: user.volumetricaId },
      select: {
        accountId: true,
        balance: true,
        currency: true,
        status: true,
        lastSync: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // 6. Transform the response to ensure proper serialization
    const serializedAccounts = accounts.map(account => ({
      accountId: account.accountId,
      balance: account.balance.toString(), // Convert Decimal to string for JSON
      currency: account.currency,
      status: account.status,
      lastSync: account.lastSync.toISOString(),
    }));

    return NextResponse.json({
      accounts: serializedAccounts,
      user: {
        id: user.id,
        volumetricaId: user.volumetricaId,
        email: user.email,
      },
      meta: {
        count: accounts.length,
        lastSync: accounts[0]?.lastSync?.toISOString() || null,
        cacheStatus: shouldSync ? 'refreshed' : 'cached',
      },
    }, { headers });

  } catch (error) {
    logger.error('Error in GET /api/accounts:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('NEXT_REDIRECT')) {
        // This is a redirect from requireAuth, let it through
        throw error;
      }
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to fetch accounts. Please try again later.'
      },
      { status: 500 }
    );
  }
}