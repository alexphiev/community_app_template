import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { UserCard } from "@/components/directory/UserCard"

const base = {
  id: "u1",
  name: "Marie Leroy",
  email: "marie@example.com",
  role: "salarie_ij_pdl" as const,
  structure: "BIJ Nantes",
  phone: null,
  image: null,
}

describe("UserCard", () => {
  it("renders name", () => {
    render(<UserCard user={base} />)
    expect(screen.getByText("Marie Leroy")).toBeDefined()
  })
  it("renders structure", () => {
    render(<UserCard user={base} />)
    expect(screen.getByText("BIJ Nantes")).toBeDefined()
  })
  it("renders role badge", () => {
    render(<UserCard user={base} />)
    expect(screen.getByText(/Salarié/i)).toBeDefined()
  })
  it("renders initials when no image", () => {
    render(<UserCard user={base} />)
    expect(screen.getByText("ML")).toBeDefined()
  })
})
