# Module 1 — Resources

## What it does

The Resources module is the document and knowledge library of the platform. It replaces scattered WordPress pages and shared drives with a structured, searchable repository split into four sub-sections:

- **Documentation** — official IJ PDL reference documents (PDFs, chartes, guides). Files are auto-versioned: uploading a new version of the same document bumps the version number while retaining the old file in S3, so the DB always points to the latest version without losing history.
- **Boîte à Outils (Toolbox)** — pedagogical resources (video, audio, PDF) that practitioners use directly with young people. Each item has a Q&A/comments thread where staff can ask questions and share tips.
- **Veille partagée** — shared intelligence feed: articles, links, and reports contributed by network members. Designed for fast contribution with tag-based filtering.
- **Tutoriels** — how-to guides for using the Hub Pro platform itself. Authored exclusively by Admin/Salarié; rich-text body stored as HTML.

Cross-cutting features across all sections:
- **Role-gated publishing** — Admin/Salarié publish immediately; Pro Réseau contributions enter a pending approval queue visible in the Admin panel.
- **Tag filtering** — all resources can be tagged with taxonomy terms managed in the Admin panel.
- **External share links** — staff can generate a password-protected, expiring link to share a document with someone outside the network (a guest), without requiring them to have an account.
- **S3 storage** — all file uploads go to an S3-compatible object store with presigned download URLs.

---

## MVP gaps & future improvements

### Search

- **Full-text search** — the MVP filters by type and tags via Drizzle queries but has no full-text search. PostgreSQL `tsvector` / `pg_trgm` should be added on `resources.title + description + body`, with a weighted ranking (title > description > body). Alternatively a dedicated search index (Meilisearch, Typesense) would give instant results with typo tolerance.
- **Search within files** — PDF text extraction (e.g. `pdf-parse`) to index document contents, not just metadata.
- **Faceted search** — combine text query + type + tag + date range filters in a single URL-driven search experience.

### File management

- **Drag-and-drop upload with progress** — the MVP has no upload UI; the `FileUpload` component is a stub. A proper upload needs a multipart POST to a Route Handler, progress indication, file type validation, and virus scanning.
- **Virus scanning** — uploaded files should pass through ClamAV (or an equivalent API) before being stored and made available for download.
- **File preview** — PDF preview in-browser (PDF.js), video player (native `<video>`), audio player (native `<audio>`) instead of download-only.
- **Storage quota** — per-user or per-organisation upload limits to prevent abuse.
- **Auto-versioning UI** — the version history table (which file version is current, who uploaded it, when) should be surfaced in the documentation detail page, with the ability to roll back to a previous version.

### Content quality

- **Rich-text editor** — tutorials currently store raw HTML. Replace with a proper editor (Tiptap, Lexical) with headings, bold/italic, ordered/unordered lists, links, and image embeds, outputting clean sanitized HTML.
- **Meta descriptions** — auto-generate from description field if missing, for screen readers and future SEO.
- **Duplicate detection** — warn when uploading a file with the same name/hash as an existing document.

### Access and analytics

- **View count tracking** — the `viewCount` column exists on `resources` but is never incremented. A lightweight server action should increment it on each detail page visit (debounced, not per-crawl).
- **Most-consulted resources** — surfaced in the admin analytics dashboard.
- **Download tracking** — log which user downloaded which file and when, for usage reporting required by FEDER.
- **Bookmarks / favourites** — users should be able to bookmark resources for quick personal access.

### External share links

- **Link management dashboard** — currently links are created but there's no way to list, revoke, or extend them. Staff need a UI to see all active share links and deactivate them.
- **Access log** — record every time a share link is accessed (IP, timestamp, whether password was correct) for audit purposes.
- **Branded landing page** — the guest share page should show the Info Jeunes branding and clearly communicate that this is a limited preview, not a full account.
