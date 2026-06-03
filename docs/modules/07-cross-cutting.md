# Module 7 — Cross-Cutting Concerns

This document covers improvements that span multiple modules or are not owned by any single feature.

---

## Notifications system

The MVP has no notification system at all — the bell icon in the topbar is decorative, and no user is ever alerted to anything.

A full notification system needs:

- **In-app notification centre** — a dropdown on the bell icon listing recent events: @mention in a post or chat message, a comment on your resource, a moderation decision on your submission, an upcoming event you RSVPed to, a new resource in your favourite tags.
- **Notification types** — each notification type needs a model (type enum, actor, subject entity, read flag, created_at) in a `notifications` table with a `user_id` FK.
- **Real-time delivery** — push new notifications to the client via WebSocket or Server-Sent Events so the bell badge updates without a page refresh.
- **Email digest** — for users who prefer low-noise communication, bundle all unread notifications into a daily or weekly digest email. The `notif_pref` table already exists for chat; a generalised version across all modules is needed.
- **Notification preferences page** — a `/settings/notifications` page where users configure which events trigger which delivery method (in-app, email, none) globally and per-module.

---

## Search

Each module currently has its own isolated search (resource tag filter, user `ilike`). A full-platform search experience needs:

- **Global search bar** — the topbar search currently does nothing. It should query across resources, posts, users, and events simultaneously, returning ranked results grouped by type.
- **PostgreSQL full-text search** — add `tsvector` columns to `resources`, `posts`, and `users`, populated via triggers or application-level updates. Use `ts_rank` for relevance scoring.
- **Dedicated search index** — for a better user experience (sub-100ms results, typo tolerance, faceting), migrate to a dedicated search engine. Meilisearch or Typesense are sovereign, self-hostable options. Typesense in particular has a Next.js-friendly client.
- **Search history** — remember recent searches per user (stored in `localStorage` or the DB) for quick re-access.
- **Search analytics** — log what users search for most, and which searches return zero results, to inform content gaps.

---

## Accessibility (RGAA Level AA)

The Lagune design system is built for WCAG 2.2 AA compliance, but the MVP has several gaps:

- **Skip to content link** — already implemented in the app shell but needs to be verified on all pages.
- **Focus management in modals/drawers** — the chat channel detail pane opens inline but does not trap focus. Any modal-style UI needs a proper focus trap.
- **Keyboard navigation of the calendar** — the agenda grid is not keyboard-navigable. Day cells and event chips need `tabindex`, arrow key navigation, and Enter-to-activate.
- **Screen reader testing** — the app has not been tested with VoiceOver (macOS/iOS) or NVDA (Windows). Automated tools catch ~30% of issues; manual testing is mandatory for RGAA certification.
- **Forced colours / high contrast mode** — Windows high contrast mode should be tested. The Lagune palette uses oklch values which may not map well to forced-colour overrides without `@media (forced-colors: active)` rules.
- **Reduced motion** — the `prefers-reduced-motion` media query is already in `globals.css` and disables transitions. Verify that all animations (card hover, FAB scale, calendar chip hover) respect this.
- **Form error messages** — all form validation errors must be associated with their input via `aria-describedby` and use `aria-invalid`. Server Action error states need to be returned and rendered client-side.
- **RGAA audit** — commission a formal RGAA Level AA audit before the FEDER deadline. RGAA is the French transposition of WCAG and has specific administrative requirements for public service platforms.

---

## Performance & eco-design

- **ISR revalidation strategy** — the current approach uses arbitrary revalidation intervals (60s news, 300s resources). A smarter approach uses on-demand revalidation via `revalidateTag` (already implemented for mutations) combined with longer background ISR intervals.
- **Image optimisation** — Next.js `<Image>` component with automatic WebP conversion and responsive sizes is not used anywhere in the MVP. All `<img>` tags should be replaced.
- **Bundle analysis** — run `@next/bundle-analyzer` to identify unexpectedly large client-side dependencies and apply dynamic imports (`next/dynamic`) where appropriate.
- **Database query optimisation** — add `EXPLAIN ANALYZE` on the most frequent queries (resource listing, chat message pagination, user search) and add indexes where missing.
- **Lazy loading** — the `CommentThread` component loads all comments on page load. For resources with many comments, use cursor-based pagination and load-more.
- **Caching headers** — S3 presigned download URLs expire in 1 hour. Immutable resources (PDFs that never change) should be served with long-lived cache headers via CloudFront or a CDN layer in front of S3.

---

## Testing coverage gaps

The MVP has 134 unit and component tests but is missing:

- **Integration tests** — tests that exercise the full Server Action pipeline against a real test database (not mocked). These catch DB schema mismatches, FK constraint errors, and Drizzle query bugs that unit tests with mocks cannot.
- **End-to-end tests** — Playwright tests covering the critical user journeys: login, browse resources, submit a resource, approve it as admin, post a news item, RSVP to an event. These are the most valuable tests for FEDER acceptance testing.
- **Accessibility tests** — `axe-core` (via `@axe-core/playwright`) integrated into the E2E test suite to catch WCAG violations automatically on every CI run.
- **Load tests** — `k6` or `artillery` scripts simulating the expected user load (e.g. 50 concurrent users) to validate that the Clever Cloud deployment scales appropriately.

---

## Deployment & CI/CD

- **CI pipeline** — a GitHub Actions (or equivalent) workflow running on every pull request: `pnpm test`, `pnpm tsc --noEmit`, `pnpm lint`, and `pnpm build`. Currently there is no CI at all.
- **Staging environment** — a staging deployment on Clever Cloud running against a separate DB, used for UAT with the client before each production release.
- **Database migrations in CI** — `pnpm db:migrate` should run automatically on deployment, not manually. Clever Cloud supports pre-build hooks.
- **Secret management** — `.env.local` is currently the only way to configure the app. Production secrets should be managed via Clever Cloud's environment variable system or a secrets manager, never committed.
- **Zero-downtime deploys** — Next.js on Clever Cloud supports rolling restarts; verify that the Drizzle migration step does not cause locking issues on the live DB during deployment.
- **Backup and restore** — automated daily PostgreSQL backups with a tested restore procedure. The FEDER grant data must not be lost.
