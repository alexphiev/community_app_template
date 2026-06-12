import type { NextAuthConfig } from "next-auth"
import type { Role } from "@/lib/roles"

// Edge-compatible config — no DB imports, no pg driver.
// Used by middleware for JWT-only session reading.
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.role = (user as { role: Role }).role
      return token
    },
    session({ session, token }) {
      session.user.id = token.sub!
      session.user.role = token.role as Role
      return session
    },
    authorized({ auth }) {
      return !!auth?.user
    },
  },
} satisfies NextAuthConfig
