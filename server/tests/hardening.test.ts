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
const { User } = await import("../src/models/User");
const { Entry } = await import("../src/models/Entry");
const { Friendship } = await import("../src/models/Friendship");
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

describe("malformed id handling", () => {
  it("returns 400 (not 500) for a non-ObjectId :id route param", async () => {
    await User.create({ firebaseUid: "alice", username: "alice", displayName: "alice", emailHash: "alice-hash" });
    const app = createApp();

    const res = await request(app)
      .get("/api/v1/users/not-a-valid-object-id")
      .set(...auth("alice"));

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid/);
  });
});

describe("index verification", () => {
  it("enforces the unique username index", async () => {
    await User.create({ firebaseUid: "alice", username: "dupe", displayName: "alice", emailHash: "alice-hash" });
    await expect(
      User.create({ firebaseUid: "bob", username: "dupe", displayName: "bob", emailHash: "bob-hash" })
    ).rejects.toThrow();
  });

  it("enforces the unique {userId, goalId, localDate} index on entries (no double-stamping)", async () => {
    const user = await User.create({ firebaseUid: "alice", username: "alice", displayName: "alice", emailHash: "h" });
    const goalId = new (await import("mongoose")).Types.ObjectId();
    await Entry.create({ userId: user._id, goalId, taskTitle: "x", photoKey: "k1", localDate: "2026-07-13" });
    await expect(
      Entry.create({ userId: user._id, goalId, taskTitle: "x", photoKey: "k2", localDate: "2026-07-13" })
    ).rejects.toThrow();
  });

  it("enforces the unique {userA, userB} index on friendships (canonical ordering)", async () => {
    const { canonicalPair } = await import("../src/models/Friendship");
    const alice = await User.create({ firebaseUid: "alice", username: "alice", displayName: "a", emailHash: "h1" });
    const bob = await User.create({ firebaseUid: "bob", username: "bob", displayName: "b", emailHash: "h2" });
    const pair = canonicalPair(alice.id, bob.id);
    await Friendship.create({ ...pair, requestedBy: alice._id, status: "pending" });
    await expect(Friendship.create({ ...pair, requestedBy: bob._id, status: "pending" })).rejects.toThrow();
  });
});
