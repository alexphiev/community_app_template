# Phase 5 — Admin Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `/admin` panel with user management, content moderation queue, taxonomy editor, and KPI analytics dashboard.

**Architecture:** All `/admin` routes are Server Components gated by `admin_ij_pdl` role (enforced at middleware). Server Actions for mutations. Analytics use aggregate Postgres queries (no external analytics service for MVP).

**Tech Stack:** Next.js 16, Drizzle, Zod, Shadcn/ui (Table, Badge, Dialog)

**Prerequisite:** Phases 0, 1, 2, 4 complete (need content tables to manage).

---

> **Status:** Stub — expand into full task breakdown before executing.

## Modules

### 1. User Management (`/admin/users`)
- Table of all users with role badge, status (active/suspended), created date
- Create user: form with name, email, role assignment
- Suspend/unsuspend: toggle `suspended` flag
- Edit role: dropdown to reassign role
- Invite by email (generate a one-time token link)

### 2. Moderation Queue (`/admin/moderation`)
- List of resources/posts with status `pending_approval`
- Approve action: sets status to `published`, notifies author
- Reject action: sets status to `rejected` with optional reason text, notifies author
- Filter by content type (resource, post)

### 3. Taxonomy (`/admin/taxonomy`)
- CRUD for global `tags` and `event_categories`
- Tag merge: reassign all content from tag A to tag B, then delete A

### 4. Analytics (`/admin/analytics`)
- KPIs via aggregate DB queries:
  - Active users (logged in last 30 days)
  - Total published resources by category
  - Most-consulted resources (page view counter on resource detail)
  - Event RSVP counts
  - New users per month
- Simple numeric cards + basic bar/line chart (Recharts or Shadcn Charts)

## File Map (to be filled in)

```
src/
  lib/actions/admin.ts           — createUser, suspendUser, approveContent, mergeTag
  lib/actions/analytics.ts       — getAnalytics aggregate queries
  lib/validations/admin.ts
  components/admin/
    UserTable.tsx
    ModerationItem.tsx
    TaxonomyEditor.tsx
    AnalyticsCard.tsx
    AnalyticsChart.tsx
app/(app)/
  admin/
    layout.tsx                   — admin sub-nav
    users/page.tsx
    moderation/page.tsx
    taxonomy/page.tsx
    analytics/page.tsx
tests/
  unit/lib/actions/admin.test.ts
  unit/lib/actions/analytics.test.ts
```
