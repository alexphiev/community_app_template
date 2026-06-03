import { XMLParser } from "fast-xml-parser"
import fs from "fs"

export interface WpPost {
  wpPostId: string
  title: string
  content: string
  excerpt: string
  status: string
  postType: string
  link: string
  categories: string[]
  tags: string[]
  createdAt: Date
}

export function extractFromWxr(filePath: string): WpPost[] {
  if (!fs.existsSync(filePath)) {
    console.warn(`[ETL] Export file not found: ${filePath}. Skipping extraction.`)
    return []
  }

  const xml = fs.readFileSync(filePath, "utf-8")
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" })
  const parsed = parser.parse(xml)

  const channel = parsed?.rss?.channel
  if (!channel) return []

  const items: unknown[] = Array.isArray(channel.item) ? channel.item : channel.item ? [channel.item] : []

  return items
    .filter((item: unknown) => {
      const i = item as Record<string, unknown>
      return i["wp:post_type"] === "post" || i["wp:post_type"] === "page"
    })
    .map((item: unknown) => {
      const i = item as Record<string, unknown>
      const categories: string[] = []
      const tags: string[] = []

      const cats = i["category"]
      const catArray: unknown[] = Array.isArray(cats) ? cats : cats ? [cats] : []
      for (const c of catArray) {
        const cat = c as Record<string, unknown>
        if (cat["@_domain"] === "category") categories.push(String(cat["#text"] ?? cat))
        if (cat["@_domain"] === "post_tag") tags.push(String(cat["#text"] ?? cat))
      }

      return {
        wpPostId: String(i["wp:post_id"] ?? ""),
        title: String(i["title"] ?? ""),
        content: String(i["content:encoded"] ?? ""),
        excerpt: String(i["excerpt:encoded"] ?? ""),
        status: String(i["wp:status"] ?? "publish"),
        postType: String(i["wp:post_type"] ?? "post"),
        link: String(i["link"] ?? ""),
        categories,
        tags,
        createdAt: new Date(String(i["pubDate"] ?? i["wp:post_date"] ?? new Date())),
      }
    })
}
