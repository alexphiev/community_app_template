import sanitizeHtml from "sanitize-html"

const ALLOWED_TAGS = ["p", "h2", "h3", "h4", "ul", "ol", "li", "a", "strong", "em", "img", "blockquote", "br"]

const SHORTCODE_PATTERN = /\[[^\]]+\][^\[]*\[\/[^\]]+\]|\[[^\]]+\/?\]/g

export function sanitizeBody(html: string): string {
  const noShortcodes = html.replace(SHORTCODE_PATTERN, "")
  return sanitizeHtml(noShortcodes, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: { a: ["href", "title"], img: ["src", "alt", "width", "height"] },
    allowedSchemes: ["http", "https"],
  }).trim()
}

export function mapWpTypeToResourceType(wpType: string): "veille" | "documentation" | "toolbox" | "tutorial" {
  const map: Record<string, "veille" | "documentation" | "toolbox" | "tutorial"> = {
    post: "veille",
    page: "documentation",
  }
  return map[wpType] ?? "veille"
}

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['']/g, "-")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s&]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

export function extractTextFromHtml(html: string): string {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
}
