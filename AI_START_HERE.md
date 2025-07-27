# 🤖 AI Agent Start Here - Crypto Volumetrica Portal

**This is THE starting point for all AI agents working on this codebase.**

## 🎯 Quick Context
- **What**: Crypto trading portal integrated with Volumetrica API
- **For**: Proprietary trading firm managing trader accounts
- **Purpose**: Monitor trading accounts, enforce risk rules, manage users
- **Status**: Phase 1 complete (auth, database, sync) - Ready for production

## 📍 Navigation Map

### 1️⃣ First - Understand the Rules
- **[AI Development Rules](/docs/ai-development/agent-rules.md)** - How we work together
- **[Collaboration Log](/docs/ai-development/collaboration-log.md)** - What's been done

### 2️⃣ Second - Understand the System
- **[Documentation Index](/docs/README.md)** - All documentation organized
- **[Architecture Overview](/docs/architecture/overview.md)** - Tech stack and design
- **[Business Logic](/docs/business/business-logic.md)** - How the system works

### 3️⃣ Third - Get Set Up
- **[Development Setup](/docs/guides/development-setup.md)** - Environment setup
- **[Troubleshooting](/docs/guides/troubleshooting.md)** - Common issues

### 4️⃣ Fourth - Check Current Status
- **[Launch Checklist](/docs/project-management/LAUNCH_CHECKLIST.md)** - What's needed for production
- **[Implementation Status](/docs/project-management/IMPLEMENTATION_SUMMARY.md)** - Current progress

## 🚀 Quick Commands

```bash
# Start development
npm run dev

# Run tests
npm test

# Check types
npm run type-check

# Open database UI
npx prisma studio
```

## 🔑 Key Information

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: Clerk
- **UI**: Tailwind CSS + shadcn/ui
- **API**: Volumetrica (external)

### Project Structure
```
/src/app/          # Pages and API routes
/src/components/   # React components
/src/lib/          # Utilities and services
/docs/             # All documentation
/prisma/           # Database schema
```

### Critical Files
- `/src/lib/volumetrica/client.ts` - API client with auth
- `/src/lib/sync-accounts.ts` - Account synchronization
- `/src/types/volumetrica.ts` - All TypeScript types
- `/prisma/schema.prisma` - Database schema

## ⚠️ Important Rules

1. **Always read before editing** - Use Read tool first
2. **Follow existing patterns** - Check similar files
3. **Update documentation** - Keep docs in sync with code
4. **Test your changes** - All tests must pass
5. **Use TypeScript strictly** - No `any` types
6. **Security first** - All routes need authentication

## 🎯 Common Tasks

### Adding a New API Endpoint
1. Check `/docs/architecture/api-reference.md` for patterns
2. Look at existing routes in `/src/app/api/`
3. Always include authentication: `requireAuth()`
4. Add rate limiting
5. Update API documentation

### Modifying the Database
1. Edit `/prisma/schema.prisma`
2. Run `npx prisma migrate dev --name your_change`
3. Update types will auto-generate
4. Document in `/docs/architecture/database.md`

### Adding UI Components
1. Check `/docs/guides/ui-components.md`
2. Use shadcn/ui components from `/src/components/ui/`
3. Follow existing component patterns
4. Keep components in feature folders

### Working with Volumetrica API
1. Read `/docs/api/volumetrica/platform.md`
2. Use the client: `/src/lib/volumetrica/client.ts`
3. Handle errors properly (see existing examples)
4. Never expose API keys to frontend

## 🔍 Where to Find Things

### Documentation
- **Architecture**: `/docs/architecture/` - How it's built
- **Guides**: `/docs/guides/` - How to do things
- **Business**: `/docs/business/` - What it does
- **API Docs**: `/docs/api/` - External integrations

### Code
- **Pages**: `/src/app/*/page.tsx`
- **API Routes**: `/src/app/api/*/route.ts`
- **Components**: `/src/components/`
- **Business Logic**: `/src/lib/`
- **Types**: `/src/types/`

### Configuration
- **Environment**: `.env.local` (already configured)
- **Database**: `prisma/schema.prisma`
- **TypeScript**: `tsconfig.json`
- **Dependencies**: `package.json`

## 📋 Current Priorities

1. **Environment Variables**: Set up production env vars
2. **Production Deployment**: Deploy to Vercel/AWS
3. **Monitoring**: Ensure Sentry is configured
4. **Testing**: Run final end-to-end tests

Check `/docs/project-management/LAUNCH_CHECKLIST.md` for detailed status.

## 💬 Need Help?

1. **First**: Check `/docs/guides/troubleshooting.md`
2. **Second**: Search existing code for patterns
3. **Third**: Check the collaboration log for similar work
4. **Finally**: Document your question in the collaboration log

## 🚦 Ready to Start?

1. ✅ Read this file completely
2. ✅ Check the collaboration log
3. ✅ Choose or get assigned a task
4. ✅ Update collaboration log with your start time
5. ✅ Begin work following the patterns

---

**Remember**: This codebase is production-ready. Maintain high quality standards and always test your changes. Good luck! 🚀