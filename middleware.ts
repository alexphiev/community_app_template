import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { ROLES, hasPermission } from "@/lib/roles"
import type { Role } from "@/lib/roles"

type RouteRequirement = "admin" | "chat" | "resources" | "news" | "agenda" | "directory" | "authenticated" | null

export function getRouteRole(pathname: string): RouteRequirement {
  if (pathname.startsWith("/admin")) return "admin"
  if (pathname.startsWith("/chat")) return "chat"
  if (pathname.startsWith("/resources")) return "resources"
  if (pathname.startsWith("/news")) return "news"
  if (pathname.startsWith("/agenda")) return "agenda"
  if (pathname.startsWith("/directory")) return "directory"
  if (pathname.startsWith("/dashboard")) return "authenticated"
  return null
}

export default auth((req) => {
  const { pathname } = req.nextUrl
  const requirement = getRouteRole(pathname)

  if (requirement === null) return NextResponse.next()

  const session = req.auth
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (requirement === "authenticated") return NextResponse.next()

  const rawRole = session.user.role
  const role = (Object.values(ROLES) as string[]).includes(rawRole) ? (rawRole as Role) : null
  if (!role || !hasPermission(role, requirement)) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
