# Phase 6 — ETL Migration (WordPress → Hub Pro) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Write a standalone ETL script that extracts ~500 WordPress articles, sanitizes HTML content, maps categories/tags to the new taxonomy, downloads media to S3, and inserts records into the Hub Pro PostgreSQL schema.

**Architecture:** Single Node.js script (TypeScript, run via `tsx`) with three phases: Extract (WordPress XML export or WP REST API), Transform (sanitize HTML, map fields, resolve media), Load (Drizzle inserts). Idempotent: re-running skips already-migrated records.

**Tech Stack:** TypeScript, tsx, Drizzle ORM, sanitize-html, axios (media download), AWS SDK v3 (S3 upload)

**Prerequisite:** Phase 1 DB schema stable (resources tables exist).

---

> **Status:** Stub — expand into full task breakdown before executing.

## ETL Steps

### Extract
- Source: WordPress XML export file (`.wxr`) placed at `etl/data/export.xml`
- Parse with `fast-xml-parser` or native XML parser
- Extract: posts, categories, tags, attachments, authors

### Transform
- Sanitize HTML body with `sanitize-html` (whitelist: p, h2-h4, ul, ol, li, a, strong, em, img, blockquote)
- Map WP categories → Hub Pro `tags` (create missing tags automatically)
- Map WP post type `post` → Hub Pro resource type `veille`
- Map WP post type `page` → Hub Pro resource type `documentation` (manual review flag)
- Strip WP-specific shortcodes (`[caption]`, `[gallery]`, etc.)
- Resolve relative media URLs → download binary → upload to S3 → replace src in HTML

### Load
- Insert `tags` first (upsert by slug)
- Insert `resources` with status `published` and a migration-created `system` author
- Insert `resource_tags` join records
- Write a `etl/migration-report.json` with counts: migrated, skipped, failed items

### Idempotency
- Add `wp_post_id` column to `resources` table (nullable text, unique)
- On each run: `INSERT ... ON CONFLICT (wp_post_id) DO NOTHING`

## File Map

```
etl/
  migrate.ts                     — main entrypoint (run: pnpm etl:run)
  extract.ts                     — parse WXR XML
  transform.ts                   — sanitize + map fields
  load.ts                        — Drizzle inserts
  media.ts                       — download + S3 upload helpers
  data/
    export.xml                   — WordPress export (gitignored)
  migration-report.json          — output (gitignored)
src/db/schema.ts                 — add wp_post_id column to resources
tests/
  unit/etl/transform.test.ts     — test HTML sanitization + field mapping
```

## Package.json additions

```json
"etl:run": "tsx etl/migrate.ts"
```

## Key risk: media download
WordPress media URLs may be behind auth or no longer exist. The transform step should catch HTTP errors per-item, log them, and continue rather than failing the whole batch.
