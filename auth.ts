import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { loginSchema } from "@/lib/validations/auth"
import type { Role } from "@/lib/roles"

// NOTE: For MVP, password auth is email+password using bcrypt.
// Replace with OIDC/SSO in a future phase if needed.

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const user = await db.query.users.findFirst({
          where: eq(users.email, parsed.data.email),
        })
        if (!user || user.suspended) return null

        // TODO (Task 3 follow-up): compare hashed password with bcrypt
        // For now: only admin seed user from env is accepted
        if (parsed.data.email !== process.env.SEED_ADMIN_EMAIL) return null

        return { id: user.id, name: user.name, email: user.email, role: user.role as Role }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.role = (user as { role: Role }).role
      return token
    },
    session({ session, token }) {
      session.user.role = token.role as Role
      return session
    },
  },
})
