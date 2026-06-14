# Phase 4 — Directory & Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the searchable Annuaire of network professionals, the personalized role-aware Dashboard, and the External Links gateway to third-party tools.

**Architecture:** Server Components for SSR. Directory uses Postgres full-text search. Dashboard composes widgets server-side per role. External links are a static config-driven list (no DB needed for MVP).

**Tech Stack:** Next.js 16, Drizzle, Zod, Shadcn/ui

**Prerequisite:** Phase 0 complete.

---

> **Status:** Stub — expand into full task breakdown before executing.

## Modules

### 1. Directory (`/directory`)
- Searchable list of `users` (name, structure, role, contact)
- Postgres full-text search on name + structure
- Profile card component: avatar, name, role badge, structure, email link
- Visible to `relais_externe` and above

### 2. Personalized Dashboard (`/dashboard`)
- Role-aware widgets:
  - **Admin:** usage stats (active users, content counts), recent moderation queue items
  - **Salarié:** own recent posts, upcoming events
  - **Pro:** recent resources, upcoming events, pending approval status
  - **Relais:** recent news, upcoming events
- Quick-access widget links to main sections
- Recent activity feed (last 10 items across content types)

### 3. External Links module
- Static config in `src/config/external-links.ts`
- Links: Canva, IJ Box, IJ Connect, Passerelle Internationale
- Rendered as card grid on a `/external-tools` page or as Dashboard widget
- No DB needed; just config + component

## File Map (to be filled in)

```
src/
  config/
    external-links.ts            — static list of external tool URLs + icons
  lib/actions/directory.ts       — searchUsers Server Action
  components/
    directory/
      UserCard.tsx
      DirectorySearch.tsx
    dashboard/
      StatsWidget.tsx
      ActivityFeed.tsx
      QuickLinks.tsx
      RecentContentWidget.tsx
app/(app)/
  directory/page.tsx
  dashboard/page.tsx             — replace stub from Phase 0
  external-tools/page.tsx
tests/
  unit/lib/actions/directory.test.ts
```
