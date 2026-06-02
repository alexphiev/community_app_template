import { describe, it, expect } from "vitest"
import { ROLES, hasPermission, canPublish, canModerate } from "@/lib/roles"

describe("ROLES constants", () => {
  it("exports all five role slugs", () => {
    expect(Object.values(ROLES)).toEqual([
      "admin_ij_pdl",
      "salarie_ij_pdl",
      "pro_reseau_ij",
      "relais_externe",
      "guest",
    ])
  })
})

describe("hasPermission", () => {
  it("admin can access admin panel", () => {
    expect(hasPermission("admin_ij_pdl", "admin")).toBe(true)
  })
  it("salarie cannot access admin panel", () => {
    expect(hasPermission("salarie_ij_pdl", "admin")).toBe(false)
  })
  it("guest cannot access chat", () => {
    expect(hasPermission("guest", "chat")).toBe(false)
  })
  it("pro_reseau_ij can access chat", () => {
    expect(hasPermission("pro_reseau_ij", "chat")).toBe(true)
  })
})

describe("canPublish", () => {
  it("admin can publish directly", () => {
    expect(canPublish("admin_ij_pdl")).toEqual({ allowed: true, requiresApproval: false })
  })
  it("pro_reseau_ij publish requires approval", () => {
    expect(canPublish("pro_reseau_ij")).toEqual({ allowed: true, requiresApproval: true })
  })
  it("guest cannot publish", () => {
    expect(canPublish("guest")).toEqual({ allowed: false, requiresApproval: false })
  })
})

describe("canModerate", () => {
  it("admin can moderate", () => expect(canModerate("admin_ij_pdl")).toBe(true))
  it("salarie can moderate", () => expect(canModerate("salarie_ij_pdl")).toBe(true))
  it("pro cannot moderate", () => expect(canModerate("pro_reseau_ij")).toBe(false))
})
