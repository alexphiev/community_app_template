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

  async function assertPageLoads(
    page: import("@playwright/test").Page,
    url: string
  ) {
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
