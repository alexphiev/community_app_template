import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { ResourceCard } from "@/components/resources/ResourceCard"

const base = {
  id: "r1",
  title: "Guide du Premier Logement",
  description: "Un dossier complet sur les aides au logement.",
  type: "documentation" as const,
  mediaType: "pdf" as const,
  status: "published" as const,
  pinned: false,
  createdAt: new Date("2024-01-15"),
  tags: [{ tag: { id: "t1", name: "Logement", slug: "logement" } }],
}

describe("ResourceCard", () => {
  it("renders title", () => {
    render(<ResourceCard resource={base} />)
    expect(screen.getByText("Guide du Premier Logement")).toBeDefined()
  })

  it("renders description", () => {
    render(<ResourceCard resource={base} />)
    expect(screen.getByText(/dossier complet/)).toBeDefined()
  })

  it("renders tag pill", () => {
    render(<ResourceCard resource={base} />)
    expect(screen.getByText("Logement")).toBeDefined()
  })

  it("shows pinned badge when pinned", () => {
    render(<ResourceCard resource={{ ...base, pinned: true }} />)
    expect(screen.getByText(/mise en avant/i)).toBeDefined()
  })

  it("shows pending badge for pending_approval status", () => {
    render(<ResourceCard resource={{ ...base, status: "pending_approval" }} />)
    expect(screen.getByText(/validation/i)).toBeDefined()
  })

  it("renders without description gracefully", () => {
    render(<ResourceCard resource={{ ...base, description: null }} />)
    expect(screen.getByText("Guide du Premier Logement")).toBeDefined()
  })
})
