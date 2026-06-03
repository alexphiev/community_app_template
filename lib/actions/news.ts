"use server"

import { db } from "@/db"
import { posts, postComments, postReactions, events, eventRsvps } from "@/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { revalidateTag } from "next/cache"
import { auth } from "@/auth"
import { canModerate } from "@/lib/roles"
import {
  createPostSchema, updatePostSchema, createPostCommentSchema,
  createEventSchema, updateEventSchema,
  type CreatePostInput, type UpdatePostInput, type CreatePostCommentInput,
  type CreateEventInput, type UpdateEventInput,
} from "@/lib/validations/news"
import { createId } from "@paralleldrive/cuid2"

// ─── Posts ────────────────────────────────────────────────────────────────────

export async function getPosts(filter: { page?: number } = {}) {
  const { page = 1 } = filter
  return db.query.posts.findMany({
    with: { author: true, comments: { with: { author: true } }, reactions: true },
    orderBy: [desc(posts.pinned), desc(posts.createdAt)],
    limit: 20,
    offset: (page - 1) * 20,
  })
}

export async function createPost(input: CreatePostInput) {
  const session = await auth()
  if (!session) throw new Error("Non authentifié")

  const parsed = createPostSchema.parse(input)
  const id = createId()

  const pinned = parsed.pinned && canModerate(session.user.role)

  await db.insert(posts).values({ id, ...parsed, pinned, authorId: session.user.id! })
  revalidateTag("posts", {})
  return { id }
}

export async function updatePost(input: UpdatePostInput) {
  const session = await auth()
  if (!session) throw new Error("Non authentifié")

  const parsed = updatePostSchema.parse(input)
  const existing = await db.query.posts.findFirst({ where: eq(posts.id, parsed.id) })
  if (!existing) throw new Error("Post introuvable")

  const isOwner = existing.authorId === session.user.id
  if (!isOwner && !canModerate(session.user.role)) throw new Error("Permission refusée")

  const { id, ...data } = parsed
  if (data.pinned && !canModerate(session.user.role)) {
    data.pinned = false
  }
  await db.update(posts).set({ ...data, updatedAt: new Date() }).where(eq(posts.id, id))
  revalidateTag("posts", {})
}

export async function deletePost(id: string) {
  const session = await auth()
  if (!session) throw new Error("Non authentifié")

  const existing = await db.query.posts.findFirst({ where: eq(posts.id, id) })
  if (!existing) throw new Error("Post introuvable")

  const isOwner = existing.authorId === session.user.id
  if (!isOwner && !canModerate(session.user.role)) throw new Error("Permission refusée")

  await db.delete(posts).where(eq(posts.id, id))
  revalidateTag("posts", {})
}

export async function createPostComment(input: CreatePostCommentInput) {
  const session = await auth()
  if (!session) throw new Error("Non authentifié")

  const parsed = createPostCommentSchema.parse(input)
  const id = createId()
  await db.insert(postComments).values({ id, ...parsed, authorId: session.user.id! })
  revalidateTag(`post-${parsed.postId}`, {})
  return { id }
}

export async function toggleReaction(postId: string, emoji = "👍") {
  const session = await auth()
  if (!session) throw new Error("Non authentifié")

  const existing = await db.query.postReactions.findFirst({
    where: and(eq(postReactions.postId, postId), eq(postReactions.userId, session.user.id!)),
  })

  if (existing) {
    await db.delete(postReactions).where(
      and(eq(postReactions.postId, postId), eq(postReactions.userId, session.user.id!))
    )
  } else {
    await db.insert(postReactions).values({ postId, userId: session.user.id!, emoji })
  }
  revalidateTag(`post-${postId}`, {})
}

// ─── Events ───────────────────────────────────────────────────────────────────

export async function getEvents(filter: {
  month?: number
  year?: number
  category?: string
} = {}) {
  return db.query.events.findMany({
    with: { createdBy: true, rsvps: { with: { user: true } } },
    orderBy: [desc(events.startAt)],
  })
}

export async function getEventById(id: string) {
  const event = await db.query.events.findFirst({
    where: eq(events.id, id),
    with: { createdBy: true, rsvps: { with: { user: true } } },
  })
  return event ?? null
}

export async function createEvent(input: CreateEventInput) {
  const session = await auth()
  if (!session || !canModerate(session.user.role)) throw new Error("Permission refusée")

  const parsed = createEventSchema.parse(input)
  const id = createId()
  await db.insert(events).values({ id, ...parsed, createdById: session.user.id! })
  revalidateTag("events", {})
  return { id }
}

export async function updateEvent(input: UpdateEventInput) {
  const session = await auth()
  if (!session || !canModerate(session.user.role)) throw new Error("Permission refusée")

  const parsed = updateEventSchema.parse(input)
  const { id, ...data } = parsed
  if (!id) throw new Error("ID de l'événement requis")
  await db.update(events).set({ ...data, updatedAt: new Date() }).where(eq(events.id, id))
  revalidateTag("events", {})
  revalidateTag(`event-${id}`, {})
}

export async function deleteEvent(id: string) {
  const session = await auth()
  if (!session || !canModerate(session.user.role)) throw new Error("Permission refusée")

  await db.delete(events).where(eq(events.id, id))
  revalidateTag("events", {})
}

export async function toggleRsvp(eventId: string) {
  const session = await auth()
  if (!session) throw new Error("Non authentifié")

  const existing = await db.query.eventRsvps.findFirst({
    where: and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.userId, session.user.id!)),
  })

  if (existing) {
    await db.delete(eventRsvps).where(
      and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.userId, session.user.id!))
    )
  } else {
    await db.insert(eventRsvps).values({ eventId, userId: session.user.id! })
  }
  revalidateTag(`event-${eventId}`, {})
}
