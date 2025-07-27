# Deployment and Production Configuration

## Table of Contents
1. [Deployment Options](#deployment-options)
2. [Production Configuration](#production-configuration)
3. [Performance Optimization](#performance-optimization)
4. [Monitoring and Logging](#monitoring-and-logging)
5. [Scaling Strategies](#scaling-strategies)
6. [Disaster Recovery](#disaster-recovery)

## Deployment Options

### Option 1: Vercel (Recommended)

#### Setup
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

#### Configuration (vercel.json)
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "env": {
    "DATABASE_URL": "@database_url",
    "VOLUMETRICA_API_KEY": "@volumetrica_api_key",
    "CLERK_SECRET_KEY": "@clerk_secret_key"
  },
  "functions": {
    "app/api/cron/sync-accounts/route.ts": {
      "maxDuration": 60
    }
  },
  "crons": [
    {
      "path": "/api/cron/sync-accounts",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

#### Environment Variables
```bash
# Add production secrets
vercel env add DATABASE_URL production
vercel env add VOLUMETRICA_API_KEY production
vercel env add CLERK_SECRET_KEY production
```

### Option 2: AWS with Docker

#### Dockerfile
```dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build application
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

#### docker-compose.production.yml
```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - VOLUMETRICA_API_URL=${VOLUMETRICA_API_URL}
      - VOLUMETRICA_API_KEY=${VOLUMETRICA_API_KEY}
      - CLERK_SECRET_KEY=${CLERK_SECRET_KEY}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: crypto_volumetrica
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### Option 3: Kubernetes Deployment

#### deployment.yaml
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: crypto-volumetrica
spec:
  replicas: 3
  selector:
    matchLabels:
      app: crypto-volumetrica
  template:
    metadata:
      labels:
        app: crypto-volumetrica
    spec:
      containers:
      - name: app
        image: crypto-volumetrica:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
        - name: VOLUMETRICA_API_KEY
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: volumetrica-api-key
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

## Production Configuration

### Environment Variables

**.env.production**:
```bash
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://crypto-volumetrica.com

# Database (Production)
DATABASE_URL="postgresql://user:pass@prod-db.aws.com:5432/crypto_volumetrica?sslmode=require"
DATABASE_POOL_SIZE=20

# Volumetrica API (Production)
VOLUMETRICA_API_URL="https://api.volumetrica.com"
VOLUMETRICA_API_KEY="prod_key_xxx"
VOLUMETRICA_WEBHOOK_SECRET="webhook_secret_xxx"

# Clerk (Production)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_xxx"
CLERK_SECRET_KEY="sk_live_xxx"
CLERK_WEBHOOK_SECRET="whsec_xxx"

# Redis (Production)
UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="xxx"

# Sentry (Production)
SENTRY_DSN="https://xxx@o123.ingest.sentry.io/xxx"
SENTRY_ORG="your-org"
SENTRY_PROJECT="crypto-volumetrica"
SENTRY_AUTH_TOKEN="xxx"
NEXT_PUBLIC_SENTRY_DSN="https://xxx@o123.ingest.sentry.io/xxx"

# Monitoring
NEW_RELIC_LICENSE_KEY="xxx"
DATADOG_API_KEY="xxx"

# Security
NEXTAUTH_SECRET="xxx"
ENCRYPTION_KEY="xxx"
```

### Security Headers

**next.config.js**:
```javascript
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy.replace(/\s{2,}/g, ' ').trim()
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

### Database Configuration

**Production Prisma Configuration**:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Production optimizations
  connectionLimit = 50
  connectTimeout  = 10
}
```

**Connection Pooling**:
```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Optimize connection pool for production
prisma.$connect().then(() => {
  console.log('Database connected successfully');
});
```

## Performance Optimization

### Next.js Optimization

**Image Optimization**:
```tsx
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={50}
  priority // For above-the-fold images
  placeholder="blur"
  blurDataURL="..." // Base64 encoded placeholder
/>
```

**Code Splitting**:
```tsx
// Dynamic imports for heavy components
const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <Skeleton />,
  ssr: false,
});
```

**API Route Optimization**:
```typescript
// Enable response caching
export const revalidate = 60; // Cache for 60 seconds

// Or use edge runtime for better performance
export const runtime = 'edge';
```

### Database Optimization

**Query Optimization**:
```typescript
// Use select to limit fields
const accounts = await prisma.account.findMany({
  select: {
    id: true,
    accountId: true,
    balance: true,
    status: true,
  },
  where: {
    userId: userId,
    status: AccountStatus.Enabled,
  },
});

// Use pagination
const { page = 1, limit = 10 } = query;
const accounts = await prisma.account.findMany({
  skip: (page - 1) * limit,
  take: limit,
});
```

**Index Optimization**:
```sql
-- Performance indexes
CREATE INDEX CONCURRENTLY idx_account_user_status 
ON "Account"(userId, status) 
WHERE status = 1;

CREATE INDEX CONCURRENTLY idx_audit_log_created 
ON "AuditLog"(createdAt DESC);

-- Analyze query performance
EXPLAIN ANALYZE 
SELECT * FROM "Account" 
WHERE "userId" = 'xxx' AND status = 1;
```

### Caching Strategy

**Redis Caching**:
```typescript
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export async function getCachedAccounts(userId: string) {
  const cacheKey = `accounts:${userId}`;
  
  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) return cached;
  
  // Fetch from database
  const accounts = await prisma.account.findMany({
    where: { userId },
  });
  
  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(accounts));
  
  return accounts;
}
```

**CDN Configuration**:
```javascript
// next.config.js
module.exports = {
  images: {
    domains: ['cdn.crypto-volumetrica.com'],
  },
  assetPrefix: process.env.CDN_URL || '',
};
```

## Monitoring and Logging

### Application Monitoring

**Sentry Configuration**:
```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  beforeSend(event, hint) {
    // Filter sensitive data
    if (event.request?.cookies) {
      delete event.request.cookies;
    }
    return event;
  },
});
```

**Custom Metrics**:
```typescript
// lib/metrics.ts
import { metrics } from '@opentelemetry/api-metrics';

const meter = metrics.getMeter('crypto-volumetrica');

export const apiCallCounter = meter.createCounter('api_calls', {
  description: 'Count of API calls',
});

export const syncDuration = meter.createHistogram('sync_duration', {
  description: 'Duration of account sync operations',
  unit: 'ms',
});

// Usage
apiCallCounter.add(1, { endpoint: '/api/accounts', method: 'GET' });
```

### Logging Strategy

**Structured Logging**:
```typescript
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'crypto-volumetrica' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

// Usage
logger.info('User created', {
  userId: user.id,
  email: user.email,
  timestamp: new Date().toISOString(),
});
```

**Log Aggregation**:
```yaml
# fluentd.conf
<source>
  @type tail
  path /var/log/app/*.log
  pos_file /var/log/td-agent/app.log.pos
  tag app.logs
  <parse>
    @type json
  </parse>
</source>

<match app.**>
  @type elasticsearch
  host elasticsearch
  port 9200
  index_name crypto-volumetrica
  type_name logs
</match>
```

### Health Checks

**API Health Endpoint**:
```typescript
// app/api/health/route.ts
export async function GET() {
  const checks = {
    database: 'unknown',
    redis: 'unknown',
    volumetrica: 'unknown',
  };

  // Check database
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'healthy';
  } catch (error) {
    checks.database = 'unhealthy';
  }

  // Check Redis
  try {
    await redis.ping();
    checks.redis = 'healthy';
  } catch (error) {
    checks.redis = 'unhealthy';
  }

  // Check Volumetrica API
  try {
    await volumetricaApi.health();
    checks.volumetrica = 'healthy';
  } catch (error) {
    checks.volumetrica = 'unhealthy';
  }

  const isHealthy = Object.values(checks).every(status => status === 'healthy');

  return NextResponse.json(
    {
      status: isHealthy ? 'healthy' : 'degraded',
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: isHealthy ? 200 : 503 }
  );
}
```

## Scaling Strategies

### Horizontal Scaling

**Load Balancer Configuration**:
```nginx
upstream app_servers {
  least_conn;
  server app1.internal:3000 weight=1;
  server app2.internal:3000 weight=1;
  server app3.internal:3000 weight=1;
  
  # Health checks
  check interval=5000 rise=2 fall=3 timeout=2000;
}

server {
  listen 80;
  server_name crypto-volumetrica.com;
  
  location / {
    proxy_pass http://app_servers;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Timeouts
    proxy_connect_timeout 10s;
    proxy_send_timeout 30s;
    proxy_read_timeout 30s;
  }
}
```

**Auto-scaling Configuration**:
```yaml
# AWS Auto Scaling
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: crypto-volumetrica-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: crypto-volumetrica
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Database Scaling

**Read Replicas**:
```typescript
// lib/prisma-read.ts
export const prismaRead = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_READ_URL, // Read replica URL
    },
  },
});

// Use for read operations
const accounts = await prismaRead.account.findMany({
  where: { userId },
});

// Use primary for writes
await prisma.account.create({
  data: accountData,
});
```

**Connection Pooling with PgBouncer**:
```ini
[databases]
crypto_volumetrica = host=primary-db.aws.com port=5432 dbname=crypto_volumetrica

[pgbouncer]
listen_port = 6432
listen_addr = *
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
reserve_pool_size = 5
```

## Disaster Recovery

### Backup Strategy

**Database Backup Script**:
```bash
#!/bin/bash
# backup-database.sh

BACKUP_DIR="/backups/postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/crypto_volumetrica_$TIMESTAMP.sql.gz"

# Create backup
pg_dump $DATABASE_URL | gzip > $BACKUP_FILE

# Upload to S3
aws s3 cp $BACKUP_FILE s3://crypto-volumetrica-backups/

# Keep only last 30 days of local backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

# Verify backup
if [ -f "$BACKUP_FILE" ]; then
  echo "Backup successful: $BACKUP_FILE"
  # Send success notification
  curl -X POST $SLACK_WEBHOOK -d "{\"text\":\"Database backup completed successfully\"}"
else
  echo "Backup failed!"
  # Send failure alert
  curl -X POST $SLACK_WEBHOOK -d "{\"text\":\"DATABASE BACKUP FAILED! Immediate attention required.\"}"
  exit 1
fi
```

**Automated Backup Cron**:
```cron
# Backup database every 6 hours
0 */6 * * * /scripts/backup-database.sh >> /var/log/backup.log 2>&1

# Backup application files daily
0 2 * * * tar -czf /backups/app/app_$(date +\%Y\%m\%d).tar.gz /app

# Test restore monthly
0 3 1 * * /scripts/test-restore.sh
```

### Recovery Procedures

**Database Recovery**:
```bash
#!/bin/bash
# restore-database.sh

if [ -z "$1" ]; then
  echo "Usage: ./restore-database.sh <backup-file>"
  exit 1
fi

BACKUP_FILE=$1

# Stop application
kubectl scale deployment crypto-volumetrica --replicas=0

# Restore database
gunzip < $BACKUP_FILE | psql $DATABASE_URL

# Run migrations
npm run prisma:migrate:deploy

# Restart application
kubectl scale deployment crypto-volumetrica --replicas=3

echo "Recovery completed"
```

**Failover Configuration**:
```yaml
# Multi-region deployment
regions:
  primary:
    name: us-east-1
    database: primary-db.us-east-1.aws.com
    replicas: 3
  secondary:
    name: eu-west-1
    database: secondary-db.eu-west-1.aws.com
    replicas: 2
  disaster:
    name: ap-southeast-1
    database: dr-db.ap-southeast-1.aws.com
    replicas: 1

failover:
  automatic: true
  health_check_interval: 30s
  failover_threshold: 3
  recovery_time_objective: 5m
```