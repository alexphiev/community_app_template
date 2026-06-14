# Plan C2 — Design Compliance

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the live app visually match the approved Stitch design mockups for 6 screens, then audit all other pages for Lagune token consistency.

**Architecture:** Direct surgical edits to page and component files. Design reference files live in `docs/design_system/<screen>/screen.png` and `code.html`. No new abstractions — fix only what deviates from the spec.

**Tech Stack:** Next.js 16, Tailwind v4, Lagune design tokens

**Prerequisites:** Plan C1 complete (all pages load without errors), seed data loaded

---

## Lagune Token Reference

| Token | Value | Use |
|-------|-------|-----|
| `teal-700` | #00807A | Primary actions, headings, active states |
| `teal-900` | #00403D | Hero headings |
| `coral-700` | #BB4F3A | Accent, active nav indicator, destructive |
| `on-surface` | #181d1c | Body text |
| `on-surface-variant` | #3e4948 | Secondary text, placeholders |
| `surface` | #f6faf9 | Page background |
| `surface-container-low` | #f0f4f3 | Card backgrounds, hover states |
| `surface-container` | #ebefed | Elevated surfaces |
| `outline-variant` | #bdc9c7 | Borders, dividers |
| `outline` | #6e7978 | Muted text, icons |

**Card pattern:** `bg-white rounded-xl border border-neutral-200 shadow-sm` OR `border-outline-variant`
**Active nav:** `border-l-[3px] border-coral-700 bg-surface-container-low text-teal-700`
**Primary button:** `bg-teal-700 text-white rounded-[6px] font-medium hover:bg-teal-800`

---

## File Map

| Action | File | What changes |
|--------|------|-------------|
| Modify | `app/(app)/agenda/page.tsx` | Fix event category colors (bg-blue-500 etc → Lagune tokens) |
| Modify | `components/news/CalendarGrid.tsx` | Fix event dot/chip colors in calendar cells |
| Modify | `app/(app)/chat/page.tsx` | Audit against chat design |
| Modify | `app/(app)/chat/layout.tsx` | Audit three-pane layout |
| Modify | `components/chat/ChannelList.tsx` | Audit channel list styling |
| Modify | `app/(app)/resources/toolbox/page.tsx` | Audit against toolbox design |
| Modify | `app/(app)/resources/documentation/page.tsx` | Audit Lagune tokens |
| Modify | `app/(app)/resources/veille/page.tsx` | Audit Lagune tokens |
| Modify | `app/(app)/resources/tutorials/page.tsx` | Audit Lagune tokens |
| Modify | `app/(app)/admin/page.tsx` | Audit Lagune tokens |
| Modify | `app/(app)/admin/users/page.tsx` | Audit Lagune tokens |
| Modify | `app/(app)/admin/moderation/page.tsx` | Audit Lagune tokens |
| Modify | `app/(app)/admin/taxonomy/page.tsx` | Audit Lagune tokens |
| Modify | `app/(app)/admin/analytics/page.tsx` | Audit Lagune tokens |

---

## Task 1: Fix agenda event category colors

**Files:**
- Modify: `app/(app)/agenda/page.tsx`
- Modify: `components/news/CalendarGrid.tsx`

The agenda page uses `bg-blue-500`, `bg-green-500`, `bg-purple-500` for event category dots/chips. These are not Lagune tokens. The design mockup (`docs/design_system/agenda/code.html`) uses `bg-blue-50 border-l-4 border-blue-500` in the calendar cells — but these are also non-Lagune. The correct approach is to map categories to Lagune tokens consistently:

| Category | Lagune token | Reasoning |
|----------|-------------|-----------|
| `formation` | `bg-teal-700` | Primary = learning/growth |
| `reunion` | `bg-coral-700` | Accent = coordination |
| `evenement` | `bg-teal-700` | Same as formation |
| `autre` | `bg-on-surface-variant` | Neutral |

- [ ] **Step 1: Update `CATEGORY_COLORS` in `app/(app)/agenda/page.tsx`**

Find the current `CATEGORY_COLORS` object (around line 11-16) and replace:

```ts
const CATEGORY_COLORS: Record<string, string> = {
  formation: "bg-teal-700",
  reunion:   "bg-coral-700",
  evenement: "bg-teal-700",
  autre:     "bg-on-surface-variant",
}
```

- [ ] **Step 2: Read `components/news/CalendarGrid.tsx` and check if it uses its own color map**

```bash
grep -n "blue\|green\|purple\|formation\|reunion\|category" /Users/alexandrephiev/Projects/info_jeunes_poc/components/news/CalendarGrid.tsx
```

If it has its own color mapping, apply the same Lagune token replacements as above. If it receives colors as props from `agenda/page.tsx`, no change needed.

- [ ] **Step 3: Verify TypeScript**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/\(app\)/agenda/page.tsx components/news/CalendarGrid.tsx
git commit -m "fix(agenda): replace non-Lagune category colors with design tokens"
```

---

## Task 2: Audit and fix news page against design

**Files:**
- Modify: `app/(app)/news/page.tsx` (if needed)
- Modify: `components/news/PostCard.tsx` (if needed)

Reference: `docs/design_system/news_feed/code.html` + `screen.png`

The design shows:
- Composer area: `bg-surface p-6 rounded-lg border border-outline-variant shadow-sm`
- Posts: article cards with avatar, author name bold, role label in `text-label-2xs text-on-surface-variant uppercase tracking-wider`, timestamp italic
- Reaction row: `px-6 py-4 bg-surface-container-lowest border-t border-outline-variant`

- [ ] **Step 1: Read the current PostCard component**

```bash
cat components/news/PostCard.tsx
```

Compare against the design: check card borders, avatar rendering, reaction bar background (`bg-surface-container-lowest`), author text styles.

- [ ] **Step 2: Apply any discrepancies found**

For each discrepancy, edit the file. Common issues to look for:
- Reaction bar using `bg-surface-container-low` instead of `bg-surface-container-lowest`
- Author role label missing `uppercase tracking-wider`
- Missing `line-clamp-2` on post body in compact view
- Card border using raw hex instead of `border-outline-variant`

- [ ] **Step 3: Verify TypeScript**

```bash
pnpm tsc --noEmit
```

- [ ] **Step 4: Commit (only if changes were needed)**

```bash
git add app/\(app\)/news/page.tsx components/news/PostCard.tsx
git commit -m "fix(news): align post feed with Stitch design spec"
```

---

## Task 3: Audit and fix dashboard against design

**Files:**
- Modify: `app/(app)/dashboard/page.tsx` (if needed)

Reference: `docs/design_system/dashboard/code.html` + `screen.png`

The design shows:
- Hero: `text-[49px] font-extrabold text-teal-900` — verify current
- Quick-link cards: `bento-card` hover lift effect (`hover:-translate-y-1`), coral icon for the last card
- Activity feed: coral accent line on hover (`absolute left-0 w-[3px] bg-coral-700`)
- Events widget in right column with mini calendar-style date chips

- [ ] **Step 1: Compare current dashboard to design**

Read `docs/design_system/dashboard/screen.png` (view as image) and `code.html`. Identify any layout, color, or spacing issues in `app/(app)/dashboard/page.tsx`.

- [ ] **Step 2: Fix discrepancies**

Current known issues:
- `iconColor: "text-coral-700"` is set on the Annuaire quick link — verify it's actually rendering with coral
- The coral accent line on the feed items uses `scale-y-0 group-hover:scale-y-100` — verify it's present

- [ ] **Step 3: Verify TypeScript and commit (if changed)**

```bash
pnpm tsc --noEmit
git add app/\(app\)/dashboard/page.tsx
git commit -m "fix(dashboard): align with Stitch design spec"
```

---

## Task 4: Audit and fix directory against design

**Files:**
- Modify: `app/(app)/directory/page.tsx` (if needed)
- Modify: `components/directory/UserCard.tsx` (if needed)

Reference: `docs/design_system/contacts/code.html` + `screen.png`

The design shows:
- Search bar: `bg-surface-container-low border border-outline-variant rounded-full`
- User cards: avatar with `border-2 border-surface-container-highest group-hover:border-teal-700`, name bold, role label with role badge pill
- Filter dropdown styled with `border-outline-variant rounded-lg`

- [ ] **Step 1: Read current directory page and UserCard**

```bash
cat app/\(app\)/directory/page.tsx
cat components/directory/UserCard.tsx
```

- [ ] **Step 2: Fix discrepancies found against the contacts design**

Common issues: avatar border not transitioning to teal on hover, role badge using wrong background color, missing grid gap.

- [ ] **Step 3: Verify TypeScript and commit (if changed)**

```bash
pnpm tsc --noEmit
git add app/\(app\)/directory/page.tsx components/directory/UserCard.tsx
git commit -m "fix(directory): align with Stitch contacts design spec"
```

---

## Task 5: Audit and fix chat against design

**Files:**
- Modify: `app/(app)/chat/page.tsx` (if needed)
- Modify: `app/(app)/chat/layout.tsx` (if needed)
- Modify: `components/chat/ChannelList.tsx` (if needed)
- Modify: `components/chat/ChatChannelClient.tsx` (if needed)

Reference: `docs/design_system/chat/code.html` + `screen.png`

The design shows a three-pane layout:
- Left pane (w-72): `bg-surface-container-low border-r border-outline-variant` with channel groups
- Center pane: message bubbles, composer at bottom
- Active channel: `bg-teal-700/10 text-teal-700` highlight

- [ ] **Step 1: Read current chat layout and channel list**

```bash
cat app/\(app\)/chat/layout.tsx
cat components/chat/ChannelList.tsx
```

- [ ] **Step 2: Fix discrepancies against the chat design**

Key things to verify:
- Left pane background is `bg-surface-container-low` not white
- Channel group headers: `text-label-2xs uppercase tracking-wider text-on-surface-variant font-bold`
- Active channel: `bg-teal-700/10 text-teal-700 rounded-md`
- "Conversations" heading: `text-teal-900 font-bold text-[18px]`

- [ ] **Step 3: Verify TypeScript and commit (if changed)**

```bash
pnpm tsc --noEmit
git add app/\(app\)/chat/ components/chat/
git commit -m "fix(chat): align with Stitch messaging design spec"
```

---

## Task 6: Audit toolbox against design

**Files:**
- Modify: `app/(app)/resources/toolbox/page.tsx` (if needed)
- Modify: `components/resources/ResourceCard.tsx` (if needed)
- Modify: `components/resources/ResourceGrid.tsx` (if needed)
- Modify: `components/resources/ResourceFilter.tsx` (if needed)

Reference: `docs/design_system/toolbox/code.html` + `screen.png`

- [ ] **Step 1: Read the toolbox design and current implementation**

```bash
grep -n "bg-\|text-\|border-\|rounded" docs/design_system/toolbox/code.html | grep -v "surface\|teal\|coral\|white\|on-\|neutral" | head -20
cat app/\(app\)/resources/toolbox/page.tsx
```

- [ ] **Step 2: Fix any non-Lagune colors or layout deviations**

Common issues: resource type badge using wrong color, media type icon color, filter pills not using `bg-teal-50 text-teal-700`.

- [ ] **Step 3: Verify TypeScript and commit (if changed)**

```bash
pnpm tsc --noEmit
git add app/\(app\)/resources/ components/resources/
git commit -m "fix(toolbox): align with Stitch toolbox design spec"
```

---

## Task 7: Audit undesigned pages for Lagune token consistency

**Files:**
- Modify: `app/(app)/admin/page.tsx`
- Modify: `app/(app)/admin/users/page.tsx`
- Modify: `app/(app)/admin/moderation/page.tsx`
- Modify: `app/(app)/admin/taxonomy/page.tsx`
- Modify: `app/(app)/admin/analytics/page.tsx`
- Modify: `app/(app)/resources/documentation/page.tsx`
- Modify: `app/(app)/resources/veille/page.tsx`
- Modify: `app/(app)/resources/tutorials/page.tsx`
- Modify: `app/(app)/resources/external/page.tsx`

For each file, grep for non-Lagune patterns and fix:

- [ ] **Step 1: Find all non-token colors across undesigned pages**

```bash
grep -rn 'text-\[#\|bg-\[#\|border-\[#\|text-blue-\|text-green-\|text-purple-\|bg-blue-\|bg-green-\|bg-purple-\|text-red-\|bg-red-' \
  app/\(app\)/admin/ \
  app/\(app\)/resources/documentation/ \
  app/\(app\)/resources/veille/ \
  app/\(app\)/resources/tutorials/ \
  app/\(app\)/resources/external/ \
  --include="*.tsx" 2>/dev/null
```

For each hit, apply the appropriate Lagune replacement:
- `text-[#181d1c]` → `text-on-surface`
- `text-[#3e4948]` → `text-on-surface-variant`
- `text-[#6e7978]` → `text-outline`
- `bg-[#f6faf9]` → `bg-surface`
- `bg-[#f0f4f3]` → `bg-surface-container-low`
- `border-[#bdc9c7]` → `border-outline-variant`
- `text-red-*` (non-error) → `text-coral-700`
- `bg-red-50` (non-error) → keep (red is appropriate for danger/suspended states)
- `bg-blue-*`, `bg-green-*`, `bg-purple-*` → replace with appropriate Lagune token

- [ ] **Step 2: Apply fixes to each file**

Edit each file that has hits. Only change color classes — do not touch layout, logic, or content.

- [ ] **Step 3: Verify TypeScript**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/\(app\)/admin/ app/\(app\)/resources/
git commit -m "fix(tokens): replace non-Lagune colors across admin and resources pages"
```

---

## Task 8: Final TypeScript + token audit

- [ ] **Step 1: Final grep for any remaining raw hex or non-Lagune colors in app/**

```bash
grep -rn 'text-\[#\|bg-\[#\|border-\[#' app/ --include="*.tsx" | grep -v "node_modules\|.next\|login\|register\|error.tsx" | head -30
```

For any hits outside login/register (which intentionally use hex for the auth card border), apply Lagune token replacements.

- [ ] **Step 2: Run full TypeScript check**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit any remaining fixes**

```bash
git add -A
git commit -m "fix(tokens): final Lagune token audit — remove remaining raw hex colors"
```

---

## Self-Review

**Spec coverage:**
- ✅ Task 1: agenda category colors
- ✅ Task 2: news/PostCard
- ✅ Task 3: dashboard
- ✅ Task 4: directory/UserCard
- ✅ Task 5: chat
- ✅ Task 6: toolbox/resources
- ✅ Task 7: undesigned admin + resource pages
- ✅ Task 8: final sweep

**Scope respected:** No features added. Admin table layouts untouched. Only token/color/spacing fixes.
