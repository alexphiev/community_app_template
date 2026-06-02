import { describe, it, expect, vi } from "vitest"

vi.mock("@/auth", () => ({
  auth: vi.fn((handler: unknown) => handler),
}))

vi.mock("next-auth", () => ({
  default: vi.fn(() => ({
    handlers: { GET: vi.fn(), POST: vi.fn() },
    signIn: vi.fn(),
    signOut: vi.fn(),
    auth: vi.fn((handler: unknown) => handler),
  })),
}))

import { getRouteRole } from "@/middleware"

describe("getRouteRole", () => {
  it("admin routes require admin role", () => {
    expect(getRouteRole("/admin/users")).toBe("admin")
  })
  it("chat routes require chat access", () => {
    expect(getRouteRole("/chat/channels")).toBe("chat")
  })
  it("public routes return null", () => {
    expect(getRouteRole("/login")).toBe(null)
    expect(getRouteRole("/")).toBe(null)
  })
  it("dashboard requires any authenticated user", () => {
    expect(getRouteRole("/dashboard")).toBe("authenticated")
  })
})
