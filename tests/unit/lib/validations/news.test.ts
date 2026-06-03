import { describe, it, expect } from "vitest"
import { createPostSchema, createPostCommentSchema, createEventSchema, rsvpSchema } from "@/lib/validations/news"

describe("createPostSchema", () => {
  it("accepts valid post", () => {
    const r = createPostSchema.safeParse({ body: "Hello réseau!" })
    expect(r.success).toBe(true)
  })
  it("rejects empty body", () => {
    const r = createPostSchema.safeParse({ body: "" })
    expect(r.success).toBe(false)
  })
  it("rejects body over 5000 chars", () => {
    const r = createPostSchema.safeParse({ body: "x".repeat(5001) })
    expect(r.success).toBe(false)
  })
})

describe("createPostCommentSchema", () => {
  it("accepts valid comment", () => {
    const r = createPostCommentSchema.safeParse({ postId: "p1", body: "Great post!" })
    expect(r.success).toBe(true)
  })
  it("rejects empty body", () => {
    const r = createPostCommentSchema.safeParse({ postId: "p1", body: "" })
    expect(r.success).toBe(false)
  })
})

describe("createEventSchema", () => {
  it("accepts valid event", () => {
    const r = createEventSchema.safeParse({
      title: "Réunion équipe",
      startAt: new Date("2025-01-15T09:00:00"),
      endAt:   new Date("2025-01-15T11:00:00"),
      category: "reunion",
    })
    expect(r.success).toBe(true)
  })
  it("rejects event where endAt is before startAt", () => {
    const r = createEventSchema.safeParse({
      title: "Bad event",
      startAt: new Date("2025-01-15T11:00:00"),
      endAt:   new Date("2025-01-15T09:00:00"),
      category: "reunion",
    })
    expect(r.success).toBe(false)
  })
  it("rejects missing title", () => {
    const r = createEventSchema.safeParse({
      title: "",
      startAt: new Date("2025-01-15T09:00:00"),
      endAt:   new Date("2025-01-15T11:00:00"),
      category: "formation",
    })
    expect(r.success).toBe(false)
  })
})

describe("rsvpSchema", () => {
  it("accepts valid rsvp", () => {
    const r = rsvpSchema.safeParse({ eventId: "e1" })
    expect(r.success).toBe(true)
  })
})
