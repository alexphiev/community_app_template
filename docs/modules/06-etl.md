# Module 6 — ETL Migration (WordPress → Hub Pro)

## What it does

The ETL script is a standalone TypeScript CLI (`pnpm etl:run`) that migrates existing WordPress content into the Hub Pro database. It has three stages:

### Extract

Reads a WordPress XML export file (`.wxr` format) placed at `etl/data/export.xml`. Uses `fast-xml-parser` to parse the XML and extract all posts and pages as structured objects with: post ID, title, HTML content, excerpt, publication status, post type, categories, tags, and publication date.

If the export file is not found, the script exits cleanly with a zero-migration report rather than crashing.

### Transform

For each extracted post:

- **HTML sanitisation** — strips dangerous tags (script, style, iframe) while preserving formatting (p, h2-h4, ul, ol, li, a, strong, em, img, blockquote). Rejects `javascript:` and `file:` URL schemes in links and images.
- **Shortcode removal** — strips WordPress shortcodes (`[caption]`, `[gallery]`, `[embed]`, etc.) which are meaningless outside WordPress.
- **Type mapping** — `post` → `veille`, `page` → `documentation`.
- **Description extraction** — strips all HTML from the excerpt to produce a plain-text description.
- **Slug generation** — normalises French text (removes accents, lowercases, replaces spaces with hyphens) for tag slugs.

### Load

For each transformed post:

- **Upsert resources** — inserts into the `resources` table using `INSERT ... ON CONFLICT (wp_post_id) DO NOTHING`. Running the script twice will never create duplicates.
- **Tag linking** — upserts tags (by slug) and creates `resource_tags` associations. Tag linking failures are non-fatal; the resource is still migrated.
- **Migration report** — writes `etl/migration-report.json` with counts of migrated, skipped, and failed items, plus an error array listing which `wp_post_id` values failed and why.

The script requires `ETL_SYSTEM_AUTHOR_ID` in `.env.local` pointing to a valid user ID (e.g. the seed admin), since the `resources.authorId` FK is non-nullable.

---

## MVP gaps & future improvements

### Extract completeness

- **Media attachments** — the current extractor reads post content but ignores WordPress `attachment` post type entries. A full migration should also extract media metadata and attempt to re-host the files in S3, updating `<img src>` URLs in the HTML body.
- **Custom post types** — many WordPress installations use custom post types (ACF-powered structured content). These would need a custom mapping rule per type.
- **Multi-site support** — Info Jeunes may have multiple WordPress instances. The ETL currently handles one export file; it should accept a directory of `.wxr` files or a glob pattern.
- **Draft handling** — posts with `status = draft` are currently skipped. There should be an option to import drafts as `status = draft` in Hub Pro for review before publishing.
- **Author mapping** — all migrated posts are assigned to a single system author. A production migration should map WordPress user logins to Hub Pro user IDs, preserving authorship.

### Transform quality

- **Broken internal link rewriting** — WordPress posts often contain absolute links to `site.example.com/page-slug`. These become dead links after migration. The transform step should detect internal links and either rewrite them to the new Hub Pro URL or strip them.
- **Image URL resolution** — `<img src="https://old-wp-site.com/wp-content/uploads/...">` links will break if the old WordPress site goes offline. The transform should download images and re-upload to S3, rewriting the src attribute.
- **Table support** — WordPress posts sometimes contain HTML `<table>` elements which are not in the current allowlist. Tables should be preserved (though styled differently) rather than stripped.
- **Embedded video handling** — `[embed]https://youtube.com/...[/embed]` shortcodes are stripped. They could instead be converted to a `<a href>` fallback link.

### Load reliability

- **Transaction wrapping** — each post is inserted in isolation. A partial failure leaves some posts migrated and others not. The load step should wrap each post's insert + tag links in a DB transaction.
- **Dry-run mode** — a `--dry-run` flag that runs all extract/transform steps and reports what would be migrated without writing to the DB. Essential for validating the mapping before running on production.
- **Resume capability** — if the script is interrupted mid-run (e.g. network timeout), it should be safe to re-run. The `ON CONFLICT DO NOTHING` on `wp_post_id` makes this mostly safe, but the migration report should also track the last successfully processed post ID.
- **Progress reporting** — for 500+ posts, the script currently shows nothing until completion. A real-time progress counter (e.g. "Processing 45/523...") would give confidence during long runs.

### Post-migration

- **Validation report** — after migration, generate a side-by-side comparison of key counts (WordPress total posts vs Hub Pro migrated resources) and flag obvious discrepancies.
- **Broken link audit** — scan all migrated resource bodies for 404 links (both internal and external) and output a report for manual review.
- **Category reconciliation** — compare the WordPress tag/category list with the Hub Pro taxonomy and flag WordPress terms that didn't map cleanly to any existing tag.
- **Rollback script** — a `pnpm etl:rollback` command that deletes all resources where `wpPostId IS NOT NULL`, allowing a clean re-run after fixing transform logic.
