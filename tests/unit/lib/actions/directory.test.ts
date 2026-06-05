import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockFindMany } = vi.hoisted(() => ({
  mockFindMany: vi.fn().mockResolvedValue([]),
}))

vi.mock("@/db", () => ({
  db: {
    query: {
      users: { findMany: mockFindMany },
    },
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn().mockResolvedValue([]),
        limit: vi.fn(() => ({ offset: vi.fn().mockResolvedValue([]) })),
      })),
    })),
  },
}))

vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: "u1", role: "salarie_ij_pdl" },
  }),
}))

import { searchUsers } from "@/lib/actions/directory"

describe("searchUsers", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns an array", async () => {
    const result = await searchUsers({})
    expect(Array.isArray(result)).toBe(true)
  })

  it("accepts a query string without throwing", async () => {
    await expect(searchUsers({ query: "Marie" })).resolves.toBeDefined()
  })

  it("accepts role filter without throwing", async () => {
    await expect(searchUsers({ role: "salarie_ij_pdl" })).resolves.toBeDefined()
  })
})
