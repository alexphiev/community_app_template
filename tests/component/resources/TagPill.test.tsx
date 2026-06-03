import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { TagPill } from "@/components/resources/TagPill"

describe("TagPill", () => {
  it("renders the tag name", () => {
    render(<TagPill name="Logement" />)
    expect(screen.getByText("Logement")).toBeDefined()
  })

  it("applies accent variant classes", () => {
    const { container } = render(<TagPill name="Urgent" variant="accent" />)
    expect(container.innerHTML).toContain("coral")
  })

  it("applies brand variant classes", () => {
    const { container } = render(<TagPill name="Rapport" variant="brand" />)
    expect(container.innerHTML).toContain("teal-700")
  })
})
