import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { MessageBubble } from "@/components/chat/MessageBubble"

const msg = {
  id: "m1",
  body: "Hello team! 👋",
  createdAt: new Date("2024-01-15T10:30:00"),
  editedAt: null,
  author: { id: "u1", name: "Julien Dupont", image: null },
}

describe("MessageBubble", () => {
  it("renders message body", () => {
    render(<MessageBubble message={msg} />)
    expect(screen.getByText("Hello team! 👋")).toBeDefined()
  })
  it("renders author name", () => {
    render(<MessageBubble message={msg} />)
    expect(screen.getByText("Julien Dupont")).toBeDefined()
  })
  it("shows edited label when editedAt is set", () => {
    render(<MessageBubble message={{ ...msg, editedAt: new Date() }} />)
    expect(screen.getByText(/modifié/i)).toBeDefined()
  })
})
