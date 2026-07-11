# Security Notes — Sprout Backend

Practices and known gaps for the `server/` API. Read this alongside `server/.env.example` before deploying.

## Presigned upload URLs (DigitalOcean Spaces)

- `services/spacesService.ts` scopes every presigned PUT URL to `entries/{userId}/{uuid}.{ext}` — a user can never write into another user's namespace, because the key is generated server-side from the verified `req.user.id`, never from client input.
- URLs expire after 5 minutes (`UPLOAD_URL_EXPIRY_SECONDS`).
- `Content-Type` is locked to `image/jpeg` or `image/png` at presign time.
- `POST /entries` independently verifies the object was actually uploaded (`HeadObject`) before creating the entry, and rejects any `photoKey` that isn't namespaced under the caller's own id — closing the gap where a client could reuse someone else's key.
- Not yet implemented: strict `Content-Length` limiting. A presigned PUT (vs. a presigned POST with policy conditions) can't enforce a max size. If abuse becomes a problem, switch to presigned POST with a `content-length-range` condition, or add a Spaces lifecycle rule + server-side size check after upload.

## Firebase Admin credentials

- `FIREBASE_PRIVATE_KEY` is a long-lived, high-privilege credential — it can mint arbitrary Firebase user tokens for your project. Never log it, never commit it (`.env*` is gitignored except `.env.example`), and store the real value only in your deploy platform's secret manager.
- Scope the service account to the Firebase Auth Admin role only. Don't reuse a broader GCP service account if the Firebase project ever shares a GCP project with other infra.
- Rotate immediately if it's ever exposed (committed, logged, pasted somewhere public).

## Rate limiting

- `middleware/rateLimiter.ts`: a global limiter (300 req / 15 min / IP) applies to all of `/api/v1`, plus a tighter limiter (20 req / 15 min / IP) on `POST /auth/bootstrap` specifically, since it's the one endpoint that can create a resource (a User document) before much else has been verified beyond Firebase token validity.
- Firebase's own email-link sign-in already has Google-side abuse protection; this covers our own endpoint independently.
- This is in-memory (per-process) rate limiting — fine for a single instance. If the API is ever horizontally scaled, switch to a shared store (e.g. `rate-limit-redis`) or the limits become per-instance instead of global.

## Input validation

- Every route that accepts a body validates it with a `zod` schema before touching the database (see each `routes/*.ts`). Route handlers only ever read `req.user._id` (set by `attachMongoUser` from the verified Firebase token) for "who is making this request" — never a client-supplied user id in the body.
- Malformed `:id` route params (not a valid Mongo ObjectId) are caught centrally in `middleware/errorHandler.ts` and turned into a 400, not a 500.
- String fields have explicit length caps (`bio` 160, `caption` 280, `username` 3–24, etc.) to bound document size and reduce abuse surface.

## Contacts-based friend matching

- Raw phone numbers/emails from a user's device address book must **never** reach or be stored on the server in plaintext.
- The client is responsible for normalizing each contact (E.164 for phone numbers, lowercased/trimmed for emails) and hashing it with `hashContactValue` (HMAC-SHA256, keyed with `CONTACT_HASH_SALT`) **before** calling `POST /friends/contacts-match`. The server only ever receives and stores hashes.
- Every user's own contact info is hashed the same way — `emailHash` at signup (from the verified Firebase email) and `contactHash` optionally via `PATCH /users/me` (if the app later collects a phone number) — so matching is symmetric.
- The server never learns which raw contact matched which hash, and never persists a contact from someone's address book unless it already belongs to an existing app user.
- `CONTACT_HASH_SALT` must be the same value across all environments hashing on the client and server side; rotating it invalidates all existing matches until every user re-hashes (client-side only — no server data needs to change, since the server never stored plaintext).

## Marketplace / currency integrity

- `POST /marketplace/purchase` uses a real Mongo multi-document transaction (via `mongoose.startSession()` + `withTransaction`) wrapping the currency debit, inventory insert, and audit-trail write — a partial purchase (currency spent, no item granted) is not possible. This requires MongoDB to be running as a replica set, which Atlas clusters are by default.
- Every currency/points delta (entry completion, purchase) is recorded in `currency_transactions` for support/debugging — not exposed as a user-facing feature.

## Least-privilege credentials

- Scope the DO Spaces access key to only the bucket used for entry photos, not full account access, if DO's IAM equivalent supports bucket-scoped keys at the time you provision it.
- Scope the MongoDB Atlas database user to only the `sprout` database, not admin/cluster-wide privileges.

## CORS

- `CORS_ALLOWED_ORIGINS` (comma-separated) controls the `cors` middleware's allowed origins. The API is consumed only by the mobile app, which doesn't send an `Origin` header the way a browser does — this exists mainly as a guardrail against a stray web client, and matters more if any admin/web tooling is added later.

## Known gaps (not blocking, but should be tracked)

- **No content moderation** on uploaded photos. Anyone who completes a goal can upload any image. Add a moderation step (manual review queue, or an automated image-safety API) before this ships publicly.
- **No delete-refund abuse guard beyond "no refund on delete."** `DELETE /entries/:id` intentionally does not refund points/currency, to prevent a complete→delete→re-complete loop from farming rewards — but a user could still delete-and-redo to change the photo/caption of "today's" entry without losing points, since the unique `{userId, goalId, localDate}` index only blocks two *simultaneous* entries, not a delete-then-recreate. Low severity (no economic exploit, since points aren't refunded on delete either), noted here in case product wants to prevent editing history entirely later.
- **Duo streak "miss" detection is lazy**, not proactive (see `services/duoStreakService.ts` header comment) — a broken streak isn't reflected until the next time either side completes something, not the instant the missed day ends. Fine for V1; would need a scheduled job to fix.
