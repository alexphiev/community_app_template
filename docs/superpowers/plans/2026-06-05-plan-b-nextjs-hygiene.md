# Plan B — Next.js 16 Hygiene Pass

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix legacy Next.js patterns left by the original AI-built code — no new features, only quality and correctness improvements.

**Architecture:** Four independent surgical edits: font loading, error boundaries, a broken API call, and an async params audit. Each task is self-contained and commits cleanly.

**Tech Stack:** Next.js 16 App Router, `next/font/google`, TypeScript

---

## File Map

| Action | File | Change |
|--------|------|--------|
| Modify | `app/layout.tsx` | Replace `<link>` font tags with `next/font/google` |
| Create | `app/(app)/error.tsx` | Error boundary for authenticated app shell |
| Create | `app/(app)/not-found.tsx` | 404 page for authenticated routes |
| Create | `app/(auth)/error.tsx` | Error boundary for auth pages |
| Modify | `lib/actions/admin.ts` | Fix `revalidateTag` wrong second argument (5 calls) |

---

## Task 1: Replace Google Fonts `<link>` tags with `next/font`

**Files:**
- Modify: `app/layout.tsx`

The current layout loads Bricolage Grotesque and Inter via a `<link>` tag to fonts.googleapis.com. This blocks rendering and bypasses Next.js font optimization. Material Symbols stays as a `<link>` tag — it's an icon font with variable axes not supported by `next/font`.

- [ ] **Step 1: Replace `app/layout.tsx`** with the next/font version:

```tsx
import type { Metadata } from "next"
import { Bricolage_Grotesque, Inter } from "next/font/google"
import "./globals.css"

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-bricolage",
  display: "swap",
})

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Hub Pro — Info Jeunes PDL",
  description: "Plateforme professionnelle du Réseau Info Jeunes Pays de la Loire",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${bricolage.variable} ${inter.variable}`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-9999 focus:px-4 focus:py-2 focus:bg-teal-700 focus:text-white focus:rounded-md focus:text-sm"
        >
          Aller au contenu principal
        </a>
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Update Tailwind config to use CSS variables**

The existing components use `style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}` inline — those still work via the CSS variable fallback. But check `globals.css` for any hardcoded font-family rules and verify Tailwind picks up the variables.

Open `app/globals.css` and check if there's a `font-family` declaration. If not, no change needed.

- [ ] **Step 3: Verify TypeScript and build**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Start dev server and spot-check**

```bash
pnpm dev
```

Open `http://localhost:3000/login`. The page should load with the same fonts. Open DevTools → Network → filter by "Font" — you should see fonts loaded from `/_next/static/media/` (self-hosted), not from `fonts.googleapis.com`.

- [ ] **Step 5: Commit**

```bash
git add app/layout.tsx
git commit -m "perf(fonts): replace Google Fonts link tags with next/font/google"
```

---

## Task 2: Add error boundaries

**Files:**
- Create: `app/(app)/error.tsx`
- Create: `app/(auth)/error.tsx`
- Create: `app/(app)/not-found.tsx`

Next.js requires `error.tsx` to be a Client Component (it receives an `Error` object as prop). `not-found.tsx` is a Server Component.

- [ ] **Step 1: Create `app/(app)/error.tsx`**

```tsx
"use client"

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      <span className="material-symbols-outlined text-[64px] text-coral-700">error</span>
      <div>
        <h1
          className="text-[24px] font-semibold text-on-surface mb-2"
          style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}
        >
          Une erreur est survenue
        </h1>
        <p className="text-[14px] text-on-surface-variant max-w-sm">
          {error.message || "Quelque chose s'est mal passé. Veuillez réessayer."}
        </p>
      </div>
      <button
        onClick={reset}
        className="h-10 px-6 rounded-[6px] bg-teal-700 text-white text-[14px] font-medium hover:bg-teal-800 transition-colors"
      >
        Réessayer
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Create `app/(auth)/error.tsx`**

```tsx
"use client"

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6faf9]">
      <div className="w-full max-w-sm bg-white rounded-[14px] border border-[#bdc9c7] shadow-sm p-8 text-center">
        <span className="material-symbols-outlined text-[48px] text-coral-700 mb-4 block">error</span>
        <h1
          className="text-[20px] font-semibold text-on-surface mb-2"
          style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}
        >
          Une erreur est survenue
        </h1>
        <p className="text-[14px] text-[#3e4948] mb-6">
          {error.message || "Veuillez réessayer ou contacter votre administrateur."}
        </p>
        <button
          onClick={reset}
          className="h-10 w-full rounded-[6px] bg-teal-700 text-white text-[14px] font-medium hover:bg-teal-800 transition-colors"
        >
          Réessayer
        </button>
        <a href="/login" className="block mt-4 text-[13px] text-teal-700 hover:underline">
          Retour à la connexion
        </a>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `app/(app)/not-found.tsx`**

```tsx
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      <span className="material-symbols-outlined text-[64px] text-on-surface-variant">search_off</span>
      <div>
        <h1
          className="text-[24px] font-semibold text-on-surface mb-2"
          style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}
        >
          Page introuvable
        </h1>
        <p className="text-[14px] text-on-surface-variant max-w-sm">
          La page que vous cherchez n&apos;existe pas ou a été déplacée.
        </p>
      </div>
      <Link
        href="/dashboard"
        className="h-10 px-6 rounded-[6px] bg-teal-700 text-white text-[14px] font-medium hover:bg-teal-800 transition-colors flex items-center"
      >
        Retour au tableau de bord
      </Link>
    </div>
  )
}
```

- [ ] **Step 4: Verify TypeScript**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Test error boundary in browser**

Start dev server. The error boundaries are hard to trigger without throwing deliberately — just verify the files are syntactically valid and the build succeeds:

```bash
pnpm build 2>&1 | tail -10
```

Expected: build completes, the three new routes appear in the output.

- [ ] **Step 6: Commit**

```bash
git add "app/(app)/error.tsx" "app/(auth)/error.tsx" "app/(app)/not-found.tsx"
git commit -m "feat(errors): add error boundaries and not-found pages for app and auth routes"
```

---

## Task 3: Fix `revalidateTag` wrong argument

**Files:**
- Modify: `lib/actions/admin.ts`

`revalidateTag` in Next.js takes exactly one argument (the tag string). The current code passes a second argument `{}` which is silently ignored in some versions but may cause type errors or unexpected behaviour.

- [ ] **Step 1: Fix all 5 calls in `lib/actions/admin.ts`**

Replace every `revalidateTag("users", {})` with `revalidateTag("users")` and every `revalidateTag("tags", {})` with `revalidateTag("tags")`.

The affected lines are 32, 40, 50, 73, 78. Replace the entire file content:

```ts
"use server"

import { db } from "@/db"
import { users, resources, tags, posts } from "@/db/schema"
import { eq, count } from "drizzle-orm"
import { revalidateTag } from "next/cache"
import { auth } from "@/auth"
import { ROLES, type Role } from "@/lib/roles"
import { z } from "zod"
import { createId } from "@paralleldrive/cuid2"

const tagSchema = z.object({ name: z.string().min(1, "Nom requis").max(50) })

// ─── Users ────────────────────────────────────────────────────────────────────

export async function getUsers(filter: { page?: number; suspended?: boolean } = {}) {
  const { page = 1, suspended } = filter
  return db.query.users.findMany({
    where: suspended !== undefined ? eq(users.suspended, suspended) : undefined,
    columns: { id: true, name: true, email: true, role: true, structure: true, suspended: true, createdAt: true },
    limit: 50,
    offset: (page - 1) * 50,
  })
}

export async function suspendUser(userId: string) {
  const session = await auth()
  if (!session) throw new Error("Non authentifié")
  if (session.user.id === userId) throw new Error("Vous ne pouvez pas suspendre vous-même")

  await db.update(users).set({ suspended: true }).where(eq(users.id, userId))
  revalidateTag("users")
}

export async function unsuspendUser(userId: string) {
  const session = await auth()
  if (!session) throw new Error("Non authentifié")

  await db.update(users).set({ suspended: false }).where(eq(users.id, userId))
  revalidateTag("users")
}

export async function assignRole(userId: string, role: Role) {
  const session = await auth()
  if (!session) throw new Error("Non authentifié")

  if (!Object.values(ROLES).includes(role)) throw new Error("Rôle invalide")

  await db.update(users).set({ role }).where(eq(users.id, userId))
  revalidateTag("users")
}

// ─── Moderation ───────────────────────────────────────────────────────────────

export async function getPendingContent() {
  return db.query.resources.findMany({
    where: eq(resources.status, "pending_approval"),
    with: { author: true },
    limit: 50,
  })
}

// ─── Taxonomy ─────────────────────────────────────────────────────────────────

export async function getAllTags() {
  return db.query.tags.findMany({ limit: 200 })
}

export async function createTag(input: { name: string }) {
  const parsed = tagSchema.parse(input)
  const slug = parsed.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
  await db.insert(tags).values({ id: createId(), name: parsed.name, slug })
  revalidateTag("tags")
}

export async function deleteTag(id: string) {
  await db.delete(tags).where(eq(tags.id, id))
  revalidateTag("tags")
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export async function getAnalytics() {
  const [userCount, resourceCount, postCount] = await Promise.all([
    db.select({ value: count() }).from(users).where(eq(users.suspended, false)),
    db.select({ value: count() }).from(resources).where(eq(resources.status, "published")),
    db.select({ value: count() }).from(posts),
  ])

  return {
    totalUsers: userCount[0]?.value ?? 0,
    publishedResources: resourceCount[0]?.value ?? 0,
    publishedPosts: postCount[0]?.value ?? 0,
  }
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/actions/admin.ts
git commit -m "fix(admin): remove invalid second argument from revalidateTag calls"
```

---

## Task 4: Async params/searchParams audit

**Files:**
- Read-only audit — no changes expected

Next.js 15+ requires `params` and `searchParams` to be awaited as `Promise<{...}>`. Verify all dynamic pages in this codebase already follow this pattern.

- [ ] **Step 1: Audit dynamic pages**

Run:
```bash
grep -rn "params\|searchParams" app --include="*.tsx" | grep -v "Promise" | grep -v "node_modules" | grep -v ".next"
```

For each result, check whether the page destructures `params`/`searchParams` without awaiting. Any page that does `{ params }: { params: { id: string } }` (non-Promise type) needs fixing.

Expected output from the audit: all dynamic pages already use `Promise<{...}>` types (verified during Plan A). If any are found that don't, fix them by:
1. Changing the type to `Promise<{ ... }>`
2. Adding `const { ... } = await params` or `const { ... } = await searchParams`

- [ ] **Step 2: If no issues found, commit the audit note**

```bash
git commit --allow-empty -m "chore: async params/searchParams audit — all pages already compliant"
```

If fixes were needed, commit the changed files instead.

---

## Self-Review

**Spec coverage:**
- ✅ Task 1: Google Fonts → next/font
- ✅ Task 2: error.tsx + not-found.tsx boundaries
- ✅ Task 3: revalidateTag fix (5 calls)
- ✅ Task 4: async params audit

**No placeholders** — all code is complete and exact.

**Type consistency** — `error.tsx` components use the exact Next.js error boundary prop signature `{ error: Error & { digest?: string }, reset: () => void }`.
