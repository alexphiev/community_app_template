import { db } from "@/db"
import { resources, tags, resourceTags } from "@/db/schema"
import { eq } from "drizzle-orm"
import { createId } from "@paralleldrive/cuid2"
import type { WpPost } from "./extract"
import { sanitizeBody, mapWpTypeToResourceType, slugify, extractTextFromHtml } from "./transform"

export interface LoadResult {
  migrated: number
  skipped: number
  failed: number
  errors: Array<{ wpPostId: string; error: string }>
}

const SYSTEM_AUTHOR_ID = process.env.ETL_SYSTEM_AUTHOR_ID ?? "system"

async function upsertTag(name: string): Promise<string> {
  const slug = slugify(name)
  const existing = await db.query.tags.findFirst({ where: eq(tags.slug, slug) })
  if (existing) return existing.id

  const id = createId()
  await db.insert(tags).values({ id, name, slug }).onConflictDoNothing()
  return id
}

export async function loadPosts(posts: WpPost[]): Promise<LoadResult> {
  const result: LoadResult = { migrated: 0, skipped: 0, failed: 0, errors: [] }

  for (const post of posts) {
    try {
      if (!post.wpPostId || !post.title.trim()) {
        result.skipped++
        continue
      }

      const body = sanitizeBody(post.content)
      const description = extractTextFromHtml(post.excerpt).slice(0, 500) || undefined
      const type = mapWpTypeToResourceType(post.postType)
      const id = createId()

      await db
        .insert(resources)
        .values({
          id,
          title: post.title.trim().slice(0, 200),
          description: description || null,
          body,
          type,
          status: "published",
          authorId: SYSTEM_AUTHOR_ID,
          wpPostId: post.wpPostId,
          createdAt: post.createdAt,
          updatedAt: post.createdAt,
        })
        .onConflictDoNothing()

      const allTagNames = [...post.categories, ...post.tags].filter(Boolean)
      for (const tagName of allTagNames) {
        try {
          const tagId = await upsertTag(tagName)
          await db
            .insert(resourceTags)
            .values({ resourceId: id, tagId })
            .onConflictDoNothing()
        } catch {
          // tag linking failure is non-fatal
        }
      }

      result.migrated++
    } catch (err) {
      result.failed++
      result.errors.push({
        wpPostId: post.wpPostId,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return result
}
