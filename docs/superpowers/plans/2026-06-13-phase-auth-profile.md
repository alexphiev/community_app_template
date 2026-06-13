# Auth & Profile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add open self-registration with Resend email confirmation, forgot/reset password flow, topbar profile dropdown, and a /profile page with identity editing and password change.

**Architecture:** Two new DB token tables (`email_verification_tokens`, `password_reset_tokens`) following the existing `invite_tokens` pattern. All email via the existing Resend client in `lib/email.ts`. The Topbar becomes a Client Component receiving session as props.

**Tech Stack:** Next.js 15 App Router, NextAuth v5, Drizzle ORM + PostgreSQL, Resend, bcryptjs, Zod, shadcn/ui (Radix DropdownMenu already installed)

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `db/schema.ts` | Modify | Add `emailVerificationTokens` and `passwordResetTokens` tables |
| `db/migrations/` | Generated | Drizzle migration for new tables |
| `lib/validations/auth.ts` | Modify | Add 5 new Zod schemas |
| `lib/email.ts` | Modify | Add `sendVerificationEmail` and `sendPasswordResetEmail` |
| `lib/actions/auth.ts` | Create | Server actions: publicRegister, verifyEmail, forgotPassword, resetPassword, updateProfile, changePassword |
| `app/(auth)/register/page.tsx` | Modify | Render public form when no `token` param; keep invite form when `token` present |
| `app/(auth)/verify-email/page.tsx` | Create | Handles email confirmation link |
| `app/(auth)/forgot-password/page.tsx` | Create | Step 1 of reset flow |
| `app/(auth)/reset-password/page.tsx` | Create | Step 3 of reset flow |
| `app/(auth)/login/page.tsx` | Modify | Add "Mot de passe oublié ?" + "Créer un compte" links |
| `app/(app)/profile/page.tsx` | Create | Profile page (Server Component wrapper) |
| `components/profile/ProfileForm.tsx` | Create | Client Component — identity fields form |
| `components/profile/ChangePasswordForm.tsx` | Create | Client Component — change password form |
| `components/layout/Topbar.tsx` | Modify | Convert to Client Component with DropdownMenu |
| `components/layout/AppShell.tsx` | Modify | Pass session user as props to Topbar |

---

## Task 1: DB Schema — add token tables

**Files:**
- Modify: `db/schema.ts`

- [ ] **Step 1: Add the two token tables to the schema**

Open `db/schema.ts` and add after the `inviteTokensRelations` block (around line 79):

```ts
export const emailVerificationTokens = pgTable("email_verification_tokens", {
  token: text("token").primaryKey().$defaultFn(() => createId()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  usedAt: timestamp("used_at", { mode: "date" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const passwordResetTokens = pgTable("password_reset_tokens", {
  token: text("token").primaryKey().$defaultFn(() => createId()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  usedAt: timestamp("used_at", { mode: "date" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})
```

- [ ] **Step 2: Generate and run migration**

```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

Expected: new migration file in `db/migrations/`, tables created in DB.

- [ ] **Step 3: Commit**

```bash
git add db/schema.ts db/migrations/
git commit -m "feat(db): add email_verification_tokens and password_reset_tokens tables"
```

---

## Task 2: Zod validation schemas

**Files:**
- Modify: `lib/validations/auth.ts`

- [ ] **Step 1: Add the 5 new schemas**

Replace the full content of `lib/validations/auth.ts` with:

```ts
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
  role: z.enum(invitableRoles, { error: "Rôle invalide" }),
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

const selfRegisterRoles = [ROLES.SALARIE, ROLES.PRO_RESEAU, ROLES.RELAIS, ROLES.GUEST] as [string, ...string[]]

export const publicRegisterSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  email: z.string().email("Email invalide"),
  role: z.enum(selfRegisterRoles, { error: "Rôle invalide" }),
  password: z.string().min(8, "Mot de passe trop court (8 caractères minimum)"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
})
export type PublicRegisterInput = z.infer<typeof publicRegisterSchema>

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email invalide"),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Mot de passe trop court (8 caractères minimum)"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
})

export const updateProfileSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  phone: z.string().optional(),
  structure: z.string().optional(),
})
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Mot de passe actuel requis"),
  newPassword: z.string().min(8, "Mot de passe trop court (8 caractères minimum)"),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
})
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/validations/auth.ts
git commit -m "feat(auth): add Zod schemas for public registration, password reset, and profile"
```

---

## Task 3: Email templates

**Files:**
- Modify: `lib/email.ts`

- [ ] **Step 1: Add verification and reset email functions**

Replace the full content of `lib/email.ts` with:

```ts
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL!

const baseStyle = `font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#ffffff`
const brandHeader = `
  <h1 style="font-size:24px;font-weight:700;color:#0f766e;margin-bottom:8px">Hub Pro</h1>
  <p style="font-size:12px;color:#3e4948;margin-top:0">Réseau Info Jeunes Pays de la Loire</p>
  <hr style="border:none;border-top:1px solid #bdc9c7;margin:24px 0"/>
`
const btn = (url: string, label: string) => `
  <div style="text-align:center;margin:32px 0">
    <a href="${url}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:15px;font-weight:600">${label}</a>
  </div>
`
const ignore = `<p style="font-size:12px;color:#6e7978">Si vous n'attendiez pas cet email, ignorez-le.</p>`

export async function sendInviteEmail({ to, name, inviteUrl }: { to: string; name?: string | null; inviteUrl: string }) {
  const greeting = name ? `Bonjour ${name},` : "Bonjour,"
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Vous êtes invité à rejoindre Hub Pro — Réseau Info Jeunes PDL",
    html: `<div style="${baseStyle}">${brandHeader}
      <p style="font-size:16px;color:#181d1c">${greeting}</p>
      <p style="font-size:16px;color:#181d1c">Vous avez été invité à rejoindre <strong>Hub Pro</strong>.</p>
      <p style="font-size:14px;color:#3e4948">Ce lien est valable <strong>72 heures</strong>.</p>
      ${btn(inviteUrl, "Créer mon compte")}
      ${ignore}
    </div>`,
  })
}

export async function sendVerificationEmail({ to, name, verifyUrl }: { to: string; name?: string | null; verifyUrl: string }) {
  const greeting = name ? `Bonjour ${name},` : "Bonjour,"
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Confirmez votre email — Hub Pro",
    html: `<div style="${baseStyle}">${brandHeader}
      <p style="font-size:16px;color:#181d1c">${greeting}</p>
      <p style="font-size:16px;color:#181d1c">Merci de créer votre compte sur <strong>Hub Pro</strong>. Confirmez votre adresse email pour activer votre compte.</p>
      <p style="font-size:14px;color:#3e4948">Ce lien est valable <strong>24 heures</strong>.</p>
      ${btn(verifyUrl, "Confirmer mon email")}
      ${ignore}
    </div>`,
  })
}

export async function sendPasswordResetEmail({ to, name, resetUrl }: { to: string; name?: string | null; resetUrl: string }) {
  const greeting = name ? `Bonjour ${name},` : "Bonjour,"
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Réinitialisation de mot de passe — Hub Pro",
    html: `<div style="${baseStyle}">${brandHeader}
      <p style="font-size:16px;color:#181d1c">${greeting}</p>
      <p style="font-size:16px;color:#181d1c">Vous avez demandé la réinitialisation de votre mot de passe.</p>
      <p style="font-size:14px;color:#3e4948">Ce lien est valable <strong>1 heure</strong>.</p>
      ${btn(resetUrl, "Réinitialiser mon mot de passe")}
      ${ignore}
    </div>`,
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
git add lib/email.ts
git commit -m "feat(email): add verification and password reset email templates"
```

---

## Task 4: Server actions

**Files:**
- Create: `lib/actions/auth.ts`

- [ ] **Step 1: Create the server actions file**

Create `lib/actions/auth.ts`:

```ts
"use server"

import { db } from "@/db"
import { users, emailVerificationTokens, passwordResetTokens } from "@/db/schema"
import { eq, and, isNull, gt } from "drizzle-orm"
import { hash, compare } from "bcryptjs"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createId } from "@paralleldrive/cuid2"
import {
  publicRegisterSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  changePasswordSchema,
} from "@/lib/validations/auth"
import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/email"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"

export async function publicRegister(formData: FormData) {
  const parsed = publicRegisterSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { name, email, role, password } = parsed.data

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
    columns: { id: true },
  })
  if (existing) {
    return { error: "Un compte avec cet email existe déjà." }
  }

  const passwordHash = await hash(password, 12)
  const [user] = await db.insert(users).values({
    name,
    email,
    role: role as typeof users.$inferInsert["role"],
    passwordHash,
  }).returning({ id: users.id })

  const token = createId()
  await db.insert(emailVerificationTokens).values({
    token,
    userId: user.id,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  })

  await sendVerificationEmail({
    to: email,
    name,
    verifyUrl: `${BASE_URL}/verify-email?token=${token}`,
  })

  redirect("/register?pending=1")
}

export async function verifyEmail(token: string) {
  const row = await db.query.emailVerificationTokens.findFirst({
    where: and(
      eq(emailVerificationTokens.token, token),
      isNull(emailVerificationTokens.usedAt),
      gt(emailVerificationTokens.expiresAt, new Date())
    ),
  })

  if (!row) return { error: "Ce lien est invalide ou a expiré." }

  const now = new Date()
  await db.update(users)
    .set({ emailVerified: now, updatedAt: now })
    .where(eq(users.id, row.userId))

  await db.update(emailVerificationTokens)
    .set({ usedAt: now })
    .where(eq(emailVerificationTokens.token, token))

  redirect("/login?verified=1")
}

export async function forgotPassword(formData: FormData) {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const user = await db.query.users.findFirst({
    where: eq(users.email, parsed.data.email),
    columns: { id: true, name: true, email: true },
  })

  if (user) {
    const token = createId()
    await db.insert(passwordResetTokens).values({
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    })
    await sendPasswordResetEmail({
      to: user.email!,
      name: user.name,
      resetUrl: `${BASE_URL}/reset-password?token=${token}`,
    })
  }

  return { success: true }
}

export async function resetPassword(formData: FormData) {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { token, password } = parsed.data

  const row = await db.query.passwordResetTokens.findFirst({
    where: and(
      eq(passwordResetTokens.token, token),
      isNull(passwordResetTokens.usedAt),
      gt(passwordResetTokens.expiresAt, new Date())
    ),
  })
  if (!row) return { error: "Ce lien est invalide ou a expiré." }

  const passwordHash = await hash(password, 12)
  const now = new Date()

  await db.update(users)
    .set({ passwordHash, updatedAt: now })
    .where(eq(users.id, row.userId))

  await db.update(passwordResetTokens)
    .set({ usedAt: now })
    .where(eq(passwordResetTokens.token, token))

  redirect("/login?reset=1")
}

export async function updateProfile(formData: FormData) {
  const session = await auth()
  if (!session) redirect("/login")

  const parsed = updateProfileSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") || undefined,
    structure: formData.get("structure") || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  await db.update(users)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(users.id, session.user.id!))

  revalidatePath("/profile")
  return { success: true }
}

export async function changePassword(formData: FormData) {
  const session = await auth()
  if (!session) redirect("/login")

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id!),
    columns: { passwordHash: true },
  })
  if (!user?.passwordHash) return { error: "Compte introuvable." }

  const ok = await compare(parsed.data.currentPassword, user.passwordHash)
  if (!ok) return { error: "Mot de passe actuel incorrect." }

  const passwordHash = await hash(parsed.data.newPassword, 12)
  await db.update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.id, session.user.id!))

  return { success: true }
}
```

**Note on `verifyEmail`:** The `signIn` with a hashed password won't work directly — after marking email verified, redirect to `/login?verified=1` instead and show a success banner. Replace the `signIn` block in `verifyEmail` with:

```ts
  redirect("/login?verified=1")
```

- [ ] **Step 2: Add relations for new token tables in `db/schema.ts`**

Add after the two new table definitions:

```ts
export const emailVerificationTokensRelations = relations(emailVerificationTokens, ({ one }) => ({
  user: one(users, { fields: [emailVerificationTokens.userId], references: [users.id] }),
}))

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, { fields: [passwordResetTokens.userId], references: [users.id] }),
}))
```

- [ ] **Step 3: Verify TypeScript**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/actions/auth.ts db/schema.ts
git commit -m "feat(auth): add server actions for public registration, email verification, password reset, and profile"
```

---

## Task 5: Login page — add links

**Files:**
- Modify: `app/(auth)/login/page.tsx`

- [ ] **Step 1: Add "Mot de passe oublié ?" and "Créer un compte" links**

Replace the full content of `app/(auth)/login/page.tsx` with:

```tsx
import { signIn } from "@/auth"
import { AuthError } from "next-auth"
import { redirect } from "next/navigation"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reset?: string; verified?: string }>
}) {
  const { error, reset, verified } = await searchParams

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
          <p className="text-[14px] text-[#3e4948]">
            Réseau Info Jeunes Pays de la Loire
          </p>
        </div>

        {error && (
          <p className="mb-4 rounded-[6px] bg-red-50 border border-red-200 px-3 py-2 text-[14px] text-red-700">
            Identifiants incorrects. Vérifiez votre email et mot de passe.
          </p>
        )}
        {reset && (
          <p className="mb-4 rounded-[6px] bg-green-50 border border-green-200 px-3 py-2 text-[14px] text-green-700">
            Mot de passe mis à jour. Connectez-vous avec votre nouveau mot de passe.
          </p>
        )}
        {verified && (
          <p className="mb-4 rounded-[6px] bg-green-50 border border-green-200 px-3 py-2 text-[14px] text-green-700">
            Email confirmé ! Connectez-vous pour accéder à votre compte.
          </p>
        )}

        <form
          className="flex flex-col gap-5"
          action={async (formData: FormData) => {
            "use server"
            try {
              await signIn("credentials", {
                email: formData.get("email"),
                password: formData.get("password"),
                redirectTo: "/dashboard",
              })
            } catch (err) {
              if (err instanceof AuthError) {
                redirect("/login?error=1")
              }
              throw err
            }
          }}
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-[14px] font-medium text-[#181d1c]">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="h-10 rounded-[6px] border border-[#d2d8d8] bg-white px-3 text-[16px] text-[#181d1c] placeholder:text-[#6e7978] focus:outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 transition-colors"
              placeholder="prenom.nom@structure.fr"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-[14px] font-medium text-[#181d1c]">
                Mot de passe
              </label>
              <a href="/forgot-password" className="text-[12px] text-teal-700 hover:underline">
                Mot de passe oublié ?
              </a>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="h-10 rounded-[6px] border border-[#d2d8d8] bg-white px-3 text-[16px] text-[#181d1c] placeholder:text-[#6e7978] focus:outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="h-10 rounded-[6px] bg-teal-700 text-white text-[14px] font-medium hover:bg-teal-800 active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2"
          >
            Se connecter
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-[#e5eaea] text-center">
          <span className="text-[13px] text-[#6e7978]">Pas encore de compte ? </span>
          <a href="/register" className="text-[13px] text-teal-700 font-medium hover:underline">
            Créer un compte
          </a>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(auth\)/login/page.tsx
git commit -m "feat(auth): add forgot-password and register links to login page"
```

---

## Task 6: Public registration page

**Files:**
- Modify: `app/(auth)/register/page.tsx`

- [ ] **Step 1: Update register page to show public form when no token**

Replace the full content of `app/(auth)/register/page.tsx` with:

```tsx
import { getInviteByToken, acceptInvite } from "@/lib/actions/invites"
import { publicRegister } from "@/lib/actions/auth"

type Props = { searchParams: Promise<{ token?: string; pending?: string }> }

export default async function RegisterPage({ searchParams }: Props) {
  const { token, pending } = await searchParams

  if (pending) return <PendingVerification />
  if (token) return <InviteForm token={token} />
  return <PublicRegisterForm />
}

async function InviteForm({ token }: { token: string }) {
  const invite = await getInviteByToken(token)
  const isValid = invite && !invite.usedAt && invite.expiresAt > new Date()
  if (!isValid) return <InvalidLink />

  return (
    <AuthCard subtitle="Créez votre compte">
      <form className="flex flex-col gap-5" action={acceptInvite}>
        <input type="hidden" name="token" value={token} />
        <Field id="name" label="Nom complet" name="name" defaultValue={invite.name ?? ""} placeholder="Prénom Nom" autoComplete="name" />
        <PasswordField id="password" label="Mot de passe" name="password" placeholder="8 caractères minimum" />
        <PasswordField id="confirmPassword" label="Confirmer le mot de passe" name="confirmPassword" placeholder="••••••••" />
        <SubmitButton>Créer mon compte</SubmitButton>
      </form>
      <BackLink />
    </AuthCard>
  )
}

function PublicRegisterForm() {
  return (
    <AuthCard subtitle="Créez votre compte">
      <form className="flex flex-col gap-5" action={publicRegister}>
        <Field id="name" label="Nom complet" name="name" placeholder="Prénom Nom" autoComplete="name" />
        <Field id="email" label="Email professionnel" name="email" type="email" placeholder="prenom.nom@structure.fr" autoComplete="email" />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="role" className="text-[14px] font-medium text-[#181d1c]">Rôle dans le réseau</label>
          <select
            id="role"
            name="role"
            className="h-10 rounded-[6px] border border-[#d2d8d8] bg-white px-3 text-[16px] text-[#181d1c] focus:outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 transition-colors"
          >
            <option value="pro_reseau_ij">Pro Réseau IJ</option>
            <option value="salarie_ij_pdl">Salarié IJ PDL</option>
            <option value="relais_externe">Relais externe</option>
            <option value="guest">Invité</option>
          </select>
        </div>
        <PasswordField id="password" label="Mot de passe" name="password" placeholder="8 caractères minimum" />
        <PasswordField id="confirmPassword" label="Confirmer le mot de passe" name="confirmPassword" placeholder="••••••••" />
        <SubmitButton>Créer mon compte</SubmitButton>
      </form>
      <BackLink />
    </AuthCard>
  )
}

function PendingVerification() {
  return (
    <AuthCard subtitle="Vérifiez votre email">
      <div className="text-center py-4">
        <span className="material-symbols-outlined text-[48px] text-teal-700 mb-4 block">mark_email_unread</span>
        <p className="text-[14px] text-[#3e4948] mb-6">
          Un email de confirmation vous a été envoyé. Cliquez sur le lien dans l'email pour activer votre compte.
        </p>
        <p className="text-[13px] text-[#6e7978]">Le lien est valable 24 heures.</p>
      </div>
      <BackLink />
    </AuthCard>
  )
}

// ─── Shared sub-components ───────────────────────────────────────────────────

function AuthCard({ subtitle, children }: { subtitle: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6faf9]">
      <div className="w-full max-w-sm bg-white rounded-[14px] border border-[#bdc9c7] shadow-sm p-8">
        <div className="mb-8">
          <h1 className="text-[31px] font-semibold leading-[1.25] text-teal-700 mb-1" style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}>
            Hub Pro
          </h1>
          <p className="text-[14px] text-[#3e4948]">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({ id, label, name, type = "text", placeholder, defaultValue, autoComplete }: {
  id: string; label: string; name: string; type?: string; placeholder?: string; defaultValue?: string; autoComplete?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[14px] font-medium text-[#181d1c]">{label}</label>
      <input id={id} name={name} type={type} required autoComplete={autoComplete} defaultValue={defaultValue}
        className="h-10 rounded-[6px] border border-[#d2d8d8] bg-white px-3 text-[16px] text-[#181d1c] placeholder:text-[#6e7978] focus:outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 transition-colors"
        placeholder={placeholder} />
    </div>
  )
}

function PasswordField({ id, label, name, placeholder }: { id: string; label: string; name: string; placeholder?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[14px] font-medium text-[#181d1c]">{label}</label>
      <input id={id} name={name} type="password" required minLength={8} autoComplete="new-password"
        className="h-10 rounded-[6px] border border-[#d2d8d8] bg-white px-3 text-[16px] text-[#181d1c] placeholder:text-[#6e7978] focus:outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 transition-colors"
        placeholder={placeholder} />
    </div>
  )
}

function SubmitButton({ children }: { children: React.ReactNode }) {
  return (
    <button type="submit"
      className="h-10 rounded-[6px] bg-teal-700 text-white text-[14px] font-medium hover:bg-teal-800 active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2">
      {children}
    </button>
  )
}

function BackLink() {
  return (
    <p className="mt-6 text-center text-[13px] text-[#6e7978]">
      <a href="/login" className="text-teal-700 hover:underline">Retour à la connexion</a>
    </p>
  )
}

function InvalidLink() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6faf9]">
      <div className="w-full max-w-sm bg-white rounded-[14px] border border-[#bdc9c7] shadow-sm p-8 text-center">
        <span className="material-symbols-outlined text-[48px] text-red-600 mb-4 block">link_off</span>
        <h1 className="text-[20px] font-semibold text-[#181d1c] mb-2" style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}>
          Lien invalide ou expiré
        </h1>
        <p className="text-[14px] text-[#3e4948] mb-6">
          Ce lien d&apos;invitation est invalide ou a expiré (72h). Contactez votre administrateur pour recevoir une nouvelle invitation.
        </p>
        <a href="/login" className="text-teal-700 text-[14px] hover:underline">Retour à la connexion</a>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(auth\)/register/page.tsx
git commit -m "feat(auth): add public registration form alongside invite flow"
```

---

## Task 7: Email verification page

**Files:**
- Create: `app/(auth)/verify-email/page.tsx`

- [ ] **Step 1: Create the verify-email page**

Create `app/(auth)/verify-email/page.tsx`:

```tsx
import { verifyEmail } from "@/lib/actions/auth"
import { redirect } from "next/navigation"

type Props = { searchParams: Promise<{ token?: string }> }

export default async function VerifyEmailPage({ searchParams }: Props) {
  const { token } = await searchParams

  if (!token) redirect("/login")

  const result = await verifyEmail(token)

  if (result?.error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6faf9]">
        <div className="w-full max-w-sm bg-white rounded-[14px] border border-[#bdc9c7] shadow-sm p-8 text-center">
          <span className="material-symbols-outlined text-[48px] text-red-600 mb-4 block">link_off</span>
          <h1 className="text-[20px] font-semibold text-[#181d1c] mb-2" style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}>
            Lien invalide ou expiré
          </h1>
          <p className="text-[14px] text-[#3e4948] mb-6">{result.error}</p>
          <a href="/register" className="text-teal-700 text-[14px] hover:underline">Créer un nouveau compte</a>
        </div>
      </div>
    )
  }

  redirect("/login?verified=1")
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(auth\)/verify-email/page.tsx
git commit -m "feat(auth): add email verification page"
```

---

## Task 8: Forgot password page

**Files:**
- Create: `app/(auth)/forgot-password/page.tsx`

- [ ] **Step 1: Create the forgot-password page**

Create `app/(auth)/forgot-password/page.tsx`:

```tsx
import { forgotPassword } from "@/lib/actions/auth"
import { redirect } from "next/navigation"

type Props = { searchParams: Promise<{ sent?: string }> }

export default async function ForgotPasswordPage({ searchParams }: Props) {
  const { sent } = await searchParams

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6faf9]">
      <div className="w-full max-w-sm bg-white rounded-[14px] border border-[#bdc9c7] shadow-sm p-8">
        <div className="mb-8">
          <h1 className="text-[31px] font-semibold leading-[1.25] text-teal-700 mb-1" style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}>
            Hub Pro
          </h1>
          <p className="text-[14px] text-[#3e4948]">Mot de passe oublié</p>
        </div>

        {sent ? (
          <div className="text-center py-4">
            <span className="material-symbols-outlined text-[48px] text-teal-700 mb-4 block">mark_email_read</span>
            <p className="text-[14px] text-[#3e4948]">
              Si un compte existe avec cet email, un lien de réinitialisation a été envoyé. Vérifiez votre boîte mail.
            </p>
          </div>
        ) : (
          <>
            <p className="text-[14px] text-[#3e4948] mb-6">
              Entrez votre email pour recevoir un lien de réinitialisation valable <strong>1 heure</strong>.
            </p>
            <form
              className="flex flex-col gap-5"
              action={async (formData: FormData) => {
                "use server"
                await forgotPassword(formData)
                redirect("/forgot-password?sent=1")
              }}
            >
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-[14px] font-medium text-[#181d1c]">Email</label>
                <input
                  id="email" name="email" type="email" required autoComplete="email"
                  className="h-10 rounded-[6px] border border-[#d2d8d8] bg-white px-3 text-[16px] text-[#181d1c] placeholder:text-[#6e7978] focus:outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 transition-colors"
                  placeholder="prenom.nom@structure.fr"
                />
              </div>
              <button type="submit"
                className="h-10 rounded-[6px] bg-teal-700 text-white text-[14px] font-medium hover:bg-teal-800 active:scale-[0.98] transition-all">
                Envoyer le lien
              </button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-[13px]">
          <a href="/login" className="text-teal-700 hover:underline">← Retour à la connexion</a>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(auth\)/forgot-password/page.tsx
git commit -m "feat(auth): add forgot-password page"
```

---

## Task 9: Reset password page

**Files:**
- Create: `app/(auth)/reset-password/page.tsx`

- [ ] **Step 1: Create the reset-password page**

Create `app/(auth)/reset-password/page.tsx`:

```tsx
import { resetPassword } from "@/lib/actions/auth"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { passwordResetTokens } from "@/db/schema"
import { eq, and, isNull, gt } from "drizzle-orm"

type Props = { searchParams: Promise<{ token?: string }> }

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams

  if (!token) redirect("/forgot-password")

  const row = await db.query.passwordResetTokens.findFirst({
    where: and(
      eq(passwordResetTokens.token, token),
      isNull(passwordResetTokens.usedAt),
      gt(passwordResetTokens.expiresAt, new Date())
    ),
  })

  if (!row) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6faf9]">
        <div className="w-full max-w-sm bg-white rounded-[14px] border border-[#bdc9c7] shadow-sm p-8 text-center">
          <span className="material-symbols-outlined text-[48px] text-red-600 mb-4 block">link_off</span>
          <h1 className="text-[20px] font-semibold text-[#181d1c] mb-2" style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}>
            Lien invalide ou expiré
          </h1>
          <p className="text-[14px] text-[#3e4948] mb-6">Ce lien a expiré (1h) ou a déjà été utilisé.</p>
          <a href="/forgot-password" className="text-teal-700 text-[14px] hover:underline">Faire une nouvelle demande</a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6faf9]">
      <div className="w-full max-w-sm bg-white rounded-[14px] border border-[#bdc9c7] shadow-sm p-8">
        <div className="mb-8">
          <h1 className="text-[31px] font-semibold leading-[1.25] text-teal-700 mb-1" style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}>
            Hub Pro
          </h1>
          <p className="text-[14px] text-[#3e4948]">Nouveau mot de passe</p>
        </div>

        <form
          className="flex flex-col gap-5"
          action={async (formData: FormData) => {
            "use server"
            const result = await resetPassword(formData)
            if (result?.error) redirect(`/reset-password?token=${token}&error=1`)
          }}
        >
          <input type="hidden" name="token" value={token} />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-[14px] font-medium text-[#181d1c]">Nouveau mot de passe</label>
            <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password"
              className="h-10 rounded-[6px] border border-[#d2d8d8] bg-white px-3 text-[16px] text-[#181d1c] placeholder:text-[#6e7978] focus:outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 transition-colors"
              placeholder="8 caractères minimum" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirmPassword" className="text-[14px] font-medium text-[#181d1c]">Confirmer le mot de passe</label>
            <input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} autoComplete="new-password"
              className="h-10 rounded-[6px] border border-[#d2d8d8] bg-white px-3 text-[16px] text-[#181d1c] placeholder:text-[#6e7978] focus:outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 transition-colors"
              placeholder="••••••••" />
          </div>
          <button type="submit"
            className="h-10 rounded-[6px] bg-teal-700 text-white text-[14px] font-medium hover:bg-teal-800 active:scale-[0.98] transition-all">
            Enregistrer le mot de passe
          </button>
        </form>

        <p className="mt-6 text-center text-[13px]">
          <a href="/login" className="text-teal-700 hover:underline">← Retour à la connexion</a>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(auth\)/reset-password/page.tsx
git commit -m "feat(auth): add reset-password page"
```

---

## Task 10: Topbar — profile dropdown

**Files:**
- Modify: `components/layout/Topbar.tsx`
- Modify: `components/layout/AppShell.tsx`

- [ ] **Step 1: Update AppShell to pass session as props to Topbar**

Replace `components/layout/AppShell.tsx` with:

```tsx
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "./Sidebar"
import { Topbar } from "./Topbar"
import type { Role } from "@/lib/roles"

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <div className="min-h-screen bg-[#f6faf9]">
      <Sidebar role={session.user.role as Role} />
      <div className="ml-64 flex flex-col min-h-screen">
        <Topbar
          name={session.user.name ?? ""}
          email={session.user.email ?? ""}
          role={session.user.role as Role}
        />
        <main className="flex-1 p-8 max-w-[1440px] mx-auto w-full" id="main-content">
          {children}
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Replace Topbar with Client Component using DropdownMenu**

Replace `components/layout/Topbar.tsx` with:

```tsx
"use client"

import { signOut } from "@/auth"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Role } from "@/lib/roles"

const roleLabel: Record<string, string> = {
  admin_ij_pdl: "Admin IJ PDL",
  salarie_ij_pdl: "Salarié IJ",
  pro_reseau_ij: "Pro Réseau",
  relais_externe: "Relais",
  guest: "Invité",
}

type Props = {
  name: string
  email: string
  role: Role
}

export function Topbar({ name, email, role }: Props) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?"

  return (
    <header className="h-16 flex justify-between items-center px-8 bg-[#f6faf9] border-b border-[#bdc9c7] sticky top-0 z-40">
      <div className="flex items-center w-1/2" title="Fonctionnalité à venir">
        <div className="relative w-full max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#6e7978]/40 text-[20px]" aria-hidden="true">
            search
          </span>
          <input
            className="w-full bg-[#f0f4f3] border-none rounded-full pl-10 pr-4 py-2 text-[14px] opacity-40 cursor-not-allowed"
            placeholder="Rechercher une ressource, un collègue..."
            type="search"
            aria-label="Rechercher"
            disabled
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button
          className="relative p-2 rounded-full opacity-40 cursor-not-allowed"
          aria-label="Notifications"
          disabled
          title="Fonctionnalité à venir"
        >
          <span className="material-symbols-outlined text-[#3e4948] text-[20px]" aria-hidden="true">notifications</span>
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-3 pl-6 border-l border-[#bdc9c7]">
          <div className="text-right">
            <p className="font-medium text-[14px]">{name}</p>
            <p className="text-[#3e4948] text-[12px]">{roleLabel[role] ?? role}</p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="w-10 h-10 rounded-full bg-[#ebefed] flex items-center justify-center text-[14px] font-semibold text-teal-700 hover:bg-[#e5e9e7] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
                aria-label="Menu profil"
              >
                {initials}
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col">
                  <span className="text-[13px] font-semibold text-[#181d1c]">{name}</span>
                  <span className="text-[11px] text-[#6e7978]">{email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a href="/profile" className="cursor-pointer flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">person</span>
                  Mon profil
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600 cursor-pointer flex items-center gap-2"
                onClick={async () => {
                  await fetch("/api/auth/signout", { method: "POST" })
                  window.location.href = "/login"
                }}
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                Se déconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
```

**Note:** The Topbar is now a Client Component. `signOut` from `@/auth` is a server action and cannot be called directly from a client component. The logout uses a `fetch` to the NextAuth signout endpoint instead. Remove the `signOut` import from the file.

- [ ] **Step 3: Verify TypeScript**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/layout/Topbar.tsx components/layout/AppShell.tsx
git commit -m "feat(topbar): replace logout button with profile dropdown menu"
```

---

## Task 11: Profile page

**Files:**
- Create: `app/(app)/profile/page.tsx`
- Create: `components/profile/ProfileForm.tsx`
- Create: `components/profile/ChangePasswordForm.tsx`

- [ ] **Step 1: Create ProfileForm client component**

Create `components/profile/ProfileForm.tsx`:

```tsx
"use client"

import { useRef, useState, useTransition } from "react"
import { updateProfile } from "@/lib/actions/auth"

type Props = {
  name: string
  email: string
  phone: string | null
  structure: string | null
  role: string
}

const roleLabel: Record<string, string> = {
  admin_ij_pdl: "Admin IJ PDL",
  salarie_ij_pdl: "Salarié IJ",
  pro_reseau_ij: "Pro Réseau",
  relais_externe: "Relais",
  guest: "Invité",
}

export function ProfileForm({ name, email, phone, structure, role }: Props) {
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateProfile(formData)
      if (result?.error) {
        setMessage({ type: "error", text: result.error })
      } else {
        setMessage({ type: "success", text: "Profil mis à jour." })
      }
    })
  }

  return (
    <div className="bg-white rounded-[12px] border border-[#e5eaea] p-6">
      <h2 className="text-[15px] font-semibold text-[#181d1c] mb-4">Informations personnelles</h2>

      {message && (
        <p className={`mb-4 rounded-[6px] px-3 py-2 text-[13px] ${message.type === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {message.text}
        </p>
      )}

      <form ref={formRef} action={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-[12px] font-medium text-[#181d1c]">Nom complet</label>
            <input id="name" name="name" type="text" required defaultValue={name}
              className="h-9 rounded-[6px] border border-[#d2d8d8] bg-white px-3 text-[13px] text-[#181d1c] focus:outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 transition-colors" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-[#181d1c]">Email</label>
            <div className="h-9 rounded-[6px] border border-[#e5eaea] bg-[#f9fafb] px-3 flex items-center gap-2 text-[13px] text-[#6e7978]">
              {email}
              <span className="text-[10px] bg-[#e5f9f6] text-teal-700 px-1.5 py-0.5 rounded-[4px]">vérifié</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="phone" className="text-[12px] font-medium text-[#181d1c]">Téléphone</label>
            <input id="phone" name="phone" type="tel" defaultValue={phone ?? ""}
              className="h-9 rounded-[6px] border border-[#d2d8d8] bg-white px-3 text-[13px] text-[#181d1c] focus:outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 transition-colors"
              placeholder="06 12 34 56 78" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="structure" className="text-[12px] font-medium text-[#181d1c]">Structure</label>
            <input id="structure" name="structure" type="text" defaultValue={structure ?? ""}
              className="h-9 rounded-[6px] border border-[#d2d8d8] bg-white px-3 text-[13px] text-[#181d1c] focus:outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 transition-colors"
              placeholder="PIJ Nantes" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-medium text-[#181d1c]">Rôle</label>
          <div className="h-9 rounded-[6px] border border-[#e5eaea] bg-[#f9fafb] px-3 flex items-center text-[13px] text-[#6e7978] gap-2">
            {roleLabel[role] ?? role}
            <span className="text-[11px] text-[#9ea8a7]">(modifiable par un admin)</span>
          </div>
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={isPending}
            className="h-9 px-5 rounded-[6px] bg-teal-700 text-white text-[13px] font-medium hover:bg-teal-800 disabled:opacity-50 transition-all">
            {isPending ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Create ChangePasswordForm client component**

Create `components/profile/ChangePasswordForm.tsx`:

```tsx
"use client"

import { useRef, useState, useTransition } from "react"
import { changePassword } from "@/lib/actions/auth"

export function ChangePasswordForm() {
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await changePassword(formData)
      if (result?.error) {
        setMessage({ type: "error", text: result.error })
      } else {
        setMessage({ type: "success", text: "Mot de passe mis à jour." })
        formRef.current?.reset()
      }
    })
  }

  return (
    <div className="bg-white rounded-[12px] border border-[#e5eaea] p-6">
      <h2 className="text-[15px] font-semibold text-[#181d1c] mb-4">Changer le mot de passe</h2>

      {message && (
        <p className={`mb-4 rounded-[6px] px-3 py-2 text-[13px] ${message.type === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {message.text}
        </p>
      )}

      <form ref={formRef} action={handleSubmit} className="flex flex-col gap-4 max-w-sm">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="currentPassword" className="text-[12px] font-medium text-[#181d1c]">Mot de passe actuel</label>
          <input id="currentPassword" name="currentPassword" type="password" required autoComplete="current-password"
            className="h-9 rounded-[6px] border border-[#d2d8d8] bg-white px-3 text-[13px] text-[#181d1c] placeholder:text-[#6e7978] focus:outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 transition-colors"
            placeholder="••••••••" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="newPassword" className="text-[12px] font-medium text-[#181d1c]">Nouveau mot de passe</label>
          <input id="newPassword" name="newPassword" type="password" required minLength={8} autoComplete="new-password"
            className="h-9 rounded-[6px] border border-[#d2d8d8] bg-white px-3 text-[13px] text-[#181d1c] placeholder:text-[#6e7978] focus:outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 transition-colors"
            placeholder="8 caractères minimum" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirmPassword" className="text-[12px] font-medium text-[#181d1c]">Confirmer le mot de passe</label>
          <input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} autoComplete="new-password"
            className="h-9 rounded-[6px] border border-[#d2d8d8] bg-white px-3 text-[13px] text-[#181d1c] placeholder:text-[#6e7978] focus:outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 transition-colors"
            placeholder="••••••••" />
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={isPending}
            className="h-9 px-5 rounded-[6px] bg-teal-700 text-white text-[13px] font-medium hover:bg-teal-800 disabled:opacity-50 transition-all">
            {isPending ? "Mise à jour…" : "Changer le mot de passe"}
          </button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: Create the profile page**

Create `app/(app)/profile/page.tsx`:

```tsx
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { ProfileForm } from "@/components/profile/ProfileForm"
import { ChangePasswordForm } from "@/components/profile/ChangePasswordForm"

export default async function ProfilePage() {
  const session = await auth()
  if (!session) redirect("/login")

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id!),
    columns: { name: true, email: true, phone: true, structure: true, role: true },
  })
  if (!user) redirect("/login")

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-[24px] font-semibold text-[#181d1c]">Mon profil</h1>
        <p className="text-[14px] text-[#6e7978]">Gérez vos informations personnelles et votre mot de passe</p>
      </div>

      {/* Avatar — disabled, future sprint */}
      <div className="bg-white rounded-[12px] border border-[#e5eaea] p-6 mb-4 opacity-50">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-[#ebefed] flex items-center justify-center text-[22px] font-bold text-teal-700 flex-shrink-0">
            {(user.name ?? "?").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
          </div>
          <div>
            <p className="text-[14px] font-semibold text-[#181d1c] mb-1">Photo de profil</p>
            <p className="text-[12px] text-[#6e7978] mb-3">JPG, PNG ou WebP · max 2 Mo</p>
            <div className="flex gap-2">
              <button disabled className="h-8 px-4 rounded-[6px] bg-[#d2d8d8] text-[#9ea8a7] text-[12px] cursor-not-allowed">Changer</button>
              <button disabled className="h-8 px-4 rounded-[6px] border border-[#d2d8d8] text-[#9ea8a7] text-[12px] cursor-not-allowed">Supprimer</button>
            </div>
          </div>
          <span className="ml-auto text-[11px] text-[#9ea8a7] italic">À venir</span>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <ProfileForm
          name={user.name ?? ""}
          email={user.email ?? ""}
          phone={user.phone}
          structure={user.structure}
          role={user.role}
        />
        <ChangePasswordForm />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify TypeScript**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/\(app\)/profile/page.tsx components/profile/ProfileForm.tsx components/profile/ChangePasswordForm.tsx
git commit -m "feat(profile): add profile page with identity editing and password change"
```

---

## Task 12: Manual smoke test

- [ ] **Step 1: Start dev server**

```bash
pnpm dev
```

- [ ] **Step 2: Test registration flow**
  1. Go to `http://localhost:3000/login` — verify "Mot de passe oublié ?" and "Créer un compte" links are visible
  2. Click "Créer un compte" → `/register` — verify public form shows with role selector
  3. Submit with a fresh email → verify redirect to `/register?pending=1` with "Vérifiez votre email" message
  4. Check Resend dashboard (or email inbox) for the verification email
  5. Click the confirmation link → verify redirect to `/login?verified=1` with green banner

- [ ] **Step 3: Test password reset flow**
  1. Click "Mot de passe oublié ?" on login → `/forgot-password`
  2. Submit with a known email → verify "Si un compte existe…" message appears
  3. Check Resend / inbox for reset email
  4. Click reset link → `/reset-password?token=…` — verify form appears
  5. Set new password → verify redirect to `/login?reset=1` with green banner
  6. Log in with new password → verify success

- [ ] **Step 4: Test topbar menu**
  1. Log in → verify avatar button opens a dropdown (not immediate logout)
  2. Verify dropdown shows name, email, "Mon profil", "Se déconnecter"
  3. Click "Mon profil" → verify `/profile` loads
  4. Click "Se déconnecter" → verify redirect to `/login`

- [ ] **Step 5: Test profile page**
  1. Navigate to `/profile`
  2. Edit name / phone / structure → click "Enregistrer" → verify success message
  3. Change password with wrong current password → verify error message
  4. Change password correctly → verify success message and form resets
  5. Verify avatar section is visually dimmed with "À venir" label and buttons non-clickable

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "chore: smoke test passed — auth & profile feature complete"
```
