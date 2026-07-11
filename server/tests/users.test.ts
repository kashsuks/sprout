import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

process.env.MONGODB_URI ??= "mongodb://unused-in-tests/sprout-test";
process.env.FIREBASE_PROJECT_ID ??= "test-project";
process.env.FIREBASE_CLIENT_EMAIL ??= "test@example.com";
process.env.FIREBASE_PRIVATE_KEY ??= "test-key";
process.env.CONTACT_HASH_SALT ??= "test-salt";

// Bearer token value doubles as the Firebase UID in these tests: the mock
// just echoes it back as the decoded token's uid/email, skipping real
// Firebase network calls while still exercising the real middleware chain.
vi.mock("../src/config/firebase", () => ({
  firebaseAuth: {
    verifyIdToken: vi.fn(async (token: string) => ({ uid: token, email: `${token}@example.com` })),
  },
}));

const { createApp } = await import("../src/app");
const { User } = await import("../src/models/User");
const { Friendship, canonicalPair } = await import("../src/models/Friendship");
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

async function createUser(firebaseUid: string, overrides: Partial<Record<string, unknown>> = {}) {
  return User.create({
    firebaseUid,
    username: firebaseUid,
    displayName: firebaseUid,
    emailHash: `${firebaseUid}-hash`,
    ...overrides,
  });
}

describe("PATCH /api/v1/users/me", () => {
  it("updates the caller's own profile fields", async () => {
    await createUser("alice");
    const app = createApp();

    const res = await request(app)
      .patch("/api/v1/users/me")
      .set("Authorization", "Bearer alice")
      .send({ bio: "new bio", friendsOnlyProfile: false });

    expect(res.status).toBe(200);
    expect(res.body.user.bio).toBe("new bio");
    expect(res.body.user.friendsOnlyProfile).toBe(false);
  });

  it("404s if the Mongo profile hasn't been bootstrapped yet", async () => {
    const app = createApp();
    const res = await request(app).patch("/api/v1/users/me").set("Authorization", "Bearer ghost").send({ bio: "x" });
    expect(res.status).toBe(404);
  });
});

describe("GET /api/v1/users/:id", () => {
  it("returns the full profile for a friend", async () => {
    const alice = await createUser("alice");
    const bob = await createUser("bob", { friendsOnlyProfile: true });
    await Friendship.create({ ...canonicalPair(alice.id, bob.id), requestedBy: alice.id, status: "accepted" });

    const app = createApp();
    const res = await request(app).get(`/api/v1/users/${bob.id}`).set("Authorization", "Bearer alice");

    expect(res.status).toBe(200);
    expect(res.body.limited).toBe(false);
    expect(res.body.user.bio).toBeDefined();
  });

  it("returns a limited view for a non-friend when friendsOnlyProfile is true", async () => {
    await createUser("alice");
    const bob = await createUser("bob", { friendsOnlyProfile: true, bio: "secret bio" });

    const app = createApp();
    const res = await request(app).get(`/api/v1/users/${bob.id}`).set("Authorization", "Bearer alice");

    expect(res.status).toBe(200);
    expect(res.body.limited).toBe(true);
    expect(res.body.user.bio).toBeUndefined();
    expect(res.body.user.username).toBe("bob");
  });

  it("returns the full profile for a non-friend when friendsOnlyProfile is false", async () => {
    await createUser("alice");
    const bob = await createUser("bob", { friendsOnlyProfile: false, bio: "public bio" });

    const app = createApp();
    const res = await request(app).get(`/api/v1/users/${bob.id}`).set("Authorization", "Bearer alice");

    expect(res.status).toBe(200);
    expect(res.body.limited).toBe(false);
    expect(res.body.user.bio).toBe("public bio");
  });
});
