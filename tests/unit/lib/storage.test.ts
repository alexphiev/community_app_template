import { describe, it, expect, vi } from "vitest"

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: class {
    send = vi.fn()
  },
  PutObjectCommand: vi.fn(),
  DeleteObjectCommand: vi.fn(),
  GetObjectCommand: vi.fn(),
}))
vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn().mockResolvedValue("https://example.com/signed-url"),
}))

import { buildS3Key, parseS3KeyResourceId, getPresignedDownloadUrl } from "@/lib/storage"

describe("buildS3Key", () => {
  it("builds a deterministic key from prefix, resourceId, filename", () => {
    const key = buildS3Key("resources", "resource-123", "guide.pdf")
    expect(key).toBe("resources/resource-123/guide.pdf")
  })

  it("sanitizes filename to prevent path traversal", () => {
    const key = buildS3Key("resources", "resource-123", "../../etc/passwd")
    expect(key).toBe("resources/resource-123/passwd")
  })
})

describe("parseS3KeyResourceId", () => {
  it("extracts resource id from s3 key", () => {
    const id = parseS3KeyResourceId("resources/resource-123/guide.pdf")
    expect(id).toBe("resource-123")
  })
})

describe("parseS3KeyResourceId — edge cases", () => {
  it("returns undefined for a flat key with no slashes", () => {
    expect(parseS3KeyResourceId("orphan-file.pdf")).toBeUndefined()
  })

  it("returns undefined for an empty string", () => {
    expect(parseS3KeyResourceId("")).toBeUndefined()
  })

  it("returns undefined for a key with only one segment", () => {
    expect(parseS3KeyResourceId("resources/")).toBeUndefined()
  })
})

describe("getPresignedDownloadUrl", () => {
  it("returns a signed URL string", async () => {
    const url = await getPresignedDownloadUrl("resources/resource-123/guide.pdf")
    expect(typeof url).toBe("string")
    expect(url).toContain("https://")
  })
})
