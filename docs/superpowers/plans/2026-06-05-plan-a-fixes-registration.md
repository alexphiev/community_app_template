# Plan A — Critical Fixes + Invite-Only Registration

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix three blocking bugs (home page, broken auth, legacy proxy file) and add a complete admin-invite → user-sets-password registration flow using Resend for email delivery.

**Architecture:** DB schema gets `passwordHash` on `users` and a new `inviteTokens` table. A Server Action in the admin users page creates invite records and sends emails. A new `(auth)/register` page validates tokens and activates accounts. Auth is fixed to do real bcrypt password verification.

**Tech Stack:** Next.js 16 App Router, NextAuth v5, Drizzle ORM, bcryptjs, Resend SDK, Zod, TypeScript

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| Delete | `middleware.ts` | Replaced by proxy.ts |
| Create | `proxy.ts` | Next.js 16 proxy (same logic, renamed) |
| Modify | `app/page.tsx` | Replace boilerplate with auth-aware redirect |
| Modify | `db/schema.ts` | Add `passwordHash` to users, add `inviteTokens` table |
| Modify | `auth.ts` | Fix authorize to use bcrypt password verification |
| Modify | `lib/validations/auth.ts` | Add invite + register Zod schemas |
| Create | `lib/actions/invites.ts` | `inviteUser` and `acceptInvite` server actions |
| Create | `lib/email.ts` | Resend client + `sendInviteEmail` function |
| Modify | `app/(app)/admin/users/page.tsx` | Add inline invite form |
| Create | `app/(auth)/register/page.tsx` | Token validation + set-password form |
| Create | `scripts/seed-admin-password.ts` | One-time script to set admin's passwordHash |

---

## Task 1: Rename middleware → proxy

**Files:**
- Delete: `middleware.ts`
- Create: `proxy.ts`

- [ ] **Step 1: Create `proxy.ts`** with the exact same logic as `middleware.ts`, but with renamed exports:

```ts
// proxy.ts
import NextAuth from "next-auth"
import { NextResponse } from "next/server"
import { authConfig } from "./auth.config"
import { ROLES, hasPermission } from "@/lib/roles"
import type { Role } from "@/lib/roles"

const { auth } = NextAuth(authConfig)

type RouteRequirement =
  | "admin" | "chat" | "resources" | "news"
  | "agenda" | "directory" | "authenticated" | null

export function getRouteRole(pathname: string): RouteRequirement {
  if (pathname.startsWith("/share")) return null
  if (pathname.startsWith("/admin")) return "admin"
  if (pathname.startsWith("/chat")) return "chat"
  if (pathname.startsWith("/resources")) return "resources"
  if (pathname.startsWith("/news")) return "news"
  if (pathname.startsWith("/agenda")) return "agenda"
  if (pathname.startsWith("/directory")) return "directory"
  if (pathname.startsWith("/dashboard")) return "authenticated"
  return null
}

export default auth((req) => {
  const { pathname } = req.nextUrl
  const requirement = getRouteRole(pathname)

  if (requirement === null) return NextResponse.next()

  const session = req.auth
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (requirement === "authenticated") return NextResponse.next()

  const rawRole = session.user.role
  const role = (Object.values(ROLES) as string[]).includes(rawRole)
    ? (rawRole as Role)
    : null
  if (!role || !hasPermission(role, requirement)) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
})

export const proxyConfig = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
```

- [ ] **Step 2: Delete `middleware.ts`**

```bash
rm /Users/alexandrephiev/Projects/info_jeunes_poc/middleware.ts
```

- [ ] **Step 3: Verify the app starts without warnings**

```bash
pnpm dev
```

Expected: server starts, no "middleware.ts is deprecated" warning in console.

- [ ] **Step 4: Commit**

```bash
git add proxy.ts middleware.ts
git commit -m "fix: rename middleware.ts to proxy.ts for Next.js 16 compatibility"
```

---

## Task 2: Fix `app/page.tsx` root redirect

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace the boilerplate with an auth-aware redirect**

```tsx
// app/page.tsx
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function RootPage() {
  const session = await auth()
  if (session) redirect("/dashboard")
  redirect("/login")
}
```

- [ ] **Step 2: Verify**

Visit `http://localhost:3000/` — unauthenticated should land on `/login`, authenticated on `/dashboard`.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "fix: replace boilerplate home page with auth-aware redirect"
```

---

## Task 3: DB schema — add passwordHash + inviteTokens

**Files:**
- Modify: `db/schema.ts`

- [ ] **Step 1: Add `passwordHash` column to `users` table**

In `db/schema.ts`, find the `users` table definition and add `passwordHash` as the last column before the closing `}`:

```ts
export const users = pgTable("user", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  role: roleEnum("role").notNull().default("pro_reseau_ij"),
  structure: text("structure"),
  phone: text("phone"),
  suspended: boolean("suspended").notNull().default(false),
  passwordHash: text("password_hash"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})
```

- [ ] **Step 2: Add `inviteTokens` table** — append this after the existing `verificationTokens` table and before the resource tables:

```ts
export const inviteTokens = pgTable(
  "invite_tokens",
  {
    token: text("token").primaryKey(),
    email: text("email").notNull(),
    role: roleEnum("role").notNull(),
    name: text("name"),
    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
    usedAt: timestamp("used_at", { mode: "date" }),
    createdById: text("created_by_id").notNull().references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("invite_tokens_email_idx").on(t.email)]
)

export const inviteTokensRelations = relations(inviteTokens, ({ one }) => ({
  createdBy: one(users, { fields: [inviteTokens.createdById], references: [users.id] }),
}))
```

- [ ] **Step 3: Generate and run the migration**

```bash
pnpm db:generate
pnpm db:migrate
```

Expected: two new migration files created; migration runs without errors.

- [ ] **Step 4: Verify schema in DB studio**

```bash
pnpm db:studio
```

Open the studio URL in browser — confirm `user` table has `password_hash` column and `invite_tokens` table exists.

- [ ] **Step 5: Commit**

```bash
git add db/schema.ts
git add drizzle/ # migration files
git commit -m "feat(db): add passwordHash to users, add inviteTokens table"
```

---

## Task 4: Fix `auth.ts` — real bcrypt password verification

**Files:**
- Modify: `auth.ts`

- [ ] **Step 1: Rewrite the Credentials `authorize` to use bcrypt**

Replace the entire `auth.ts` file content:

```ts
// auth.ts
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { compare } from "bcryptjs"
import { loginSchema } from "@/lib/validations/auth"
import type { Role } from "@/lib/roles"
import { authConfig } from "./auth.config"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db),
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const user = await db.query.users.findFirst({
          where: eq(users.email, parsed.data.email),
        })

        if (!user || user.suspended || !user.passwordHash) return null

        const passwordOk = await compare(parsed.data.password, user.passwordHash)
        if (!passwordOk) return null

        return { id: user.id, name: user.name, email: user.email, role: user.role as Role }
      },
    }),
  ],
})
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add auth.ts
git commit -m "fix(auth): verify bcrypt password hash instead of seed email bypass"
```

---

## Task 5: Validation schemas for invite and register

**Files:**
- Modify: `lib/validations/auth.ts`

- [ ] **Step 1: Add `inviteSchema` and `registerSchema`**

Replace `lib/validations/auth.ts` entirely:

```ts
// lib/validations/auth.ts
import { z } from "zod"
import { ROLES } from "@/lib/roles"

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Mot de passe trop court"),
})

export type LoginInput = z.infer<typeof loginSchema>

const invitableRoles = Object.values(ROLES).filter((r) => r !== ROLES.GUEST) as [string, ...string[]]

export const inviteSchema = z.object({
  email: z.string().email("Email invalide"),
  name: z.string().optional(),
  role: z.enum(invitableRoles as [string, ...string[]], { error: "Rôle invalide" }),
})

export type InviteInput = z.infer<typeof inviteSchema>

export const registerSchema = z.object({
  token: z.string().min(1),
  name: z.string().min(1, "Nom requis"),
  password: z.string().min(8, "Mot de passe trop court (8 caractères minimum)"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
})

export type RegisterInput = z.infer<typeof registerSchema>
```

- [ ] **Step 2: Verify TypeScript**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/validations/auth.ts
git commit -m "feat(auth): add invite and register Zod schemas"
```

---

## Task 6: Resend email client

**Files:**
- Create: `lib/email.ts`

- [ ] **Step 1: Install Resend SDK**

```bash
pnpm add resend
```

- [ ] **Step 2: Create `lib/email.ts`**

```ts
// lib/email.ts
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendInviteEmail({
  to,
  name,
  inviteUrl,
}: {
  to: string
  name?: string | null
  inviteUrl: string
}) {
  const greeting = name ? `Bonjour ${name},` : "Bonjour,"

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to,
    subject: "Vous êtes invité à rejoindre Hub Pro — Réseau Info Jeunes PDL",
    html: `
      <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#ffffff">
        <h1 style="font-size:24px;font-weight:700;color:#0f766e;margin-bottom:8px">Hub Pro</h1>
        <p style="font-size:12px;color:#3e4948;margin-top:0">Réseau Info Jeunes Pays de la Loire</p>
        <hr style="border:none;border-top:1px solid #bdc9c7;margin:24px 0"/>
        <p style="font-size:16px;color:#181d1c">${greeting}</p>
        <p style="font-size:16px;color:#181d1c">
          Vous avez été invité à rejoindre <strong>Hub Pro</strong>, la plateforme professionnelle du Réseau Info Jeunes Pays de la Loire.
        </p>
        <p style="font-size:14px;color:#3e4948">
          Cliquez sur le bouton ci-dessous pour créer votre compte. Ce lien est valable <strong>72 heures</strong>.
        </p>
        <div style="text-align:center;margin:32px 0">
          <a href="${inviteUrl}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:15px;font-weight:600">
            Créer mon compte
          </a>
        </div>
        <p style="font-size:12px;color:#6e7978">
          Si vous n'attendiez pas cette invitation, ignorez cet email.
        </p>
      </div>
    `,
  })
}
```

- [ ] **Step 3: Add env vars to `.env.local`** (you must do this manually):

```
RESEND_API_KEY=re_your_key_here
RESEND_FROM_EMAIL=hub@info-jeunes-pdl.fr
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

- [ ] **Step 4: Verify TypeScript**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add lib/email.ts package.json pnpm-lock.yaml
git commit -m "feat(email): add Resend client and sendInviteEmail helper"
```

---

## Task 7: Invite + accept server actions

**Files:**
- Create: `lib/actions/invites.ts`

- [ ] **Step 1: Create `lib/actions/invites.ts`**

```ts
// lib/actions/invites.ts
"use server"

import { db } from "@/db"
import { users, inviteTokens } from "@/db/schema"
import { eq, and, isNull, gt } from "drizzle-orm"
import { createId } from "@paralleldrive/cuid2"
import { hash } from "bcryptjs"
import { signIn } from "@/auth"
import { auth } from "@/auth"
import { ROLES } from "@/lib/roles"
import { inviteSchema, registerSchema } from "@/lib/validations/auth"
import { sendInviteEmail } from "@/lib/email"
import { revalidatePath } from "next/cache"

export async function inviteUser(formData: FormData) {
  const session = await auth()
  if (!session || session.user.role !== ROLES.ADMIN) {
    throw new Error("Non autorisé")
  }

  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name") || undefined,
    role: formData.get("role"),
  })
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { email, name, role } = parsed.data

  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
    columns: { id: true },
  })
  if (existingUser) {
    return { error: "Un compte avec cet email existe déjà." }
  }

  const existingInvite = await db.query.inviteTokens.findFirst({
    where: and(
      eq(inviteTokens.email, email),
      isNull(inviteTokens.usedAt),
      gt(inviteTokens.expiresAt, new Date())
    ),
    columns: { token: true },
  })
  if (existingInvite) {
    return { error: "Une invitation est déjà en attente pour cet email." }
  }

  const token = createId()
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000)

  await db.insert(inviteTokens).values({
    token,
    email,
    role: role as typeof ROLES[keyof typeof ROLES],
    name: name ?? null,
    expiresAt,
    createdById: session.user.id!,
  })

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"
  await sendInviteEmail({ to: email, name, inviteUrl: `${baseUrl}/register?token=${token}` })

  revalidatePath("/admin/users")
  return { success: true }
}

export async function getInviteByToken(token: string) {
  return db.query.inviteTokens.findFirst({
    where: eq(inviteTokens.token, token),
  })
}

export async function acceptInvite(formData: FormData) {
  const parsed = registerSchema.safeParse({
    token: formData.get("token"),
    name: formData.get("name"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  })
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { token, name, password } = parsed.data

  const invite = await db.query.inviteTokens.findFirst({
    where: and(
      eq(inviteTokens.token, token),
      isNull(inviteTokens.usedAt),
      gt(inviteTokens.expiresAt, new Date())
    ),
  })
  if (!invite) {
    return { error: "Ce lien est invalide ou a expiré." }
  }

  const passwordHash = await hash(password, 12)
  const now = new Date()

  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, invite.email),
    columns: { id: true },
  })

  if (existingUser) {
    await db.update(users)
      .set({ passwordHash, name, emailVerified: now, updatedAt: now })
      .where(eq(users.id, existingUser.id))
  } else {
    await db.insert(users).values({
      email: invite.email,
      name,
      role: invite.role,
      passwordHash,
      emailVerified: now,
    })
  }

  await db.update(inviteTokens)
    .set({ usedAt: now })
    .where(eq(inviteTokens.token, token))

  await signIn("credentials", {
    email: invite.email,
    password,
    redirectTo: "/dashboard",
  })
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/actions/invites.ts
git commit -m "feat(invites): inviteUser and acceptInvite server actions"
```

---

## Task 8: Register page

**Files:**
- Create: `app/(auth)/register/page.tsx`

- [ ] **Step 1: Create the register page**

```tsx
// app/(auth)/register/page.tsx
import { getInviteByToken, acceptInvite } from "@/lib/actions/invites"

type Props = { searchParams: Promise<{ token?: string }> }

export default async function RegisterPage({ searchParams }: Props) {
  const { token } = await searchParams

  if (!token) {
    return <InvalidLink />
  }

  const invite = await getInviteByToken(token)
  const isValid = invite && !invite.usedAt && invite.expiresAt > new Date()

  if (!isValid) {
    return <InvalidLink />
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6faf9]">
      <div className="w-full max-w-sm bg-white rounded-[14px] border border-[#bdc9c7] shadow-sm p-8">
        <div className="mb-8">
          <h1
            className="text-[31px] font-semibold leading-[1.25] text-teal-700 mb-1"
            style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}
          >
            Hub Pro
          </h1>
          <p className="text-[14px] text-[#3e4948]">Créez votre compte</p>
        </div>

        <form className="flex flex-col gap-5" action={acceptInvite}>
          <input type="hidden" name="token" value={token} />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-[14px] font-medium text-[#181d1c]">
              Nom complet
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              autoComplete="name"
              defaultValue={invite.name ?? ""}
              className="h-10 rounded-[6px] border border-[#d2d8d8] bg-white px-3 text-[16px] text-[#181d1c] placeholder:text-[#6e7978] focus:outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 transition-colors"
              placeholder="Prénom Nom"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-[14px] font-medium text-[#181d1c]">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="h-10 rounded-[6px] border border-[#d2d8d8] bg-white px-3 text-[16px] text-[#181d1c] placeholder:text-[#6e7978] focus:outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 transition-colors"
              placeholder="8 caractères minimum"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirmPassword" className="text-[14px] font-medium text-[#181d1c]">
              Confirmer le mot de passe
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="h-10 rounded-[6px] border border-[#d2d8d8] bg-white px-3 text-[16px] text-[#181d1c] placeholder:text-[#6e7978] focus:outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="h-10 rounded-[6px] bg-teal-700 text-white text-[14px] font-medium hover:bg-teal-800 active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2"
          >
            Créer mon compte
          </button>
        </form>

        <p className="mt-6 text-center text-[13px] text-[#6e7978]">
          <a href="/login" className="text-teal-700 hover:underline">
            Retour à la connexion
          </a>
        </p>
      </div>
    </div>
  )
}

function InvalidLink() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6faf9]">
      <div className="w-full max-w-sm bg-white rounded-[14px] border border-[#bdc9c7] shadow-sm p-8 text-center">
        <span className="material-symbols-outlined text-[48px] text-coral-700 mb-4 block">
          link_off
        </span>
        <h1
          className="text-[20px] font-semibold text-on-surface mb-2"
          style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}
        >
          Lien invalide ou expiré
        </h1>
        <p className="text-[14px] text-[#3e4948] mb-6">
          Ce lien d&apos;invitation est invalide ou a expiré (72h). Contactez votre administrateur pour recevoir une nouvelle invitation.
        </p>
        <a href="/login" className="text-teal-700 text-[14px] hover:underline">
          Retour à la connexion
        </a>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Test in browser**

- Visit `http://localhost:3000/register` (no token) → should show "Lien invalide ou expiré"
- Visit `http://localhost:3000/register?token=bogus` → should show same error

- [ ] **Step 4: Commit**

```bash
git add app/\(auth\)/register/page.tsx
git commit -m "feat(auth): add invite registration page with token validation"
```

---

## Task 9: Admin invite form

**Files:**
- Modify: `app/(app)/admin/users/page.tsx`

- [ ] **Step 1: Replace `app/(app)/admin/users/page.tsx`** with the version that includes an inline invite form:

```tsx
// app/(app)/admin/users/page.tsx
import { getUsers, suspendUser, unsuspendUser } from "@/lib/actions/admin"
import { inviteUser } from "@/lib/actions/invites"
import { ROLES } from "@/lib/roles"

const ROLE_LABELS: Record<string, string> = {
  admin_ij_pdl:   "Admin IJ PDL",
  salarie_ij_pdl: "Salarié IJ",
  pro_reseau_ij:  "Pro Réseau",
  relais_externe: "Relais",
  guest:          "Invité",
}

const INVITABLE_ROLES = [
  { value: ROLES.ADMIN,    label: "Admin IJ PDL" },
  { value: ROLES.SALARIE,  label: "Salarié IJ" },
  { value: ROLES.PRO_RESEAU, label: "Pro Réseau" },
  { value: ROLES.RELAIS,   label: "Relais externe" },
]

export default async function AdminUsersPage() {
  const userList = await getUsers()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[24px] font-semibold text-on-surface" style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}>
          Gestion des utilisateurs
        </h2>
        <span className="text-[14px] text-on-surface-variant">{userList.length} utilisateurs</span>
      </div>

      {/* Invite form */}
      <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-6 mb-6">
        <h3 className="text-[16px] font-semibold text-on-surface mb-4">Inviter un utilisateur</h3>
        <form action={inviteUser} className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label htmlFor="invite-email" className="text-[12px] font-medium text-on-surface-variant">Email *</label>
            <input
              id="invite-email"
              name="email"
              type="email"
              required
              placeholder="prenom.nom@structure.fr"
              className="h-9 rounded-[6px] border border-[#d2d8d8] bg-white px-3 text-[14px] text-[#181d1c] placeholder:text-[#6e7978] focus:outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 transition-colors min-w-[220px]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="invite-name" className="text-[12px] font-medium text-on-surface-variant">Nom (optionnel)</label>
            <input
              id="invite-name"
              name="name"
              type="text"
              placeholder="Prénom Nom"
              className="h-9 rounded-[6px] border border-[#d2d8d8] bg-white px-3 text-[14px] text-[#181d1c] placeholder:text-[#6e7978] focus:outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 transition-colors min-w-[160px]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="invite-role" className="text-[12px] font-medium text-on-surface-variant">Rôle *</label>
            <select
              id="invite-role"
              name="role"
              required
              defaultValue={ROLES.PRO_RESEAU}
              className="h-9 rounded-[6px] border border-[#d2d8d8] bg-white px-3 text-[14px] text-[#181d1c] focus:outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 transition-colors"
            >
              {INVITABLE_ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="h-9 px-4 rounded-[6px] bg-teal-700 text-white text-[14px] font-medium hover:bg-teal-800 transition-colors"
          >
            Envoyer l&apos;invitation
          </button>
        </form>
      </div>

      {/* Users table */}
      <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <table className="w-full text-[14px]" aria-label="Liste des utilisateurs">
          <thead>
            <tr className="bg-surface-container-low border-b border-outline-variant text-[11px] uppercase tracking-wider text-on-surface-variant">
              <th className="text-left px-6 py-3 font-semibold">Nom</th>
              <th className="text-left px-6 py-3 font-semibold">Email</th>
              <th className="text-left px-6 py-3 font-semibold">Rôle</th>
              <th className="text-left px-6 py-3 font-semibold">Structure</th>
              <th className="text-left px-6 py-3 font-semibold">Statut</th>
              <th className="text-right px-6 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {userList.map((user) => (
              <tr key={user.id} className="hover:bg-surface-container-low transition-colors">
                <td className="px-6 py-4 font-medium text-on-surface">{user.name ?? "—"}</td>
                <td className="px-6 py-4 text-on-surface-variant">{user.email}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full text-[11px] font-semibold border border-teal-100">
                    {ROLE_LABELS[user.role] ?? user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-on-surface-variant">{user.structure ?? "—"}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${user.suspended ? "bg-red-50 text-red-700 border border-red-100" : "bg-green-50 text-green-700 border border-green-100"}`}>
                    {user.suspended ? "Suspendu" : "Actif"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <form action={async () => {
                      "use server"
                      if (user.suspended) await unsuspendUser(user.id)
                      else await suspendUser(user.id)
                    }}>
                      <button
                        type="submit"
                        className={`text-[12px] px-3 py-1 rounded-lg border font-medium transition-colors ${user.suspended ? "border-green-500 text-green-700 hover:bg-green-50" : "border-red-300 text-red-600 hover:bg-red-50"}`}
                      >
                        {user.suspended ? "Réactiver" : "Suspendre"}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {userList.length === 0 && (
          <p className="text-center py-12 text-on-surface-variant text-[14px]">Aucun utilisateur.</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/admin/users/page.tsx
git commit -m "feat(admin): add inline invite form to users page"
```

---

## Task 10: Seed admin password script

**Files:**
- Create: `scripts/seed-admin-password.ts`

- [ ] **Step 1: Create the one-time seed script**

```ts
// scripts/seed-admin-password.ts
// Run once: SEED_ADMIN_EMAIL=you@example.com SEED_ADMIN_PASSWORD=yourpass tsx scripts/seed-admin-password.ts
import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "../db/schema"
import { eq } from "drizzle-orm"
import { hash } from "bcryptjs"
import { createId } from "@paralleldrive/cuid2"

const email = process.env.SEED_ADMIN_EMAIL
const password = process.env.SEED_ADMIN_PASSWORD

if (!email || !password) {
  console.error("Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD env vars")
  process.exit(1)
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const db = drizzle(pool, { schema })

const passwordHash = await hash(password, 12)

const existing = await db.query.users.findFirst({
  where: eq(schema.users.email, email),
  columns: { id: true },
})

if (existing) {
  await db.update(schema.users)
    .set({ passwordHash, emailVerified: new Date(), role: "admin_ij_pdl", updatedAt: new Date() })
    .where(eq(schema.users.id, existing.id))
  console.log(`Updated password for existing user: ${email}`)
} else {
  await db.insert(schema.users).values({
    id: createId(),
    email,
    role: "admin_ij_pdl",
    passwordHash,
    emailVerified: new Date(),
  })
  console.log(`Created admin user: ${email}`)
}

await pool.end()
```

- [ ] **Step 2: Run it to create/update the seed admin** (replace values with real credentials):

```bash
DATABASE_URL=postgresql://localhost:5432/hub_pro_dev \
SEED_ADMIN_EMAIL=admin@example.com \
SEED_ADMIN_PASSWORD=yourpassword \
tsx scripts/seed-admin-password.ts
```

Expected output: `Updated password for existing user: admin@example.com` or `Created admin user: admin@example.com`

- [ ] **Step 3: Test login**

Start the dev server and visit `http://localhost:3000/login`. Log in with the seeded credentials. You should land on `/dashboard`.

- [ ] **Step 4: Commit**

```bash
git add scripts/seed-admin-password.ts
git commit -m "feat(scripts): add one-time seed-admin-password script"
```

---

## Task 11: End-to-end smoke test

- [ ] **Step 1: Test the full invite flow**

1. Log in as admin → go to `/admin/users`
2. Fill invite form with a test email, name, role "Pro Réseau" → submit
3. Check that the invited email arrives in Resend dashboard (or check logs if using test mode)
4. Copy the invite link from the email
5. Open the link → should show the "Créer votre compte" form, name pre-filled
6. Fill in password + confirm → submit
7. Should be redirected to `/dashboard` as the new user
8. Log out → log in again with the new credentials → should work

- [ ] **Step 2: Test expired/invalid token**

Visit `/register?token=notreal` → should show "Lien invalide ou expiré", not a crash.

- [ ] **Step 3: Test duplicate invite**

Try inviting the same email again → should get "Une invitation est déjà en attente pour cet email."

- [ ] **Step 4: Test wrong password on login**

Enter correct email but wrong password → should return to login without crash (NextAuth handles the redirect; the page just re-renders).

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: plan A complete — fixes + invite registration"
```
