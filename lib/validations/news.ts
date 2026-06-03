import { z } from "zod"

export const createPostSchema = z.object({
  body: z.string().min(1, "Le contenu est requis").max(5000),
  pinned: z.boolean().optional().default(false),
})

export const updatePostSchema = createPostSchema.partial().extend({
  id: z.string().min(1),
})

export const createPostCommentSchema = z.object({
  postId: z.string().min(1),
  parentId: z.string().optional(),
  body: z.string().min(1, "Le commentaire ne peut pas être vide").max(2000),
})

const eventBaseSchema = z.object({
  title: z.string().min(1, "Le titre est requis").max(200),
  description: z.string().max(2000).optional(),
  location: z.string().max(200).optional(),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  category: z.enum(["formation", "reunion", "evenement", "autre"]),
  isInternal: z.boolean().optional().default(true),
  externalFormUrl: z
    .string()
    .url()
    .refine((u) => u.startsWith("http://") || u.startsWith("https://"), "URL invalide")
    .optional(),
})

export const createEventSchema = eventBaseSchema.refine((d) => d.endAt > d.startAt, {
  message: "La date de fin doit être après la date de début",
  path: ["endAt"],
})

export const updateEventSchema = eventBaseSchema.partial().extend({
  id: z.string().min(1),
})

export const rsvpSchema = z.object({
  eventId: z.string().min(1),
})

export type CreatePostInput = z.input<typeof createPostSchema>
export type UpdatePostInput = z.input<typeof updatePostSchema>
export type CreatePostCommentInput = z.input<typeof createPostCommentSchema>
export type CreateEventInput = z.input<typeof createEventSchema>
export type UpdateEventInput = z.input<typeof updateEventSchema>
export type RsvpInput = z.infer<typeof rsvpSchema>
