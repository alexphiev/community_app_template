import { describe, it, expect } from "vitest"
import {
  createResourceSchema,
  createShareLinkSchema,
  createCommentSchema,
} from "@/lib/validations/resources"

describe("createResourceSchema", () => {
  it("accepts valid documentation resource", () => {
    const result = createResourceSchema.safeParse({
      title: "Guide du logement",
      description: "Un guide complet",
      type: "documentation",
      mediaType: "pdf",
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty title", () => {
    const result = createResourceSchema.safeParse({ title: "", type: "veille" })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain("title")
  })

  it("rejects invalid type", () => {
    const result = createResourceSchema.safeParse({ title: "Test", type: "invalid" })
    expect(result.success).toBe(false)
  })

  it("requires externalUrl for veille link type", () => {
    const result = createResourceSchema.safeParse({
      title: "Article",
      type: "veille",
      mediaType: "link",
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toContain("URL")
  })
})

describe("createShareLinkSchema", () => {
  it("accepts valid share link without password", () => {
    const result = createShareLinkSchema.safeParse({ resourceId: "abc123" })
    expect(result.success).toBe(true)
  })

  it("rejects password shorter than 4 chars", () => {
    const result = createShareLinkSchema.safeParse({ resourceId: "abc123", password: "ab" })
    expect(result.success).toBe(false)
  })
})

describe("createCommentSchema", () => {
  it("accepts valid comment", () => {
    const result = createCommentSchema.safeParse({ resourceId: "r1", body: "Great resource!" })
    expect(result.success).toBe(true)
  })

  it("rejects empty body", () => {
    const result = createCommentSchema.safeParse({ resourceId: "r1", body: "" })
    expect(result.success).toBe(false)
  })

  it("rejects body over 2000 chars", () => {
    const result = createCommentSchema.safeParse({ resourceId: "r1", body: "x".repeat(2001) })
    expect(result.success).toBe(false)
  })
})
