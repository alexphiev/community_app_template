"use server"

import { db } from "@/db"
import { users, inviteTokens } from "@/db/schema"
import { eq, and, isNull, gt } from "drizzle-orm"
import { createId } from "@paralleldrive/cuid2"
import { hash } from "bcryptjs"
import { signIn, auth } from "@/auth"
import { ROLES } from "@/lib/roles"
import { inviteSchema, registerSchema } from "@/lib/validations/auth"
import { sendInviteEmail } from "@/lib/email"
import { revalidatePath } from "next/cache"

export async function inviteUser(formData: FormData) {
  const session = await auth()
  if (!session || session.user.role !== ROLES.ADMIN) {
    throw new Error("Non autorisé")
  }

  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name") || undefined,
    role: formData.get("role"),
  })
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message)
  }

  const { email, name, role } = parsed.data

  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
    columns: { id: true },
  })
  if (existingUser) {
    throw new Error("Un compte avec cet email existe déjà.")
  }

  const existingInvite = await db.query.inviteTokens.findFirst({
    where: and(
      eq(inviteTokens.email, email),
      isNull(inviteTokens.usedAt),
      gt(inviteTokens.expiresAt, new Date())
    ),
    columns: { token: true },
  })
  if (existingInvite) {
    throw new Error("Une invitation est déjà en attente pour cet email.")
  }

  const token = createId()
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000)

  await db.insert(inviteTokens).values({
    token,
    email,
    role: role as (typeof ROLES)[keyof typeof ROLES],
    name: name ?? null,
    expiresAt,
    createdById: session.user.id!,
  })

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"
  await sendInviteEmail({ to: email, name, inviteUrl: `${baseUrl}/register?token=${token}` })

  revalidatePath("/admin/users")
}

export async function getInviteByToken(token: string) {
  return db.query.inviteTokens.findFirst({
    where: eq(inviteTokens.token, token),
  })
}

export async function acceptInvite(formData: FormData) {
  const parsed = registerSchema.safeParse({
    token: formData.get("token"),
    name: formData.get("name"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { token, name, password } = parsed.data

  const invite = await db.query.inviteTokens.findFirst({
    where: and(
      eq(inviteTokens.token, token),
      isNull(inviteTokens.usedAt),
      gt(inviteTokens.expiresAt, new Date())
    ),
  })
  if (!invite) {
    return { error: "Ce lien est invalide ou a expiré." }
  }

  const passwordHash = await hash(password, 12)
  const now = new Date()

  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, invite.email),
    columns: { id: true },
  })

  if (existingUser) {
    await db.update(users)
      .set({ passwordHash, name, emailVerified: now, updatedAt: now })
      .where(eq(users.id, existingUser.id))
  } else {
    await db.insert(users).values({
      email: invite.email,
      name,
      role: invite.role,
      passwordHash,
      emailVerified: now,
    })
  }

  await db.update(inviteTokens)
    .set({ usedAt: now })
    .where(eq(inviteTokens.token, token))

  await signIn("credentials", {
    email: invite.email,
    password,
    redirectTo: "/dashboard",
  })
}
