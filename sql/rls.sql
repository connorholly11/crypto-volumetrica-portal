-- Row Level Security (RLS) Policies for Supabase
-- This file implements RLS to ensure users can only access their own data
-- 
-- IMPORTANT: Clerk Integration Challenge
-- Supabase doesn't know about Clerk IDs, so we need to pass the clerkId from the application
-- using current_setting() function. The application must set this value in each database session
-- using: SET LOCAL app.current_user_clerk_id = 'clerk_user_id_here';

-- Enable RLS on all tables
alter table "User" enable row level security;
alter table "Account" enable row level security;
alter table "AuditLog" enable row level security;

-- For User table: Users can only read their own record
-- Note: We'll need to pass clerkId from the app since Supabase doesn't know about Clerk
create policy "Users read own record"
on "User"
for select
using ("clerkId" = current_setting('app.current_user_clerk_id', true));

-- For Account table: Users can only see accounts linked to their user record
create policy "Users see own accounts"
on "Account"
for select
using (
  "userId" IN (
    SELECT id FROM "User" WHERE "clerkId" = current_setting('app.current_user_clerk_id', true)
  )
);

-- Admin bypass policy (implement in Phase 2)
-- create policy "Admins bypass all"
-- on "User"
-- for all
-- using (current_setting('app.current_user_role', true) = 'admin');

-- IMPLEMENTATION NOTES:
-- 1. Execute this file via Supabase SQL editor AFTER the first migration
-- 2. The application must set the current user's Clerk ID before each query:
--    await prisma.$executeRaw`SET LOCAL app.current_user_clerk_id = ${clerkId}`;
-- 3. For Phase 2, we'll add admin bypass policies using a similar pattern with roles
-- 4. AuditLog policies will be added when we implement audit logging functionality