CREATE TYPE "public"."media_type" AS ENUM('pdf', 'video', 'audio', 'link', 'image');--> statement-breakpoint
CREATE TYPE "public"."resource_status" AS ENUM('draft', 'pending_approval', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."resource_type" AS ENUM('documentation', 'toolbox', 'veille', 'tutorial');--> statement-breakpoint
CREATE TABLE "comments" (
	"id" text PRIMARY KEY NOT NULL,
	"resource_id" text NOT NULL,
	"author_id" text NOT NULL,
	"parent_id" text,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resource_files" (
	"id" text PRIMARY KEY NOT NULL,
	"resource_id" text NOT NULL,
	"s3_key" text NOT NULL,
	"filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"is_current" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resource_tags" (
	"resource_id" text NOT NULL,
	"tag_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"body" text,
	"type" "resource_type" NOT NULL,
	"status" "resource_status" DEFAULT 'draft' NOT NULL,
	"media_type" "media_type",
	"external_url" text,
	"author_id" text NOT NULL,
	"approved_by_id" text,
	"pinned" boolean DEFAULT false NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"wp_post_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "resources_wp_post_id_unique" UNIQUE("wp_post_id")
);
--> statement-breakpoint
CREATE TABLE "share_links" (
	"id" text PRIMARY KEY NOT NULL,
	"resource_id" text NOT NULL,
	"token" text NOT NULL,
	"password_hash" text,
	"expires_at" timestamp,
	"created_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "share_links_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tags_name_unique" UNIQUE("name"),
	CONSTRAINT "tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_files" ADD CONSTRAINT "resource_files_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_tags" ADD CONSTRAINT "resource_tags_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_tags" ADD CONSTRAINT "resource_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_approved_by_id_user_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "share_links" ADD CONSTRAINT "share_links_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "share_links" ADD CONSTRAINT "share_links_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "comments_resource_idx" ON "comments" USING btree ("resource_id");--> statement-breakpoint
CREATE INDEX "comments_parent_idx" ON "comments" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "resource_files_resource_idx" ON "resource_files" USING btree ("resource_id");--> statement-breakpoint
CREATE INDEX "resources_type_status_idx" ON "resources" USING btree ("type","status");--> statement-breakpoint
CREATE INDEX "resources_author_idx" ON "resources" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "share_links_token_idx" ON "share_links" USING btree ("token");