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
      users: { findFirst: mockFindFirst, findMany: mockFindMany },
      resources: { findFirst: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
      tags: { findMany: vi.fn().mockResolvedValue([]) },
    },
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn().mockResolvedValue([]),
        orderBy: vi.fn().mockResolvedValue([]),
        limit: vi.fn(() => ({ offset: vi.fn().mockResolvedValue([]) })),
      })),
    })),
  },
}))

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }))

vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: "admin-1", role: "admin_ij_pdl" },
  }),
}))

import { suspendUser, assignRole, getPendingContent, getAnalytics, createTag, deleteTag } from "@/lib/actions/admin"

describe("suspendUser", () => {
  beforeEach(() => vi.clearAllMocks())
  it("throws when suspending self", async () => {
    await expect(suspendUser("admin-1")).rejects.toThrow("vous-même")
  })
  it("updates suspended flag for another user", async () => {
    await suspendUser("other-user")
    expect(mockUpdate).toHaveBeenCalled()
  })
})

describe("assignRole", () => {
  beforeEach(() => vi.clearAllMocks())
  it("throws for invalid role", async () => {
    await expect(assignRole("u1", "invalid_role" as never)).rejects.toThrow()
  })
  it("updates role for valid role", async () => {
    await assignRole("u1", "salarie_ij_pdl")
    expect(mockUpdate).toHaveBeenCalled()
  })
})

describe("getPendingContent", () => {
  it("returns an array", async () => {
    const result = await getPendingContent()
    expect(Array.isArray(result)).toBe(true)
  })
})

describe("getAnalytics", () => {
  it("returns an object with numeric fields", async () => {
    const result = await getAnalytics()
    expect(typeof result.totalUsers).toBe("number")
    expect(typeof result.publishedResources).toBe("number")
    expect(typeof result.publishedPosts).toBe("number")
  })
})

describe("createTag", () => {
  beforeEach(() => vi.clearAllMocks())
  it("creates a tag", async () => {
    await createTag({ name: "Emploi" })
    expect(mockInsert).toHaveBeenCalled()
  })
  it("rejects empty name", async () => {
    await expect(createTag({ name: "" })).rejects.toThrow()
  })
})

describe("deleteTag", () => {
  it("deletes a tag", async () => {
    await deleteTag("tag-1")
    expect(mockDelete).toHaveBeenCalled()
  })
})
