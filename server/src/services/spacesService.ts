import { randomUUID } from "node:crypto";
import { HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../config/env";
import { getSpacesClient } from "../config/spaces";

const ALLOWED_CONTENT_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
};

const UPLOAD_URL_EXPIRY_SECONDS = 300;

export function isAllowedImageContentType(contentType: string): boolean {
  return contentType in ALLOWED_CONTENT_TYPES;
}

// Scoped to entries/{userId}/... with a short expiry and a locked
// Content-Type so a presigned URL can never be used to write into another
// user's namespace or upload a non-image payload. See SECURITY.md.
export async function createPresignedUploadUrl(
  userId: string,
  contentType: string
): Promise<{ uploadUrl: string; photoKey: string; expiresIn: number }> {
  const ext = ALLOWED_CONTENT_TYPES[contentType];
  const photoKey = `entries/${userId}/${randomUUID()}.${ext}`;

  const command = new PutObjectCommand({ Bucket: requireBucket(), Key: photoKey, ContentType: contentType });
  const uploadUrl = await getSignedUrl(getSpacesClient(), command, { expiresIn: UPLOAD_URL_EXPIRY_SECONDS });

  return { uploadUrl, photoKey, expiresIn: UPLOAD_URL_EXPIRY_SECONDS };
}

// Defense against ghost entries pointing at an object that was never
// actually uploaded (client crash mid-flow, expired/misused presigned URL).
export async function objectExists(photoKey: string): Promise<boolean> {
  try {
    await getSpacesClient().send(new HeadObjectCommand({ Bucket: requireBucket(), Key: photoKey }));
    return true;
  } catch {
    return false;
  }
}

function requireBucket(): string {
  if (!env.DO_SPACES_BUCKET) throw new Error("DO_SPACES_BUCKET is not configured");
  return env.DO_SPACES_BUCKET;
}

// Only photoKey is ever persisted in Mongo; the public URL is constructed at
// read time so switching CDN domains later needs no data migration.
export function photoUrlFor(photoKey: string): string {
  if (!env.DO_SPACES_CDN_BASE_URL) throw new Error("DO_SPACES_CDN_BASE_URL is not configured");
  return `${env.DO_SPACES_CDN_BASE_URL.replace(/\/$/, "")}/${photoKey}`;
}
