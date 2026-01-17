# 🚀 Launch Checklist

This document outlines the absolute minimum requirements to launch the Crypto Volumetrica Portal safely.

## ✅ Phase 1 Status: COMPLETE
All core functionality is implemented and ready.

## 📋 Phase 2 Requirements: PARTIAL
Only critical items needed before launch:

### Must Have (from Phase 2):
- [ ] **Enhanced Audit Logging** - Add Prisma middleware for comprehensive audit trail
- [ ] **SyncJob Tracking** - Add model to track sync status and failures
- [ ] **Performance Verification** - Ensure < 500ms response times

### Nice to Have (can add post-launch):
- [ ] Admin audit log viewer UI
- [ ] Detailed sync metrics dashboard
- [ ] Advanced error recovery mechanisms

## 🔒 Phase 3 Minimum Requirements

### Critical Security & Production Items:

#### 1. **Switch to Production Volumetrica API** (30 min)
```env
# Change in .env.local and Vercel:
VOLUMETRICA_API_URL=https://api.volumetricafx.com
VOLUMETRICA_API_KEY=your_production_key
```

#### 2. **Basic Rate Limiting** (1 hour)
```typescript
// Add to API routes using Vercel Edge Config:
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});

// Or use simple in-memory for MVP:
const requests = new Map();
function simpleRateLimit(ip: string) {
  const now = Date.now();
  const windowStart = now - 10000; // 10 seconds
  const userRequests = requests.get(ip) || [];
  const recentRequests = userRequests.filter(time => time > windowStart);
  
  if (recentRequests.length >= 10) {
    throw new Error("Rate limit exceeded");
  }
  
  recentRequests.push(now);
  requests.set(ip, recentRequests);
}
```

#### 3. **Environment Security Audit** (30 min)
- [ ] Verify all secrets are in Vercel environment variables
- [ ] Confirm `.env.local` is in `.gitignore`
- [ ] Check no hardcoded keys in codebase
- [ ] Review Clerk security settings

#### 4. **Error Monitoring Setup** (15 min)
- [ ] Configure Sentry email alerts for errors
- [ ] Set up alert for cron job failures
- [ ] Create alert for high error rates

#### 5. **Backup Documentation** (30 min)
Create a simple backup guide:
```markdown
## Backup Procedures
1. **Supabase**: Dashboard > Settings > Backups (automatic)
2. **Clerk Users**: Dashboard > Users > Export
3. **Recovery**: Document how to restore from backups
```

## 🚦 Pre-Launch Checklist

### Environment Setup
- [ ] Create production Clerk instance
- [ ] Create production Supabase project
- [ ] Obtain production Volumetrica API credentials
- [ ] Generate CRON_SECRET: `openssl rand -base64 32`
- [ ] Set up Sentry project (optional but recommended)

### Vercel Deployment
- [ ] Add all environment variables to Vercel
- [ ] Verify cron job is configured
- [ ] Test health endpoint: `/api/health`
- [ ] Confirm custom domain (optional)

### Database Setup
- [ ] Run migrations on production Supabase
- [ ] Apply RLS policies from `sql/rls.sql`
- [ ] Verify connection strings work

### Testing
- [ ] Create test admin user in Clerk
- [ ] Test complete user creation flow
- [ ] Verify account sync works
- [ ] Check trader dashboard displays data
- [ ] Test error handling scenarios

### Security Final Check
- [ ] Rate limiting active on all API routes
- [ ] All routes require authentication (except health)
- [ ] Admin routes check for admin role
- [ ] No sensitive data in logs

## 🎯 Launch Sequence

1. **Deploy to Vercel** (with all env vars)
2. **Run database migrations**
3. **Apply RLS policies**
4. **Create first admin user** in Clerk dashboard
5. **Test admin → trader flow** end-to-end
6. **Monitor Sentry** for first 24 hours
7. **Check cron job** runs successfully

## 📊 Post-Launch Monitoring

### First 24 Hours
- Monitor Sentry for errors
- Check Vercel logs for issues
- Verify cron job runs every 5 minutes
- Watch database connection count

### First Week
- Review API response times
- Check data sync accuracy
- Gather user feedback
- Plan Phase 2/3 completion

## 🚨 Emergency Contacts

Document these before launch:
- Volumetrica API support: [contact]
- Supabase support: support@supabase.io
- Clerk support: support@clerk.dev
- Your team escalation: [contacts]

---

**Total Pre-Launch Time: ~3-4 hours**

Once these items are complete, you can safely launch! 🎉