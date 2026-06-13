"use server"

import { db } from "@/db"
import { users, emailVerificationTokens, passwordResetTokens } from "@/db/schema"
import { eq, and, isNull, gt } from "drizzle-orm"
import { hash, compare } from "bcryptjs"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createId } from "@paralleldrive/cuid2"
import {
  publicRegisterSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  changePasswordSchema,
} from "@/lib/validations/auth"
import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/email"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"

export async function publicRegister(formData: FormData) {
  const parsed = publicRegisterSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { name, email, role, password } = parsed.data

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
    columns: { id: true },
  })
  if (existing) {
    return { error: "Un compte avec cet email existe déjà." }
  }

  const passwordHash = await hash(password, 12)
  const [user] = await db.insert(users).values({
    name,
    email,
    role: role as typeof users.$inferInsert["role"],
    passwordHash,
  }).returning({ id: users.id })

  const token = createId()
  await db.insert(emailVerificationTokens).values({
    token,
    userId: user.id,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  })

  await sendVerificationEmail({
    to: email,
    name,
    verifyUrl: `${BASE_URL}/verify-email?token=${token}`,
  })

  redirect("/register?pending=1")
}

export async function verifyEmail(token: string) {
  const row = await db.query.emailVerificationTokens.findFirst({
    where: and(
      eq(emailVerificationTokens.token, token),
      isNull(emailVerificationTokens.usedAt),
      gt(emailVerificationTokens.expiresAt, new Date())
    ),
  })

  if (!row) return { error: "Ce lien est invalide ou a expiré." }

  const now = new Date()
  await db.update(users)
    .set({ emailVerified: now, updatedAt: now })
    .where(eq(users.id, row.userId))

  await db.update(emailVerificationTokens)
    .set({ usedAt: now })
    .where(eq(emailVerificationTokens.token, token))

  redirect("/login?verified=1")
}

export async function forgotPassword(formData: FormData) {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const user = await db.query.users.findFirst({
    where: eq(users.email, parsed.data.email),
    columns: { id: true, name: true, email: true },
  })

  if (user) {
    const token = createId()
    await db.insert(passwordResetTokens).values({
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    })
    await sendPasswordResetEmail({
      to: user.email!,
      name: user.name,
      resetUrl: `${BASE_URL}/reset-password?token=${token}`,
    })
  }

  return { success: true }
}

export async function resetPassword(formData: FormData) {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { token, password } = parsed.data

  const row = await db.query.passwordResetTokens.findFirst({
    where: and(
      eq(passwordResetTokens.token, token),
      isNull(passwordResetTokens.usedAt),
      gt(passwordResetTokens.expiresAt, new Date())
    ),
  })
  if (!row) return { error: "Ce lien est invalide ou a expiré." }

  const passwordHash = await hash(password, 12)
  const now = new Date()

  await db.update(users)
    .set({ passwordHash, updatedAt: now })
    .where(eq(users.id, row.userId))

  await db.update(passwordResetTokens)
    .set({ usedAt: now })
    .where(eq(passwordResetTokens.token, token))

  redirect("/login?reset=1")
}

export async function updateProfile(formData: FormData) {
  const session = await auth()
  if (!session) redirect("/login")

  const parsed = updateProfileSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") || undefined,
    structure: formData.get("structure") || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  await db.update(users)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(users.id, session.user.id!))

  revalidatePath("/profile")
  return { success: true }
}

export async function changePassword(formData: FormData) {
  const session = await auth()
  if (!session) redirect("/login")

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id!),
    columns: { passwordHash: true },
  })
  if (!user?.passwordHash) return { error: "Compte introuvable." }

  const ok = await compare(parsed.data.currentPassword, user.passwordHash)
  if (!ok) return { error: "Mot de passe actuel incorrect." }

  const passwordHash = await hash(parsed.data.newPassword, 12)
  await db.update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.id, session.user.id!))

  return { success: true }
}
