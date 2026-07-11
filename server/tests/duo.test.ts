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

vi.mock("../src/services/spacesService", () => ({
  isAllowedImageContentType: () => true,
  createPresignedUploadUrl: vi.fn(),
  objectExists: vi.fn(async () => true),
  photoUrlFor: (key: string) => `https://cdn.example.com/${key}`,
}));

const { createApp } = await import("../src/app");
const { User } = await import("../src/models/User");
const { Goal } = await import("../src/models/Goal");
const { Duo } = await import("../src/models/Duo");
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

async function createUser(firebaseUid: string) {
  return User.create({ firebaseUid, username: firebaseUid, displayName: firebaseUid, emailHash: `${firebaseUid}-hash` });
}

async function befriend(a: string, b: string) {
  await Friendship.create({ ...canonicalPair(a, b), requestedBy: a, status: "accepted" });
}

const auth = (token: string) => ["Authorization", `Bearer ${token}`] as const;

async function stamp(app: ReturnType<typeof createApp>, token: string, goalId: string, localDate: string, userId: string) {
  return request(app)
    .post("/api/v1/entries")
    .set(...auth(token))
    .send({ goalId, photoKey: `entries/${userId}/${localDate}.jpg`, localDate });
}

describe("duo linking", () => {
  it("links two friends on a task, creating a goal for the friend if needed", async () => {
    const alice = await createUser("alice");
    const bob = await createUser("bob");
    await befriend(alice.id, bob.id);
    const app = createApp();

    const aliceGoal = await Goal.create({
      userId: alice._id,
      title: "gym session",
      source: "custom",
      recurrence: { type: "daily" },
      timezone: "UTC",
    });

    const res = await request(app)
      .post("/api/v1/duo")
      .set(...auth("alice"))
      .send({ friendUserId: bob.id, taskTitle: "gym session", myGoalId: aliceGoal.id });

    expect(res.status).toBe(201);
    const bobGoal = await Goal.findOne({ userId: bob._id, title: "gym session" });
    expect(bobGoal).not.toBeNull();
    expect(bobGoal!.duoId?.toString()).toBe(res.body.duo._id);
  });

  it("rejects linking with a non-friend", async () => {
    const alice = await createUser("alice");
    const bob = await createUser("bob");
    const app = createApp();
    const aliceGoal = await Goal.create({
      userId: alice._id,
      title: "gym",
      source: "custom",
      recurrence: { type: "daily" },
      timezone: "UTC",
    });

    const res = await request(app)
      .post("/api/v1/duo")
      .set(...auth("alice"))
      .send({ friendUserId: bob.id, taskTitle: "gym", myGoalId: aliceGoal.id });
    expect(res.status).toBe(403);
  });

  it("linkable-friends reflects existing links", async () => {
    const alice = await createUser("alice");
    const bob = await createUser("bob");
    await befriend(alice.id, bob.id);
    const app = createApp();
    const aliceGoal = await Goal.create({
      userId: alice._id,
      title: "gym",
      source: "custom",
      recurrence: { type: "daily" },
      timezone: "UTC",
    });
    await request(app)
      .post("/api/v1/duo")
      .set(...auth("alice"))
      .send({ friendUserId: bob.id, taskTitle: "gym", myGoalId: aliceGoal.id });

    const res = await request(app)
      .get("/api/v1/duo/linkable-friends?taskTitle=gym")
      .set(...auth("alice"));
    expect(res.body.friends).toEqual([expect.objectContaining({ username: "bob", linked: true })]);
  });

  it("unlinking clears duoId on both goals", async () => {
    const alice = await createUser("alice");
    const bob = await createUser("bob");
    await befriend(alice.id, bob.id);
    const app = createApp();
    const aliceGoal = await Goal.create({
      userId: alice._id,
      title: "gym",
      source: "custom",
      recurrence: { type: "daily" },
      timezone: "UTC",
    });
    const linkRes = await request(app)
      .post("/api/v1/duo")
      .set(...auth("alice"))
      .send({ friendUserId: bob.id, taskTitle: "gym", myGoalId: aliceGoal.id });

    const del = await request(app)
      .delete(`/api/v1/duo/${linkRes.body.duo._id}`)
      .set(...auth("alice"));
    expect(del.status).toBe(204);

    const refreshedGoal = await Goal.findById(aliceGoal.id);
    expect(refreshedGoal!.duoId).toBeNull();
  });
});

describe("duo shared streak", () => {
  it("only advances the streak once BOTH sides complete on the same day", async () => {
    const alice = await createUser("alice");
    const bob = await createUser("bob");
    await befriend(alice.id, bob.id);
    const app = createApp();
    const aliceGoal = await Goal.create({
      userId: alice._id,
      title: "gym",
      source: "custom",
      recurrence: { type: "daily" },
      timezone: "UTC",
    });
    const linkRes = await request(app)
      .post("/api/v1/duo")
      .set(...auth("alice"))
      .send({ friendUserId: bob.id, taskTitle: "gym", myGoalId: aliceGoal.id });
    const bobGoal = await Goal.findOne({ userId: bob._id, title: "gym" });

    await stamp(app, "alice", aliceGoal.id, "2026-07-10", alice.id);
    let duo = await Duo.findById(linkRes.body.duo._id);
    expect(duo!.streak).toBe(0); // bob hasn't completed yet

    await stamp(app, "bob", bobGoal!.id, "2026-07-10", bob.id);
    duo = await Duo.findById(linkRes.body.duo._id);
    expect(duo!.streak).toBe(1);
  });

  it("increments on consecutive joint-completion days and resets after a gap", async () => {
    const alice = await createUser("alice");
    const bob = await createUser("bob");
    await befriend(alice.id, bob.id);
    const app = createApp();
    const aliceGoal = await Goal.create({
      userId: alice._id,
      title: "gym",
      source: "custom",
      recurrence: { type: "daily" },
      timezone: "UTC",
    });
    const linkRes = await request(app)
      .post("/api/v1/duo")
      .set(...auth("alice"))
      .send({ friendUserId: bob.id, taskTitle: "gym", myGoalId: aliceGoal.id });
    const bobGoal = await Goal.findOne({ userId: bob._id, title: "gym" });

    for (const date of ["2026-07-10", "2026-07-11"]) {
      await stamp(app, "alice", aliceGoal.id, date, alice.id);
      await stamp(app, "bob", bobGoal!.id, date, bob.id);
    }
    let duo = await Duo.findById(linkRes.body.duo._id);
    expect(duo!.streak).toBe(2);

    // bob misses 2026-07-12 entirely; both complete again on 2026-07-14 (gap > 1)
    await stamp(app, "alice", aliceGoal.id, "2026-07-14", alice.id);
    await stamp(app, "bob", bobGoal!.id, "2026-07-14", bob.id);
    duo = await Duo.findById(linkRes.body.duo._id);
    expect(duo!.streak).toBe(1);
  });
});
