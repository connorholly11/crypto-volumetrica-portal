# Backup & Recovery Procedures

## Overview
This document outlines backup and recovery procedures for the Crypto Volumetrica Trading Portal.

## Automated Backups

### 1. Supabase Database
- **Frequency**: Daily automatic backups
- **Time**: Configured in Supabase Dashboard (default: 2 AM UTC)
- **Retention**: 7 days (free tier) / 30 days (pro tier)
- **Location**: Supabase Dashboard > Settings > Backups

### 2. Clerk User Data
- **Frequency**: Continuous (managed service)
- **Provider**: Clerk handles all user authentication data backups
- **Recovery**: Contact Clerk support for data recovery

### 3. Code Repository
- **Frequency**: On every push to GitHub
- **Branches**: All branches are backed up
- **History**: Full Git history maintained

## Manual Backup Process

### Before Major Changes
1. **Database Backup**
   ```bash
   # Export current database state
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
   
   # Store in secure location (e.g., encrypted S3 bucket)
   ```

2. **Environment Variables**
   ```bash
   # Export from Vercel (requires Vercel CLI)
   vercel env pull .env.backup
   
   # Store securely (never commit to Git!)
   ```

3. **User Data Export**
   - Clerk Dashboard > Users > Export Users
   - Download CSV file
   - Store in secure location

## Recovery Procedures

### 1. Database Recovery

#### From Supabase Backup
1. Navigate to Supabase Dashboard
2. Go to Settings > Backups
3. Select backup point
4. Click "Restore"
5. Confirm restoration

#### From Manual Backup
```bash
# Connect to database
psql $DATABASE_URL < backup_20240127_120000.sql
```

### 2. User Recovery
1. Contact Clerk support at support@clerk.dev
2. Provide:
   - Application ID
   - Approximate time of data loss
   - Description of issue
3. Follow their recovery process

### 3. Code Recovery
```bash
# List recent commits
git log --oneline -20

# Revert to specific commit
git checkout [commit-hash]

# Or revert last deployment
vercel rollback
```

### 4. Environment Variables Recovery
```bash
# If you have a backup
cat .env.backup > .env.local

# Re-add to Vercel
vercel env add
```

## Disaster Recovery Plan

### Complete System Failure
1. **Create new Vercel project**
   ```bash
   vercel --new
   ```

2. **Restore database**
   - Create new Supabase project
   - Restore from latest backup
   - Update DATABASE_URL in Vercel

3. **Restore authentication**
   - Contact Clerk for user data migration
   - Update Clerk keys in Vercel

4. **Deploy application**
   ```bash
   git push origin main
   vercel --prod
   ```

## Testing Recovery Procedures

### Monthly Recovery Test
1. Create test environment
2. Restore database backup to test DB
3. Verify data integrity
4. Document any issues

### Backup Verification Checklist
- [ ] Database backup exists and is recent
- [ ] Backup file is not corrupted
- [ ] Environment variables are documented
- [ ] Clerk export is available
- [ ] Recovery contact list is updated

## Emergency Contacts

### Primary Contacts
- **Supabase Support**: support@supabase.io
- **Clerk Support**: support@clerk.dev
- **Volumetrica API**: [Add contact]
- **Vercel Support**: Via dashboard

### Team Contacts
- **Team Lead**: [Name] - [Phone] - [Email]
- **DevOps Lead**: [Name] - [Phone] - [Email]
- **On-Call Engineer**: [Name] - [Phone] - [Email]

## Backup Storage Locations

### Production Backups
- **Database**: Supabase automatic backups
- **Manual Backups**: [Specify S3 bucket or secure location]
- **Documentation**: GitHub repository

### Access Requirements
- Supabase: Admin access required
- Clerk: Owner or Admin role
- Vercel: Team member access
- GitHub: Repository access

## Recovery Time Objectives (RTO)

| Component | Target RTO | Notes |
|-----------|-----------|-------|
| Database | < 1 hour | From Supabase backup |
| Users | < 2 hours | Clerk support required |
| Application | < 30 min | Vercel deployment |
| Full System | < 4 hours | Complete recovery |

## Preventive Measures

1. **Regular Testing**
   - Monthly backup verification
   - Quarterly recovery drill

2. **Monitoring**
   - Sentry alerts for errors
   - Database size monitoring
   - Backup job monitoring

3. **Documentation**
   - Keep this document updated
   - Document any recovery attempts
   - Update contact information

## Version History
- v1.0 - Initial documentation (January 2025)
- [Add updates here]

---

**Last Updated**: January 27, 2025
**Next Review**: February 27, 2025