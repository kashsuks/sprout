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

const auth = (token: string) => ["Authorization", `Bearer ${token}`] as const;

describe("goals", () => {
  it("creates a daily goal and shows it as due-but-incomplete today, then completed after an entry", async () => {
    await createUser("alice");
    const app = createApp();

    const createRes = await request(app)
      .post("/api/v1/goals")
      .set(...auth("alice"))
      .send({ title: "stretch", source: "custom", recurrence: { type: "daily" }, timezone: "America/Los_Angeles" });
    expect(createRes.status).toBe(201);
    const goalId = createRes.body.goal._id;

    const todayRes = await request(app)
      .get("/api/v1/goals/today?localDate=2026-07-13")
      .set(...auth("alice"));
    expect(todayRes.status).toBe(200);
    expect(todayRes.body.goals).toHaveLength(1);
    expect(todayRes.body.goals[0].completed).toBe(false);

    await Entry.create({
      userId: (await User.findOne({ firebaseUid: "alice" }))!._id,
      goalId,
      taskTitle: "stretch",
      photoData: "aGVsbG8=",
      photoContentType: "image/jpeg",
      localDate: "2026-07-13",
    });

    const afterRes = await request(app)
      .get("/api/v1/goals/today?localDate=2026-07-13")
      .set(...auth("alice"));
    expect(afterRes.body.goals[0].completed).toBe(true);
  });

  it("only shows a weekly goal on its configured day of week", async () => {
    await createUser("alice");
    const app = createApp();

    // 2024-01-01 was a Monday (dow=1); 2024-01-02 was a Tuesday.
    await request(app)
      .post("/api/v1/goals")
      .set(...auth("alice"))
      .send({
        title: "gym",
        source: "custom",
        recurrence: { type: "weekly", daysOfWeek: [1] },
        timezone: "America/Los_Angeles",
      });

    const monday = await request(app)
      .get("/api/v1/goals/today?localDate=2024-01-01")
      .set(...auth("alice"));
    expect(monday.body.goals).toHaveLength(1);

    const tuesday = await request(app)
      .get("/api/v1/goals/today?localDate=2024-01-02")
      .set(...auth("alice"));
    expect(tuesday.body.goals).toHaveLength(0);
  });

  it("stops showing a 'once' goal after it has ever been completed", async () => {
    await createUser("alice");
    const app = createApp();

    const createRes = await request(app)
      .post("/api/v1/goals")
      .set(...auth("alice"))
      .send({ title: "read a book", source: "custom", recurrence: { type: "once" }, timezone: "America/Los_Angeles" });
    const goalId = createRes.body.goal._id;

    const before = await request(app)
      .get("/api/v1/goals/today?localDate=2026-07-13")
      .set(...auth("alice"));
    expect(before.body.goals).toHaveLength(1);

    await Entry.create({
      userId: (await User.findOne({ firebaseUid: "alice" }))!._id,
      goalId,
      taskTitle: "read a book",
      photoData: "aGVsbG8=",
      photoContentType: "image/jpeg",
      localDate: "2026-07-10", // completed on an earlier day
    });

    const after = await request(app)
      .get("/api/v1/goals/today?localDate=2026-07-13")
      .set(...auth("alice"));
    expect(after.body.goals).toHaveLength(0);
  });

  it("soft-deletes a goal via DELETE, removing it from listings", async () => {
    await createUser("alice");
    const app = createApp();

    const createRes = await request(app)
      .post("/api/v1/goals")
      .set(...auth("alice"))
      .send({ title: "meditate", source: "custom", recurrence: { type: "daily" }, timezone: "UTC" });
    const goalId = createRes.body.goal._id;

    const del = await request(app)
      .delete(`/api/v1/goals/${goalId}`)
      .set(...auth("alice"));
    expect(del.status).toBe(204);

    const list = await request(app)
      .get("/api/v1/goals")
      .set(...auth("alice"));
    expect(list.body.goals).toHaveLength(0);
  });
});
