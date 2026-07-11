import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

process.env.MONGODB_URI ??= "mongodb://unused-in-tests/sprout-test";
process.env.FIREBASE_PROJECT_ID ??= "test-project";
process.env.FIREBASE_CLIENT_EMAIL ??= "test@example.com";
process.env.FIREBASE_PRIVATE_KEY ??= "test-key";
process.env.CONTACT_HASH_SALT ??= "test-salt";

vi.mock("../src/config/firebase", () => ({
  firebaseAuth: {
    verifyIdToken: vi.fn(async (token: string) => ({ uid: token, email: `${token}@example.com` })),
  },
}));

const { createApp } = await import("../src/app");
const { connectTestDb, disconnectTestDb, clearTestDb } = await import("./dbTestUtils");
const request = (await import("supertest")).default;

beforeAll(async () => {
  await connectTestDb();
});

afterEach(async () => {
  await clearTestDb();
});

afterAll(async () => {
  await disconnectTestDb();
});

const auth = (token: string) => ["Authorization", `Bearer ${token}`] as const;

describe("auth bootstrap rate limiting", () => {
  // authLimiter is applied directly on the route regardless of NODE_ENV
  // (unlike the global apiLimiter, which is skipped in tests), so this
  // exercises the real limiter configured in middleware/rateLimiter.ts.
  it("returns 429 once the limit is exceeded within the window", async () => {
    const app = createApp();

    const statuses: number[] = [];
    for (let i = 0; i < 21; i++) {
      const res = await request(app)
        .post("/api/v1/auth/bootstrap")
        .set(...auth("limituser"))
        .send({ username: "limituser", displayName: "Limit User" });
      statuses.push(res.status);
    }

    expect(statuses.slice(0, 20).every((s) => s === 200 || s === 201)).toBe(true);
    expect(statuses[20]).toBe(429);
  });
});
