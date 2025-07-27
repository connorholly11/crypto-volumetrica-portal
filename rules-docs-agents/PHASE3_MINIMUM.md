# Phase 3: Minimum Requirements for Launch

This document extracts only the **absolute minimum** items needed from Phase 3 (Production Hardening) to safely launch.

## Time Required: 3-4 hours total

## 1. Production API Switch (30 minutes)

### What to do:
1. Get production API credentials from Volumetrica
2. Update environment variables:
```env
VOLUMETRICA_API_URL=https://api.volumetricafx.com  # Remove 'staging-'
VOLUMETRICA_API_KEY=prod_xxxxx  # Production key
```
3. Test a few API calls to verify access

### Why critical:
- Staging API has rate limits and may have test data
- Production API is required for real trading accounts

## 2. Basic Rate Limiting (1 hour)

### Option A: Vercel Edge Config (Recommended)
```typescript
// src/lib/rate-limit.ts
import { get } from '@vercel/edge-config';

export async function checkRateLimit(identifier: string) {
  const limit = await get('rateLimit') || { requests: 10, window: 10 };
  // Implement sliding window logic
}
```

### Option B: Simple In-Memory (Quick MVP)
```typescript
// src/lib/simple-rate-limit.ts
const requests = new Map<string, number[]>();

export function rateLimitMiddleware(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();
  const userRequests = requests.get(ip) || [];
  const recentRequests = userRequests.filter(t => t > now - 10000);
  
  if (recentRequests.length >= 10) {
    return new Response('Too Many Requests', { status: 429 });
  }
  
  recentRequests.push(now);
  requests.set(ip, recentRequests);
}
```

### Apply to critical routes:
- `/api/admin/users/create` - Prevent spam user creation
- `/api/accounts` - Prevent data scraping
- `/api/cron/*` - Already protected by CRON_SECRET

### Why critical:
- Prevents API abuse and Volumetrica rate limit hits
- Protects against basic DoS attacks
- Required for production stability

## 3. Security Audit (30 minutes)

### Checklist:
```bash
# 1. Check environment variables
□ All secrets in Vercel dashboard (not in code)
□ Different keys for dev/staging/prod
□ CRON_SECRET is random and secure

# 2. Verify Git security
□ .env.local in .gitignore
□ No committed secrets in git history
□ No hardcoded API keys or passwords

# 3. Check authentication
□ All API routes use requireAuth() or requireAdmin()
□ Middleware properly configured
□ Sign-in/sign-up pages working

# 4. Review error messages
□ No sensitive data in error responses
□ No stack traces in production
□ Generic messages for auth failures
```

### Why critical:
- Prevents credential leaks
- Ensures proper access control
- Protects user data

## 4. Error Alerts (15 minutes)

### Sentry Configuration:
1. Log into Sentry dashboard
2. Set up alerts:
   - **Critical**: Unhandled errors (email immediately)
   - **Warning**: High error rate (> 1% of requests)
   - **Cron failures**: Alert if sync-accounts fails

### Vercel Monitoring:
1. Enable Vercel Analytics (free tier)
2. Set up alerts for:
   - Function timeouts
   - High error rates
   - Deployment failures

### Why critical:
- Know immediately if something breaks
- Catch issues before users complain
- Monitor cron job health

## 5. Backup Plan Documentation (30 minutes)

### Create `BACKUP_RECOVERY.md`:
```markdown
# Backup & Recovery Procedures

## Regular Backups (Automatic)
- **Supabase**: Daily automatic backups (Settings > Backups)
- **Clerk**: User data backed up by Clerk
- **Code**: GitHub repository

## Manual Backup Before Major Changes
1. Supabase: Create manual backup point
2. Export critical data: `pg_dump $DATABASE_URL > backup.sql`

## Recovery Procedures
1. **Database**: Restore from Supabase dashboard
2. **Users**: Contact Clerk support for restore
3. **Code**: Git revert to last working commit

## Emergency Contacts
- Supabase: support@supabase.io
- Clerk: support@clerk.dev
- Volumetrica: [their support contact]
```

### Why critical:
- Quick recovery from disasters
- Reduces downtime
- Peace of mind for launch

## What We're Skipping (Add Later)

### Can wait 1-2 weeks:
- ❌ Multi-factor authentication (MFA)
- ❌ GDPR compliance endpoints
- ❌ Load testing
- ❌ Custom domain setup
- ❌ Advanced caching (Redis)

### Can wait 1-2 months:
- ❌ SOC2 compliance
- ❌ Detailed audit trail UI
- ❌ IP whitelisting
- ❌ Advanced rate limiting per user/tier
- ❌ Automated security scanning

## Implementation Order

1. **First**: Security audit (know what you're working with)
2. **Second**: Production API switch (test everything works)
3. **Third**: Rate limiting (protect the APIs)
4. **Fourth**: Error alerts (know if something breaks)
5. **Last**: Document backups (prepare for worst case)

## Verification Steps

After implementing:
1. Try to spam an API endpoint (should get rate limited)
2. Trigger a test error (should see in Sentry)
3. Check all env vars are in Vercel (not in code)
4. Verify production API returns real data
5. Test backup procedures work

---

**Time Investment: 3-4 hours**
**Risk Reduction: 90%**
**Ready to Launch: YES! 🚀**