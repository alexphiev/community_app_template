# Auth & Profile — Design Spec
**Date:** 2026-06-13  
**Status:** Approved

## Summary

Add a full self-registration flow with Resend email confirmation, password reset via magic link, a profile page (identity + password change), and convert the topbar avatar button into a dropdown menu.

---

## 1. Scope

| Feature | Status |
|---|---|
| Open self-registration with role selector + email confirmation | New |
| Email verification page (post-registration) | New |
| Forgot password flow (3 steps) | New |
| Topbar avatar → dropdown menu (Mon profil / Se déconnecter) | Changed |
| Profile page `/profile` — identity fields + change password | New |
| Avatar upload | Out of scope (future sprint) |

The existing invite-by-admin flow (`/register?token=…`) is **kept as-is** and remains fully functional alongside the new public registration.

---

## 2. Architecture

**Approach: Token table (DB tokens)**  
Consistent with the existing `invite_tokens` pattern. Two new Drizzle tables:

- `email_verification_tokens` — used after public registration to confirm email address
- `password_reset_tokens` — used in the forgot-password flow

Both tables follow the same shape as `invite_tokens`: a random CUID token, expiry timestamp, and a `usedAt` field for single-use enforcement.

All emails sent via the existing `lib/email.ts` Resend client.

---

## 3. Database Schema Changes

```ts
// email_verification_tokens
{
  token: text (PK, CUID)
  userId: text (FK → users.id, cascade delete)
  expiresAt: timestamp  // createdAt + 24h
  usedAt: timestamp | null
  createdAt: timestamp
}

// password_reset_tokens
{
  token: text (PK, CUID)
  userId: text (FK → users.id, cascade delete)
  expiresAt: timestamp  // createdAt + 1h
  usedAt: timestamp | null
  createdAt: timestamp
}
```

The `users` table already has `emailVerified`, `passwordHash`, `name`, `phone`, `structure`, `role`, and `image` columns — no changes needed except confirming `phone` and `structure` exist (they do).

---

## 4. New Routes

| Route | Description |
|---|---|
| `GET /register` | Public registration form (replaces invite-only guard) |
| `GET /verify-email?token=…` | Confirms email, activates account |
| `GET /forgot-password` | Step 1 — enter email |
| `GET /reset-password?token=…` | Step 3 — set new password |
| `GET /profile` | Authenticated profile page |

The existing `GET /register?token=…` invite flow continues to work — the new public form renders when no `token` param is present.

---

## 5. Flows

### 5.1 Public Registration

1. User visits `/register` (no token param)
2. Fills: name, email, role selector (options: `salarie_ij_pdl`, `pro_reseau_ij`, `relais_externe`, `guest`; excludes `admin_ij_pdl`), password, confirm password
3. Server action: create user with `emailVerified: null`, send verification email via Resend
4. Redirect to `/register?pending=1` — "Vérifiez votre email" screen
5. User clicks link → `GET /verify-email?token=…`
6. Server: mark `emailVerified`, mark token `usedAt`, auto sign-in, redirect `/dashboard`

**Edge cases:**
- Email already exists → show error "Un compte avec cet email existe déjà"
- Token expired/used → show error page with link to resend (resend not in scope, just show message to re-register)

### 5.2 Forgot Password

1. User clicks "Mot de passe oublié ?" on `/login`
2. `GET /forgot-password` — enter email form
3. Server action: if user exists, create `password_reset_tokens` row, send reset email. Always show "Si un compte existe, un email a été envoyé." (no email enumeration)
4. User clicks link → `GET /reset-password?token=…`
5. Server validates token (exists, not used, not expired < 1h)
6. User sets new password + confirm
7. Server: hash password, update `users.passwordHash`, mark token `usedAt`, redirect `/login?reset=1` (show success banner)

### 5.3 Profile — Identity Update

- `POST` server action on `/profile`
- Fields: `name`, `phone`, `structure`
- Email: readonly (displayed with "vérifié" badge)
- Role: readonly (displayed with "modifiable par un admin" note)
- On success: revalidate session, show inline success toast

### 5.4 Profile — Change Password

- Separate server action on same page
- Fields: `currentPassword`, `newPassword`, `confirmPassword`
- Validates `currentPassword` against `bcrypt.compare`
- On success: update `passwordHash`, show inline success message

---

## 6. Login Page Changes

- Add "Mot de passe oublié ?" link inline next to the password label (right-aligned)
- Add "Créer un compte" link below the submit button, separated by a divider
- Both are plain `<a>` links — no JS

---

## 7. Topbar Menu Change

Replace the current avatar `<button formAction={signOut}>` with a Radix `DropdownMenu` (already available via shadcn):

- **Trigger**: same avatar circle with initials (no visual change when closed)
- **Dropdown header**: name + email (non-clickable)
- **Item 1**: "Mon profil" → `href="/profile"` 
- **Divider**
- **Item 2**: "Se déconnecter" → server action `signOut`

The `Topbar` component becomes a Client Component (`"use client"`) to handle the dropdown interaction; session data is passed down as props from the Server Component layout.

---

## 8. Email Templates

All emails follow the existing style in `lib/email.ts`.

| Email | Subject | Content |
|---|---|---|
| Verification | "Confirmez votre email — Hub Pro" | Greeting + button "Confirmer mon email" + 24h validity note |
| Password reset | "Réinitialisation de mot de passe — Hub Pro" | Greeting + button "Réinitialiser mon mot de passe" + 1h validity note + "ignorez si vous n'avez pas demandé" |

---

## 9. Validation (Zod)

New schemas in `lib/validations/auth.ts`:

- `publicRegisterSchema`: name, email, role (enum without admin), password (min 8), confirmPassword (must match)
- `forgotPasswordSchema`: email
- `resetPasswordSchema`: token, password (min 8), confirmPassword (must match)
- `updateProfileSchema`: name (min 1), phone (optional), structure (optional)
- `changePasswordSchema`: currentPassword, newPassword (min 8), confirmPassword (must match)

---

## 10. Out of Scope

- Avatar upload (future sprint — storage not wired)
- Email change (requires re-verification flow, future)
- Admin approval gate on self-registration
- Resend verification email button
- OAuth / social login
