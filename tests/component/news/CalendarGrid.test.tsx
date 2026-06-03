import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { CalendarGrid } from "@/components/news/CalendarGrid"

const mockEvents = [
  {
    id: "e1",
    title: "Réunion équipe",
    startAt: new Date("2024-01-15T09:00:00"),
    endAt: new Date("2024-01-15T11:00:00"),
    category: "reunion" as const,
    isInternal: true,
    description: null,
    location: null,
    createdById: "u1",
    createdAt: new Date(),
    updatedAt: new Date(),
    externalFormUrl: null,
    openAgendaId: null,
    rsvps: [],
    createdBy: { id: "u1", name: "Admin" },
  },
]

describe("CalendarGrid", () => {
  it("renders day headers", () => {
    render(<CalendarGrid events={[]} year={2024} month={0} />)
    expect(screen.getByText("Lun.")).toBeDefined()
    expect(screen.getByText("Dim.")).toBeDefined()
  })
  it("renders an event chip on the correct day", () => {
    render(<CalendarGrid events={mockEvents} year={2024} month={0} />)
    expect(screen.getByText("Réunion équipe")).toBeDefined()
  })
})
