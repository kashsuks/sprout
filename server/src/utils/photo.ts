const ALLOWED_CONTENT_TYPES = new Set(["image/jpeg", "image/png"]);

// 8MB decoded, which is roughly 10.7MB as a base64 string — generous for a
// single quality-compressed phone photo while still bounding request size.
export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

export function isAllowedImageContentType(contentType: string): boolean {
  return ALLOWED_CONTENT_TYPES.has(contentType);
}

export function photoDataUri(entry: { photoData: string; photoContentType: string }): string {
  return `data:${entry.photoContentType};base64,${entry.photoData}`;
}
