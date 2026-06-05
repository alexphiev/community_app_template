import { pgTable, text, timestamp, boolean, integer, pgEnum, primaryKey, index, type AnyPgColumn } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
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
  passwordHash: text("password_hash"),
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

export const inviteTokens = pgTable(
  "invite_tokens",
  {
    token: text("token").primaryKey(),
    email: text("email").notNull(),
    role: roleEnum("role").notNull(),
    name: text("name"),
    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
    usedAt: timestamp("used_at", { mode: "date" }),
    createdById: text("created_by_id").notNull().references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("invite_tokens_email_idx").on(t.email)]
)

export const inviteTokensRelations = relations(inviteTokens, ({ one }) => ({
  createdBy: one(users, { fields: [inviteTokens.createdById], references: [users.id] }),
}))

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

export const resourcesRelations = relations(resources, ({ one, many }) => ({
  author: one(users, { fields: [resources.authorId], references: [users.id] }),
  approvedBy: one(users, { fields: [resources.approvedById], references: [users.id] }),
  files: many(resourceFiles),
  tags: many(resourceTags),
  comments: many(comments),
}))

export const resourceTagsRelations = relations(resourceTags, ({ one }) => ({
  resource: one(resources, { fields: [resourceTags.resourceId], references: [resources.id] }),
  tag: one(tags, { fields: [resourceTags.tagId], references: [tags.id] }),
}))

export const tagsRelations = relations(tags, ({ many }) => ({
  resources: many(resourceTags),
}))

export const commentsRelations = relations(comments, ({ one, many }) => ({
  resource: one(resources, { fields: [comments.resourceId], references: [resources.id] }),
  author: one(users, { fields: [comments.authorId], references: [users.id] }),
  parent: one(comments, { fields: [comments.parentId], references: [comments.id] }),
  replies: many(comments),
}))

export const shareLinksRelations = relations(shareLinks, ({ one }) => ({
  resource: one(resources, { fields: [shareLinks.resourceId], references: [resources.id] }),
  createdBy: one(users, { fields: [shareLinks.createdById], references: [users.id] }),
}))

export const resourceFilesRelations = relations(resourceFiles, ({ one }) => ({
  resource: one(resources, { fields: [resourceFiles.resourceId], references: [resources.id] }),
}))

// ─── Posts / Newsfeed ────────────────────────────────────────────────────────

export const posts = pgTable("posts", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  authorId: text("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  pinned: boolean("pinned").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("posts_author_idx").on(t.authorId),
  index("posts_created_idx").on(t.createdAt),
])

export const postComments = pgTable("post_comments", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  authorId: text("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  parentId: text("parent_id").references((): AnyPgColumn => postComments.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("post_comments_post_idx").on(t.postId),
])

export const postReactions = pgTable("post_reactions", {
  postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  emoji: text("emoji").notNull().default("👍"),
}, (t) => [
  primaryKey({ columns: [t.postId, t.userId] }),
])

// ─── Events / Agenda ─────────────────────────────────────────────────────────

export const eventCategoryEnum = pgEnum("event_category", [
  "formation",
  "reunion",
  "evenement",
  "autre",
])

export const events = pgTable("events", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  title: text("title").notNull(),
  description: text("description"),
  location: text("location"),
  startAt: timestamp("start_at").notNull(),
  endAt: timestamp("end_at").notNull(),
  category: eventCategoryEnum("category").notNull().default("evenement"),
  isInternal: boolean("is_internal").notNull().default(true),
  externalFormUrl: text("external_form_url"),
  openAgendaId: text("open_agenda_id"),
  createdById: text("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("events_start_idx").on(t.startAt),
])

export const eventRsvps = pgTable("event_rsvps", {
  eventId: text("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  primaryKey({ columns: [t.eventId, t.userId] }),
])

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, { fields: [posts.authorId], references: [users.id] }),
  comments: many(postComments),
  reactions: many(postReactions),
}))

export const postCommentsRelations = relations(postComments, ({ one, many }) => ({
  post: one(posts, { fields: [postComments.postId], references: [posts.id] }),
  author: one(users, { fields: [postComments.authorId], references: [users.id] }),
  parent: one(postComments, { fields: [postComments.parentId], references: [postComments.id] }),
  replies: many(postComments),
}))

export const postReactionsRelations = relations(postReactions, ({ one }) => ({
  post: one(posts, { fields: [postReactions.postId], references: [posts.id] }),
  user: one(users, { fields: [postReactions.userId], references: [users.id] }),
}))

export const eventsRelations = relations(events, ({ one, many }) => ({
  createdBy: one(users, { fields: [events.createdById], references: [users.id] }),
  rsvps: many(eventRsvps),
}))

export const eventRsvpsRelations = relations(eventRsvps, ({ one }) => ({
  event: one(events, { fields: [eventRsvps.eventId], references: [events.id] }),
  user: one(users, { fields: [eventRsvps.userId], references: [users.id] }),
}))

// ─── Chat ─────────────────────────────────────────────────────────────────────

export const channelTypeEnum = pgEnum("channel_type", ["channel", "direct"])

export const notifPrefEnum = pgEnum("notif_pref", ["all", "mentions", "digest", "muted"])

export const channels = pgTable("channels", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(),
  description: text("description"),
  type: channelTypeEnum("type").notNull().default("channel"),
  createdById: text("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("channels_type_idx").on(t.type),
])

export const channelMembers = pgTable("channel_members", {
  channelId: text("channel_id").notNull().references(() => channels.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
}, (t) => [
  primaryKey({ columns: [t.channelId, t.userId] }),
])

export const chatMessages = pgTable("chat_messages", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  channelId: text("channel_id").notNull().references(() => channels.id, { onDelete: "cascade" }),
  authorId: text("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  editedAt: timestamp("edited_at"),
}, (t) => [
  index("chat_messages_channel_idx").on(t.channelId, t.createdAt),
])

export const notificationPrefs = pgTable("notification_prefs", {
  channelId: text("channel_id").notNull().references(() => channels.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  pref: notifPrefEnum("pref").notNull().default("all"),
}, (t) => [
  primaryKey({ columns: [t.channelId, t.userId] }),
])

export const channelsRelations = relations(channels, ({ one, many }) => ({
  createdBy: one(users, { fields: [channels.createdById], references: [users.id] }),
  members: many(channelMembers),
  messages: many(chatMessages),
}))

export const channelMembersRelations = relations(channelMembers, ({ one }) => ({
  channel: one(channels, { fields: [channelMembers.channelId], references: [channels.id] }),
  user: one(users, { fields: [channelMembers.userId], references: [users.id] }),
}))

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  channel: one(channels, { fields: [chatMessages.channelId], references: [channels.id] }),
  author: one(users, { fields: [chatMessages.authorId], references: [users.id] }),
}))

export const notificationPrefsRelations = relations(notificationPrefs, ({ one }) => ({
  channel: one(channels, { fields: [notificationPrefs.channelId], references: [channels.id] }),
  user: one(users, { fields: [notificationPrefs.userId], references: [users.id] }),
}))
