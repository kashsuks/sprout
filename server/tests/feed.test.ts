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
const { Entry } = await import("../src/models/Entry");
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

async function postEntry(userId: string, localDate: string) {
  const goal = await Goal.create({
    userId,
    title: "run",
    source: "custom",
    recurrence: { type: "daily" },
    timezone: "UTC",
  });
  return Entry.create({
    userId,
    goalId: goal._id,
    taskTitle: goal.title,
    photoKey: `entries/${userId}/${localDate}.jpg`,
    localDate,
    pointsAwarded: 15,
  });
}

const auth = (token: string) => ["Authorization", `Bearer ${token}`] as const;

describe("GET /api/v1/feed", () => {
  it("only includes entries from accepted friends, not strangers", async () => {
    const alice = await createUser("alice");
    const bob = await createUser("bob");
    const stranger = await createUser("stranger");
    await befriend(alice.id, bob.id);

    await postEntry(bob.id, "2026-07-10");
    await postEntry(stranger.id, "2026-07-10");

    const app = createApp();
    const res = await request(app)
      .get("/api/v1/feed")
      .set(...auth("alice"));

    expect(res.status).toBe(200);
    expect(res.body.entries).toHaveLength(1);
    expect(res.body.entries[0].author.username).toBe("bob");
  });

  it("returns an empty feed with no friends", async () => {
    await createUser("alice");
    const app = createApp();
    const res = await request(app)
      .get("/api/v1/feed")
      .set(...auth("alice"));
    expect(res.body.entries).toEqual([]);
    expect(res.body.nextCursor).toBeNull();
  });

  it("paginates with a cursor, newest first", async () => {
    const alice = await createUser("alice");
    const bob = await createUser("bob");
    await befriend(alice.id, bob.id);

    for (const localDate of ["2026-07-10", "2026-07-11", "2026-07-12"]) {
      await postEntry(bob.id, localDate);
    }

    const app = createApp();
    const page1 = await request(app)
      .get("/api/v1/feed?limit=2")
      .set(...auth("alice"));
    expect(page1.body.entries).toHaveLength(2);
    expect(page1.body.entries[0].localDate).toBe("2026-07-12");
    expect(page1.body.nextCursor).not.toBeNull();

    const page2 = await request(app)
      .get(`/api/v1/feed?limit=2&cursor=${page1.body.nextCursor}`)
      .set(...auth("alice"));
    expect(page2.body.entries).toHaveLength(1);
    expect(page2.body.entries[0].localDate).toBe("2026-07-10");
    expect(page2.body.nextCursor).toBeNull();
  });
});
