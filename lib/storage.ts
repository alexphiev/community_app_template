import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import path from "path"

const s3 = new S3Client({
  region: process.env.S3_REGION ?? "eu-west-3",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
  },
})

const BUCKET = process.env.S3_BUCKET ?? "hub-pro"

export function buildS3Key(prefix: string, resourceId: string, filename: string): string {
  const safe = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, "_")
  return `${prefix}/${resourceId}/${safe}`
}

export function parseS3KeyResourceId(key: string): string | undefined {
  const parts = key.split("/")
  if (parts.length < 3) return undefined
  return parts[1]
}

export async function uploadToS3(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<void> {
  await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body, ContentType: contentType }))
}

export async function deleteFromS3(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
}

export async function getPresignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn })
}
