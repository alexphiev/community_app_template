import { z } from "zod"

const RESOURCE_TYPES = ["documentation", "toolbox", "veille", "tutorial"] as const
const MEDIA_TYPES = ["pdf", "video", "audio", "link", "image"] as const

const resourceBaseSchema = z.object({
  title: z.string().min(1, "Le titre est requis").max(200),
  description: z.string().max(500).optional(),
  body: z.string().optional(),
  type: z.enum(RESOURCE_TYPES),
  mediaType: z.enum(MEDIA_TYPES).optional(),
  externalUrl: z.string().url("URL invalide").optional(),
  tagIds: z.array(z.string()).default([]),
})

export const createResourceSchema = resourceBaseSchema.refine(
  (d) => !(d.type === "veille" && d.mediaType === "link" && !d.externalUrl),
  { message: "URL requise pour un lien externe", path: ["externalUrl"] }
)

export const updateResourceSchema = resourceBaseSchema.partial().extend({
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
