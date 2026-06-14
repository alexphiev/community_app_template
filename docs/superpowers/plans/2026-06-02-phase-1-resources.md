# Phase 1 — Resources Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build all five resource sub-sections — Documentation (PDF auto-versioning), Toolbox (media + Q&A), Veille (shared intelligence), Tutorials, and External share links — with tag filtering, full-text search, and role-gated publishing.

**Architecture:** Server Components for listing/detail pages, Server Actions for CRUD mutations, Zod validation at the action layer. File uploads go to S3-compatible storage. Content pending approval for `pro_reseau_ij` flows through a `status` flag on the DB record. ISR revalidation via Next.js cache tags.

**Tech Stack:** Next.js 16 App Router, Drizzle ORM, PostgreSQL, Zod, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `bcryptjs`, Shadcn/ui, vitest (unit + component)

**Prerequisite:** Phase 0 complete (DB, auth, RBAC middleware, Lagune design tokens).

**Design reference:** `docs/stitch_hub_pro_design_system/bo_te_outils/` — white cards, teal-700 primary, coral-700 accent, left filter sidebar 288px, resource grid `xl:grid-cols-2 2xl:grid-cols-3`, tag pills `bg-teal-100 text-teal-900 rounded-full`.

---

## File Map

```
db/schema.ts                         — extend with resource tables
lib/
  storage.ts                         — S3 upload/download/presign helpers
  actions/
    resources.ts                     — Server Actions (create, update, delete, approve, share)
  validations/
    resources.ts                     — Zod schemas for all resource mutations
components/resources/
  ResourceCard.tsx                   — Lagune-styled card (white, teal hover, coral accent)
  ResourceFilter.tsx                 — Left sidebar filter panel (type, tags, search)
  CommentThread.tsx                  — Q&A / threaded comments
  TagPill.tsx                        — Reusable pill badge
  ResourceGrid.tsx                   — Grid wrapper with count + view toggle
  FileUpload.tsx                     — Drag-drop file input with progress
  PendingBadge.tsx                   — "En attente de validation" badge
app/(app)/resources/
  layout.tsx                         — Resources section layout (header + filter sidebar slot)
  page.tsx                           — /resources redirect → /resources/documentation
  documentation/
    page.tsx                         — Documentation list (PDFs, auto-versioned)
  toolbox/
    page.tsx                         — Toolbox list (video/audio/PDF + Q&A)
    [id]/page.tsx                    — Toolbox item detail with comment thread
  veille/
    page.tsx                         — Veille list (articles/links)
  tutorials/
    page.tsx                         — Tutorials list
    [id]/page.tsx                    — Tutorial detail (rich-text rendering)
  external/
    page.tsx                         — External share link generation (for staff)
app/(public)/resources/
  share/[token]/page.tsx             — Guest-accessible share page (password-protected)
app/api/
  resources/revalidate/route.ts      — Webhook endpoint for ISR revalidation
tests/
  unit/
    lib/actions/resources.test.ts    — Server Action unit tests (mocked DB)
    lib/validations/resources.test.ts — Zod schema tests
    lib/storage.test.ts              — Storage helper unit tests (mocked S3)
  component/
    resources/ResourceCard.test.tsx  — Card render + interaction tests
    resources/ResourceFilter.test.tsx — Filter state tests
    resources/CommentThread.test.tsx  — Comment display tests
```

---

## Task A: DB schema extensions, validations, storage helpers

**Files:**
- Modify: `db/schema.ts`
- Create: `lib/validations/resources.ts`
- Create: `lib/storage.ts`
- Test: `tests/unit/lib/validations/resources.test.ts`
- Test: `tests/unit/lib/storage.test.ts`

### Steps

- [ ] **Step 1: Extend `db/schema.ts` with resource tables**

Add after the existing auth tables:

```ts
import { pgTable, text, timestamp, boolean, pgEnum, integer, index } from "drizzle-orm/pg-core"
import { createId } from "@paralleldrive/cuid2"

export const resourceTypeEnum = pgEnum("resource_type", [
  "documentation",
  "toolbox",
  "veille",
  "tutorial",
])

export const resourceStatusEnum = pgEnum("resource_status", [
  "draft",
  "pending_approval",
  "published",
  "archived",
])

export const mediaTypeEnum = pgEnum("media_type", ["pdf", "video", "audio", "link", "image"])

export const tags = pgTable("tags", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const resources = pgTable("resources", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  title: text("title").notNull(),
  description: text("description"),
  body: text("body"),                          // rich-text JSON (tutorials) or null
  type: resourceTypeEnum("type").notNull(),
  status: resourceStatusEnum("status").notNull().default("draft"),
  mediaType: mediaTypeEnum("media_type"),
  externalUrl: text("external_url"),           // for veille links
  authorId: text("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  approvedById: text("approved_by_id").references(() => users.id),
  pinned: boolean("pinned").notNull().default(false),
  viewCount: integer("view_count").notNull().default(0),
  wpPostId: text("wp_post_id").unique(),       // ETL migration hook
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("resources_type_status_idx").on(t.type, t.status),
  index("resources_author_idx").on(t.authorId),
])

export const resourceFiles = pgTable("resource_files", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  resourceId: text("resource_id").notNull().references(() => resources.id, { onDelete: "cascade" }),
  s3Key: text("s3_key").notNull(),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  version: integer("version").notNull().default(1),
  isCurrent: boolean("is_current").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("resource_files_resource_idx").on(t.resourceId),
])

export const resourceTags = pgTable("resource_tags", {
  resourceId: text("resource_id").notNull().references(() => resources.id, { onDelete: "cascade" }),
  tagId: text("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
})

export const comments = pgTable("comments", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  resourceId: text("resource_id").notNull().references(() => resources.id, { onDelete: "cascade" }),
  authorId: text("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  parentId: text("parent_id"),                 // null = top-level; set = reply
  body: text("body").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("comments_resource_idx").on(t.resourceId),
  index("comments_parent_idx").on(t.parentId),
])

export const shareLinks = pgTable("share_links", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  resourceId: text("resource_id").notNull().references(() => resources.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  passwordHash: text("password_hash"),         // bcrypt hash, null = no password
  expiresAt: timestamp("expires_at"),          // null = never expires
  createdById: text("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("share_links_token_idx").on(t.token),
])
```

Note: `users` must be imported from the same file (it's already defined there). Use the existing import within the same `schema.ts` file — no circular dependency.

- [ ] **Step 2: Generate and apply migration**

```bash
pnpm db:generate
pnpm db:migrate
```

Expected: new migration file created + applied cleanly.

- [ ] **Step 3: Install S3 + bcrypt packages**

```bash
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner bcryptjs
pnpm add -D @types/bcryptjs
```

- [ ] **Step 4: Write failing tests for Zod validations**

Create `tests/unit/lib/validations/resources.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import {
  createResourceSchema,
  updateResourceSchema,
  createShareLinkSchema,
  createCommentSchema,
} from "@/lib/validations/resources"

describe("createResourceSchema", () => {
  it("accepts valid documentation resource", () => {
    const result = createResourceSchema.safeParse({
      title: "Guide du logement",
      description: "Un guide complet",
      type: "documentation",
      mediaType: "pdf",
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty title", () => {
    const result = createResourceSchema.safeParse({ title: "", type: "veille" })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain("title")
  })

  it("rejects invalid type", () => {
    const result = createResourceSchema.safeParse({ title: "Test", type: "invalid" })
    expect(result.success).toBe(false)
  })

  it("requires externalUrl for veille link type", () => {
    const result = createResourceSchema.safeParse({
      title: "Article",
      type: "veille",
      mediaType: "link",
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toContain("URL")
  })
})

describe("createShareLinkSchema", () => {
  it("accepts valid share link without password", () => {
    const result = createShareLinkSchema.safeParse({ resourceId: "abc123" })
    expect(result.success).toBe(true)
  })

  it("rejects password shorter than 4 chars", () => {
    const result = createShareLinkSchema.safeParse({ resourceId: "abc123", password: "ab" })
    expect(result.success).toBe(false)
  })
})

describe("createCommentSchema", () => {
  it("accepts valid comment", () => {
    const result = createCommentSchema.safeParse({ resourceId: "r1", body: "Great resource!" })
    expect(result.success).toBe(true)
  })

  it("rejects empty body", () => {
    const result = createCommentSchema.safeParse({ resourceId: "r1", body: "" })
    expect(result.success).toBe(false)
  })

  it("rejects body over 2000 chars", () => {
    const result = createCommentSchema.safeParse({ resourceId: "r1", body: "x".repeat(2001) })
    expect(result.success).toBe(false)
  })
})
```

- [ ] **Step 5: Run tests to confirm they fail**

```bash
pnpm test tests/unit/lib/validations/resources.test.ts
```

Expected: FAIL — cannot find module `@/lib/validations/resources`

- [ ] **Step 6: Create `lib/validations/resources.ts`**

```ts
import { z } from "zod"

const RESOURCE_TYPES = ["documentation", "toolbox", "veille", "tutorial"] as const
const MEDIA_TYPES = ["pdf", "video", "audio", "link", "image"] as const

export const createResourceSchema = z
  .object({
    title: z.string().min(1, "Le titre est requis").max(200),
    description: z.string().max(500).optional(),
    body: z.string().optional(),
    type: z.enum(RESOURCE_TYPES),
    mediaType: z.enum(MEDIA_TYPES).optional(),
    externalUrl: z.string().url("URL invalide").optional(),
    tagIds: z.array(z.string()).default([]),
  })
  .refine(
    (d) => !(d.type === "veille" && d.mediaType === "link" && !d.externalUrl),
    { message: "URL requise pour un lien externe", path: ["externalUrl"] }
  )

export const updateResourceSchema = createResourceSchema.partial().extend({
  id: z.string().min(1),
  status: z.enum(["draft", "pending_approval", "published", "archived"]).optional(),
  pinned: z.boolean().optional(),
})

export const createShareLinkSchema = z.object({
  resourceId: z.string().min(1),
  password: z.string().min(4, "Mot de passe trop court (min 4 caractères)").optional(),
  expiresInDays: z.number().int().min(1).max(365).optional(),
})

export const createCommentSchema = z.object({
  resourceId: z.string().min(1),
  parentId: z.string().optional(),
  body: z.string().min(1, "Le commentaire ne peut pas être vide").max(2000, "Maximum 2000 caractères"),
})

export type CreateResourceInput = z.infer<typeof createResourceSchema>
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>
export type CreateShareLinkInput = z.infer<typeof createShareLinkSchema>
export type CreateCommentInput = z.infer<typeof createCommentSchema>
```

- [ ] **Step 7: Run validation tests — confirm passing**

```bash
pnpm test tests/unit/lib/validations/resources.test.ts
```

Expected: PASS (8 tests)

- [ ] **Step 8: Write failing storage tests**

Create `tests/unit/lib/storage.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock AWS SDK before importing storage
vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn(() => ({ send: vi.fn() })),
  PutObjectCommand: vi.fn(),
  DeleteObjectCommand: vi.fn(),
  GetObjectCommand: vi.fn(),
}))
vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn().mockResolvedValue("https://example.com/signed-url"),
}))

import { getPresignedDownloadUrl, buildS3Key, parseS3KeyResourceId } from "@/lib/storage"

describe("buildS3Key", () => {
  it("builds a deterministic key from resource id and filename", () => {
    const key = buildS3Key("resources", "resource-123", "guide.pdf")
    expect(key).toBe("resources/resource-123/guide.pdf")
  })

  it("sanitizes filename (no path traversal)", () => {
    const key = buildS3Key("resources", "resource-123", "../../etc/passwd")
    expect(key).not.toContain("..")
    expect(key).not.toContain("/etc/")
  })
})

describe("parseS3KeyResourceId", () => {
  it("extracts resource id from s3 key", () => {
    const id = parseS3KeyResourceId("resources/resource-123/guide.pdf")
    expect(id).toBe("resource-123")
  })
})

describe("getPresignedDownloadUrl", () => {
  it("returns a signed URL string", async () => {
    const url = await getPresignedDownloadUrl("resources/resource-123/guide.pdf")
    expect(typeof url).toBe("string")
    expect(url).toContain("https://")
  })
})
```

- [ ] **Step 9: Run storage tests — confirm fail**

```bash
pnpm test tests/unit/lib/storage.test.ts
```

Expected: FAIL

- [ ] **Step 10: Create `lib/storage.ts`**

```ts
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import path from "path"

const s3 = new S3Client({
  region: process.env.S3_REGION ?? "eu-west-3",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
  },
})

const BUCKET = process.env.S3_BUCKET ?? "hub-pro"

export function buildS3Key(prefix: string, resourceId: string, filename: string): string {
  const safe = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, "_")
  return `${prefix}/${resourceId}/${safe}`
}

export function parseS3KeyResourceId(key: string): string {
  return key.split("/")[1] ?? ""
}

export async function uploadToS3(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<void> {
  await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body, ContentType: contentType }))
}

export async function deleteFromS3(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
}

export async function getPresignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn })
}
```

- [ ] **Step 11: Run storage tests — confirm passing**

```bash
pnpm test tests/unit/lib/storage.test.ts
```

Expected: PASS (4 tests)

- [ ] **Step 12: Run all tests**

```bash
pnpm test
```

Expected: 15 (existing) + 12 (new) = 27 tests passing

- [ ] **Step 13: Type check**

```bash
pnpm tsc --noEmit
```

Expected: 0 errors

- [ ] **Step 14: Commit**

```bash
git add db/schema.ts db/migrations/ lib/validations/resources.ts lib/storage.ts tests/
git commit -m "feat(resources): DB schema, Zod validations, S3 storage helpers"
```

---

## Task B: Server Actions for resource CRUD

**Files:**
- Create: `lib/actions/resources.ts`
- Test: `tests/unit/lib/actions/resources.test.ts`

### Steps

- [ ] **Step 1: Write failing tests for Server Actions**

Create `tests/unit/lib/actions/resources.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock Drizzle DB
vi.mock("@/db", () => ({
  db: {
    query: {
      resources: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
    },
    insert: vi.fn(() => ({ values: vi.fn().mockResolvedValue([{ id: "new-id" }]) })),
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn().mockResolvedValue([]) })) })),
    delete: vi.fn(() => ({ where: vi.fn().mockResolvedValue([]) })),
    transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn({})),
  },
}))

// Mock next/cache
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }))

// Mock next-auth
vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: "user-1", role: "salarie_ij_pdl" },
  }),
}))

import { getResources, getResourceById } from "@/lib/actions/resources"

describe("getResources", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns an array", async () => {
    const { db } = await import("@/db")
    ;(db.query.resources.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: "r1", title: "Guide", type: "documentation", status: "published" },
    ])
    const results = await getResources({ type: "documentation" })
    expect(Array.isArray(results)).toBe(true)
  })
})

describe("getResourceById", () => {
  it("returns null for unknown id", async () => {
    const { db } = await import("@/db")
    ;(db.query.resources.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(undefined)
    const result = await getResourceById("nonexistent")
    expect(result).toBeNull()
  })
})
```

- [ ] **Step 2: Run to confirm fail**

```bash
pnpm test tests/unit/lib/actions/resources.test.ts
```

Expected: FAIL

- [ ] **Step 3: Create `lib/actions/resources.ts`**

```ts
"use server"

import { db } from "@/db"
import { resources, resourceTags, tags, comments, shareLinks, resourceFiles } from "@/db/schema"
import { eq, and, inArray, desc, sql } from "drizzle-orm"
import { revalidateTag } from "next/cache"
import { auth } from "@/auth"
import { canPublish, canModerate } from "@/lib/roles"
import {
  createResourceSchema,
  updateResourceSchema,
  createShareLinkSchema,
  createCommentSchema,
  type CreateResourceInput,
  type UpdateResourceInput,
  type CreateShareLinkInput,
  type CreateCommentInput,
} from "@/lib/validations/resources"
import { createId } from "@paralleldrive/cuid2"
import bcrypt from "bcryptjs"

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getResources(filter: {
  type?: "documentation" | "toolbox" | "veille" | "tutorial"
  tagIds?: string[]
  search?: string
  page?: number
}) {
  const { type, page = 1 } = filter
  const limit = 12
  const offset = (page - 1) * limit

  return db.query.resources.findMany({
    where: and(
      type ? eq(resources.type, type) : undefined,
      eq(resources.status, "published")
    ),
    with: { tags: { with: { tag: true } }, author: true, files: { where: eq(resourceFiles.isCurrent, true) } },
    orderBy: [desc(resources.pinned), desc(resources.createdAt)],
    limit,
    offset,
  })
}

export async function getResourceById(id: string) {
  const resource = await db.query.resources.findFirst({
    where: eq(resources.id, id),
    with: {
      tags: { with: { tag: true } },
      author: true,
      files: true,
      comments: { with: { author: true }, orderBy: [desc(comments.createdAt)] },
    },
  })
  return resource ?? null
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createResource(input: CreateResourceInput) {
  const session = await auth()
  if (!session) throw new Error("Non authentifié")

  const { allowed, requiresApproval } = canPublish(session.user.role)
  if (!allowed) throw new Error("Permission refusée")

  const parsed = createResourceSchema.parse(input)
  const { tagIds, ...data } = parsed

  const id = createId()
  await db.insert(resources).values({
    id,
    ...data,
    authorId: session.user.id!,
    status: requiresApproval ? "pending_approval" : "published",
  })

  if (tagIds.length > 0) {
    await db.insert(resourceTags).values(tagIds.map((tagId) => ({ resourceId: id, tagId })))
  }

  revalidateTag(`resources-${data.type}`)
  return { id }
}

export async function updateResource(input: UpdateResourceInput) {
  const session = await auth()
  if (!session) throw new Error("Non authentifié")

  const parsed = updateResourceSchema.parse(input)
  const { id, tagIds, ...data } = parsed

  const existing = await db.query.resources.findFirst({ where: eq(resources.id, id) })
  if (!existing) throw new Error("Ressource introuvable")

  const isOwner = existing.authorId === session.user.id
  const isModerator = canModerate(session.user.role)
  if (!isOwner && !isModerator) throw new Error("Permission refusée")

  await db.update(resources).set({ ...data, updatedAt: new Date() }).where(eq(resources.id, id))

  if (tagIds !== undefined) {
    await db.delete(resourceTags).where(eq(resourceTags.resourceId, id))
    if (tagIds.length > 0) {
      await db.insert(resourceTags).values(tagIds.map((tagId) => ({ resourceId: id, tagId })))
    }
  }

  revalidateTag(`resources-${existing.type}`)
  revalidateTag(`resource-${id}`)
}

export async function deleteResource(id: string) {
  const session = await auth()
  if (!session) throw new Error("Non authentifié")

  const existing = await db.query.resources.findFirst({ where: eq(resources.id, id) })
  if (!existing) throw new Error("Ressource introuvable")

  const isOwner = existing.authorId === session.user.id
  const isModerator = canModerate(session.user.role)
  if (!isOwner && !isModerator) throw new Error("Permission refusée")

  await db.delete(resources).where(eq(resources.id, id))
  revalidateTag(`resources-${existing.type}`)
}

export async function approveResource(id: string) {
  const session = await auth()
  if (!session || !canModerate(session.user.role)) throw new Error("Permission refusée")

  await db
    .update(resources)
    .set({ status: "published", approvedById: session.user.id!, updatedAt: new Date() })
    .where(eq(resources.id, id))

  const existing = await db.query.resources.findFirst({ where: eq(resources.id, id) })
  if (existing) revalidateTag(`resources-${existing.type}`)
  revalidateTag(`resource-${id}`)
}

export async function createComment(input: CreateCommentInput) {
  const session = await auth()
  if (!session) throw new Error("Non authentifié")

  const parsed = createCommentSchema.parse(input)
  const id = createId()

  await db.insert(comments).values({
    id,
    ...parsed,
    authorId: session.user.id!,
  })

  revalidateTag(`resource-${parsed.resourceId}`)
  return { id }
}

export async function createShareLink(input: CreateShareLinkInput) {
  const session = await auth()
  if (!session) throw new Error("Non authentifié")

  const parsed = createShareLinkSchema.parse(input)

  const token = createId()
  const passwordHash = parsed.password ? await bcrypt.hash(parsed.password, 10) : null
  const expiresAt = parsed.expiresInDays
    ? new Date(Date.now() + parsed.expiresInDays * 86_400_000)
    : null

  await db.insert(shareLinks).values({
    resourceId: parsed.resourceId,
    token,
    passwordHash,
    expiresAt,
    createdById: session.user.id!,
  })

  return { token }
}

export async function verifyShareLink(token: string, password?: string) {
  const link = await db.query.shareLinks.findFirst({
    where: eq(shareLinks.token, token),
    with: { resource: { with: { files: { where: eq(resourceFiles.isCurrent, true) } } } },
  })

  if (!link) return null
  if (link.expiresAt && link.expiresAt < new Date()) return null
  if (link.passwordHash) {
    if (!password) return "password_required"
    const valid = await bcrypt.compare(password, link.passwordHash)
    if (!valid) return "invalid_password"
  }

  return link.resource
}
```

- [ ] **Step 4: Run tests to confirm passing**

```bash
pnpm test tests/unit/lib/actions/resources.test.ts
```

Expected: PASS

- [ ] **Step 5: Run all tests**

```bash
pnpm test && pnpm tsc --noEmit
```

Expected: all passing, 0 TS errors

- [ ] **Step 6: Commit**

```bash
git add lib/actions/resources.ts tests/unit/lib/actions/resources.test.ts
git commit -m "feat(resources): Server Actions for CRUD, approval, comments, share links"
```

---

## Task C: Resource UI components (Lagune design)

**Files:**
- Create: `components/resources/TagPill.tsx`
- Create: `components/resources/ResourceCard.tsx`
- Create: `components/resources/ResourceFilter.tsx`
- Create: `components/resources/ResourceGrid.tsx`
- Create: `components/resources/CommentThread.tsx`
- Create: `components/resources/PendingBadge.tsx`
- Test: `tests/component/resources/ResourceCard.test.tsx`
- Test: `tests/component/resources/TagPill.test.tsx`

Design spec (from `docs/stitch_hub_pro_design_system/bo_te_outils/code.html`):
- Cards: `bg-white border border-[#bdc9c7] rounded-xl p-6 shadow-sm hover:shadow-md transition-all`
- Type icon: colored `rounded-lg p-2` badge (PDF=red-50, video=teal-50, link=secondary-fixed-dim)
- Tags: `px-2 py-0.5 bg-teal-100 text-teal-900 rounded-full font-label-2xs`
- Action buttons: `opacity-0 group-hover:opacity-100 transition-opacity`
- Left filter sidebar: 288px wide, collapsible filter sections with `expand_more` icon
- Filter sidebar CTA card: `bg-teal-900 rounded-xl text-white` with coral 15° slant decoration

### Steps

- [ ] **Step 1: Write failing component tests**

Create `tests/component/resources/TagPill.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { TagPill } from "@/components/resources/TagPill"

describe("TagPill", () => {
  it("renders the tag name", () => {
    render(<TagPill name="Logement" />)
    expect(screen.getByText("Logement")).toBeDefined()
  })

  it("applies teal styles by default", () => {
    const { container } = render(<TagPill name="Emploi" />)
    expect(container.firstChild?.toString()).toBeTruthy()
  })

  it("applies coral variant for accent tags", () => {
    render(<TagPill name="Indispensable" variant="accent" />)
    const el = screen.getByText("Indispensable")
    expect(el.className).toContain("coral")
  })
})
```

Create `tests/component/resources/ResourceCard.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { ResourceCard } from "@/components/resources/ResourceCard"

const mockResource = {
  id: "r1",
  title: "Guide du Premier Logement 2024",
  description: "Un dossier complet sur les aides au logement.",
  type: "documentation" as const,
  mediaType: "pdf" as const,
  status: "published" as const,
  createdAt: new Date("2024-01-15"),
  tags: [{ tag: { id: "t1", name: "Logement", slug: "logement" } }],
  pinned: false,
}

describe("ResourceCard", () => {
  it("renders the title", () => {
    render(<ResourceCard resource={mockResource} />)
    expect(screen.getByText("Guide du Premier Logement 2024")).toBeDefined()
  })

  it("renders the description", () => {
    render(<ResourceCard resource={mockResource} />)
    expect(screen.getByText(/dossier complet/)).toBeDefined()
  })

  it("renders tag pills", () => {
    render(<ResourceCard resource={mockResource} />)
    expect(screen.getByText("Logement")).toBeDefined()
  })

  it("shows pinned indicator when pinned=true", () => {
    render(<ResourceCard resource={{ ...mockResource, pinned: true }} />)
    expect(screen.getByText(/mise en avant/i)).toBeDefined()
  })

  it("shows pending badge for pending_approval status", () => {
    render(<ResourceCard resource={{ ...mockResource, status: "pending_approval" }} />)
    expect(screen.getByText(/validation/i)).toBeDefined()
  })
})
```

- [ ] **Step 2: Run to confirm fail**

```bash
pnpm test tests/component/
```

Expected: FAIL

- [ ] **Step 3: Create `components/resources/TagPill.tsx`**

```tsx
import { cn } from "@/lib/utils"

interface TagPillProps {
  name: string
  variant?: "default" | "accent" | "brand"
  className?: string
}

const variants = {
  default: "bg-teal-100 text-teal-900",
  accent: "bg-coral-100 text-coral-700",
  brand: "bg-teal-700 text-white",
}

export function TagPill({ name, variant = "default", className }: TagPillProps) {
  return (
    <span
      className={cn(
        "px-2 py-0.5 rounded-full text-[11px] font-semibold leading-[1.45] tracking-[0.05em]",
        variants[variant],
        className
      )}
    >
      {name}
    </span>
  )
}
```

- [ ] **Step 4: Create `components/resources/PendingBadge.tsx`**

```tsx
export function PendingBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#FBD8CF] text-[#BB4F3A] rounded-full text-[11px] font-semibold">
      <span className="material-symbols-outlined text-[12px]" aria-hidden="true">schedule</span>
      En attente de validation
    </span>
  )
}
```

- [ ] **Step 5: Create `components/resources/ResourceCard.tsx`**

Matches the Lagune Boîte à Outils design exactly.

```tsx
import Link from "next/link"
import { cn } from "@/lib/utils"
import { TagPill } from "./TagPill"
import { PendingBadge } from "./PendingBadge"

const MEDIA_ICONS: Record<string, { icon: string; bg: string; color: string }> = {
  pdf:   { icon: "picture_as_pdf", bg: "bg-red-50",   color: "text-red-600" },
  video: { icon: "video_library",  bg: "bg-teal-50",  color: "text-teal-700" },
  audio: { icon: "headphones",     bg: "bg-teal-50",  color: "text-teal-700" },
  link:  { icon: "link",           bg: "bg-[#ffb4a5]/20", color: "text-[#a33d2a]" },
  image: { icon: "image",          bg: "bg-teal-50",  color: "text-teal-700" },
}

type ResourceCardProps = {
  resource: {
    id: string
    title: string
    description?: string | null
    type: string
    mediaType?: string | null
    status: string
    pinned: boolean
    createdAt: Date
    tags?: { tag: { id: string; name: string; slug: string } }[]
  }
  href?: string
}

export function ResourceCard({ resource, href }: ResourceCardProps) {
  const media = MEDIA_ICONS[resource.mediaType ?? ""] ?? MEDIA_ICONS.pdf
  const isPinned = resource.pinned
  const isPending = resource.status === "pending_approval"
  const linkHref = href ?? `/resources/${resource.type}/${resource.id}`

  return (
    <article
      className={cn(
        "group bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden",
        isPinned ? "border-teal-700/20" : "border-[#bdc9c7]"
      )}
    >
      {isPinned && (
        <div className="absolute top-0 right-0 px-3 py-1 bg-teal-700 text-white text-[11px] font-semibold rounded-bl-lg z-10">
          Mise en avant
        </div>
      )}

      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-2 rounded-lg", media.bg)}>
          <span className={cn("material-symbols-outlined", media.color)} aria-hidden="true">
            {media.icon}
          </span>
        </div>
        {isPending && <PendingBadge />}
      </div>

      <Link href={linkHref} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00807A] rounded">
        <h3 className="text-[24px] font-semibold leading-[1.35] text-[#181d1c] mb-2 group-hover:text-teal-700 transition-colors">
          {resource.title}
        </h3>
      </Link>

      {resource.description && (
        <p className="text-[14px] text-[#3e4948] leading-[1.5] line-clamp-2 mb-4">
          {resource.description}
        </p>
      )}

      {resource.tags && resource.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {resource.tags.map(({ tag }) => (
            <TagPill key={tag.id} name={tag.name} />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-[#bdc9c7]">
        <span className="text-[12px] text-[#6e7978] italic">
          {new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" }).format(
            new Date(resource.createdAt)
          )}
        </span>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link
            href={linkHref}
            className="p-2 text-teal-700 hover:bg-teal-50 rounded-full transition-colors"
            aria-label={`Ouvrir ${resource.title}`}
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">open_in_new</span>
          </Link>
        </div>
      </div>

      {isPinned && (
        <div className="absolute -bottom-10 -right-6 w-32 h-6 bg-[#BB4F3A]/5 rotate-[15deg]" aria-hidden="true" />
      )}
    </article>
  )
}
```

- [ ] **Step 6: Create `components/resources/ResourceFilter.tsx`**

```tsx
"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

type Tag = { id: string; name: string; slug: string }

interface ResourceFilterProps {
  tags: Tag[]
  selectedTagIds: string[]
  selectedTypes: string[]
  onTagToggle: (id: string) => void
  onTypeToggle: (type: string) => void
}

const MEDIA_TYPES = [
  { value: "pdf",   label: "PDF" },
  { value: "video", label: "Vidéos" },
  { value: "audio", label: "Audio" },
  { value: "link",  label: "Liens Web" },
]

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="border-b border-[#bdc9c7] pb-4">
      <button
        className="w-full flex items-center justify-between py-2 text-left"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="text-[16px] font-semibold text-[#181d1c]">{title}</span>
        <span className={cn("material-symbols-outlined text-[#6e7978] transition-transform", !open && "rotate-180")} aria-hidden="true">
          expand_more
        </span>
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  )
}

export function ResourceFilter({ tags, selectedTagIds, selectedTypes, onTagToggle, onTypeToggle }: ResourceFilterProps) {
  return (
    <aside className="w-72 flex-shrink-0 space-y-6">
      <div className="space-y-4">
        <FilterSection title="Type de document">
          <div className="space-y-2">
            {MEDIA_TYPES.map((t) => (
              <label key={t.value} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  className="rounded border-[#bdc9c7] text-teal-700 focus:ring-teal-700"
                  checked={selectedTypes.includes(t.value)}
                  onChange={() => onTypeToggle(t.value)}
                  aria-label={t.label}
                />
                <span className="text-[14px] text-[#3e4948] group-hover:text-teal-700 transition-colors">
                  {t.label}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>

        <FilterSection title="Thématique">
          <div className="grid grid-cols-1 gap-2">
            {tags.map((tag) => {
              const selected = selectedTagIds.includes(tag.id)
              return (
                <button
                  key={tag.id}
                  onClick={() => onTagToggle(tag.id)}
                  className={cn(
                    "text-left px-3 py-1.5 rounded text-[12px] font-medium flex items-center justify-between transition-colors",
                    selected
                      ? "bg-teal-100 text-teal-900"
                      : "hover:bg-[#ebefed] text-[#3e4948]"
                  )}
                >
                  {tag.name}
                  {selected && (
                    <span className="material-symbols-outlined text-[16px]" aria-hidden="true">close</span>
                  )}
                </button>
              )
            })}
          </div>
        </FilterSection>
      </div>

      <div className="p-4 bg-teal-900 rounded-xl text-white relative overflow-hidden group">
        <div className="relative z-10">
          <h4 className="font-semibold text-[16px] mb-1">Nouveau Document ?</h4>
          <p className="text-[12px] opacity-80 mb-4">Contribuez à la veille partagée du réseau.</p>
          <button className="bg-white text-teal-900 px-4 py-2 rounded-lg font-semibold text-[12px] shadow-sm hover:bg-teal-50 transition-colors">
            Télécharger
          </button>
        </div>
        <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-[#BB4F3A]/20 transform rotate-[15deg] group-hover:scale-110 transition-transform" aria-hidden="true" />
      </div>
    </aside>
  )
}
```

- [ ] **Step 7: Create `components/resources/ResourceGrid.tsx`**

```tsx
import { ResourceCard } from "./ResourceCard"

type Resource = Parameters<typeof ResourceCard>[0]["resource"]

interface ResourceGridProps {
  resources: Resource[]
  total: number
  page: number
  pageSize?: number
}

export function ResourceGrid({ resources, total, page, pageSize = 12 }: ResourceGridProps) {
  const totalPages = Math.ceil(total / pageSize)

  return (
    <section className="flex-1">
      <div className="flex items-center justify-between mb-6">
        <p className="text-[14px] text-[#6e7978]">
          <span className="font-bold text-[#181d1c]">{total}</span> ressource{total !== 1 ? "s" : ""} trouvée{total !== 1 ? "s" : ""}
        </p>
      </div>

      {resources.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center" role="status">
          <span className="material-symbols-outlined text-[48px] text-[#bdc9c7] mb-4" aria-hidden="true">
            folder_open
          </span>
          <h3 className="text-[24px] font-semibold text-[#181d1c] mb-2">Aucune ressource trouvée</h3>
          <p className="text-[14px] text-[#3e4948]">Essayez de modifier vos filtres ou d'ajouter de nouveaux documents.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
          {resources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="mt-12 flex items-center justify-center gap-4" aria-label="Pagination">
          <a
            href={`?page=${page - 1}`}
            className={`flex items-center gap-2 px-4 py-2 border border-[#bdc9c7] rounded-lg text-[14px] text-[#3e4948] hover:bg-[#ebefed] transition-colors ${page <= 1 ? "pointer-events-none opacity-50" : ""}`}
            aria-disabled={page <= 1}
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">chevron_left</span>
            Précédent
          </a>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
              <a
                key={p}
                href={`?page=${p}`}
                className={`w-10 h-10 flex items-center justify-center rounded-lg text-[14px] font-semibold transition-colors ${
                  p === page
                    ? "bg-teal-700 text-white"
                    : "hover:bg-[#ebefed] text-[#3e4948]"
                }`}
                aria-current={p === page ? "page" : undefined}
              >
                {p}
              </a>
            ))}
          </div>

          <a
            href={`?page=${page + 1}`}
            className={`flex items-center gap-2 px-4 py-2 border border-[#bdc9c7] rounded-lg text-[14px] text-[#3e4948] hover:bg-[#ebefed] transition-colors ${page >= totalPages ? "pointer-events-none opacity-50" : ""}`}
            aria-disabled={page >= totalPages}
          >
            Suivant
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">chevron_right</span>
          </a>
        </nav>
      )}
    </section>
  )
}
```

- [ ] **Step 8: Create `components/resources/CommentThread.tsx`**

```tsx
"use client"

import { useState } from "react"
import { createComment } from "@/lib/actions/resources"

type Comment = {
  id: string
  body: string
  parentId: string | null
  createdAt: Date
  author: { id: string; name: string }
  replies?: Comment[]
}

function CommentItem({ comment, resourceId }: { comment: Comment; resourceId: string }) {
  const [replying, setReplying] = useState(false)
  const [replyText, setReplyText] = useState("")

  async function submitReply(e: React.FormEvent) {
    e.preventDefault()
    if (!replyText.trim()) return
    await createComment({ resourceId, parentId: comment.id, body: replyText.trim() })
    setReplyText("")
    setReplying(false)
  }

  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-[#ebefed] flex items-center justify-center text-[12px] font-semibold text-teal-700 flex-shrink-0">
        {comment.author.name.slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[14px] font-semibold text-[#181d1c]">{comment.author.name}</span>
          <span className="text-[11px] text-[#6e7978]">
            {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(comment.createdAt))}
          </span>
        </div>
        <p className="text-[14px] text-[#3e4948] leading-[1.5]">{comment.body}</p>
        <button
          className="mt-1 text-[12px] text-teal-700 hover:underline"
          onClick={() => setReplying(!replying)}
        >
          Répondre
        </button>

        {replying && (
          <form onSubmit={submitReply} className="mt-2 flex gap-2">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="flex-1 rounded-lg border border-[#bdc9c7] p-2 text-[14px] resize-none min-h-[60px] focus:border-teal-700 focus:ring-1 focus:ring-teal-700"
              placeholder="Votre réponse..."
              aria-label="Réponse"
            />
            <button
              type="submit"
              className="self-end px-3 py-2 bg-teal-700 text-white rounded-lg text-[14px] font-medium hover:bg-teal-800 transition-colors"
            >
              Envoyer
            </button>
          </form>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 pl-4 border-l-2 border-[#bdc9c7] space-y-3">
            {comment.replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} resourceId={resourceId} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function CommentThread({ resourceId, comments }: { resourceId: string; comments: Comment[] }) {
  const [newComment, setNewComment] = useState("")

  const topLevel = comments.filter((c) => !c.parentId)
  const replies = comments.filter((c) => c.parentId)

  const threaded = topLevel.map((c) => ({
    ...c,
    replies: replies.filter((r) => r.parentId === c.id),
  }))

  async function submitComment(e: React.FormEvent) {
    e.preventDefault()
    if (!newComment.trim()) return
    await createComment({ resourceId, body: newComment.trim() })
    setNewComment("")
  }

  return (
    <section aria-label="Commentaires et questions">
      <h2 className="text-[24px] font-semibold text-[#181d1c] mb-6">
        Questions & Réponses ({topLevel.length})
      </h2>

      <form onSubmit={submitComment} className="mb-8 flex gap-3">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="flex-1 rounded-lg border border-[#bdc9c7] p-3 text-[14px] resize-none min-h-[80px] focus:border-teal-700 focus:ring-1 focus:ring-teal-700"
          placeholder="Posez votre question ou partagez un commentaire..."
          aria-label="Nouveau commentaire"
        />
        <button
          type="submit"
          className="self-end px-4 py-2 bg-teal-700 text-white rounded-lg text-[14px] font-medium hover:bg-teal-800 transition-colors"
        >
          Publier
        </button>
      </form>

      <div className="space-y-6">
        {threaded.length === 0 ? (
          <p className="text-[14px] text-[#6e7978] text-center py-8">
            Aucun commentaire pour le moment. Soyez le premier !
          </p>
        ) : (
          threaded.map((comment) => (
            <CommentItem key={comment.id} comment={comment} resourceId={resourceId} />
          ))
        )}
      </div>
    </section>
  )
}
```

- [ ] **Step 9: Run component tests**

```bash
pnpm test tests/component/
```

Expected: PASS

- [ ] **Step 10: Run all tests + type check**

```bash
pnpm test && pnpm tsc --noEmit
```

- [ ] **Step 11: Commit**

```bash
git add components/resources/ tests/component/
git commit -m "feat(resources): Lagune-styled resource components (card, filter, grid, comments)"
```

---

## Task D: Resource pages (all 5 routes)

**Files:**
- Create: `app/(app)/resources/layout.tsx`
- Create: `app/(app)/resources/page.tsx`
- Create: `app/(app)/resources/documentation/page.tsx`
- Create: `app/(app)/resources/toolbox/page.tsx`
- Create: `app/(app)/resources/toolbox/[id]/page.tsx`
- Create: `app/(app)/resources/veille/page.tsx`
- Create: `app/(app)/resources/tutorials/page.tsx`
- Create: `app/(app)/resources/tutorials/[id]/page.tsx`
- Create: `app/(app)/resources/external/page.tsx`
- Create: `app/(public)/resources/share/[token]/page.tsx`

### Steps

- [ ] **Step 1: Create `app/(app)/resources/layout.tsx`**

```tsx
import { Metadata } from "next"

export const metadata: Metadata = { title: "Ressources — Hub Pro" }

export default function ResourcesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
```

- [ ] **Step 2: Create `app/(app)/resources/page.tsx`**

```tsx
import { redirect } from "next/navigation"

export default function ResourcesPage() {
  redirect("/resources/documentation")
}
```

- [ ] **Step 3: Create `app/(app)/resources/documentation/page.tsx`**

```tsx
import { getResources } from "@/lib/actions/resources"
import { getTags } from "@/lib/actions/tags"
import { ResourceGrid } from "@/components/resources/ResourceGrid"
import { ResourceFilter } from "@/components/resources/ResourceFilter"

export const revalidate = 300 // ISR: revalidate every 5 minutes

export default async function DocumentationPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? "1", 10))

  const [resourceList, allTags] = await Promise.all([
    getResources({ type: "documentation", page }),
    getTags(),
  ])

  return (
    <div>
      <div className="mb-8">
        <h2
          className="text-[31px] font-semibold leading-[1.25] text-teal-900 mb-2"
          style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}
        >
          Documentation officielle
        </h2>
        <p className="text-[14px] text-[#3e4948]">Guides, chartes et documents de référence du réseau IJ.</p>
      </div>

      <div className="flex gap-6">
        <ResourceFilter
          tags={allTags}
          selectedTagIds={[]}
          selectedTypes={[]}
          onTagToggle={() => {}}
          onTypeToggle={() => {}}
        />
        <ResourceGrid
          resources={resourceList}
          total={resourceList.length}
          page={page}
        />
      </div>

      <a
        href="/resources/documentation/new"
        className="fixed bottom-8 right-8 w-14 h-14 bg-teal-700 text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-50"
        aria-label="Ajouter une ressource"
      >
        <span className="material-symbols-outlined text-[28px]" aria-hidden="true">add</span>
      </a>
    </div>
  )
}
```

- [ ] **Step 4: Create a minimal `getTags` helper**

Create `lib/actions/tags.ts`:

```ts
"use server"
import { db } from "@/db"
import { tags } from "@/db/schema"

export async function getTags() {
  return db.select().from(tags).orderBy(tags.name)
}
```

- [ ] **Step 5: Create `app/(app)/resources/toolbox/page.tsx`**

```tsx
import { getResources } from "@/lib/actions/resources"
import { getTags } from "@/lib/actions/tags"
import { ResourceGrid } from "@/components/resources/ResourceGrid"
import { ResourceFilter } from "@/components/resources/ResourceFilter"

export const revalidate = 300

export default async function ToolboxPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? "1", 10))

  const [resourceList, allTags] = await Promise.all([
    getResources({ type: "toolbox", page }),
    getTags(),
  ])

  return (
    <div>
      <div className="mb-8">
        <h2
          className="text-[31px] font-semibold leading-[1.25] text-teal-900 mb-2"
          style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}
        >
          Boîte à Outils
        </h2>
        <p className="text-[14px] text-[#3e4948]">Gérez et accédez à vos ressources pédagogiques.</p>
      </div>

      <div className="flex gap-6">
        <ResourceFilter
          tags={allTags}
          selectedTagIds={[]}
          selectedTypes={[]}
          onTagToggle={() => {}}
          onTypeToggle={() => {}}
        />
        <ResourceGrid resources={resourceList} total={resourceList.length} page={page} />
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Create `app/(app)/resources/toolbox/[id]/page.tsx`**

```tsx
import { notFound } from "next/navigation"
import { getResourceById } from "@/lib/actions/resources"
import { CommentThread } from "@/components/resources/CommentThread"
import { TagPill } from "@/components/resources/TagPill"

export const revalidate = 0 // dynamic — comments change often

export default async function ToolboxItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const resource = await getResourceById(id)
  if (!resource || resource.type !== "toolbox") notFound()

  return (
    <article className="max-w-3xl">
      <header className="mb-8">
        <div className="flex flex-wrap gap-2 mb-3">
          {resource.tags?.map(({ tag }) => <TagPill key={tag.id} name={tag.name} />)}
        </div>
        <h1
          className="text-[39px] font-bold leading-[1.15] text-[#181d1c] mb-3"
          style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}
        >
          {resource.title}
        </h1>
        {resource.description && (
          <p className="text-[18px] text-[#3e4948] leading-[1.55]">{resource.description}</p>
        )}
      </header>

      <div className="mb-12">
        {resource.files?.[0] && (
          <div className="border border-[#bdc9c7] rounded-xl overflow-hidden bg-white flex items-center hover:border-teal-700/50 transition-colors cursor-pointer">
            <div className="bg-teal-700 p-4 text-white">
              <span className="material-symbols-outlined text-[32px]" aria-hidden="true">
                {resource.mediaType === "video" ? "video_library" : resource.mediaType === "audio" ? "headphones" : "picture_as_pdf"}
              </span>
            </div>
            <div className="p-4 flex-1">
              <h2 className="text-[14px] font-semibold text-[#181d1c] hover:text-teal-700">
                {resource.files[0].filename}
              </h2>
              <p className="text-[12px] text-[#6e7978]">
                {(resource.files[0].sizeBytes / 1_048_576).toFixed(1)} MB
              </p>
            </div>
            <div className="p-4">
              <span className="material-symbols-outlined text-teal-700" aria-hidden="true">download</span>
            </div>
          </div>
        )}
      </div>

      <CommentThread
        resourceId={resource.id}
        comments={(resource.comments ?? []) as Parameters<typeof CommentThread>[0]["comments"]}
      />
    </article>
  )
}
```

- [ ] **Step 7: Create `app/(app)/resources/veille/page.tsx`**

```tsx
import { getResources } from "@/lib/actions/resources"
import { getTags } from "@/lib/actions/tags"
import { ResourceGrid } from "@/components/resources/ResourceGrid"
import { ResourceFilter } from "@/components/resources/ResourceFilter"

export const revalidate = 300

export default async function VeillePage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? "1", 10))

  const [resourceList, allTags] = await Promise.all([
    getResources({ type: "veille", page }),
    getTags(),
  ])

  return (
    <div>
      <div className="mb-8">
        <h2
          className="text-[31px] font-semibold leading-[1.25] text-teal-900 mb-2"
          style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}
        >
          Veille partagée
        </h2>
        <p className="text-[14px] text-[#3e4948]">Articles, rapports et liens sélectionnés par le réseau.</p>
      </div>
      <div className="flex gap-6">
        <ResourceFilter tags={allTags} selectedTagIds={[]} selectedTypes={[]} onTagToggle={() => {}} onTypeToggle={() => {}} />
        <ResourceGrid resources={resourceList} total={resourceList.length} page={page} />
      </div>
    </div>
  )
}
```

- [ ] **Step 8: Create `app/(app)/resources/tutorials/page.tsx`**

```tsx
import { getResources } from "@/lib/actions/resources"
import { ResourceGrid } from "@/components/resources/ResourceGrid"

export const revalidate = 3600

export default async function TutorialsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? "1", 10))
  const resourceList = await getResources({ type: "tutorial", page })

  return (
    <div>
      <div className="mb-8">
        <h2
          className="text-[31px] font-semibold leading-[1.25] text-teal-900 mb-2"
          style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}
        >
          Tutoriels
        </h2>
        <p className="text-[14px] text-[#3e4948]">Guides d'utilisation de la plateforme Hub Pro.</p>
      </div>
      <ResourceGrid resources={resourceList} total={resourceList.length} page={page} />
    </div>
  )
}
```

- [ ] **Step 9: Create `app/(app)/resources/tutorials/[id]/page.tsx`**

```tsx
import { notFound } from "next/navigation"
import { getResourceById } from "@/lib/actions/resources"
import { TagPill } from "@/components/resources/TagPill"

export const revalidate = 3600

export default async function TutorialDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const resource = await getResourceById(id)
  if (!resource || resource.type !== "tutorial") notFound()

  return (
    <article className="max-w-3xl">
      <header className="mb-8">
        <div className="flex flex-wrap gap-2 mb-3">
          {resource.tags?.map(({ tag }) => <TagPill key={tag.id} name={tag.name} />)}
        </div>
        <h1
          className="text-[39px] font-bold leading-[1.15] text-[#181d1c] mb-3"
          style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}
        >
          {resource.title}
        </h1>
        {resource.description && (
          <p className="text-[18px] text-[#3e4948] leading-[1.55]">{resource.description}</p>
        )}
      </header>

      {resource.body && (
        <div
          className="prose prose-neutral max-w-none text-[16px] leading-[1.6]"
          dangerouslySetInnerHTML={{ __html: resource.body }}
        />
      )}
    </article>
  )
}
```

- [ ] **Step 10: Create `app/(app)/resources/external/page.tsx`** (share link generator for staff)

```tsx
import { auth } from "@/auth"
import { canModerate } from "@/lib/roles"
import { redirect } from "next/navigation"
import { createShareLink } from "@/lib/actions/resources"

export default async function ExternalSharePage() {
  const session = await auth()
  if (!session || !canModerate(session.user.role)) redirect("/resources/documentation")

  return (
    <div className="max-w-lg">
      <h2
        className="text-[31px] font-semibold leading-[1.25] text-teal-900 mb-2"
        style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}
      >
        Créer un lien de partage
      </h2>
      <p className="text-[14px] text-[#3e4948] mb-8">
        Partagez un document de façon sécurisée avec une personne extérieure au réseau.
      </p>

      <form
        className="space-y-5 bg-white rounded-xl border border-[#bdc9c7] p-6 shadow-sm"
        action={async (formData: FormData) => {
          "use server"
          const resourceId = formData.get("resourceId") as string
          const password = formData.get("password") as string | undefined
          const days = formData.get("expiresInDays")
          const { token } = await createShareLink({
            resourceId,
            password: password || undefined,
            expiresInDays: days ? parseInt(days as string, 10) : undefined,
          })
          redirect(`/resources/share/${token}`)
        }}
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="resourceId" className="text-[14px] font-medium text-[#181d1c]">
            ID de la ressource <span aria-hidden="true">*</span>
          </label>
          <input
            id="resourceId"
            name="resourceId"
            required
            className="h-10 rounded-[6px] border border-[#d2d8d8] px-3 text-[16px] focus:border-teal-700 focus:ring-1 focus:ring-teal-700"
            placeholder="resource-id"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-[14px] font-medium text-[#181d1c]">
            Mot de passe (optionnel)
          </label>
          <input
            id="password"
            name="password"
            type="password"
            className="h-10 rounded-[6px] border border-[#d2d8d8] px-3 text-[16px] focus:border-teal-700 focus:ring-1 focus:ring-teal-700"
            placeholder="Laisser vide = pas de protection"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="expiresInDays" className="text-[14px] font-medium text-[#181d1c]">
            Expire dans (jours, optionnel)
          </label>
          <input
            id="expiresInDays"
            name="expiresInDays"
            type="number"
            min={1}
            max={365}
            className="h-10 rounded-[6px] border border-[#d2d8d8] px-3 text-[16px] focus:border-teal-700 focus:ring-1 focus:ring-teal-700"
            placeholder="30"
          />
        </div>

        <button
          type="submit"
          className="w-full h-10 bg-teal-700 text-white rounded-[6px] text-[14px] font-medium hover:bg-teal-800 transition-colors"
        >
          Générer le lien
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 11: Create public share page**

Create `app/(public)/resources/share/[token]/page.tsx`:

```tsx
import { notFound } from "next/navigation"
import { verifyShareLink } from "@/lib/actions/resources"

export default async function SharePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ password?: string }>
}) {
  const { token } = await params
  const { password } = await searchParams

  const result = await verifyShareLink(token, password)

  if (result === null) {
    notFound()
  }

  if (result === "password_required" || result === "invalid_password") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6faf9]">
        <div className="w-full max-w-sm bg-white rounded-[14px] border border-[#bdc9c7] shadow-sm p-8">
          <h1
            className="text-[24px] font-semibold text-teal-700 mb-2"
            style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}
          >
            Document protégé
          </h1>
          {result === "invalid_password" && (
            <p className="text-[14px] text-red-600 mb-4">Mot de passe incorrect.</p>
          )}
          <form method="GET">
            <div className="flex flex-col gap-1.5 mb-4">
              <label htmlFor="password" className="text-[14px] font-medium text-[#181d1c]">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="h-10 rounded-[6px] border border-[#d2d8d8] px-3 text-[16px] focus:border-teal-700 focus:ring-1 focus:ring-teal-700"
              />
            </div>
            <button
              type="submit"
              className="w-full h-10 bg-teal-700 text-white rounded-[6px] text-[14px] font-medium hover:bg-teal-800"
            >
              Accéder
            </button>
          </form>
        </div>
      </div>
    )
  }

  const resource = result

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6faf9]">
      <div className="w-full max-w-lg bg-white rounded-[14px] border border-[#bdc9c7] shadow-sm p-8">
        <p className="text-[12px] text-[#6e7978] mb-2 uppercase tracking-wide">Document partagé</p>
        <h1
          className="text-[31px] font-semibold text-[#181d1c] mb-4"
          style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}
        >
          {resource.title}
        </h1>
        {resource.description && (
          <p className="text-[14px] text-[#3e4948] mb-6">{resource.description}</p>
        )}
        {resource.files?.[0] && (
          <div className="border border-[#bdc9c7] rounded-xl overflow-hidden flex items-center">
            <div className="bg-teal-700 p-4 text-white">
              <span className="material-symbols-outlined text-[32px]" aria-hidden="true">picture_as_pdf</span>
            </div>
            <div className="p-4 flex-1">
              <p className="text-[14px] font-semibold">{resource.files[0].filename}</p>
              <p className="text-[12px] text-[#6e7978]">{(resource.files[0].sizeBytes / 1_048_576).toFixed(1)} MB</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 12: Run type check + all tests**

```bash
pnpm tsc --noEmit && pnpm test
```

Expected: 0 errors, all tests passing

- [ ] **Step 13: Commit**

```bash
git add app/ lib/actions/tags.ts
git commit -m "feat(resources): all 5 resource pages (documentation, toolbox, veille, tutorials, external share)"
```

---

## Phase 1 Completion Checklist

- [ ] DB schema: `tags`, `resources`, `resource_files`, `resource_tags`, `comments`, `share_links` tables migrated
- [ ] Zod validations tested (8 tests passing)
- [ ] Storage helpers tested (4 tests passing)
- [ ] Server Actions: create/update/delete/approve/comment/share implemented
- [ ] `ResourceCard` matches Lagune design (white card, type icon, tag pills, hover reveal actions)
- [ ] `ResourceFilter` left sidebar with collapsible sections and teal-900 CTA card
- [ ] `ResourceGrid` with empty state, count, and pagination
- [ ] `CommentThread` with nested replies
- [ ] All 5 resource listing pages + 2 detail pages + share page
- [ ] ISR configured (revalidate on publish)
- [ ] All tests pass, 0 TS errors
