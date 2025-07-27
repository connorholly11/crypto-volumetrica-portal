import { prisma } from '@/lib/prisma';
import { volumetricaApi, VolumetricaError } from '@/lib/volumetrica/client';
import { logger } from '@/lib/volumetrica/client-logger';
import type { 
  TradingAccount, 
  PaginatedResponse,
  Currency,
  AccountStatus
} from '@/types/volumetrica';
import { Prisma } from '@/generated/prisma';

// In-memory lock map to prevent concurrent syncs for the same user
const syncLocks = new Map<string, Promise<void>>();

/**
 * Maps Volumetrica account data to Prisma schema format
 */
function mapVolumetricaAccountToPrisma(account: TradingAccount): Prisma.AccountCreateInput | Prisma.AccountUpdateInput {
  // Map currency enum to string
  const currencyMap: Record<Currency, string> = {
    [Currency.EUR]: 'EUR',
    [Currency.USD]: 'USD',
  };

  return {
    accountId: account.accountId,
    userId: account.userId,
    balance: new Prisma.Decimal(account.balance),
    currency: currencyMap[account.currency] || 'USD',
    status: account.status,
  };
}

/**
 * Internal function that performs the actual sync operation
 * This is separated to allow for proper locking mechanism
 */
async function performSync(volumetricaUserId: string): Promise<void> {
  try {
    logger.info(`Starting account sync for user: ${volumetricaUserId}`);

    // Fetch accounts from Volumetrica API
    const response = await volumetricaApi.accounts.list({ 
      userId: volumetricaUserId 
    }) as PaginatedResponse<TradingAccount>;

    if (!response || !Array.isArray(response.items)) {
      logger.error(`Invalid response from Volumetrica API for user ${volumetricaUserId}`);
      throw new Error('Invalid response from Volumetrica API');
    }

    logger.info(`Found ${response.items.length} accounts for user ${volumetricaUserId}`);

    // Use a transaction to ensure all accounts are updated atomically
    await prisma.$transaction(
      response.items.map(account => {
        const accountData = mapVolumetricaAccountToPrisma(account);
        
        return prisma.account.upsert({
          where: { 
            accountId: account.accountId 
          },
          update: {
            ...accountData,
            lastSequence: account.sequenceId || null,
            lastSync: new Date(),
          },
          create: {
            ...accountData,
            lastSequence: account.sequenceId || null,
            lastSync: new Date(),
          } as Prisma.AccountCreateInput,
        });
      })
    );

    logger.info(`Successfully synced ${response.items.length} accounts for user ${volumetricaUserId}`);
  } catch (error) {
    if (error instanceof VolumetricaError) {
      logger.error(`Volumetrica API error during sync for user ${volumetricaUserId}:`, {
        message: error.message,
        statusCode: error.statusCode,
        details: error.details,
      });
      throw error;
    }

    logger.error(`Unexpected error during sync for user ${volumetricaUserId}:`, error);
    throw new Error(`Failed to sync accounts: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Synchronizes user accounts from Volumetrica API to the database
 * Uses a locking mechanism to prevent concurrent syncs for the same user
 * 
 * @param volumetricaUserId - The Volumetrica user ID to sync accounts for
 * @returns Promise that resolves when sync is complete
 * @throws VolumetricaError if API call fails
 */
export async function syncUserAccounts(volumetricaUserId: string): Promise<void> {
  // Check if there's already a sync in progress for this user
  const existingSync = syncLocks.get(volumetricaUserId);
  if (existingSync) {
    logger.info(`Sync already in progress for user ${volumetricaUserId}, waiting for it to complete`);
    return existingSync;
  }

  // Create a new sync promise and store it in the lock map
  const syncPromise = performSync(volumetricaUserId);
  syncLocks.set(volumetricaUserId, syncPromise);

  try {
    // Wait for the sync to complete
    await syncPromise;
  } finally {
    // Always remove the lock when done, whether successful or not
    syncLocks.delete(volumetricaUserId);
  }
}

/**
 * Synchronizes accounts for multiple users
 * 
 * @param volumetricaUserIds - Array of Volumetrica user IDs to sync
 * @returns Promise that resolves with sync results
 */
export async function syncMultipleUserAccounts(volumetricaUserIds: string[]): Promise<{
  successful: string[];
  failed: Array<{ userId: string; error: string }>;
}> {
  const results = {
    successful: [] as string[],
    failed: [] as Array<{ userId: string; error: string }>,
  };

  for (const userId of volumetricaUserIds) {
    try {
      await syncUserAccounts(userId);
      results.successful.push(userId);
    } catch (error) {
      results.failed.push({
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

/**
 * Gets the last sync timestamp for a user's accounts
 * 
 * @param volumetricaUserId - The Volumetrica user ID
 * @returns The most recent sync timestamp or null if never synced
 */
export async function getLastSyncTimestamp(volumetricaUserId: string): Promise<Date | null> {
  const account = await prisma.account.findFirst({
    where: { userId: volumetricaUserId },
    orderBy: { lastSync: 'desc' },
    select: { lastSync: true },
  });

  return account?.lastSync || null;
}

/**
 * Checks if a user's accounts need syncing based on time elapsed
 * 
 * @param volumetricaUserId - The Volumetrica user ID
 * @param maxAgeMinutes - Maximum age in minutes before sync is needed (default: 5)
 * @returns True if sync is needed, false otherwise
 */
export async function needsSync(volumetricaUserId: string, maxAgeMinutes: number = 5): Promise<boolean> {
  const lastSync = await getLastSyncTimestamp(volumetricaUserId);
  
  if (!lastSync) {
    return true; // Never synced
  }

  const ageInMinutes = (Date.now() - lastSync.getTime()) / (1000 * 60);
  return ageInMinutes > maxAgeMinutes;
}