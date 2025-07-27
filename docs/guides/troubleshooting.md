# Maintenance and Troubleshooting Guide

## Table of Contents
1. [Regular Maintenance](#regular-maintenance)
2. [Common Issues and Solutions](#common-issues-and-solutions)
3. [Debugging Techniques](#debugging-techniques)
4. [Log Analysis](#log-analysis)
5. [Performance Troubleshooting](#performance-troubleshooting)
6. [Emergency Procedures](#emergency-procedures)

## Regular Maintenance

### Daily Tasks

#### 1. Health Check Monitoring
```bash
#!/bin/bash
# daily-health-check.sh

# Check application health
curl -f https://crypto-volumetrica.com/api/health || {
  echo "Health check failed!"
  # Send alert
  curl -X POST $SLACK_WEBHOOK -d '{"text":"Application health check failed!"}'
}

# Check database connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;" || {
  echo "Database check failed!"
}

# Check Redis
redis-cli -u $REDIS_URL ping || {
  echo "Redis check failed!"
}
```

#### 2. Log Review
```bash
# Check error logs
grep -i error /var/log/app/error.log | tail -100

# Check for unusual activity
grep -E "(failed|unauthorized|forbidden)" /var/log/app/access.log | wc -l

# Check for performance issues
grep "slow_query" /var/log/postgres/postgresql.log
```

### Weekly Tasks

#### 1. Database Maintenance
```sql
-- Analyze tables for query optimization
ANALYZE;

-- Update table statistics
VACUUM ANALYZE;

-- Check for bloated tables
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS external_size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
```

#### 2. Security Audit
```bash
#!/bin/bash
# weekly-security-audit.sh

# Check for failed login attempts
echo "Failed login attempts in the last week:"
grep "authentication failed" /var/log/app/*.log | wc -l

# Check for suspicious API calls
echo "Unusual API activity:"
grep -E "(DELETE|unauthorized)" /var/log/app/api.log | tail -20

# Verify SSL certificates
echo | openssl s_client -servername crypto-volumetrica.com -connect crypto-volumetrica.com:443 2>/dev/null | openssl x509 -noout -dates

# Check for outdated dependencies
npm audit
```

### Monthly Tasks

#### 1. Performance Review
```typescript
// scripts/monthly-performance-review.ts
import { prisma } from '@/lib/prisma';

async function performanceReview() {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 1);

  // Slow queries
  const slowQueries = await prisma.$queryRaw`
    SELECT 
      query,
      mean_exec_time,
      calls
    FROM pg_stat_statements
    WHERE mean_exec_time > 1000
    ORDER BY mean_exec_time DESC
    LIMIT 20
  `;

  // API response times
  const apiMetrics = await prisma.$queryRaw`
    SELECT 
      endpoint,
      AVG(response_time) as avg_time,
      MAX(response_time) as max_time,
      COUNT(*) as requests
    FROM audit_logs
    WHERE created_at > ${startDate}
    GROUP BY endpoint
    ORDER BY avg_time DESC
  `;

  console.log('Slow Queries:', slowQueries);
  console.log('API Metrics:', apiMetrics);
}
```

#### 2. Backup Verification
```bash
#!/bin/bash
# verify-backups.sh

# Test database restore
echo "Testing database backup restore..."
LATEST_BACKUP=$(ls -t /backups/postgres/*.sql.gz | head -1)
pg_restore --clean --if-exists -d test_restore $LATEST_BACKUP

# Verify data integrity
PROD_COUNT=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM users;")
TEST_COUNT=$(psql test_restore -t -c "SELECT COUNT(*) FROM users;")

if [ "$PROD_COUNT" -eq "$TEST_COUNT" ]; then
  echo "Backup verification successful"
else
  echo "Backup verification failed! Count mismatch."
  exit 1
fi
```

## Common Issues and Solutions

### Authentication Issues

#### Problem: "Unauthorized" errors after deployment
```typescript
// Solution 1: Verify Clerk webhook endpoint
export async function POST(req: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('Missing CLERK_WEBHOOK_SECRET');
    return new Response('Server configuration error', { status: 500 });
  }
  // ... rest of webhook handler
}

// Solution 2: Check session configuration
import { authMiddleware } from '@clerk/nextjs';

export default authMiddleware({
  publicRoutes: ['/api/health', '/api/webhook/clerk'],
  ignoredRoutes: ['/api/cron(.*)'],
});
```

#### Problem: API key authentication failing
```bash
# Debug API key issues
curl -H "x-api-key: $VOLUMETRICA_API_KEY" \
     -H "Content-Type: application/json" \
     https://api.volumetrica.com/v1/health

# Common fixes:
# 1. Check for trailing spaces in API key
# 2. Verify API key hasn't expired
# 3. Ensure correct environment (staging vs production)
```

### Database Connection Issues

#### Problem: "too many connections" error
```sql
-- Check current connections
SELECT count(*) FROM pg_stat_activity;

-- See connections by state
SELECT state, count(*) 
FROM pg_stat_activity 
GROUP BY state;

-- Kill idle connections
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'idle' 
  AND state_change < current_timestamp - interval '10 minutes';
```

```typescript
// Fix in code: Implement connection pooling
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Use pool for queries
export async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}
```

#### Problem: Slow database queries
```sql
-- Identify slow queries
SELECT 
  query,
  calls,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC;

-- Check missing indexes
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  most_common_vals
FROM pg_stats
WHERE tablename = 'accounts'
  AND n_distinct > 100
  AND attname NOT IN (
    SELECT column_name
    FROM information_schema.key_column_usage
    WHERE table_name = 'accounts'
  );
```

### Sync Issues

#### Problem: Account sync failing repeatedly
```typescript
// Debug sync issues
async function debugSync(userId: string) {
  console.log(`Starting sync debug for user: ${userId}`);
  
  try {
    // Check user exists
    const user = await prisma.user.findUnique({
      where: { volumetricaId: userId }
    });
    console.log('User found:', !!user);
    
    // Test Volumetrica connection
    const testCall = await volumetricaApi.users.get(userId);
    console.log('Volumetrica API accessible:', !!testCall);
    
    // Check rate limits
    const rateLimitStatus = await checkRateLimit(userId);
    console.log('Rate limit status:', rateLimitStatus);
    
    // Attempt sync with detailed logging
    await syncUserAccounts(userId);
    console.log('Sync completed successfully');
    
  } catch (error) {
    console.error('Sync debug error:', error);
    // Log specific error details
    if (error instanceof VolumetricaError) {
      console.error('Volumetrica error code:', error.code);
      console.error('Volumetrica error details:', error.details);
    }
  }
}
```

#### Problem: Duplicate sync attempts
```typescript
// Fix: Implement proper locking
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export async function syncWithLock(userId: string) {
  const lockKey = `sync:lock:${userId}`;
  const lockTimeout = 300; // 5 minutes
  
  // Try to acquire lock
  const acquired = await redis.set(lockKey, '1', {
    nx: true,
    ex: lockTimeout,
  });
  
  if (!acquired) {
    console.log(`Sync already in progress for user ${userId}`);
    return;
  }
  
  try {
    await performSync(userId);
  } finally {
    // Always release lock
    await redis.del(lockKey);
  }
}
```

### Performance Issues

#### Problem: Slow page loads
```typescript
// Debug with performance timing
export async function measurePerformance(fn: () => Promise<any>, label: string) {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    console.log(`${label} took ${duration}ms`);
    
    // Log slow operations
    if (duration > 1000) {
      logger.warn(`Slow operation detected`, {
        operation: label,
        duration,
        timestamp: new Date().toISOString(),
      });
    }
    
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`${label} failed after ${duration}ms`, error);
    throw error;
  }
}

// Usage
const accounts = await measurePerformance(
  () => prisma.account.findMany({ where: { userId } }),
  'Fetch user accounts'
);
```

## Debugging Techniques

### Remote Debugging

#### Enable Node.js Inspector
```bash
# Start with debugging enabled
NODE_OPTIONS='--inspect=0.0.0.0:9229' npm start

# Connect via Chrome DevTools
# Navigate to: chrome://inspect
```

#### Production Debugging
```typescript
// Add debug endpoints (protect in production!)
export async function GET(req: Request) {
  // Verify admin authentication
  const isAdmin = await verifyAdmin(req);
  if (!isAdmin) {
    return new Response('Forbidden', { status: 403 });
  }
  
  const debug = {
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
      VOLUMETRICA_API_KEY: process.env.VOLUMETRICA_API_KEY ? 'SET' : 'NOT SET',
    },
    versions: process.versions,
  };
  
  return NextResponse.json(debug);
}
```

### Database Query Debugging

```typescript
// Enable query logging in development
const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
  ],
});

prisma.$on('query', (e) => {
  console.log('Query: ' + e.query);
  console.log('Duration: ' + e.duration + 'ms');
  if (e.duration > 100) {
    console.warn('SLOW QUERY DETECTED');
  }
});
```

### API Debugging

```typescript
// Request/Response interceptor
export function apiDebugMiddleware(req: Request) {
  const requestId = crypto.randomUUID();
  
  console.log(`[${requestId}] ${req.method} ${req.url}`);
  console.log(`[${requestId}] Headers:`, Object.fromEntries(req.headers));
  
  const start = Date.now();
  
  return {
    requestId,
    logResponse: (status: number, body?: any) => {
      const duration = Date.now() - start;
      console.log(`[${requestId}] Response: ${status} (${duration}ms)`);
      if (body) {
        console.log(`[${requestId}] Body:`, JSON.stringify(body, null, 2));
      }
    },
  };
}
```

## Log Analysis

### Log Parsing Scripts

```bash
#!/bin/bash
# analyze-logs.sh

# Extract error patterns
echo "=== Error Summary ==="
grep -E "(ERROR|FATAL)" /var/log/app/*.log | 
  awk '{print $5}' | 
  sort | 
  uniq -c | 
  sort -rn | 
  head -20

# API endpoint analysis
echo "=== API Endpoint Usage ==="
grep "api/" /var/log/app/access.log | 
  awk '{print $7}' | 
  cut -d'?' -f1 | 
  sort | 
  uniq -c | 
  sort -rn | 
  head -20

# Response time analysis
echo "=== Slow Requests (>1s) ==="
awk '$NF > 1000 {print $7, $NF"ms"}' /var/log/app/access.log | 
  sort -k2 -rn | 
  head -20
```

### Log Aggregation Queries

```typescript
// Elasticsearch queries for log analysis
const slowRequests = await elastic.search({
  index: 'app-logs-*',
  body: {
    query: {
      range: {
        response_time: { gte: 1000 }
      }
    },
    aggs: {
      by_endpoint: {
        terms: {
          field: 'endpoint.keyword',
          size: 10
        },
        aggs: {
          avg_time: {
            avg: { field: 'response_time' }
          }
        }
      }
    }
  }
});

// Error rate by hour
const errorRate = await elastic.search({
  index: 'app-logs-*',
  body: {
    query: {
      match: { level: 'error' }
    },
    aggs: {
      errors_over_time: {
        date_histogram: {
          field: '@timestamp',
          interval: 'hour'
        }
      }
    }
  }
});
```

## Performance Troubleshooting

### Memory Leaks

```typescript
// Monitor memory usage
setInterval(() => {
  const usage = process.memoryUsage();
  console.log('Memory Usage:', {
    rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
    external: `${Math.round(usage.external / 1024 / 1024)}MB`,
  });
  
  // Alert if heap usage is too high
  if (usage.heapUsed > 500 * 1024 * 1024) { // 500MB
    console.error('HIGH MEMORY USAGE DETECTED');
    // Optional: trigger heap snapshot
    if (process.env.NODE_ENV === 'production') {
      require('v8').writeHeapSnapshot();
    }
  }
}, 60000); // Every minute
```

### CPU Profiling

```bash
# Generate CPU profile
node --cpu-prof --cpu-prof-duration=30 index.js

# Analyze with Chrome DevTools
# 1. Open chrome://inspect
# 2. Load the .cpuprofile file
```

### Database Performance

```sql
-- Find tables with sequential scans
SELECT 
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  idx_tup_fetch
FROM pg_stat_user_tables
WHERE seq_scan > 0
ORDER BY seq_tup_read DESC;

-- Optimize with indexes
CREATE INDEX CONCURRENTLY idx_accounts_userid_status 
ON accounts(user_id, status) 
WHERE status = 1;

-- Monitor index usage
SELECT 
  indexrelname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan;
```

## Emergency Procedures

### System Down

```bash
#!/bin/bash
# emergency-restart.sh

echo "Starting emergency restart procedure..."

# 1. Capture current state
docker ps > /tmp/docker-state.log
kubectl get pods > /tmp/k8s-state.log

# 2. Restart services
echo "Restarting application..."
kubectl rollout restart deployment/crypto-volumetrica

# 3. Wait for health
echo "Waiting for services to become healthy..."
sleep 30

# 4. Verify health
if curl -f https://crypto-volumetrica.com/api/health; then
  echo "Application is healthy"
else
  echo "Health check failed, investigating..."
  kubectl logs -l app=crypto-volumetrica --tail=100
fi
```

### Data Corruption

```typescript
// Data integrity check
async function verifyDataIntegrity() {
  const issues = [];
  
  // Check for orphaned accounts
  const orphanedAccounts = await prisma.account.findMany({
    where: {
      user: null
    }
  });
  
  if (orphanedAccounts.length > 0) {
    issues.push({
      type: 'orphaned_accounts',
      count: orphanedAccounts.length,
      ids: orphanedAccounts.map(a => a.id)
    });
  }
  
  // Check for invalid balances
  const invalidBalances = await prisma.$queryRaw`
    SELECT * FROM accounts 
    WHERE balance < 0 
    OR balance > 1000000000
  `;
  
  if (invalidBalances.length > 0) {
    issues.push({
      type: 'invalid_balances',
      count: invalidBalances.length
    });
  }
  
  return issues;
}

// Fix data issues
async function fixDataIssues(issues: any[]) {
  for (const issue of issues) {
    switch (issue.type) {
      case 'orphaned_accounts':
        await prisma.account.deleteMany({
          where: {
            id: { in: issue.ids }
          }
        });
        break;
        
      case 'invalid_balances':
        // Re-sync from Volumetrica
        await resyncInvalidAccounts();
        break;
    }
  }
}
```

### Security Breach

```bash
#!/bin/bash
# security-breach-response.sh

echo "SECURITY BREACH DETECTED - Initiating response"

# 1. Rotate all secrets immediately
echo "Rotating secrets..."
kubectl set env deployment/crypto-volumetrica \
  VOLUMETRICA_API_KEY=$NEW_API_KEY \
  CLERK_SECRET_KEY=$NEW_CLERK_KEY

# 2. Invalidate all sessions
echo "Invalidating all user sessions..."
redis-cli -u $REDIS_URL FLUSHDB

# 3. Enable maintenance mode
kubectl set env deployment/crypto-volumetrica \
  MAINTENANCE_MODE=true

# 4. Audit recent activity
echo "Generating audit report..."
psql $DATABASE_URL -c "
  SELECT * FROM audit_logs 
  WHERE created_at > NOW() - INTERVAL '24 hours'
  ORDER BY created_at DESC
" > /tmp/security-audit.log

# 5. Notify team
curl -X POST $SLACK_WEBHOOK -d '{
  "text": "SECURITY BREACH: Response initiated. Check logs for details.",
  "color": "danger"
}'
```