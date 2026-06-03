# Module 0 — Foundation & Infrastructure

## What it does

The foundation layer is invisible to end users but underpins every other module. It establishes:

- **Authentication** via NextAuth.js v5 — email/password credentials, JWT sessions, role embedded in the token so every request knows the caller's identity without a DB round-trip.
- **RBAC middleware** — a single `middleware.ts` intercepts every request and evaluates the user's role against the required permission for that route prefix. Unauthenticated users are redirected to `/login`; authenticated users without the right role are redirected to `/dashboard`.
- **Database schema** — PostgreSQL via Drizzle ORM. All tables are strongly typed; the TypeScript types are derived from the schema, eliminating an entire class of runtime bugs.
- **i18n scaffolding** — `next-intl` configured with French as the primary locale and English as a stub, ready to scale.
- **Lagune design system** — Tailwind v4 with the full "Lagune" token set (teal-700 primary, coral-700 accent, WCAG 2.2 AA compliant palette, Bricolage Grotesque display font, Inter body font, Material Symbols icons).
- **App shell** — authenticated layout with a 256px fixed sidebar (role-aware nav, coral 3px active indicator), 64px topbar (search, notifications bell, user avatar/logout).

---

## MVP gaps & future improvements

### Authentication

- **Hashed passwords** — the MVP accepts only a single seed admin email with no password check. A production system needs bcrypt-hashed passwords stored on the `users` table, with a secure registration flow and password reset by email.
- **Email magic links / OIDC** — many professional networks prefer passwordless auth or SSO via their organisation's identity provider (Azure AD, Google Workspace). NextAuth supports both; the Credentials provider should be replaced or supplemented.
- **Multi-factor authentication (MFA)** — TOTP (authenticator app) or email OTP should be offered to admins and optionally to all staff, given the sensitive internal data in the platform.
- **Session revocation** — JWT sessions can't be revoked before expiry. A Redis-backed session blocklist should be introduced so suspending a user takes effect immediately, not at next JWT expiry.
- **Brute-force protection** — rate limit login attempts per IP and per email (e.g. 5 attempts / 10 min), with exponential backoff and optional CAPTCHA.

### RBAC

- **Fine-grained permissions** — the current model is coarse (5 roles, 6 features). A production system may need attribute-based permissions: "can edit own posts but not others'", "can approve resources in their department but not nationally", etc.
- **Role audit log** — every role change, suspension, and permission escalation should be logged with who made the change and when, for GDPR accountability.
- **Invitation-only registration** — new accounts should be created only via an admin-generated invite link (token with expiry), not open registration.

### Infrastructure

- **Redis** — currently absent. Needed for: chat unread counts, session blocklist, rate limiting, and eventually WebSocket presence. Should be added early in the next development cycle.
- **Environment validation** — use `zod` to validate all required env vars at startup and fail fast with a clear error rather than a cryptic runtime crash.
- **Health check endpoint** — `GET /api/health` returning DB connectivity status, used by Clever Cloud's load balancer for zero-downtime deploys.
- **Error monitoring** — integrate Sentry (or equivalent sovereign alternative) for server-side error tracking. Currently errors are silent in production.
- **Structured logging** — replace `console.log` with a structured logger (e.g. `pino`) that emits JSON, enabling log aggregation and alerting.
- **GDPR data export** — a "download my data" endpoint is required by GDPR Article 20. Should generate a ZIP of all user-owned content in JSON format.
- **Cookie consent** — a GDPR-compliant consent banner must be added before any analytics or non-essential cookies are set.
- **Content Security Policy headers** — CSP, HSTS, X-Frame-Options, and other security headers should be enforced via Next.js config or a reverse proxy.
