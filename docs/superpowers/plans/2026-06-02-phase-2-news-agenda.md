# Phase 2 — News & Agenda Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Newsfeed (pinned posts, threaded comments, moderation) and the Events calendar (monthly/weekly views, RSVP, iCal export, category filtering).

**Architecture:** ISR-cached list pages, Server Actions for post/comment mutations. Calendar uses a headless library (e.g., `react-big-calendar` or custom grid). iCal generation in a Route Handler. Future OpenAgenda API sync is anticipated in the data model but not implemented in MVP.

**Tech Stack:** Next.js 16, Drizzle, Zod, ics (npm) for iCal, Shadcn/ui

**Prerequisite:** Phase 0 complete.

---

> **Status:** Stub — expand into full task breakdown before executing.

## Modules

### 1. Newsfeed (`/news`)
- DB tables: `posts`, `post_comments`
- Pinned flag on posts (Admin/Salarié only)
- Rich text body (stored as JSON, rendered client-side)
- Threaded comments with moderation delete (Admin/Salarié)
- ISR revalidation on publish/update

### 2. Events / Agenda (`/agenda`)
- DB tables: `events`, `event_categories`, `event_rsvps`
- Color-coded categories (Internal IJ vs. Network)
- Monthly and weekly calendar views
- RSVP: internal form (stored) or external Google Form link
- iCal export: Route Handler `/api/events/ical` returning `.ics` file
- `openagenda_id` nullable column for future sync

## DB Schema additions

```ts
// posts, post_comments, events, event_categories, event_rsvps
// (expand in full plan)
```

## File Map (to be filled in)

```
src/
  db/schema.ts                   — add posts + events tables
  lib/actions/posts.ts
  lib/actions/events.ts
  lib/validations/posts.ts
  lib/validations/events.ts
  components/news/
    PostCard.tsx
    PostComments.tsx
    PinBadge.tsx
  components/agenda/
    CalendarGrid.tsx
    EventCard.tsx
    RsvpForm.tsx
app/(app)/
  news/
    page.tsx
    [id]/page.tsx
  agenda/
    page.tsx
    [id]/page.tsx
app/api/
  events/ical/route.ts
tests/
  unit/lib/actions/posts.test.ts
  unit/lib/actions/events.test.ts
  unit/api/ical.test.ts
```
