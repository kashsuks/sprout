import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

process.env.MONGODB_URI ??= "mongodb://unused-in-tests/sprout-test";
process.env.FIREBASE_PROJECT_ID ??= "test-project";
process.env.FIREBASE_CLIENT_EMAIL ??= "test@example.com";
process.env.FIREBASE_PRIVATE_KEY ??= "test-key";
process.env.CONTACT_HASH_SALT ??= "test-salt";

const searchGoalsByText = vi.fn();
vi.mock("../src/services/vectorSearchService", () => ({ searchGoalsByText }));

const { getDiscoverEntries } = await import("../src/services/discoverFeedService");
const { User } = await import("../src/models/User");
const { Goal } = await import("../src/models/Goal");
const { Entry } = await import("../src/models/Entry");
const { canonicalPair, Friendship } = await import("../src/models/Friendship");
const { connectTestDb, disconnectTestDb, clearTestDb } = await import("./dbTestUtils");

beforeAll(async () => {
  await connectTestDb();
});

afterEach(async () => {
  await clearTestDb();
  searchGoalsByText.mockReset();
});

afterAll(async () => {
  await disconnectTestDb();
});

async function createUser(firebaseUid: string, overrides: Record<string, unknown> = {}) {
  return User.create({
    firebaseUid,
    username: firebaseUid,
    displayName: firebaseUid,
    emailHash: `${firebaseUid}-hash`,
    friendsOnlyProfile: false,
    ...overrides,
  });
}

async function postEntry(userId: string, title: string) {
  const goal = await Goal.create({ userId, title, source: "custom", recurrence: { type: "daily" }, timezone: "UTC" });
  const entry = await Entry.create({
    userId,
    goalId: goal._id,
    taskTitle: goal.title,
    photoData: Buffer.from("fake-image-bytes").toString("base64"),
    photoContentType: "image/jpeg",
    localDate: "2026-07-10",
    pointsAwarded: 15,
  });
  return { goal, entry };
}

describe("getDiscoverEntries", () => {
  it("returns nothing when the caller has no content preferences", async () => {
    const alice = await createUser("alice");
    const result = await getDiscoverEntries(alice.id, 20);
    expect(result).toEqual([]);
    expect(searchGoalsByText).not.toHaveBeenCalled();
  });

  it("excludes the caller's own goals and friends' goals from candidates", async () => {
    const alice = await createUser("alice", { contentPreferences: ["fitness"] });
    const bob = await createUser("bob");
    const stranger = await createUser("stranger");
    await Friendship.create({ ...canonicalPair(alice.id, bob.id), requestedBy: alice.id, status: "accepted" });

    const { goal: aliceGoal } = await postEntry(alice.id, "Morning run");
    const { goal: bobGoal } = await postEntry(bob.id, "Evening run");
    const { goal: strangerGoal } = await postEntry(stranger.id, "Leg day");

    searchGoalsByText.mockResolvedValue([
      { goalId: aliceGoal.id, userId: alice.id, title: "Morning run", score: 0.99 },
      { goalId: bobGoal.id, userId: bob.id, title: "Evening run", score: 0.9 },
      { goalId: strangerGoal.id, userId: stranger.id, title: "Leg day", score: 0.8 },
    ]);

    const result = await getDiscoverEntries(alice.id, 20);
    expect(result).toHaveLength(1);
    expect(result[0]!.author!.username).toBe("stranger");
  });

  it("excludes candidates whose owner has a friends-only profile", async () => {
    const alice = await createUser("alice", { contentPreferences: ["fitness"] });
    const priv = await createUser("priv", { friendsOnlyProfile: true });
    const { goal } = await postEntry(priv.id, "Leg day");

    searchGoalsByText.mockResolvedValue([{ goalId: goal.id, userId: priv.id, title: "Leg day", score: 0.9 }]);

    const result = await getDiscoverEntries(alice.id, 20);
    expect(result).toEqual([]);
  });

  it("keeps only the best-ranked goal per owner", async () => {
    const alice = await createUser("alice", { contentPreferences: ["fitness"] });
    const bob = await createUser("bob");
    const { goal: bestGoal } = await postEntry(bob.id, "Morning run");
    const { goal: worseGoal } = await postEntry(bob.id, "Evening walk");

    searchGoalsByText.mockResolvedValue([
      { goalId: bestGoal.id, userId: bob.id, title: "Morning run", score: 0.95 },
      { goalId: worseGoal.id, userId: bob.id, title: "Evening walk", score: 0.7 },
    ]);

    const result = await getDiscoverEntries(alice.id, 20);
    expect(result).toHaveLength(1);
    expect(result[0]!.taskTitle).toBe("Morning run");
  });

  it("falls back to the owner's most recent entry when the top-matched goal has none", async () => {
    const alice = await createUser("alice", { contentPreferences: ["fitness"] });
    const bob = await createUser("bob");
    const { entry: bobEntry } = await postEntry(bob.id, "Evening walk");
    const emptyGoal = await Goal.create({
      userId: bob.id,
      title: "Morning run",
      source: "custom",
      recurrence: { type: "daily" },
      timezone: "UTC",
    });

    searchGoalsByText.mockResolvedValue([
      { goalId: emptyGoal.id, userId: bob.id, title: "Morning run", score: 0.95 },
    ]);

    const result = await getDiscoverEntries(alice.id, 20);
    expect(result).toHaveLength(1);
    expect(result[0]!._id.toString()).toBe(bobEntry.id);
  });
});
