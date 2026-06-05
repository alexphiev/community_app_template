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
