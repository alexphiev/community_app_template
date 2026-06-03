import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock Drizzle DB - using vi.hoisted to avoid hoisting issues
const { mockFindFirst, mockFindMany, mockInsertValues, mockInsert, mockUpdateSet, mockUpdate, mockDeleteWhere, mockDelete, mockSelect, mockShareLinksFindFirst } = vi.hoisted(() => {
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
    mockShareLinksFindFirst: vi.fn(),
  }
})

vi.mock("@/db", () => ({
  db: {
    query: {
      resources: { findFirst: mockFindFirst, findMany: mockFindMany },
      shareLinks: { findFirst: mockShareLinksFindFirst },
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

import { getResources, getResourceById, createResource, approveResource, deleteResource, updateResource, createComment, createShareLink, verifyShareLink } from "@/lib/actions/resources"

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

describe("createResource — pending_approval", () => {
  beforeEach(() => vi.clearAllMocks())

  it("sets pending_approval status for pro_reseau_ij role", async () => {
    const { auth } = await import("@/auth")
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      user: { id: "user-3", role: "pro_reseau_ij" },
    })
    mockInsertValues.mockResolvedValue([{ id: "pending-id" }])
    await createResource({ title: "Resource", type: "veille", tagIds: [] })
    const insertCall = mockInsertValues.mock.calls[0][0]
    expect(insertCall.status).toBe("pending_approval")
  })
})

describe("deleteResource", () => {
  beforeEach(() => vi.clearAllMocks())

  it("throws when unauthenticated", async () => {
    const { auth } = await import("@/auth")
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null)
    await expect(deleteResource("r1")).rejects.toThrow("Non authentifié")
  })

  it("throws when caller is neither owner nor moderator", async () => {
    const { auth } = await import("@/auth")
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      user: { id: "other-user", role: "pro_reseau_ij" },
    })
    mockFindFirst.mockResolvedValueOnce({
      id: "r1",
      authorId: "original-author",
      type: "documentation",
      status: "published",
    })
    await expect(deleteResource("r1")).rejects.toThrow("Permission refusée")
  })

  it("succeeds when caller is the owner", async () => {
    const { auth } = await import("@/auth")
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      user: { id: "owner-id", role: "pro_reseau_ij" },
    })
    mockFindFirst.mockResolvedValueOnce({
      id: "r1",
      authorId: "owner-id",
      type: "documentation",
      status: "published",
    })
    await expect(deleteResource("r1")).resolves.not.toThrow()
    expect(mockDelete).toHaveBeenCalled()
  })
})

describe("createComment", () => {
  beforeEach(() => vi.clearAllMocks())

  it("throws when unauthenticated", async () => {
    const { auth } = await import("@/auth")
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null)
    await expect(
      createComment({ resourceId: "r1", body: "Hello" })
    ).rejects.toThrow("Non authentifié")
  })

  it("creates a comment and returns an id", async () => {
    mockInsertValues.mockResolvedValue([{ id: "c1" }])
    const result = await createComment({ resourceId: "r1", body: "Great resource!" })
    expect(result).toHaveProperty("id")
    expect(mockInsert).toHaveBeenCalled()
  })
})

describe("createShareLink", () => {
  beforeEach(() => vi.clearAllMocks())

  it("throws when unauthenticated", async () => {
    const { auth } = await import("@/auth")
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null)
    await expect(
      createShareLink({ resourceId: "r1" })
    ).rejects.toThrow("Non authentifié")
  })

  it("creates a share link and returns a token", async () => {
    mockInsertValues.mockResolvedValue([{}])
    const result = await createShareLink({ resourceId: "r1" })
    expect(result).toHaveProperty("token")
    expect(typeof result.token).toBe("string")
    expect(result.token.length).toBeGreaterThan(0)
  })

  it("hashes the password when provided", async () => {
    const { default: bcrypt } = await import("bcryptjs")
    mockInsertValues.mockResolvedValue([{}])
    await createShareLink({ resourceId: "r1", password: "secret123" })
    expect(bcrypt.hash).toHaveBeenCalledWith("secret123", 10)
  })
})

describe("verifyShareLink", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns null for unknown token", async () => {
    mockShareLinksFindFirst.mockResolvedValueOnce(undefined)
    const result = await verifyShareLink("unknown-token")
    expect(result).toBeNull()
  })

  it("returns null for expired link", async () => {
    mockShareLinksFindFirst.mockResolvedValueOnce({
      token: "t1",
      expiresAt: new Date("2000-01-01"),
      passwordHash: null,
      resource: { id: "r1", title: "Test", files: [] },
    })
    const result = await verifyShareLink("t1")
    expect(result).toBeNull()
  })

  it("returns password_required when link has password and none provided", async () => {
    mockShareLinksFindFirst.mockResolvedValueOnce({
      token: "t1",
      expiresAt: null,
      passwordHash: "$2b$hashed",
      resource: { id: "r1", title: "Test", files: [] },
    })
    const result = await verifyShareLink("t1")
    expect(result).toBe("password_required")
  })

  it("returns invalid_password for wrong password", async () => {
    const { default: bcrypt } = await import("bcryptjs")
    mockShareLinksFindFirst.mockResolvedValueOnce({
      token: "t1",
      expiresAt: null,
      passwordHash: "$2b$hashed",
      resource: { id: "r1", title: "Test", files: [] },
    })
    ;(bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValueOnce(false)
    const result = await verifyShareLink("t1", "wrongpassword")
    expect(result).toBe("invalid_password")
  })

  it("returns the resource for a valid link without password", async () => {
    const resource = { id: "r1", title: "Test Resource", files: [] }
    mockShareLinksFindFirst.mockResolvedValueOnce({
      token: "t1",
      expiresAt: null,
      passwordHash: null,
      resource,
    })
    const result = await verifyShareLink("t1")
    expect(result).toEqual(resource)
  })
})
