import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock Drizzle DB - using vi.hoisted to avoid hoisting issues
const { mockFindFirst, mockFindMany, mockInsertValues, mockInsert, mockUpdateSet, mockUpdate, mockDeleteWhere, mockDelete, mockSelect } = vi.hoisted(() => {
  const mockInsertValues = vi.fn().mockResolvedValue([{ id: "new-id" }])
  const mockUpdateSet = vi.fn(() => ({ where: vi.fn().mockResolvedValue([]) }))
  const mockDeleteWhere = vi.fn().mockResolvedValue([])
  return {
    mockFindFirst: vi.fn(),
    mockFindMany: vi.fn(),
    mockInsertValues,
    mockInsert: vi.fn(() => ({ values: mockInsertValues })),
    mockUpdateSet,
    mockUpdate: vi.fn(() => ({ set: mockUpdateSet })),
    mockDeleteWhere,
    mockDelete: vi.fn(() => ({ where: mockDeleteWhere })),
    mockSelect: vi.fn(() => ({ from: vi.fn(() => ({ orderBy: vi.fn().mockResolvedValue([]) })) })),
  }
})

vi.mock("@/db", () => ({
  db: {
    query: {
      resources: { findFirst: mockFindFirst, findMany: mockFindMany },
      shareLinks: { findFirst: vi.fn() },
    },
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    select: mockSelect,
  },
}))

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }))

vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: "user-1", role: "salarie_ij_pdl", name: "Test User", email: "test@example.com" },
  }),
}))

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("$2b$hashed"),
    compare: vi.fn().mockResolvedValue(true),
  },
  hash: vi.fn().mockResolvedValue("$2b$hashed"),
  compare: vi.fn().mockResolvedValue(true),
}))

import { getResources, getResourceById, createResource, approveResource } from "@/lib/actions/resources"

describe("getResources", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns an array of resources", async () => {
    mockFindMany.mockResolvedValue([
      { id: "r1", title: "Guide", type: "documentation", status: "published" },
    ])
    const results = await getResources({ type: "documentation" })
    expect(Array.isArray(results)).toBe(true)
    expect(results[0].id).toBe("r1")
  })

  it("defaults to page 1", async () => {
    mockFindMany.mockResolvedValue([])
    await getResources({})
    expect(mockFindMany).toHaveBeenCalledOnce()
  })
})

describe("getResourceById", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns null for unknown id", async () => {
    mockFindFirst.mockResolvedValue(undefined)
    const result = await getResourceById("nonexistent")
    expect(result).toBeNull()
  })

  it("returns the resource when found", async () => {
    const resource = { id: "r1", title: "Test", type: "toolbox", status: "published" }
    mockFindFirst.mockResolvedValue(resource)
    const result = await getResourceById("r1")
    expect(result).toEqual(resource)
  })
})

describe("createResource", () => {
  beforeEach(() => vi.clearAllMocks())

  it("creates a resource and returns its id", async () => {
    mockInsertValues.mockResolvedValue([{ id: "new-resource-id" }])
    const result = await createResource({
      title: "Test Resource",
      type: "documentation",
      mediaType: "pdf",
      tagIds: [],
    })
    expect(result).toHaveProperty("id")
    expect(mockInsert).toHaveBeenCalled()
  })

  it("throws when unauthenticated", async () => {
    const { auth } = await import("@/auth")
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null)
    await expect(
      createResource({ title: "Test", type: "documentation", tagIds: [] })
    ).rejects.toThrow("Non authentifié")
  })

  it("publishes directly for salarie without approval", async () => {
    mockInsertValues.mockResolvedValue([{ id: "new-id" }])
    await createResource({ title: "Resource", type: "veille", tagIds: [] })
    const insertCall = mockInsertValues.mock.calls[0][0]
    expect(insertCall.status).toBe("published")
  })
})

describe("approveResource", () => {
  beforeEach(() => vi.clearAllMocks())

  it("throws when called by non-moderator", async () => {
    const { auth } = await import("@/auth")
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      user: { id: "user-2", role: "pro_reseau_ij" },
    })
    await expect(approveResource("r1")).rejects.toThrow("Permission refusée")
  })
})
