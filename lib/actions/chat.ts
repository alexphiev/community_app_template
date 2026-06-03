"use server"

import { db } from "@/db"
import { channels, channelMembers, chatMessages, notificationPrefs } from "@/db/schema"
import { eq, and, gt, asc } from "drizzle-orm"
import { revalidateTag } from "next/cache"
import { auth } from "@/auth"
import { canModerate } from "@/lib/roles"
import {
  sendMessageSchema, createChannelSchema, updateNotifPrefSchema,
  type SendMessageInput, type CreateChannelInput, type UpdateNotifPrefInput,
} from "@/lib/validations/chat"
import { createId } from "@paralleldrive/cuid2"

export async function getChannels() {
  return db.query.channels.findMany({
    where: eq(channels.type, "channel"),
    with: { members: { with: { user: { columns: { id: true, name: true } } } } },
    orderBy: [asc(channels.name)],
  })
}

export async function getDirectChannels(userId: string) {
  return db.query.channels.findMany({
    where: eq(channels.type, "direct"),
    with: { members: { with: { user: { columns: { id: true, name: true, image: true } } } } },
  })
}

export async function getMessages(channelId: string, after?: string) {
  return db.query.chatMessages.findMany({
    where: and(
      eq(chatMessages.channelId, channelId),
      after ? gt(chatMessages.id, after) : undefined,
    ),
    with: { author: { columns: { id: true, name: true, image: true } } },
    orderBy: [asc(chatMessages.createdAt)],
    limit: 50,
  })
}

export async function sendMessage(input: SendMessageInput) {
  const session = await auth()
  if (!session) throw new Error("Non authentifié")

  const parsed = sendMessageSchema.parse(input)
  const id = createId()

  await db.insert(chatMessages).values({
    id,
    channelId: parsed.channelId,
    authorId: session.user.id!,
    body: parsed.body,
  })

  revalidateTag(`channel-${parsed.channelId}`, {})
  return { id }
}

export async function createChannel(input: CreateChannelInput) {
  const session = await auth()
  if (!session || !canModerate(session.user.role)) throw new Error("Permission refusée")

  const parsed = createChannelSchema.parse(input)
  const id = createId()

  await db.insert(channels).values({
    id,
    name: parsed.name,
    description: parsed.description,
    type: parsed.type,
    createdById: session.user.id!,
  })

  await db.insert(channelMembers).values({ channelId: id, userId: session.user.id! })

  revalidateTag("channels", {})
  return { id }
}

export async function joinChannel(channelId: string) {
  const session = await auth()
  if (!session) throw new Error("Non authentifié")

  const existing = await db.query.channelMembers.findFirst({
    where: and(eq(channelMembers.channelId, channelId), eq(channelMembers.userId, session.user.id!)),
  })
  if (existing) return

  await db.insert(channelMembers).values({ channelId, userId: session.user.id! })
  revalidateTag(`channel-${channelId}`, {})
}

export async function updateNotifPref(input: UpdateNotifPrefInput) {
  const session = await auth()
  if (!session) throw new Error("Non authentifié")

  const parsed = updateNotifPrefSchema.parse(input)

  const existing = await db.query.notificationPrefs.findFirst({
    where: and(eq(notificationPrefs.channelId, parsed.channelId), eq(notificationPrefs.userId, session.user.id!)),
  })

  if (existing) {
    await db.update(notificationPrefs)
      .set({ pref: parsed.pref })
      .where(and(eq(notificationPrefs.channelId, parsed.channelId), eq(notificationPrefs.userId, session.user.id!)))
  } else {
    await db.insert(notificationPrefs).values({
      channelId: parsed.channelId,
      userId: session.user.id!,
      pref: parsed.pref,
    })
  }

  revalidateTag(`notif-prefs-${session.user.id}`, {})
}
