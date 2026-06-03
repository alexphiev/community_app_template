"use server"

import { db } from "@/db"
import { users } from "@/db/schema"
import { eq, ilike, or, and } from "drizzle-orm"
import type { Role } from "@/lib/roles"

export async function searchUsers(filter: {
  query?: string
  role?: Role
  structure?: string
  page?: number
}) {
  const { query, role, structure, page = 1 } = filter
  const limit = 24
  const offset = (page - 1) * limit

  const base = eq(users.suspended, false)
  const roleCond = role ? eq(users.role, role) : undefined
  const structCond = structure ? ilike(users.structure, `%${structure}%`) : undefined
  const queryCond = query
    ? or(
        ilike(users.name, `%${query}%`),
        ilike(users.email, `%${query}%`),
        ilike(users.structure, `%${query}%`)
      )
    : undefined

  return db.query.users.findMany({
    where: and(base, roleCond, structCond, queryCond),
    columns: { id: true, name: true, email: true, role: true, structure: true, phone: true, image: true },
    limit,
    offset,
  })
}
