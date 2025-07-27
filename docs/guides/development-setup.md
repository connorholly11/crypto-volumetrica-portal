# Development Environment Setup

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [Running the Application](#running-the-application)
6. [Development Tools](#development-tools)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements
- **Node.js**: v18.17.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher
- **PostgreSQL**: v14 or higher
- **Git**: v2.0 or higher
- **OS**: macOS, Linux, or Windows with WSL2

### Recommended Tools
- **VS Code** with extensions:
  - Prisma
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript and JavaScript Language Features
- **PostgreSQL Client**: pgAdmin or DBeaver
- **API Testing**: Postman or Insomnia
- **Browser**: Chrome with React Developer Tools

## Initial Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/crypto-volumetrica.git
cd crypto-volumetrica
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Install Development Tools
```bash
# Install Prisma CLI globally (optional)
npm install -g prisma

# Install database migration tools
npm install -g dotenv-cli
```

## Environment Configuration

### 1. Create Environment File
```bash
cp .env.example .env.local
```

### 2. Configure Environment Variables

Edit `.env.local` with your values:

```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/crypto_volumetrica"

# Volumetrica API (Development)
VOLUMETRICA_API_URL="https://staging.volumetrica.com"
VOLUMETRICA_API_KEY="your-staging-api-key"

# Clerk Authentication (Development)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/admin"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/admin"

# Sentry Error Tracking (Optional for Development)
SENTRY_DSN="https://...@sentry.io/..."
SENTRY_ORG="your-org"
SENTRY_PROJECT="crypto-volumetrica-dev"
SENTRY_AUTH_TOKEN="..."

# Redis for Rate Limiting (Optional for Development)
UPSTASH_REDIS_REST_URL="https://...upstash.io"
UPSTASH_REDIS_REST_TOKEN="..."

# Application Settings
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# Cron Secret (for local testing)
CRON_SECRET="development-secret-change-in-production"
```

### 3. Obtain API Keys

#### Clerk Authentication
1. Sign up at [clerk.com](https://clerk.com)
2. Create a new application
3. Copy publishable and secret keys
4. Configure OAuth providers if needed

#### Volumetrica API
1. Request staging access from Volumetrica
2. Obtain API key from their dashboard
3. Note API rate limits for development

#### Upstash Redis (Optional)
1. Create account at [upstash.com](https://upstash.com)
2. Create a Redis database
3. Copy REST URL and token

## Database Setup

### 1. Install PostgreSQL

#### macOS
```bash
brew install postgresql@14
brew services start postgresql@14
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### Windows
Download installer from [postgresql.org](https://www.postgresql.org/download/windows/)

### 2. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE crypto_volumetrica;
CREATE USER crypto_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE crypto_volumetrica TO crypto_user;
\q
```

### 3. Run Prisma Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database (optional)
npm run db:seed
```

### 4. Verify Database Setup

```bash
# Open Prisma Studio
npx prisma studio
```

## Running the Application

### Development Server

```bash
# Start the development server
npm run dev

# Or with specific port
PORT=3001 npm run dev
```

The application will be available at:
- Main app: http://localhost:3000
- API routes: http://localhost:3000/api

### Build and Production Mode

```bash
# Build the application
npm run build

# Run in production mode
npm start
```

### Running with Docker (Optional)

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f
```

## Development Tools

### 1. Database Management

```bash
# Reset database
npm run db:reset

# Run specific migration
npx prisma migrate dev --name add_new_field

# Generate migration SQL without applying
npx prisma migrate dev --create-only
```

### 2. Type Generation

```bash
# Generate TypeScript types from Prisma schema
npx prisma generate

# Type check the project
npm run type-check
```

### 3. Linting and Formatting

```bash
# Run ESLint
npm run lint

# Fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format
```

### 4. Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test src/lib/utils.test.ts

# Generate coverage report
npm run test:coverage
```

### 5. API Development

```bash
# Generate API documentation
npm run docs:api

# Test API endpoints
curl -X POST http://localhost:3000/api/users/create \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","firstName":"Test","lastName":"User"}'
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Error
```
Error: P1001: Can't reach database server
```

**Solution**:
- Verify PostgreSQL is running: `pg_isready`
- Check DATABASE_URL format
- Ensure database exists: `psql -U postgres -l`

#### 2. Prisma Client Not Found
```
Error: @prisma/client did not initialize yet
```

**Solution**:
```bash
npx prisma generate
npm install
```

#### 3. Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution**:
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

#### 4. Environment Variables Not Loading
```
Error: Missing required environment variable
```

**Solution**:
- Ensure `.env.local` exists
- Check variable names match exactly
- Restart development server
- For production builds, use `.env.production`

#### 5. TypeScript Errors
```
Type error: Property does not exist
```

**Solution**:
```bash
# Regenerate types
npx prisma generate

# Clear TypeScript cache
rm -rf node_modules/.cache
npm run dev
```

### Debug Mode

Enable detailed logging:

```bash
# Enable debug mode
DEBUG=* npm run dev

# Specific debug namespaces
DEBUG=prisma:client npm run dev
DEBUG=volumetrica:* npm run dev
```

### Performance Profiling

```bash
# Run with Node.js profiler
node --prof npm run dev

# Analyze performance
node --prof-process isolate-*.log > profile.txt
```

### Database Debugging

```sql
-- Check active connections
SELECT pid, usename, application_name, client_addr, state
FROM pg_stat_activity
WHERE datname = 'crypto_volumetrica';

-- Check slow queries
SELECT query, calls, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

## Next Steps

1. **Set up your IDE** with recommended extensions
2. **Review the codebase structure** in `/docs/architecture.md`
3. **Understand the business logic** in `/docs/business-logic.md`
4. **Learn about testing** in `/docs/testing.md`
5. **Check security guidelines** in `/docs/security.md`

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)