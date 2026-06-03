import path from "path"
import fs from "fs"
import { extractFromWxr } from "./extract"
import { loadPosts } from "./load"

async function main() {
  const exportPath = path.resolve(process.cwd(), "etl/data/export.xml")
  console.log(`[ETL] Starting migration — source: ${exportPath}`)

  const posts = extractFromWxr(exportPath)
  console.log(`[ETL] Extracted ${posts.length} posts from WXR`)

  if (posts.length === 0) {
    console.log("[ETL] No posts to migrate. Ensure etl/data/export.xml exists.")
    const report = { migrated: 0, skipped: 0, failed: 0, errors: [], exportFile: exportPath, runAt: new Date().toISOString() }
    fs.writeFileSync(path.resolve(process.cwd(), "etl/migration-report.json"), JSON.stringify(report, null, 2))
    return
  }

  const result = await loadPosts(posts)

  const report = { ...result, exportFile: exportPath, runAt: new Date().toISOString() }
  const reportPath = path.resolve(process.cwd(), "etl/migration-report.json")
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

  console.log(`[ETL] Migration complete:`)
  console.log(`  ✓ Migrated: ${result.migrated}`)
  console.log(`  → Skipped:  ${result.skipped}`)
  console.log(`  ✗ Failed:   ${result.failed}`)
  if (result.errors.length > 0) {
    console.log("[ETL] Errors:")
    result.errors.forEach((e) => console.log(`  - [${e.wpPostId}] ${e.error}`))
  }
  console.log(`[ETL] Report written to ${reportPath}`)
}

main().catch((err) => {
  console.error("[ETL] Fatal error:", err)
  process.exit(1)
})
