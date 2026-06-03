"use server"

import { db } from "@/db"
import { resources, resourceTags, comments, shareLinks, resourceFiles } from "@/db/schema"
import { eq, and, desc } from "drizzle-orm"
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
    with: {
      tags: { with: { tag: true } },
      author: true,
      files: { where: eq(resourceFiles.isCurrent, true) },
    },
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
      comments: {
        with: { author: true },
        orderBy: [desc(comments.createdAt)],
      },
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

  revalidateTag(`resources-${data.type}`, {})
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

  revalidateTag(`resources-${existing.type}`, {})
  revalidateTag(`resource-${id}`, {})
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
  revalidateTag(`resources-${existing.type}`, {})
}

export async function approveResource(id: string) {
  const session = await auth()
  if (!session || !canModerate(session.user.role)) throw new Error("Permission refusée")

  const existing = await db.query.resources.findFirst({ where: eq(resources.id, id) })
  if (!existing) throw new Error("Ressource introuvable")

  await db
    .update(resources)
    .set({ status: "published", approvedById: session.user.id!, updatedAt: new Date() })
    .where(eq(resources.id, id))

  revalidateTag(`resources-${existing.type}`, {})
  revalidateTag(`resource-${id}`, {})
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

  revalidateTag(`resource-${parsed.resourceId}`, {})
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
    with: {
      resource: {
        with: {
          files: { where: eq(resourceFiles.isCurrent, true) },
        },
      },
    },
  })

  if (!link) return null
  if (link.expiresAt && link.expiresAt < new Date()) return null

  if (link.passwordHash) {
    if (!password) return "password_required" as const
    const valid = await bcrypt.compare(password, link.passwordHash)
    if (!valid) return "invalid_password" as const
  }

  return link.resource
}
