import { z } from "zod"
import { ROLES } from "@/lib/roles"

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Mot de passe trop court"),
})
export type LoginInput = z.infer<typeof loginSchema>

const invitableRoles = Object.values(ROLES).filter((r) => r !== ROLES.GUEST) as [string, ...string[]]

export const inviteSchema = z.object({
  email: z.string().email("Email invalide"),
  name: z.string().optional(),
  role: z.enum(invitableRoles, { error: "Rôle invalide" }),
})
export type InviteInput = z.infer<typeof inviteSchema>

export const registerSchema = z.object({
  token: z.string().min(1),
  name: z.string().min(1, "Nom requis"),
  password: z.string().min(8, "Mot de passe trop court (8 caractères minimum)"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
})
export type RegisterInput = z.infer<typeof registerSchema>

const selfRegisterRoles = [ROLES.SALARIE, ROLES.PRO_RESEAU, ROLES.RELAIS, ROLES.GUEST] as [string, ...string[]]

export const publicRegisterSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  email: z.string().email("Email invalide"),
  role: z.enum(selfRegisterRoles, { error: "Rôle invalide" }),
  password: z.string().min(8, "Mot de passe trop court (8 caractères minimum)"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
})
export type PublicRegisterInput = z.infer<typeof publicRegisterSchema>

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email invalide"),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Mot de passe trop court (8 caractères minimum)"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
})

export const updateProfileSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  phone: z.string().optional(),
  structure: z.string().optional(),
})
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Mot de passe actuel requis"),
  newPassword: z.string().min(8, "Mot de passe trop court (8 caractères minimum)"),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
})
