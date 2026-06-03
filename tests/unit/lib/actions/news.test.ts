import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockFindFirst, mockFindMany, mockInsertValues, mockInsert,
        mockUpdateSet, mockUpdate, mockDeleteWhere, mockDelete } = vi.hoisted(() => {
  const mockInsertValues = vi.fn().mockResolvedValue([{ id: "new-id" }])
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
      posts: { findFirst: mockFindFirst, findMany: mockFindMany },
      events: { findFirst: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
      eventRsvps: { findFirst: vi.fn().mockResolvedValue(null) },
      postReactions: { findFirst: vi.fn().mockResolvedValue(null) },
    },
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  },
}))

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }))

vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: "user-1", role: "salarie_ij_pdl", name: "Test User" },
  }),
}))

import { getPosts, createPost, deletePost, createPostComment, getEvents, createEvent, toggleRsvp } from "@/lib/actions/news"

describe("getPosts", () => {
  beforeEach(() => vi.clearAllMocks())
  it("returns an array", async () => {
    mockFindMany.mockResolvedValue([{ id: "p1", body: "Test", pinned: false }])
    const result = await getPosts()
    expect(Array.isArray(result)).toBe(true)
  })
})

describe("createPost", () => {
  beforeEach(() => vi.clearAllMocks())
  it("creates a post and returns id", async () => {
    mockInsertValues.mockResolvedValue([{ id: "p1" }])
    const result = await createPost({ body: "Hello réseau!" })
    expect(result).toHaveProperty("id")
  })
  it("throws when unauthenticated", async () => {
    const { auth } = await import("@/auth")
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null)
    await expect(createPost({ body: "Hello" })).rejects.toThrow("Non authentifié")
  })
})

describe("deletePost", () => {
  beforeEach(() => vi.clearAllMocks())
  it("throws when not owner and not moderator", async () => {
    const { auth } = await import("@/auth")
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      user: { id: "other", role: "pro_reseau_ij" },
    })
    mockFindFirst.mockResolvedValueOnce({ id: "p1", authorId: "owner" })
    await expect(deletePost("p1")).rejects.toThrow("Permission refusée")
  })
})

describe("createPostComment", () => {
  beforeEach(() => vi.clearAllMocks())
  it("creates a comment", async () => {
    mockInsertValues.mockResolvedValue([{ id: "c1" }])
    const result = await createPostComment({ postId: "p1", body: "Great!" })
    expect(result).toHaveProperty("id")
  })
})

describe("getEvents", () => {
  it("returns an array", async () => {
    const result = await getEvents({})
    expect(Array.isArray(result)).toBe(true)
  })
})

describe("createEvent", () => {
  beforeEach(() => vi.clearAllMocks())
  it("throws for non-moderator", async () => {
    const { auth } = await import("@/auth")
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      user: { id: "u1", role: "pro_reseau_ij" },
    })
    await expect(createEvent({
      title: "Réunion",
      startAt: new Date("2025-01-15T09:00:00"),
      endAt: new Date("2025-01-15T11:00:00"),
      category: "reunion",
    })).rejects.toThrow("Permission refusée")
  })
  it("creates an event for moderator", async () => {
    mockInsertValues.mockResolvedValue([{ id: "e1" }])
    const result = await createEvent({
      title: "Réunion",
      startAt: new Date("2025-01-15T09:00:00"),
      endAt: new Date("2025-01-15T11:00:00"),
      category: "reunion",
    })
    expect(result).toHaveProperty("id")
  })
})

describe("toggleRsvp", () => {
  beforeEach(() => vi.clearAllMocks())
  it("inserts rsvp when not already registered", async () => {
    const { db } = await import("@/db")
    ;(db.query.eventRsvps.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null)
    await toggleRsvp("e1")
    expect(mockInsert).toHaveBeenCalled()
  })
  it("removes rsvp when already registered", async () => {
    const { db } = await import("@/db")
    ;(db.query.eventRsvps.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ eventId: "e1", userId: "user-1" })
    await toggleRsvp("e1")
    expect(mockDelete).toHaveBeenCalled()
  })
})
