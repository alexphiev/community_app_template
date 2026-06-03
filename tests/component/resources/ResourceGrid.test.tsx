import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { ResourceGrid } from "@/components/resources/ResourceGrid"

const mockResource = {
  id: "r1",
  title: "Test Resource",
  description: "A test",
  type: "documentation" as const,
  mediaType: "pdf" as const,
  status: "published" as const,
  pinned: false,
  createdAt: new Date("2024-01-01"),
  tags: [],
}

describe("ResourceGrid", () => {
  it("shows empty state when no resources", () => {
    render(<ResourceGrid resources={[]} total={0} page={1} />)
    expect(screen.getByText(/aucune ressource/i)).toBeDefined()
  })

  it("shows resource count", () => {
    render(<ResourceGrid resources={[mockResource]} total={1} page={1} />)
    expect(screen.getByText("1")).toBeDefined()
  })

  it("renders resource cards", () => {
    render(<ResourceGrid resources={[mockResource]} total={1} page={1} />)
    expect(screen.getByText("Test Resource")).toBeDefined()
  })

  it("shows pagination when total > pageSize", () => {
    const resources = Array.from({ length: 12 }, (_, i) => ({ ...mockResource, id: `r${i}`, title: `Resource ${i}` }))
    const { container } = render(<ResourceGrid resources={resources} total={24} page={1} />)
    expect(container.innerHTML).toContain("Suivant")
  })
})
