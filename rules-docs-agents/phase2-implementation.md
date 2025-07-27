**File to add:** `rules-docs-agents/phase2_implementation_plan.md`
*(Create this file at the same level as `phase1-implementation.md` so engineers see it early in the docs navigation.)*

---

# Phase 2 Implementation Plan – **Data Layer**

> **Scope recap:**
> Phase 2 delivers a persistent data layer backed by Supabase + PostgreSQL, mapped to Prisma models, plus background sync and audit logging as laid out in **post-proto.md**. It turns the prototype into a state‑aware application that no longer depends on Volumetrica for user + account storage.

---

## 1  Checkpoints

* **C1 – Schema in Source Control**: `schema.prisma` merged with all Phase 2 entities (`User`, `Account`, `AuditLog`, `SyncJob`).
* **C2 – Migrations Applied**: Supabase instance migrated in all environments; `DATABASE_URL` & `DIRECT_URL` verified.
* **C3 – Prisma Client Connected**: Successful read/write round‑trip (`prisma.user.findFirst`, `prisma.account.create`).
* **C4 – Auth Mapping Layer**: Clerk ⟷ Prisma identity mapping utilities implemented (`getOrCreateLocalUser`).
* **C5 – Volumetrica → DB Sync**: Cron route `/api/cron/sync-accounts` populates `Account` rows for at least one user.
* **C6 – Audit Middleware Live**: All mutating DB calls generate an `AuditLog` row with `userId`, `action`, and `details`.
* **C7 – Cache Strategy Operational**: `useAccount` & friends pull from DB first, then trigger Volumetrica refresh when stale.
* **C8 – Phase 2 Demo**: Admin creates user ➜ account syncs ➜ trader sees dashboard populated from DB.

---

## 2  Iterative Tasks

* **Data‑model evolution (3 iterations)**

  * *Why*: Expect feedback after first migration; self‑contained iterations keep rollbacks trivial.
  * *Done when*: No new columns/types required by current UI & API routes.

* **Account‑sync optimisation (until avg latency < 500 ms)**

  * *Why*: Volumetrica endpoints can be slow; refine batching/back‑off progressively.
  * *Criterion*: `GET /api/accounts` responds in < 500 ms (95th percentile) with cache warm.

* **Audit‑log enrichment (2 iterations)**

  * *Why*: Start with basic create/update/delete, extend to background jobs and integration failures.
  * *Criterion*: Every mutation path in `src/app/api/**` writes an `AuditLog`.

* **Cron‑job scalability (iterations until < 60 s)**

  * *Why*: 5‑minute job must finish before next run. Tune chunk size & parallelism.
  * *Criterion*: Sync of 1 000 accounts < 60 s on Vercel hobby tier.

---

## 3  Implementation Checklist

| Task                                                                                    | Dependency       | Est. Time (h) | Completed |
| --------------------------------------------------------------------------------------- | ---------------- | ------------- | --------- |
| **DB Schema** – add `User`, `Account`, `AuditLog`, `SyncJob` models to `schema.prisma`  | —                | 3             | ☐         |
| Generate & apply migration (`npx prisma migrate dev`)                                   | DB schema        | 0.5           | ☐         |
| Seed script for local dev data (`scripts/seed.ts`)                                      | Migration        | 1             | ☐         |
| **Supabase RLS policies** for `User` & `Account`                                        | Migration        | 2             | ☐         |
| Update `.env.example` with `DATABASE_URL`, `DIRECT_URL`                                 | —                | 0.25          | ☐         |
| **Prisma client** installation & build pipeline (CI step)                               | Migration        | 0.5           | ☐         |
| `lib/db.ts` ‑ Prisma singleton pattern                                                  | Prisma client    | 0.25          | ☐         |
| **Auth mapping util** `lib/auth/getCurrentUser.ts` (Clerk JWT ➜ DB)                     | db.ts            | 1             | ☐         |
| Extend **API routes** to use Prisma (`/api/users/create`, `/api/accounts/create`, etc.) | db.ts            | 4             | ☐         |
| Write **sync service** `lib/sync/syncUserAccounts.ts`                                   | db.ts            | 2             | ☐         |
| Cron route `/api/cron/sync-accounts/route.ts`                                           | syncUserAccounts | 1             | ☐         |
| Add `vercel.json` cron config                                                           | Cron route       | 0.25          | ☐         |
| **Cache layer**: `lib/cache/getAccountCached.ts` (DB first, then refresh)               | sync service     | 2             | ☐         |
| Refactor React hooks (`useAccount`, `useAccounts`) to call new cached endpoints         | Cache layer      | 3             | ☐         |
| **Prisma middleware** for audit logging in `prisma.$use`                                | db.ts            | 2             | ☐         |
| Create `lib/audit/index.ts` helpers (query/filter logs)                                 | Audit model      | 1             | ☐         |
| Add **Admin UI** audit‑log table (simple read‑only)                                     | audit helpers    | 3             | ☐         |
| Update **post-proto.md** cross‑refs & add link in `AI_AGENT_INTRO.md`                   | Plan ready       | 0.25          | ☐         |
| Document Phase 2 plan in `AGENT_COLLABORATION.md` header                                | This file        | 0.25          | ☐         |

*(Adjust estimates per team velocity.)*

---

## 4  Developer Guidance

### 4.1  Prisma Singleton

```ts
// lib/db.ts
import { PrismaClient } from "@prisma/client";

declare global { var prisma: PrismaClient | undefined }

export const prisma = global.prisma || new PrismaClient({
  log: ["error"],              // noisy levels disabled in prod
});

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
```

### 4.2  Clerk → Local User mapping

```ts
// lib/auth/getCurrentUser.ts
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

/** Ensures we have a local user row and returns it */
export async function requireLocalUser() {
  const clerkUser = await currentUser();     // throws if not signed in
  const email = clerkUser.emailAddresses[0]?.emailAddress;

  const user = await prisma.user.upsert({
    where: { clerkId: clerkUser.id },
    create: {
      clerkId: clerkUser.id,
      email,
      firstName: clerkUser.firstName ?? "",
      lastName: clerkUser.lastName ?? "",
    },
    update: {},
  });

  return user;
}
```

> **Pitfall:** Don’t store Volumetrica passwords! Only `volumetricaId`.

### 4.3  Sync Service Skeleton

```ts
// lib/sync/syncUserAccounts.ts
import { prisma } from "@/lib/db";
import { volumetricaApi } from "@/lib/volumetrica/client";

export async function syncUserAccounts(volUserId: string) {
  const remote = await volumetricaApi.accounts.list({ userId: volUserId });
  await prisma.$transaction(
    remote.accounts.map(acc =>
      prisma.account.upsert({
        where: { accountId: acc.accountId },
        update: mapAccount(acc),
        create: mapAccount(acc),
      })
    )
  );
}

function mapAccount(v: any) {
  return {
    accountId: v.accountId,
    user: { connect: { volumetricaId: v.userId } },
    balance: v.balance,
    currency: v.currency === 0 ? "EUR" : "USD",
    status: v.status,
    lastSync: new Date(),
    lastSequence: v.sequenceId ?? null,
  };
}
```

### 4.4  Prisma Audit Middleware

```ts
// lib/db.ts (append)
prisma.$use(async (params, next) => {
  const result = await next(params);
  if (["create", "update", "delete"].includes(params.action)) {
    const userId = getClerkIdOrSystem();         // util that handles cron jobs
    await prisma.auditLog.create({
      data: {
        userId,
        action: `${params.model}.${params.action}`,
        details: params.args as any,
        ipAddress: getClientIpOrJobName(),
      },
    });
  }
  return result;
});
```

> **Complexity warning:** Large `details` JSONs ❯ index on `createdAt,userId` for queries.

### 4.5  Caching Contract

* **Staleness window**: 5 minutes (`STALE_AFTER_MS = 5*60*1000`).
* `/api/accounts/:id` returns DB copy **immediately** with `X-Data-Stale: true/false`.
* If stale, it triggers `syncUserAccounts` **in background** (no await).
* Front‑end hook watches `X-Data-Stale`; if `true`, schedules silent refetch after 2 s.

### 4.6  Rate Limiting Example

```ts
// lib/middleware/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { kv } from "@vercel/kv";

export const limiter = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(30, "10 s"),
});
```

### 4.7  Environment Vars (additions)

```env
# Database
DATABASE_URL=postgresql://....
DIRECT_URL=postgresql://....     # for migrations only

# Cron
CRON_SECRET=${randomHex32}

# Optional Upstash
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

---

## 5  Success Criteria

* **SC‑1**  All Prisma migrations apply cleanly on Supabase and local dev.
* **SC‑2**  Every Clerk user has an associated `User` row in PostgreSQL.
* **SC‑3**  `/api/cron/sync-accounts` runs via Vercel cron and inserts/updates account rows without errors.
* **SC‑4**  Admin + Trader dashboards read exclusively from PostgreSQL, not directly from Volumetrica.
* **SC‑5**  Cache freshness: account balance visible in UI < 5 min behind Volumetrica (± polling interval).
* **SC‑6**  AuditLog row count matches count of DB mutations during a typical user flow (± 10 %).
* **SC‑7**  95ᵗʰ percentile latency for `/api/accounts` < 500 ms with warm cache.
* **SC‑8**  All checklist items marked **Completed = Yes** in this document.

---

Save this file and reference it from **AI\_AGENT\_INTRO.md** (“Phase 2 Implementation Plan ➜ *start here if Phase 1 is completed*”).
