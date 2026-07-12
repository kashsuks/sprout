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
const { Goal } = await import("../src/models/Goal");
const { canonicalPair, Friendship } = await import("../src/models/Friendship");
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

async function befriend(a: string, b: string) {
  await Friendship.create({ ...canonicalPair(a, b), requestedBy: a, status: "accepted" });
}

const auth = (token: string) => ["Authorization", `Bearer ${token}`] as const;
const photoFields = { photoData: Buffer.from("fake-image-bytes").toString("base64"), photoContentType: "image/jpeg" };

describe("GET /api/v1/leaderboard/friends", () => {
  it("ranks the caller and friends by points, excluding strangers", async () => {
    const alice = await createUser("alice", { points: 30 });
    const bob = await createUser("bob", { points: 50 });
    const stranger = await createUser("stranger", { points: 999 });
    await befriend(alice.id, bob.id);
    void stranger;

    const app = createApp();
    const res = await request(app)
      .get("/api/v1/leaderboard/friends")
      .set(...auth("alice"));

    expect(res.status).toBe(200);
    expect(res.body.leaderboard.map((r: { username: string }) => r.username)).toEqual(["bob", "alice"]);
    expect(res.body.leaderboard[0].rank).toBe(1);
    expect(res.body.leaderboard[1]).toMatchObject({ username: "alice", me: true });
  });
});

describe("pins", () => {
  it("awards the first_stamp pin after the first completed entry", async () => {
    const alice = await createUser("alice");
    const goal = await Goal.create({
      userId: alice._id,
      title: "stretch",
      source: "custom",
      recurrence: { type: "daily" },
      timezone: "UTC",
    });
    const app = createApp();

    const entryRes = await request(app)
      .post("/api/v1/entries")
      .set(...auth("alice"))
      .send({ goalId: goal.id, ...photoFields, localDate: "2026-07-13" });

    expect(entryRes.body.newlyEarnedPins).toContain("first_stamp");

    const catalog = await request(app)
      .get("/api/v1/pins")
      .set(...auth("alice"));
    const firstStamp = catalog.body.pins.find((p: { key: string }) => p.key === "first_stamp");
    expect(firstStamp.earned).toBe(true);
  });

  it("awards streak_3 only once a 3-day streak is reached, and doesn't re-award it", async () => {
    const alice = await createUser("alice");
    const goal = await Goal.create({
      userId: alice._id,
      title: "stretch",
      source: "custom",
      recurrence: { type: "daily" },
      timezone: "UTC",
    });
    const app = createApp();

    const dates = ["2026-07-10", "2026-07-11", "2026-07-12"];
    const results = [];
    for (const localDate of dates) {
      const res = await request(app)
        .post("/api/v1/entries")
        .set(...auth("alice"))
        .send({ goalId: goal.id, ...photoFields, localDate });
      results.push(res.body.newlyEarnedPins);
    }

    expect(results[0]).not.toContain("streak_3");
    expect(results[1]).not.toContain("streak_3");
    expect(results[2]).toContain("streak_3");

    const res = await request(app)
      .get(`/api/v1/users/${alice.id}/pins`)
      .set(...auth("alice"));
    expect(res.body.pins.map((p: { key: string }) => p.key).sort()).toEqual(["first_stamp", "streak_3"]);
  });
});
