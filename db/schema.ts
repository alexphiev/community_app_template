import { pgTable, text, timestamp, boolean, integer, pgEnum, primaryKey, index, type AnyPgColumn } from "drizzle-orm/pg-core"
import { createId } from "@paralleldrive/cuid2"
import { ROLES } from "@/lib/roles"

const roleValues = Object.values(ROLES) as [string, ...string[]]
export const roleEnum = pgEnum("role", roleValues)

export const users = pgTable("user", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  role: roleEnum("role").notNull().default("pro_reseau_ij"),
  structure: text("structure"),
  phone: text("phone"),
  suspended: boolean("suspended").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const accounts = pgTable(
  "account",
  {
    userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compositePk: primaryKey({ columns: [account.provider, account.providerAccountId] }),
  })
)

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
})

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compositePk: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
)

export const resourceTypeEnum = pgEnum("resource_type", [
  "documentation",
  "toolbox",
  "veille",
  "tutorial",
])

export const resourceStatusEnum = pgEnum("resource_status", [
  "draft",
  "pending_approval",
  "published",
  "archived",
])

export const mediaTypeEnum = pgEnum("media_type", ["pdf", "video", "audio", "link", "image"])

export const tags = pgTable("tags", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const resources = pgTable("resources", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  title: text("title").notNull(),
  description: text("description"),
  body: text("body"),
  type: resourceTypeEnum("type").notNull(),
  status: resourceStatusEnum("status").notNull().default("draft"),
  mediaType: mediaTypeEnum("media_type"),
  externalUrl: text("external_url"),
  authorId: text("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  approvedById: text("approved_by_id").references(() => users.id),
  pinned: boolean("pinned").notNull().default(false),
  viewCount: integer("view_count").notNull().default(0),
  wpPostId: text("wp_post_id").unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("resources_type_status_idx").on(t.type, t.status),
  index("resources_author_idx").on(t.authorId),
])

export const resourceFiles = pgTable("resource_files", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  resourceId: text("resource_id").notNull().references(() => resources.id, { onDelete: "cascade" }),
  s3Key: text("s3_key").notNull(),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  version: integer("version").notNull().default(1),
  isCurrent: boolean("is_current").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("resource_files_resource_idx").on(t.resourceId),
])

export const resourceTags = pgTable("resource_tags", {
  resourceId: text("resource_id").notNull().references(() => resources.id, { onDelete: "cascade" }),
  tagId: text("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
}, (t) => [
  primaryKey({ columns: [t.resourceId, t.tagId] }),
])

export const comments = pgTable("comments", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  resourceId: text("resource_id").notNull().references(() => resources.id, { onDelete: "cascade" }),
  authorId: text("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  parentId: text("parent_id").references((): AnyPgColumn => comments.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("comments_resource_idx").on(t.resourceId),
  index("comments_parent_idx").on(t.parentId),
])

export const shareLinks = pgTable("share_links", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  resourceId: text("resource_id").notNull().references(() => resources.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  passwordHash: text("password_hash"),
  expiresAt: timestamp("expires_at"),
  createdById: text("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})
