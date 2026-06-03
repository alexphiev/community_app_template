import { z } from "zod"

export const sendMessageSchema = z.object({
  channelId: z.string().min(1),
  body: z.string().min(1, "Le message ne peut pas être vide").max(4000),
})

export const createChannelSchema = z.object({
  name: z.string().min(1, "Nom requis").max(80).regex(/^[a-z0-9-_]+$/, "Minuscules, chiffres, tirets uniquement"),
  description: z.string().max(200).optional(),
  type: z.enum(["channel", "direct"]).default("channel"),
})

export const updateNotifPrefSchema = z.object({
  channelId: z.string().min(1),
  pref: z.enum(["all", "mentions", "digest", "muted"]),
})

export type SendMessageInput = z.infer<typeof sendMessageSchema>
export type CreateChannelInput = z.infer<typeof createChannelSchema>
export type UpdateNotifPrefInput = z.infer<typeof updateNotifPrefSchema>
