// Run once: DATABASE_URL=... SEED_ADMIN_EMAIL=you@example.com SEED_ADMIN_PASSWORD=yourpass tsx scripts/seed-admin-password.ts
import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "../db/schema"
import { eq } from "drizzle-orm"
import { hash } from "bcryptjs"
import { createId } from "@paralleldrive/cuid2"

const email = process.env.SEED_ADMIN_EMAIL
const password = process.env.SEED_ADMIN_PASSWORD

if (!email || !password) {
  console.error("Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD env vars")
  process.exit(1)
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const db = drizzle(pool, { schema })

const passwordHash = await hash(password, 12)

const existing = await db.query.users.findFirst({
  where: eq(schema.users.email, email),
  columns: { id: true },
})

if (existing) {
  await db.update(schema.users)
    .set({ passwordHash, emailVerified: new Date(), role: "admin_ij_pdl", updatedAt: new Date() })
    .where(eq(schema.users.id, existing.id))
  console.log(`Updated password for existing user: ${email}`)
} else {
  await db.insert(schema.users).values({
    id: createId(),
    email,
    role: "admin_ij_pdl",
    passwordHash,
    emailVerified: new Date(),
  })
  console.log(`Created admin user: ${email}`)
}

await pool.end()
