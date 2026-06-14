# Plan C — Smoke Tests + Design Compliance

**Date:** 2026-06-05
**Scope:** Two sequential sub-plans: C1 (Playwright smoke tests) then C2 (design compliance)
**Prerequisite:** Plan B complete, seed data loaded (`pnpm db:seed`)

---

## Sub-plan C1: Playwright Smoke Tests

### Goal

Verify every route in the app loads without a 500 error or React crash. Catch blocking bugs before investing time in design fixes.

### Setup

Create a minimal Playwright config at the project root. No existing `playwright.config.ts`.

**Target:** `http://localhost:3000` (dev server must be running)
**Auth strategy:** `auth.setup.ts` logs in as admin once, saves browser storage state to `tests/e2e/.auth/admin.json`. All smoke tests reuse that state — no repeated logins.

### Routes to test

All routes visited as admin (`alexandre.martin@ij-pdl.fr` / `password123`):

| Route | Method |
|-------|--------|
| `/` | Should redirect to `/dashboard` |
| `/dashboard` | Direct visit |
| `/news` | Direct visit |
| `/agenda` | Direct visit |
| `/chat` | Direct visit |
| `/chat/channels/[channelId]` | Visit first channel from DB (seeded: `#général`) |
| `/directory` | Direct visit |
| `/resources` | Direct visit |
| `/resources/documentation` | Direct visit |
| `/resources/toolbox` | Direct visit |
| `/resources/toolbox/[id]` | Visit first toolbox item from DB |
| `/resources/veille` | Direct visit |
| `/resources/tutorials` | Direct visit |
| `/resources/tutorials/[id]` | Visit first tutorial from DB |
| `/resources/external` | Direct visit |
| `/admin` | Direct visit |
| `/admin/users` | Direct visit |
| `/admin/moderation` | Direct visit |
| `/admin/taxonomy` | Direct visit |
| `/admin/analytics` | Direct visit |
| `/login` | Visit unauthenticated (separate context) |
| `/register` | Visit without token — should show InvalidLink, not crash |

**Skip:** `/share/[token]` — requires a live share token, not seeded.

### Pass criteria per route

- HTTP response status < 500
- Page does not contain "Application error" text
- Page does not contain "Internal Server Error" text
- Page body is not empty

### Files

- `playwright.config.ts` — root config
- `tests/e2e/auth.setup.ts` — login once, save state
- `tests/e2e/smoke.spec.ts` — all route checks, reuses auth state

### Run command

```bash
pnpm playwright test
```

---

## Sub-plan C2: Design Compliance

### Goal

Make the live app visually match the approved Stitch design mockups for the 6 designed screens, then ensure all other pages follow the same Lagune design principles for a globally harmonious app.

### Design file locations

Each folder under `docs/design_system/` contains:
- `screen.png` — reference screenshot
- `code.html` — annotated HTML mockup with exact class names and tokens

| Folder | Route |
|--------|-------|
| `dashboard/` | `/dashboard` |
| `news_feed/` | `/news` |
| `agenda/` | `/agenda` |
| `chat/` | `/chat` |
| `contacts/` | `/directory` |
| `toolbox/` | `/resources/toolbox` |

### Lagune design principles (for undesigned pages)

Derived from the 6 designed screens:

- **Colors:** teal-700 (primary), coral-700 (accent/danger), on-surface, on-surface-variant, surface, surface-container-low, outline-variant — no raw hex values
- **Cards:** `bg-white rounded-xl border border-neutral-200 shadow-sm` (or `border-outline-variant`)
- **Typography:** Bricolage Grotesque for headings, Inter for body; sizes from design scale (49px hero, 31px h2, 24px h3, 16px body, 14px sm, 12px xs, 11px 2xs)
- **Buttons:** `h-10 rounded-[6px] bg-teal-700 text-white` (primary), `border border-outline-variant` (secondary)
- **Active nav:** `border-l-[3px] border-coral-700 bg-surface-container-low text-teal-700`
- **Spacing:** consistent `p-6` cards, `gap-6` grids, `mb-6`/`mb-10` sections
- **Empty states:** centered, `text-on-surface-variant`, descriptive text

### Phase 1: Six designed screens

For each screen:
1. Read `screen.png` and `code.html`
2. Identify discrepancies between the design and the current page implementation
3. Fix only discrepancies — do not add features, do not redesign

**What counts as a discrepancy:**
- Wrong color token (e.g., using `#0f766e` instead of `teal-700`)
- Wrong spacing (e.g., `p-4` where design shows `p-6`)
- Missing visual element from the design (e.g., coral accent line on hover)
- Wrong typography size/weight
- Wrong layout structure (e.g., missing sidebar widget)

**What is NOT a discrepancy:**
- Missing data (empty feed, no events) — content problem, not design
- Missing features (e.g., no "Créer un post" form on news page) — feature problem
- Admin pages with no design mockup

### Phase 2: Undesigned pages

Audit these pages against the Lagune principles above:
- `/admin` and all sub-pages
- `/resources/documentation`, `/resources/veille`, `/resources/tutorials`, `/resources/external`
- `/login`, `/register`

Fix: wrong hex values, non-standard spacing, missing card borders, wrong button styles. Match the visual language of the 6 designed screens.

### Scope boundary

- **In scope:** color tokens, spacing, typography, card/border styles, hover states, empty state UI
- **Out of scope:** new features, layout restructuring, accessibility beyond what's visible, i18n, animations
- **Admin pages:** align tokens and colors only — do not redesign the table/form layouts

---

## Success Criteria

### C1
- [ ] All routes return < 500 status
- [ ] No "Application error" on any page
- [ ] `pnpm playwright test` exits green

### C2
- [ ] Each of the 6 designed screens visually matches its `screen.png`
- [ ] All undesigned pages use only Lagune tokens (no raw hex, no off-brand colors)
- [ ] `pnpm tsc --noEmit` passes after all changes
