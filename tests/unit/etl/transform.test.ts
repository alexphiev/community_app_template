import { describe, it, expect } from "vitest"
import { sanitizeBody, mapWpTypeToResourceType, slugify, extractTextFromHtml } from "@/etl/transform"

describe("sanitizeBody", () => {
  it("keeps allowed tags", () => {
    const result = sanitizeBody("<p>Hello <strong>world</strong></p>")
    expect(result).toContain("<p>")
    expect(result).toContain("<strong>")
  })
  it("strips disallowed tags", () => {
    const result = sanitizeBody("<script>alert(1)</script><p>Safe</p>")
    expect(result).not.toContain("<script>")
    expect(result).toContain("Safe")
  })
  it("strips WP shortcodes", () => {
    const result = sanitizeBody("[caption id='1']Some caption[/caption]<p>Content</p>")
    expect(result).not.toContain("[caption")
    expect(result).toContain("Content")
  })
})

describe("mapWpTypeToResourceType", () => {
  it("maps post to veille", () => {
    expect(mapWpTypeToResourceType("post")).toBe("veille")
  })
  it("maps page to documentation", () => {
    expect(mapWpTypeToResourceType("page")).toBe("documentation")
  })
  it("defaults unknown types to veille", () => {
    expect(mapWpTypeToResourceType("custom_type")).toBe("veille")
  })
})

describe("slugify", () => {
  it("converts French text to slug", () => {
    expect(slugify("Aide à l'emploi")).toBe("aide-a-l-emploi")
  })
  it("lowercases and replaces spaces with hyphens", () => {
    expect(slugify("Hello World")).toBe("hello-world")
  })
  it("strips special characters", () => {
    expect(slugify("Café & Co.")).toBe("cafe-co")
  })
})

describe("extractTextFromHtml", () => {
  it("strips all HTML tags", () => {
    expect(extractTextFromHtml("<p>Hello <b>world</b></p>")).toBe("Hello world")
  })
  it("returns empty string for empty input", () => {
    expect(extractTextFromHtml("")).toBe("")
  })
})
