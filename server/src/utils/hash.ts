import { createHash, createHmac } from "node:crypto";
import { env } from "../config/env";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Used for both: (a) hashing a user's own email at signup so it can be
 * matched later, and (b) hashing a device contact's email/phone client-side
 * before it's sent to the contacts-match endpoint. Both sides must use the
 * same salted HMAC so a match is possible without either party ever storing
 * plaintext contact data.
 */
export function hashContactValue(normalizedValue: string): string {
  const salt = env.CONTACT_HASH_SALT ?? "";
  return createHmac("sha256", salt).update(normalizedValue).digest("hex");
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
