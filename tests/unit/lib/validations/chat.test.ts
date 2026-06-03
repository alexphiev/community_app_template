import { describe, it, expect } from "vitest"
import { sendMessageSchema, createChannelSchema, updateNotifPrefSchema } from "@/lib/validations/chat"

describe("sendMessageSchema", () => {
  it("accepts valid message", () => {
    expect(sendMessageSchema.safeParse({ channelId: "c1", body: "Hello!" }).success).toBe(true)
  })
  it("rejects empty body", () => {
    expect(sendMessageSchema.safeParse({ channelId: "c1", body: "" }).success).toBe(false)
  })
  it("rejects body over 4000 chars", () => {
    expect(sendMessageSchema.safeParse({ channelId: "c1", body: "x".repeat(4001) }).success).toBe(false)
  })
})

describe("createChannelSchema", () => {
  it("accepts valid channel", () => {
    expect(createChannelSchema.safeParse({ name: "annonces", type: "channel" }).success).toBe(true)
  })
  it("rejects empty name", () => {
    expect(createChannelSchema.safeParse({ name: "", type: "channel" }).success).toBe(false)
  })
})

describe("updateNotifPrefSchema", () => {
  it("accepts valid pref", () => {
    expect(updateNotifPrefSchema.safeParse({ channelId: "c1", pref: "muted" }).success).toBe(true)
  })
  it("rejects invalid pref", () => {
    expect(updateNotifPrefSchema.safeParse({ channelId: "c1", pref: "never" }).success).toBe(false)
  })
})
