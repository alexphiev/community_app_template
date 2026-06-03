import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockFindFirst, mockFindMany, mockInsertValues, mockInsert,
        mockUpdateSet, mockUpdate, mockDeleteWhere, mockDelete } = vi.hoisted(() => {
  const mockInsertValues = vi.fn().mockResolvedValue([])
  const mockUpdateSet = vi.fn(() => ({ where: vi.fn().mockResolvedValue([]) }))
  const mockDeleteWhere = vi.fn().mockResolvedValue([])
  return {
    mockFindFirst: vi.fn(),
    mockFindMany: vi.fn().mockResolvedValue([]),
    mockInsertValues,
    mockInsert: vi.fn(() => ({ values: mockInsertValues })),
    mockUpdateSet,
    mockUpdate: vi.fn(() => ({ set: mockUpdateSet })),
    mockDeleteWhere,
    mockDelete: vi.fn(() => ({ where: mockDeleteWhere })),
  }
})

vi.mock("@/db", () => ({
  db: {
    query: {
      channels: { findFirst: mockFindFirst, findMany: mockFindMany },
      chatMessages: { findMany: vi.fn().mockResolvedValue([]) },
      channelMembers: { findFirst: vi.fn().mockResolvedValue(null) },
      notificationPrefs: { findFirst: vi.fn().mockResolvedValue(null) },
    },
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  },
}))

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }))

vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: "user-1", role: "salarie_ij_pdl" },
  }),
}))

import { getChannels, sendMessage, createChannel, updateNotifPref } from "@/lib/actions/chat"

describe("getChannels", () => {
  it("returns an array", async () => {
    const result = await getChannels()
    expect(Array.isArray(result)).toBe(true)
  })
})

describe("sendMessage", () => {
  beforeEach(() => vi.clearAllMocks())
  it("throws when unauthenticated", async () => {
    const { auth } = await import("@/auth")
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null)
    await expect(sendMessage({ channelId: "c1", body: "Hello" })).rejects.toThrow("Non authentifié")
  })
  it("creates a message and returns id", async () => {
    mockInsertValues.mockResolvedValueOnce([{ id: "m1" }])
    const result = await sendMessage({ channelId: "c1", body: "Hello team!" })
    expect(result).toHaveProperty("id")
    expect(mockInsert).toHaveBeenCalled()
  })
})

describe("createChannel", () => {
  beforeEach(() => vi.clearAllMocks())
  it("throws for non-moderator", async () => {
    const { auth } = await import("@/auth")
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      user: { id: "u1", role: "pro_reseau_ij" },
    })
    await expect(createChannel({ name: "new-channel", type: "channel" })).rejects.toThrow("Permission refusée")
  })
  it("creates a channel for moderator", async () => {
    mockInsertValues.mockResolvedValueOnce([{ id: "c1" }])
    const result = await createChannel({ name: "new-channel", type: "channel" })
    expect(result).toHaveProperty("id")
  })
})

describe("updateNotifPref", () => {
  it("upserts a notification preference", async () => {
    await updateNotifPref({ channelId: "c1", pref: "muted" })
    expect(mockInsert).toHaveBeenCalled()
  })
})
