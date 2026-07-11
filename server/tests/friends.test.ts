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

const auth = (token: string) => ["Authorization", `Bearer ${token}`] as const;

describe("friend search", () => {
  it("finds users by username prefix and annotates relationship status", async () => {
    await createUser("alice");
    await createUser("bobby");
    await createUser("bobcat");
    const app = createApp();

    const res = await request(app)
      .get("/api/v1/friends/search?q=bob")
      .set(...auth("alice"));

    expect(res.status).toBe(200);
    expect(res.body.users.map((u: { username: string }) => u.username).sort()).toEqual(["bobby", "bobcat"]);
    expect(res.body.users.every((u: { status: string }) => u.status === "none")).toBe(true);
  });
});

describe("contacts match", () => {
  it("matches a user by their stored contactHash", async () => {
    await createUser("alice");
    await createUser("bob", { contactHash: "hash-of-bobs-phone" });
    const app = createApp();

    const res = await request(app)
      .post("/api/v1/friends/contacts-match")
      .set(...auth("alice"))
      .send({ hashes: ["hash-of-bobs-phone", "hash-of-nobody"] });

    expect(res.status).toBe(200);
    expect(res.body.users).toHaveLength(1);
    expect(res.body.users[0].username).toBe("bob");
  });
});

describe("friend request lifecycle", () => {
  it("request -> accept results in both users seeing each other as friends", async () => {
    const alice = await createUser("alice");
    const bob = await createUser("bob");
    const app = createApp();

    const reqRes = await request(app)
      .post("/api/v1/friends/requests")
      .set(...auth("alice"))
      .send({ toUserId: bob.id });
    expect(reqRes.status).toBe(201);
    const friendshipId = reqRes.body.friendship._id;

    const incoming = await request(app)
      .get("/api/v1/friends/requests/incoming")
      .set(...auth("bob"));
    expect(incoming.body.requests).toHaveLength(1);

    const accept = await request(app)
      .post(`/api/v1/friends/requests/${friendshipId}/accept`)
      .set(...auth("bob"));
    expect(accept.status).toBe(200);

    const aliceFriends = await request(app)
      .get("/api/v1/friends")
      .set(...auth("alice"));
    expect(aliceFriends.body.friends.map((f: { username: string }) => f.username)).toEqual(["bob"]);

    const bobFriends = await request(app)
      .get("/api/v1/friends")
      .set(...auth("bob"));
    expect(bobFriends.body.friends.map((f: { username: string }) => f.username)).toEqual(["alice"]);
  });

  it("only the recipient can accept, not the requester", async () => {
    const alice = await createUser("alice");
    const bob = await createUser("bob");
    const app = createApp();

    const reqRes = await request(app)
      .post("/api/v1/friends/requests")
      .set(...auth("alice"))
      .send({ toUserId: bob.id });

    const selfAccept = await request(app)
      .post(`/api/v1/friends/requests/${reqRes.body.friendship._id}/accept`)
      .set(...auth("alice"));
    expect(selfAccept.status).toBe(403);
  });

  it("rejects a duplicate request while one is already pending", async () => {
    const alice = await createUser("alice");
    const bob = await createUser("bob");
    const app = createApp();

    await request(app)
      .post("/api/v1/friends/requests")
      .set(...auth("alice"))
      .send({ toUserId: bob.id });

    const dup = await request(app)
      .post("/api/v1/friends/requests")
      .set(...auth("alice"))
      .send({ toUserId: bob.id });
    expect(dup.status).toBe(409);
  });

  it("decline deletes the edge, allowing a fresh request later", async () => {
    const alice = await createUser("alice");
    const bob = await createUser("bob");
    const app = createApp();

    const reqRes = await request(app)
      .post("/api/v1/friends/requests")
      .set(...auth("alice"))
      .send({ toUserId: bob.id });

    const decline = await request(app)
      .post(`/api/v1/friends/requests/${reqRes.body.friendship._id}/decline`)
      .set(...auth("bob"));
    expect(decline.status).toBe(204);

    const retry = await request(app)
      .post("/api/v1/friends/requests")
      .set(...auth("alice"))
      .send({ toUserId: bob.id });
    expect(retry.status).toBe(201);
  });

  it("unfriend removes the accepted edge for both sides", async () => {
    const alice = await createUser("alice");
    const bob = await createUser("bob");
    const app = createApp();

    const reqRes = await request(app)
      .post("/api/v1/friends/requests")
      .set(...auth("alice"))
      .send({ toUserId: bob.id });
    await request(app)
      .post(`/api/v1/friends/requests/${reqRes.body.friendship._id}/accept`)
      .set(...auth("bob"));

    const unfriend = await request(app)
      .delete(`/api/v1/friends/${reqRes.body.friendship._id}`)
      .set(...auth("alice"));
    expect(unfriend.status).toBe(204);

    const aliceFriends = await request(app)
      .get("/api/v1/friends")
      .set(...auth("alice"));
    expect(aliceFriends.body.friends).toHaveLength(0);
  });
});
