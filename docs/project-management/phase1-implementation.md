Below is the full contents of **`phase1_implementation_plan.md`**.
Save it at the project root (`crypto‑vol‑integration/phase1_implementation_plan.md`).

---

````markdown
# Phase 1 Implementation Plan  
*Based on “Post‑Prototype Roadmap – Final Implementation Plan” (dated 2025‑07‑27)*  

## 1  Checkpoints

- **Checkpoint 1 – Infrastructure Bootstrapped (Day 1)**  
  - Supabase project created (default region - simplify for now)  
  - Clerk dev instance created  
  - Vercel project + GitHub repo online  
  - `.env.local` committed **only** to Vercel/Clerk/Supabase secrets vaults  
  - Volumetrica API test successful (verify staging access)  

- **Checkpoint 2 – Database & Auth Wired (Day 2)**  
  - `schema.prisma` added; initial migration applied to Supabase  
  - Clerk SDK installed and middleware configured  
  - Row‑Level‑Security (RLS) policies for `User` table enabled & verified  

- **Checkpoint 3 – Clerk Integration Smoke‑Test (Day 3)**  
  - Public `/sign‑in` and protected `/dashboard` routes working locally  
  - `requireAuth()` helper returns Clerk user ID inside API route  

- **Checkpoint 4 – Admin ⟶ Trader Creation Flow (Day 4)**  
  - API route `src/app/api/admin/users/create/route.ts` creates  
    1. Clerk user (temp pwd)  
    2. Volumetrica user  
    3. DB mapping row (`User`)  
  - Happy‑path tested via REST client  

- **Checkpoint 5 – Trader Dashboard Reads Cached Accounts (Day 5)**  
  - Authenticated trader hits `/trader/[userId]` → accounts loaded from DB cache  
  - If cache stale (>5 min) background sync triggers Volumetrica fetch + upsert  

## 2  Iterative Tasks

- **Account/Position Sync Logic (2 iterations)**  
  1. *Iteration A* – Basic pull every 5 min via cron, no sequence handling  
  2. *Iteration B* – Add `sequenceId` check + idempotent upsert  

  *Rationale*: Enables early demo while deferring complexity of idempotency.  

- **RLS Policy Hardening (until zero failing tests)**  
  - Iterate until Cypress auth tests confirm traders cannot read others’ rows.  

- **Environment Variable Management (3 passes)**  
  1. Local dev `.env.example`  
  2. Vercel staging env → secrets injected  
  3. GitHub Actions workflow verifies required vars present  

- **Error Handling & Logging Middleware (open‑ended, converge when Sentry shows <1% unhandled)**  
  - Incrementally wrap API routes with try/catch + Sentry capture.  

## 3  Implementation Checklist

| # | Task | Dependency | Est. Time (h) | Completed |
|---|------|------------|---------------|-----------|
| 1 | Create Supabase project (default region) | – | 1 | ☐ |
| 2 | Create Clerk dev instance | – | 0.5 | ☐ |
| 3 | Set up Vercel project + GitHub repo | – | 1 | ☐ |
| 4 | Add **DATABASE_URL**/**CLERK\_KEYS**/**VOLUMETRICA\_KEY** to Vercel/Supabase/Clerk | 1‑3 | 0.5 | ☐ |
| 5 | `npm i prisma @prisma/client` + `npx prisma init` | 1 | 0.5 | ☐ |
| 6 | Write `schema.prisma` v1 (User, Account, AuditLog) | 5 | 1 | ☐ |
| 7 | `npx prisma migrate dev --name init` | 6 | 0.5 | ☐ |
| 8 | Enable RLS & policies in Supabase (`sql/rls.sql`) | 6‑7 | 1 | ☐ |
| 9 | `npm i @clerk/nextjs` + middleware (`src/middleware.ts`) | 2 | 1 | ☐ |
|10 | Implement `lib/auth.ts::requireAuth()` | 9 | 0.5 | ☐ |
|11 | Add health check endpoint `/api/health` | – | 0.5 | ☐ |
|12 | Protect `/trader/*` & `/admin/*` routes with Clerk | 10 | 0.5 | ☐ |
|12 | API route **admin/users/create** (Clerk → Volumetrica → DB) | 4,6,9 | 2 | ☐ |
|13 | Hook up `AccountCreationForm` to new route | 12 | 0.5 | ☐ |
|14 | Add account sync util `lib/syncAccounts.ts` (vol → DB) | 6 | 2 | ☐ |
|15 | Cron endpoint `/api/cron/sync-accounts` | 14 | 1 | ☐ |
|16 | Configure Vercel cron (`vercel.json`) | 15 | 0.5 | ☐ |
|17 | Trader dashboard server API `/api/accounts` reads DB then sync if stale | 14 | 1.5 | ☐ |
|18 | Integrate Sentry (`npm i @sentry/nextjs`) & wrap API routes | 3 | 1 | ☐ |
|19 | Update docs (`AGENT_RULES.md`, `AI_AGENT_INTRO.md`) to reference Phase‑1 auth flow | – | 0.5 | ☐ |

> **Legend**: time = engineer‑hours of focused work.  
> **Total estimate**: 20 hours (~2.5 days of focused work)  

## 4  Developer Guidance

### 4.1  Environment File (`.env.local`)

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
DATABASE_URL=postgresql://postgres:<pwd>@db.supabase.co:5432/postgres
VOLUMETRICA_API_URL=https://staging-api.volumetricafx.com
VOLUMETRICA_API_KEY=stv_xxx
CRON_SECRET=your-secret-for-cron-jobs  # Generate with openssl rand -base64 32
```

*Never commit real keys.* Use Vercel’s “Environment Variables” UI.

### 4.2  Prisma Models (excerpt)

```prisma
model User {
  id            String   @id @default(uuid())
  clerkId       String   @unique
  volumetricaId String   @unique
  email         String   @unique
  firstName     String
  lastName      String
  country       String   @db.Char(2)
  state         String?  @db.Char(2)
  phone         String?
  createdAt     DateTime @default(now())
  accounts      Account[]
  auditLogs     AuditLog[]
}

model Account {
  accountId     String   @id         // Volumetrica ID
  userId        String
  balance       Decimal  @db.Decimal(18,2)
  currency      String   @db.Char(3)
  status        Int
  lastSequence  String?
  lastSync      DateTime
  createdAt     DateTime @default(now())
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### 4.3  Auth Helper

```ts
// lib/auth.ts
import { auth, redirect } from "@clerk/nextjs/server";

export function requireAuth() {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");
  return userId;
}
```

### 4.4  Admin → Trader Creation Flow (API Route Skeleton)

```ts
// src/app/api/admin/users/create/route.ts
export async function POST(req: Request) {
  const { firstName, lastName, email, country, state } = await req.json();

  /* 1. Clerk user */
  const clerkUser = await clerk.users.createUser({
    emailAddress: email,
    password: generateTempPassword(),
    firstName,
    lastName,
  });

  /* 2. Volumetrica user */
  const vol = await volumetricaApi.users.create({ email, firstName, lastName, country });

  /* 3. DB mapping */
  await prisma.user.create({
    data: {
      clerkId: clerkUser.id,
      volumetricaId: vol.userId,
      email,
      firstName,
      lastName,
      country,
      state,
    },
  });

  return Response.json({ success: true });
}
```

> **Pitfall**: Volumetrica sometimes returns `200` even on partial failure—always check `success` flag.

### 4.5  Supabase RLS Snippet

```sql
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
```

Be sure to execute via Supabase SQL editor **after** first migration.

### 4.6  Cron Sync Pattern

```ts
async function syncUserAccounts(volUserId: string) {
  const live = await volumetricaApi.accounts.list({ userId: volUserId });
  await prisma.$transaction(
    live.items.map(acc =>
      prisma.account.upsert({
        where: { accountId: acc.accountId },
        update: { ...mapAcc(acc), lastSequence: acc.sequenceId, lastSync: new Date() },
        create: { ...mapAcc(acc), lastSequence: acc.sequenceId, lastSync: new Date() },
      })
    )
  );
}
```

### 4.7  Logging & Monitoring

Wrap every API route with a simple utility:

```ts
export const withErrorCapture = (handler: NextRouteHandler) =>
  async (req: Request, ctx: any) => {
    try { return await handler(req, ctx); }
    catch (e) { Sentry.captureException(e); throw e; }
  };
```

## 5  Success Criteria

* ✅ **Auth Flow**: Users can sign‑in/out via Clerk; un‑authed users redirected.
* ✅ **DB Schema**: `User`, `Account`, `AuditLog` tables live; migrations reproducible.
* ✅ **RLS Enforcement**: Automated test proves trader A cannot read trader B’s rows.
* ✅ **Admin Endpoint**: Hitting `/api/admin/users/create` creates Clerk user, Volumetrica user, DB mapping in one transaction (or rolls back).
* ✅ **Cron Sync**: Vercel cron runs every 5 min and updates at least one account row.
* ✅ **Trader Dashboard**: Logged‑in trader sees balances from DB without hitting Volumetrica on every page load.
* ✅ **Error Capture**: Unhandled exceptions in any API route are reported to Sentry with stack trace and user context.

```

---

**File generation complete.**  
Add this file to version control and reference it from `AGENT_COLLABORATION.md` as the authoritative guide for Phase 1.
```
