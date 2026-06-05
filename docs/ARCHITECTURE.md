# Hub Pro — Architecture Reference (Info Jeunes Pays de la Loire)

> **Status:** MVP target — Production by **2027-02-01** (hard FEDER constraint)

---

## Project Overview

Centralized web platform for Youth Information professionals (Réseau Info Jeunes PDL). Replaces legacy WordPress and external tools (Discord). Low-noise, role-tailored, sovereign-hosted.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| UI | Shadcn/ui (Radix primitives) + Tailwind CSS v4 |
| Database | PostgreSQL (via Drizzle ORM) |
| Auth | NextAuth.js v5 (JWT / HttpOnly sessions) |
| Validation | Zod |
| Real-time | WebSockets (e.g., Ably or native WS via Route Handler) |
| Storage | S3-compatible EU/EEE object storage |
| Cache (dynamic) | Redis (Upstash or self-hosted) |
| i18n | next-intl (`/fr` primary, `/en` ready) |
| Hosting | Clever Cloud (France) |
| Package manager | pnpm |

---

## RBAC Roles

| Role | Permissions |
|---|---|
| `admin_ij_pdl` | Full CRUD, user management, moderation, settings, analytics |
| `salarie_ij_pdl` | Publish/edit own content, moderate network content, full chat |
| `pro_reseau_ij` | Read + contribute (pending validation), chat, event RSVP |
| `relais_externe` | Read-only on permitted features |
| `guest` | Public pages + password-protected share links only |

Enforced at middleware layer on every protected route.

---

## Feature Modules & Routes

```
/dashboard              — Personalized landing (role-aware)
/resources
  /documentation        — Official PDFs (auto-versioned)
  /toolbox              — Pedagogical tools (video/audio/PDF + Q&A)
  /veille               — Shared intelligence (articles, links)
  /tutorials            — Platform usage guides
  /external             — Guest share links (password-protected)
/news                   — Newsfeed / Actualités (pinned, threaded comments)
/agenda                 — Events calendar (RSVP, iCal export)
/chat
  /direct               — 1-to-1 private messaging
  /channels             — Thematic group channels
/directory              — Annuaire of professionals
/admin
  /users                — Account management
  /moderation           — Content approval queue
  /taxonomy             — Tags / categories
  /analytics            — KPI dashboard
```

---

## Architecture Decisions

- **Monolithic serverless** — single Next.js app, no microservices for MVP.
- **Server Actions** for mutations; Route Handlers (`/api/*`) for webhooks and data exports.
- **ISR** for Resources and News pages; Redis for chat/presence/session.
- **ETL script** required to migrate ~500 WordPress articles into the new schema.
- **GDPR**: cookie consent, full Open Data export, RGAA Level AA a11y.

---

## Implementation Plans Index

| Plan | Status | Description |
|---|---|---|
| [Phase 0 — Foundation](superpowers/plans/2026-06-02-phase-0-foundation.md) | ✅ Complete | DB schema, auth, RBAC middleware, layout shell |
| [Phase 1 — Resources](superpowers/plans/2026-06-02-phase-1-resources.md) | ✅ Complete | Documentation, Toolbox, Veille, Tutorials, External share |
| [Phase 2 — News & Agenda](superpowers/plans/2026-06-02-phase-2-news-agenda.md) | ✅ Complete | Newsfeed, comments, calendar, RSVP, iCal |
| [Phase 3 — Chat](superpowers/plans/2026-06-02-phase-3-chat.md) | ✅ Complete | Channels, polling messages, notif prefs (WebSocket-ready) |
| [Phase 4 — Directory & Dashboard](superpowers/plans/2026-06-02-phase-4-directory-dashboard.md) | ✅ Complete | Annuaire, personalized dashboard, external links |
| [Phase 5 — Admin Panel](superpowers/plans/2026-06-02-phase-5-admin.md) | ✅ Complete | Users, moderation queue, taxonomy, analytics |
| [Phase 6 — ETL & Migration](superpowers/plans/2026-06-02-phase-6-etl-migration.md) | ✅ Complete | WordPress → new DB schema migration script |

---

## Dependency Order

```
Phase 0 (Foundation)
  └─► Phase 1 (Resources)
  └─► Phase 2 (News & Agenda)
  └─► Phase 4 (Directory & Dashboard)
  └─► Phase 5 (Admin Panel) — depends on Phase 1+2+4
  └─► Phase 3 (Chat) — independent after Phase 0
Phase 6 (ETL) — independent, run after Phase 1 schema is stable
```

All phases depend on Phase 0 being complete first.
