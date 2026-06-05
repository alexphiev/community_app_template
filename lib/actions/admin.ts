"use server"

import { db } from "@/db"
import { users, resources, tags, posts } from "@/db/schema"
import { eq, count } from "drizzle-orm"
import { revalidateTag } from "next/cache"
import { auth } from "@/auth"
import { ROLES, type Role } from "@/lib/roles"
import { z } from "zod"
import { createId } from "@paralleldrive/cuid2"

const tagSchema = z.object({ name: z.string().min(1, "Nom requis").max(50) })

// ─── Users ────────────────────────────────────────────────────────────────────

export async function getUsers(filter: { page?: number; suspended?: boolean } = {}) {
  const { page = 1, suspended } = filter
  return db.query.users.findMany({
    where: suspended !== undefined ? eq(users.suspended, suspended) : undefined,
    columns: { id: true, name: true, email: true, role: true, structure: true, suspended: true, createdAt: true },
    limit: 50,
    offset: (page - 1) * 50,
  })
}

export async function suspendUser(userId: string) {
  const session = await auth()
  if (!session) throw new Error("Non authentifié")
  if (session.user.id === userId) throw new Error("Vous ne pouvez pas suspendre vous-même")

  await db.update(users).set({ suspended: true }).where(eq(users.id, userId))
  revalidateTag("users", "max")
}

export async function unsuspendUser(userId: string) {
  const session = await auth()
  if (!session) throw new Error("Non authentifié")

  await db.update(users).set({ suspended: false }).where(eq(users.id, userId))
  revalidateTag("users", "max")
}

export async function assignRole(userId: string, role: Role) {
  const session = await auth()
  if (!session) throw new Error("Non authentifié")

  if (!Object.values(ROLES).includes(role)) throw new Error("Rôle invalide")

  await db.update(users).set({ role }).where(eq(users.id, userId))
  revalidateTag("users", "max")
}

// ─── Moderation ───────────────────────────────────────────────────────────────

export async function getPendingContent() {
  return db.query.resources.findMany({
    where: eq(resources.status, "pending_approval"),
    with: { author: true },
    limit: 50,
  })
}

// ─── Taxonomy ─────────────────────────────────────────────────────────────────

export async function getAllTags() {
  return db.query.tags.findMany({ limit: 200 })
}

export async function createTag(input: { name: string }) {
  const parsed = tagSchema.parse(input)
  const slug = parsed.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
  await db.insert(tags).values({ id: createId(), name: parsed.name, slug })
  revalidateTag("tags", "max")
}

export async function deleteTag(id: string) {
  await db.delete(tags).where(eq(tags.id, id))
  revalidateTag("tags", "max")
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export async function getAnalytics() {
  const [userCount, resourceCount, postCount] = await Promise.all([
    db.select({ value: count() }).from(users).where(eq(users.suspended, false)),
    db.select({ value: count() }).from(resources).where(eq(resources.status, "published")),
    db.select({ value: count() }).from(posts),
  ])

  return {
    totalUsers: userCount[0]?.value ?? 0,
    publishedResources: resourceCount[0]?.value ?? 0,
    publishedPosts: postCount[0]?.value ?? 0,
  }
}
