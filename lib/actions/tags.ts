"use server"

import { db } from "@/db"
import { tags } from "@/db/schema"
import { asc } from "drizzle-orm"

export async function getTags() {
  return db.select().from(tags).orderBy(asc(tags.name))
}
