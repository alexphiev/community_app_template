# Plan C1 — Playwright Smoke Tests

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up Playwright and verify every app route loads without a 500 error or React crash.

**Architecture:** One auth setup fixture logs in as admin and saves browser storage state. One smoke spec reuses that state and visits all routes, asserting no server errors. Dynamic route IDs (channel, toolbox item, tutorial) are fetched from the DB at test start using the seeded data.

**Tech Stack:** Playwright (`@playwright/test` already installed), PostgreSQL (via `pg` for ID lookup), pnpm

**Prerequisites:** Dev server running on `http://localhost:3000`, seed data loaded (`DATABASE_URL=postgresql://localhost:5432/hub_pro_dev pnpm db:seed`)

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| Create | `playwright.config.ts` | Playwright config pointing at localhost:3000 |
| Create | `tests/e2e/auth.setup.ts` | Login once, save auth state |
| Create | `tests/e2e/smoke.spec.ts` | Visit all routes, assert no crash |

---

## Task 1: Playwright config

**Files:**
- Create: `playwright.config.ts`

- [ ] **Step 1: Create `playwright.config.ts`** at project root:

```ts
import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "setup",
      testMatch: "**/auth.setup.ts",
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "tests/e2e/.auth/admin.json",
      },
      dependencies: ["setup"],
    },
  ],
})
```

- [ ] **Step 2: Create the auth state directory**

```bash
mkdir -p tests/e2e/.auth
echo '{}' > tests/e2e/.auth/admin.json
```

- [ ] **Step 3: Add `.auth` to `.gitignore`**

Open `.gitignore` and add this line:
```
tests/e2e/.auth/
```

- [ ] **Step 4: Add `playwright:test` script to `package.json`**

In `package.json`, add to `scripts`:
```json
"playwright:test": "playwright test"
```

- [ ] **Step 5: Verify Playwright can be found**

```bash
pnpm playwright --version
```

Expected: prints a version number (e.g. `Version 1.60.x`)

- [ ] **Step 6: Commit**

```bash
git add playwright.config.ts .gitignore package.json
git commit -m "chore(playwright): add config and auth state directory"
```

---

## Task 2: Auth setup fixture

**Files:**
- Create: `tests/e2e/auth.setup.ts`

- [ ] **Step 1: Create `tests/e2e/auth.setup.ts`**:

```ts
import { test as setup } from "@playwright/test"
import path from "path"

const authFile = path.join(__dirname, ".auth/admin.json")

setup("authenticate as admin", async ({ page }) => {
  await page.goto("/login")

  await page.fill('input[name="email"]', "alexandre.martin@ij-pdl.fr")
  await page.fill('input[name="password"]', "password123")
  await page.click('button[type="submit"]')

  await page.waitForURL("/dashboard", { timeout: 10_000 })

  await page.context().storageState({ path: authFile })
})
```

- [ ] **Step 2: Run setup in isolation to verify it works**

Make sure the dev server is running (`pnpm dev` in another terminal), then:

```bash
pnpm playwright test --project=setup
```

Expected output:
```
[setup] › auth.setup.ts:5 › authenticate as admin
  ✓ authenticate as admin
```

And `tests/e2e/.auth/admin.json` should now contain cookies/storage data (not just `{}`).

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/auth.setup.ts
git commit -m "test(e2e): add admin auth setup fixture"
```

---

## Task 3: Smoke test spec

**Files:**
- Create: `tests/e2e/smoke.spec.ts`

The spec fetches dynamic IDs (channel, toolbox resource, tutorial resource) from the DB at the start of the test, then builds the route list. It uses `pg` which is already in the project dependencies.

- [ ] **Step 1: Create `tests/e2e/smoke.spec.ts`**:

```ts
import { test, expect } from "@playwright/test"
import { Client } from "pg"

const DB_URL = process.env.DATABASE_URL ?? "postgresql://localhost:5432/hub_pro_dev"

async function getSeedIds() {
  const client = new Client({ connectionString: DB_URL })
  await client.connect()

  const channelRes = await client.query(
    `SELECT id FROM channels WHERE name = 'général' LIMIT 1`
  )
  const toolboxRes = await client.query(
    `SELECT id FROM resources WHERE type = 'toolbox' AND status = 'published' LIMIT 1`
  )
  const tutorialRes = await client.query(
    `SELECT id FROM resources WHERE type = 'tutorial' AND status = 'published' LIMIT 1`
  )

  await client.end()

  return {
    channelId: channelRes.rows[0]?.id as string | undefined,
    toolboxId: toolboxRes.rows[0]?.id as string | undefined,
    tutorialId: tutorialRes.rows[0]?.id as string | undefined,
  }
}

test.describe("Smoke — all routes load without error", () => {
  let ids: Awaited<ReturnType<typeof getSeedIds>>

  test.beforeAll(async () => {
    ids = await getSeedIds()
  })

  async function assertPageLoads(page: Parameters<typeof test>[1] extends (args: { page: infer P }) => unknown ? P : never, url: string) {
    const response = await page.goto(url)
    expect(response?.status() ?? 200, `${url} returned a server error`).toBeLessThan(500)
    const body = await page.textContent("body")
    expect(body, `${url} contains "Application error"`).not.toContain("Application error")
    expect(body, `${url} contains "Internal Server Error"`).not.toContain("Internal Server Error")
  }

  test("/ redirects to /dashboard", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test("/dashboard", async ({ page }) => {
    await assertPageLoads(page, "/dashboard")
  })

  test("/news", async ({ page }) => {
    await assertPageLoads(page, "/news")
  })

  test("/agenda", async ({ page }) => {
    await assertPageLoads(page, "/agenda")
  })

  test("/chat", async ({ page }) => {
    await assertPageLoads(page, "/chat")
  })

  test("/chat/channels/[channelId]", async ({ page }) => {
    test.skip(!ids.channelId, "No seeded channel found")
    await assertPageLoads(page, `/chat/channels/${ids.channelId}`)
  })

  test("/directory", async ({ page }) => {
    await assertPageLoads(page, "/directory")
  })

  test("/resources", async ({ page }) => {
    await assertPageLoads(page, "/resources")
  })

  test("/resources/documentation", async ({ page }) => {
    await assertPageLoads(page, "/resources/documentation")
  })

  test("/resources/toolbox", async ({ page }) => {
    await assertPageLoads(page, "/resources/toolbox")
  })

  test("/resources/toolbox/[id]", async ({ page }) => {
    test.skip(!ids.toolboxId, "No seeded toolbox resource found")
    await assertPageLoads(page, `/resources/toolbox/${ids.toolboxId}`)
  })

  test("/resources/veille", async ({ page }) => {
    await assertPageLoads(page, "/resources/veille")
  })

  test("/resources/tutorials", async ({ page }) => {
    await assertPageLoads(page, "/resources/tutorials")
  })

  test("/resources/tutorials/[id]", async ({ page }) => {
    test.skip(!ids.tutorialId, "No seeded tutorial resource found")
    await assertPageLoads(page, `/resources/tutorials/${ids.tutorialId}`)
  })

  test("/resources/external", async ({ page }) => {
    await assertPageLoads(page, "/resources/external")
  })

  test("/admin", async ({ page }) => {
    await assertPageLoads(page, "/admin")
  })

  test("/admin/users", async ({ page }) => {
    await assertPageLoads(page, "/admin/users")
  })

  test("/admin/moderation", async ({ page }) => {
    await assertPageLoads(page, "/admin/moderation")
  })

  test("/admin/taxonomy", async ({ page }) => {
    await assertPageLoads(page, "/admin/taxonomy")
  })

  test("/admin/analytics", async ({ page }) => {
    await assertPageLoads(page, "/admin/analytics")
  })

  test("/login (unauthenticated)", async ({ browser }) => {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    await assertPageLoads(page, "/login")
    await ctx.close()
  })

  test("/register without token shows invalid link", async ({ browser }) => {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    const response = await page.goto("/register")
    expect(response?.status() ?? 200).toBeLessThan(500)
    const body = await page.textContent("body")
    expect(body).toContain("invalide")
    await ctx.close()
  })
})
```

- [ ] **Step 2: Run the smoke tests**

Make sure the dev server is running, then:

```bash
pnpm playwright test --project=chromium
```

Expected: all tests pass. If any fail, read the error output — it will name the failing URL and the assertion that failed. Fix the underlying page bug before proceeding to Plan C2.

Common failure patterns:
- `Application error` on a page → the page has an unhandled runtime error, check dev server logs
- Status 500 → server action or data fetch is throwing, check dev server logs
- Redirect loop → auth/middleware misconfiguration

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/smoke.spec.ts
git commit -m "test(e2e): add smoke tests for all app routes"
```
