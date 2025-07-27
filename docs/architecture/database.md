# Database Schema and Data Synchronization

## Table of Contents
1. [Database Schema](#database-schema)
2. [Data Synchronization](#data-synchronization)

## Database Schema

### Overview
The application uses Prisma ORM with PostgreSQL. The schema is designed for local user management and account caching, with Volumetrica as the source of truth.

### Prisma Models

#### User Model
```prisma
model User {
  id                String    @id @default(cuid())
  clerkId           String    @unique
  volumetricaId     String    @unique
  email             String    @unique
  firstName         String
  lastName          String
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  accounts          Account[]
  auditLogs         AuditLog[]
  
  @@index([clerkId])
  @@index([volumetricaId])
}
```

#### Account Model
```prisma
model Account {
  id                String    @id @default(cuid())
  accountId         String    @unique  // Volumetrica account ID
  userId            String
  name              String
  balance           Decimal   @db.Decimal(20, 8)
  currency          String
  status            Int       // Maps to AccountStatus enum
  mode              Int       // Evaluation, Funded, etc.
  lastSync          DateTime
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  user              User      @relation(fields: [userId], references: [id])
  
  @@index([userId])
  @@index([accountId])
  @@index([lastSync])
  @@index([userId, status])
}
```

#### AuditLog Model
```prisma
model AuditLog {
  id                String    @id @default(cuid())
  userId            String?
  action            String
  entityType        String
  entityId          String?
  metadata          Json?
  ipAddress         String?
  userAgent         String?
  createdAt         DateTime  @default(now())
  
  user              User?     @relation(fields: [userId], references: [id])
  
  @@index([userId])
  @@index([action])
  @@index([createdAt])
  @@index([entityType, entityId])
}
```

### Key Features

1. **Relationships**:
   - One-to-many: User → Accounts
   - One-to-many: User → AuditLogs

2. **Indexes**:
   - Performance indexes on foreign keys and commonly queried fields
   - Composite index on `userId` + `status` for filtered queries

3. **Data Types**:
   - Decimal precision for financial amounts
   - JSON field for flexible metadata storage
   - Proper timestamp tracking

### Migration Strategy

1. **Development**:
   ```bash
   npx prisma migrate dev --name description_of_change
   ```

2. **Production**:
   ```bash
   npx prisma migrate deploy
   ```

3. **Schema Updates**:
   - Always create migrations for schema changes
   - Test migrations in development first
   - Review generated SQL before deploying

## Data Synchronization

### Synchronization Strategy

1. **On-Demand Sync**:
   - Triggered when users access their dashboard
   - Updates local cache from Volumetrica

2. **Scheduled Sync**:
   - Cron job runs every 5 minutes
   - Syncs all accounts modified in last hour

3. **Event-Driven Sync**:
   - After account modifications
   - After trading rule updates

### Sync Implementation

Located in `/src/lib/sync-accounts.ts`:

```typescript
export async function syncUserAccounts(volumetricaUserId: string): Promise<void> {
  // 1. Check for existing sync to prevent duplicates
  const existingSync = syncLocks.get(volumetricaUserId);
  if (existingSync) return existingSync;
  
  // 2. Fetch accounts from Volumetrica
  const volumetricaAccounts = await volumetricaApi.accounts.list({ 
    userId: volumetricaUserId 
  });
  
  // 3. Update local database in transaction
  await prisma.$transaction(async (tx) => {
    for (const account of volumetricaAccounts) {
      await tx.account.upsert({
        where: { accountId: account.accountId },
        update: { /* updated fields */ },
        create: { /* new account */ }
      });
    }
  });
}
```

### Sync Features

1. **Locking Mechanism**:
   - In-memory locks prevent concurrent syncs
   - Per-user locking granularity
   - Automatic cleanup on completion

2. **Error Recovery**:
   - Retries on transient failures
   - Logs sync failures to audit log
   - Continues with next account on individual failures

3. **Performance**:
   - Batch updates in transactions
   - Only syncs changed data
   - Respects rate limits

### Cache Invalidation

1. **Time-based**:
   - Accounts older than 5 minutes are considered stale
   - Automatic refresh on access

2. **Event-based**:
   - Manual refresh button in UI
   - After account modifications
   - After rule changes

3. **Monitoring**:
   - Tracks sync duration
   - Monitors failure rates
   - Alerts on repeated failures