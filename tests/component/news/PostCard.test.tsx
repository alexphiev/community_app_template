import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { PostCard } from "@/components/news/PostCard"

const base = {
  id: "p1",
  body: "Hello réseau! Voici une mise à jour importante.",
  pinned: false,
  createdAt: new Date("2024-01-15T10:00:00"),
  author: { id: "u1", name: "Marie Leroy", role: "salarie_ij_pdl" as const },
  comments: [],
  reactions: [],
}

describe("PostCard", () => {
  it("renders author name", () => {
    render(<PostCard post={base} />)
    expect(screen.getByText("Marie Leroy")).toBeDefined()
  })
  it("renders body text", () => {
    render(<PostCard post={base} />)
    expect(screen.getByText(/Hello réseau/)).toBeDefined()
  })
  it("shows pinned badge when pinned", () => {
    render(<PostCard post={{ ...base, pinned: true }} />)
    expect(screen.getByText(/à la une/i)).toBeDefined()
  })
  it("shows reaction count", () => {
    render(<PostCard post={{ ...base, reactions: [{ postId: "p1", userId: "u2", emoji: "👍" }] }} />)
    expect(screen.getByText("1")).toBeDefined()
  })
})
