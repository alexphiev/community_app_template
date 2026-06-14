# Plan A — Critical Fixes + Invite-Only Registration

**Date:** 2026-06-05  
**Scope:** Blocking bug fixes + admin-initiated invite registration flow  
**Next plans:** Plan B (Next.js hygiene), Plan C (design compliance)

---

## Goals

1. Make the app actually usable: fix the broken home page, broken auth, and the legacy middleware file.
2. Add a complete invite-only registration flow so real users can onboard without manual DB seeding.

---

## Section 1 — Blocking Fixes

### 1.1 `middleware.ts` → `proxy.ts`

Next.js 16 renamed `middleware.ts` to `proxy.ts`. The exported function must be `proxy()` and the config export must be `proxyConfig`. The existing logic (route-role mapping, JWT session check, RBAC redirect) is correct and moves unchanged.

**Files:**
- Delete `middleware.ts`
- Create `proxy.ts` with identical logic, renamed exports

### 1.2 `app/page.tsx` — replace boilerplate

The root `/` route shows the default Next.js scaffold page. Replace with a server component that:
- Calls `auth()`
- If session exists → `redirect("/dashboard")`
- If no session → `redirect("/login")`

No UI needed — pure redirect.

### 1.3 Fix `auth.ts` Credentials `authorize`

Current implementation only checks `email === SEED_ADMIN_EMAIL` — no password verification. Replace with:
1. Look up user by email in DB
2. If user not found, suspended, or `passwordHash` is null → return `null`
3. `bcryptjs.compare(password, user.passwordHash)` → if false → return `null`
4. Return `{ id, name, email, role }`

This removes the `SEED_ADMIN_EMAIL` env var dependency entirely.

---

## Section 2 — Database Changes

### 2.1 `users` table — add `passwordHash`

```sql
ALTER TABLE "user" ADD COLUMN "password_hash" text;
```

Nullable. Null = invite sent, account not yet activated. Non-null = account active.

### 2.2 New table: `inviteTokens`

| Column | Type | Notes |
|--------|------|-------|
| `token` | `text` PK | cuid2, cryptographically random |
| `email` | `text` NOT NULL | invited email address |
| `role` | `roleEnum` NOT NULL | role to assign on acceptance |
| `name` | `text` | optional display name preset by admin |
| `expiresAt` | `timestamp` NOT NULL | 72 hours from creation |
| `usedAt` | `timestamp` | null until accepted |
| `createdById` | `text` FK → users.id | admin who created the invite |
| `createdAt` | `timestamp` NOT NULL | defaultNow() |

Unique index on `email` where `usedAt IS NULL` (only one pending invite per email at a time).

---

## Section 3 — Admin Invite UI

### Route: `/admin/users` (existing page, extend)

Add an "Inviter un utilisateur" button that reveals an inline form (no modal):
- `email` (required, email type)
- `name` (optional text)
- `role` selector (all roles except `guest`)

**Server Action: `inviteUser(formData)`**
1. Validate with Zod: email required, role must be a valid `Role`
2. Check no active (non-expired, non-used) invite already exists for this email
3. Check no active user with this email already exists
4. Create `inviteToken` record (token = `createId()`, expiresAt = now + 72h)
5. Send invite email via Resend SDK
6. Return success/error state to the form

### Resend email

- **To:** invited email
- **From:** `hub@info-jeunes-pdl.fr` (configure via `RESEND_FROM_EMAIL` env var)
- **Subject:** `Vous êtes invité à rejoindre Hub Pro — Réseau Info Jeunes PDL`
- **Body:** Plain HTML, includes:
  - Welcome message with the invitee's name (if provided)
  - CTA button linking to `${BASE_URL}/register?token=<token>`
  - Note that the link expires in 72 hours

**Env vars required:**
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `NEXT_PUBLIC_BASE_URL`

---

## Section 4 — Registration Flow (User Side)

### Route: `app/(auth)/register/page.tsx`

Server component. Reads `token` from `searchParams` (awaited, Next.js 16 async pattern).

**Token validation (on page load):**
- Token exists in DB
- `expiresAt > now()`
- `usedAt IS NULL`
- If invalid → render error state ("Ce lien est invalide ou a expiré. Contactez votre administrateur.")

**If valid:** render "Créer votre compte" form:
- `name` field (pre-filled with invite's name if set, always editable)
- `password` field (min 8 chars)
- `confirmPassword` field (client-side match validation)
- Hidden `token` input

**Server Action: `acceptInvite(formData)`**
1. Validate: name required, password min 8 chars, passwords match
2. Re-fetch token from DB (guard against race conditions / double-submit)
3. Hash password: `bcryptjs.hash(password, 12)`
4. Upsert user:
   - If user row with this email exists: update `passwordHash`, `name`, `emailVerified = now()`
   - If not: insert new user with `email`, `name`, `role`, `passwordHash`, `emailVerified = now()`
5. Mark `inviteToken.usedAt = now()`
6. Call `signIn("credentials", { email, password, redirectTo: "/dashboard" })`

### Visual style

Same card design as `app/(auth)/login/page.tsx`: white card, `max-w-sm`, teal-700 heading, Lagune colors. No new layout required — uses existing `(auth)` route group.

A "Retour à la connexion" link at the bottom pointing to `/login`.

---

## Out of Scope (Plan B / Plan C)

- Google Fonts → `next/font` migration (Plan B)
- `error.tsx` / `not-found.tsx` boundaries (Plan B)
- Async params/searchParams audit across all pages (Plan B)
- Playwright page testing (Plan C)
- Design compliance against Stitch screenshots (Plan C)
- Password reset flow (future)
- MFA (future)
- Session revocation / Redis blocklist (future)
- Rate limiting on login/register (future)

---

## Success Criteria

- [ ] `/` redirects to `/dashboard` (authed) or `/login` (unauthed)
- [ ] `proxy.ts` replaces `middleware.ts`, app starts without deprecation warning
- [ ] Admin can invite a user from `/admin/users` → email arrives via Resend
- [ ] Invited user clicks link → lands on `/register?token=...` form
- [ ] Invalid/expired token shows error, not a crash
- [ ] User submits form → account activated → redirected to `/dashboard`
- [ ] Login with email+password works for activated users
- [ ] Login with wrong password returns error (no crash, no bypass)
- [ ] Previously seeded admin (if any) needs `passwordHash` set — implementation plan must include a one-time seed script (`scripts/seed-admin-password.ts`) that takes `SEED_ADMIN_EMAIL` + `SEED_ADMIN_PASSWORD` from env and upserts the hash directly via Drizzle
