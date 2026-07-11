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

// No real DO Spaces credentials in this test environment — stub the service
// layer so entries.ts's business logic (ownership check, HEAD-verification
// gate, points/streak/once-goal side effects) is exercised without needing
// live object storage. objectExists defaults to true (upload "succeeded");
// individual tests override it via vi.mocked(...).mockResolvedValueOnce to
// cover the "never uploaded" rejection path.
vi.mock("../src/services/spacesService", () => ({
  isAllowedImageContentType: (ct: string) => ct === "image/jpeg" || ct === "image/png",
  createPresignedUploadUrl: vi.fn(async (userId: string) => ({
    uploadUrl: "https://fake-spaces.example.com/upload",
    photoKey: `entries/${userId}/fake.jpg`,
    expiresIn: 300,
  })),
  objectExists: vi.fn(async () => true),
  photoUrlFor: (key: string) => `https://cdn.example.com/${key}`,
}));

const { createApp } = await import("../src/app");
const { User } = await import("../src/models/User");
const { Goal } = await import("../src/models/Goal");
const spacesService = await import("../src/services/spacesService");
const { connectTestDb, disconnectTestDb, clearTestDb } = await import("./dbTestUtils");
const request = (await import("supertest")).default;

beforeAll(async () => {
  await connectTestDb();
});

afterEach(async () => {
  await clearTestDb();
  vi.mocked(spacesService.objectExists).mockResolvedValue(true);
});

afterAll(async () => {
  await disconnectTestDb();
});

const auth = (token: string) => ["Authorization", `Bearer ${token}`] as const;

async function setup() {
  const user = await User.create({
    firebaseUid: "alice",
    username: "alice",
    displayName: "Alice",
    emailHash: "alice-hash",
  });
  const goal = await Goal.create({
    userId: user._id,
    title: "stretch",
    source: "custom",
    recurrence: { type: "daily" },
    timezone: "UTC",
  });
  return { user, goal };
}

describe("POST /api/v1/entries/upload-url", () => {
  it("returns a presigned url for an allowed content type", async () => {
    await setup();
    const app = createApp();
    const res = await request(app)
      .post("/api/v1/entries/upload-url")
      .set(...auth("alice"))
      .send({ contentType: "image/jpeg" });
    expect(res.status).toBe(200);
    expect(res.body.photoKey).toMatch(/^entries\//);
  });

  it("rejects a disallowed content type", async () => {
    await setup();
    const app = createApp();
    const res = await request(app)
      .post("/api/v1/entries/upload-url")
      .set(...auth("alice"))
      .send({ contentType: "application/pdf" });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/v1/entries", () => {
  it("completes a goal: creates the entry and awards points/currency/streak", async () => {
    const { user, goal } = await setup();
    const app = createApp();

    const res = await request(app)
      .post("/api/v1/entries")
      .set(...auth("alice"))
      .send({
        goalId: goal.id,
        photoKey: `entries/${user.id}/photo.jpg`,
        caption: "done!",
        localDate: "2026-07-13",
      });

    expect(res.status).toBe(201);
    expect(res.body.user.points).toBe(15);
    expect(res.body.user.currency).toBe(10);
    expect(res.body.user.currentStreak).toBe(1);
    expect(res.body.entry.photoUrl).toBe(`https://cdn.example.com/entries/${user.id}/photo.jpg`);
  });

  it("rejects a photoKey that doesn't belong to the caller", async () => {
    const { goal } = await setup();
    const app = createApp();

    const res = await request(app)
      .post("/api/v1/entries")
      .set(...auth("alice"))
      .send({ goalId: goal.id, photoKey: "entries/someone-else/photo.jpg", localDate: "2026-07-13" });

    expect(res.status).toBe(403);
  });

  it("rejects if the object was never actually uploaded to Spaces", async () => {
    const { user, goal } = await setup();
    vi.mocked(spacesService.objectExists).mockResolvedValueOnce(false);
    const app = createApp();

    const res = await request(app)
      .post("/api/v1/entries")
      .set(...auth("alice"))
      .send({ goalId: goal.id, photoKey: `entries/${user.id}/photo.jpg`, localDate: "2026-07-13" });

    expect(res.status).toBe(400);
  });

  it("rejects double-stamping the same goal on the same day", async () => {
    const { user, goal } = await setup();
    const app = createApp();
    const payload = { goalId: goal.id, photoKey: `entries/${user.id}/photo.jpg`, localDate: "2026-07-13" };

    const first = await request(app)
      .post("/api/v1/entries")
      .set(...auth("alice"))
      .send(payload);
    expect(first.status).toBe(201);

    const second = await request(app)
      .post("/api/v1/entries")
      .set(...auth("alice"))
      .send(payload);
    expect(second.status).toBe(409);
  });

  it("increments streak on consecutive days and resets after a gap", async () => {
    const { user, goal } = await setup();
    const app = createApp();

    const day1 = await request(app)
      .post("/api/v1/entries")
      .set(...auth("alice"))
      .send({ goalId: goal.id, photoKey: `entries/${user.id}/d1.jpg`, localDate: "2026-07-10" });
    expect(day1.body.user.currentStreak).toBe(1);

    const day2 = await request(app)
      .post("/api/v1/entries")
      .set(...auth("alice"))
      .send({ goalId: goal.id, photoKey: `entries/${user.id}/d2.jpg`, localDate: "2026-07-11" });
    expect(day2.body.user.currentStreak).toBe(2);

    // gap of 3 days -> streak resets to 1
    const day5 = await request(app)
      .post("/api/v1/entries")
      .set(...auth("alice"))
      .send({ goalId: goal.id, photoKey: `entries/${user.id}/d5.jpg`, localDate: "2026-07-14" });
    expect(day5.body.user.currentStreak).toBe(1);
  });

  it("deactivates a 'once' goal after it's completed", async () => {
    const { user } = await setup();
    const onceGoal = await Goal.create({
      userId: user._id,
      title: "read a book",
      source: "custom",
      recurrence: { type: "once" },
      timezone: "UTC",
    });
    const app = createApp();

    await request(app)
      .post("/api/v1/entries")
      .set(...auth("alice"))
      .send({ goalId: onceGoal.id, photoKey: `entries/${user.id}/photo.jpg`, localDate: "2026-07-13" });

    const refreshed = await Goal.findById(onceGoal.id);
    expect(refreshed!.active).toBe(false);
  });
});

describe("GET /api/v1/users/me/scrapbook", () => {
  it("returns the caller's own entries newest-first", async () => {
    const { user, goal } = await setup();
    const app = createApp();

    for (const localDate of ["2026-07-10", "2026-07-11", "2026-07-12"]) {
      await request(app)
        .post("/api/v1/entries")
        .set(...auth("alice"))
        .send({ goalId: goal.id, photoKey: `entries/${user.id}/${localDate}.jpg`, localDate });
    }

    const res = await request(app)
      .get("/api/v1/users/me/scrapbook")
      .set(...auth("alice"));

    expect(res.status).toBe(200);
    expect(res.body.entries).toHaveLength(3);
    expect(res.body.entries[0].localDate).toBe("2026-07-12");
  });
});
