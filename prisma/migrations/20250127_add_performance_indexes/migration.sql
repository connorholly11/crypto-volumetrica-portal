-- Add indexes for common query patterns to improve performance

-- Account table indexes
CREATE INDEX IF NOT EXISTS "idx_account_userid" ON "Account"("userId");
CREATE INDEX IF NOT EXISTS "idx_account_lastsync" ON "Account"("lastSync");
CREATE INDEX IF NOT EXISTS "idx_account_userid_lastsync" ON "Account"("userId", "lastSync");

-- AuditLog table indexes
CREATE INDEX IF NOT EXISTS "idx_auditlog_userid" ON "AuditLog"("userId");
CREATE INDEX IF NOT EXISTS "idx_auditlog_createdat" ON "AuditLog"("createdAt");

-- User table indexes (for common lookups)
CREATE INDEX IF NOT EXISTS "idx_user_clerkid" ON "User"("clerkId");
CREATE INDEX IF NOT EXISTS "idx_user_volumetricaid" ON "User"("volumetricaId");
CREATE INDEX IF NOT EXISTS "idx_user_email" ON "User"("email");