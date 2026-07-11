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
const { MarketplaceItem } = await import("../src/models/MarketplaceItem");
const { UserInventory } = await import("../src/models/UserInventory");
const { CurrencyTransaction } = await import("../src/models/CurrencyTransaction");
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

describe("marketplace", () => {
  it("lists only active items", async () => {
    await createUser("alice");
    await MarketplaceItem.create({ key: "a", name: "A", priceCurrency: 10, category: "flair", active: true });
    await MarketplaceItem.create({ key: "b", name: "B", priceCurrency: 10, category: "flair", active: false });
    const app = createApp();

    const res = await request(app)
      .get("/api/v1/marketplace/items")
      .set(...auth("alice"));
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].key).toBe("a");
  });

  it("purchases an item: decrements currency, adds to inventory, records a ledger entry", async () => {
    const alice = await createUser("alice", { currency: 100 });
    const item = await MarketplaceItem.create({ key: "gold", name: "Gold Border", priceCurrency: 40, category: "flair" });
    const app = createApp();

    const res = await request(app)
      .post("/api/v1/marketplace/purchase")
      .set(...auth("alice"))
      .send({ itemId: item.id });

    expect(res.status).toBe(200);
    expect(res.body.currency).toBe(60);

    const refreshedUser = await User.findById(alice.id);
    expect(refreshedUser!.currency).toBe(60);

    const owned = await UserInventory.findOne({ userId: alice._id, itemId: item._id });
    expect(owned).not.toBeNull();

    const ledger = await CurrencyTransaction.findOne({ userId: alice._id, reason: "marketplace_purchase" });
    expect(ledger!.delta).toBe(-40);
    expect(ledger!.balanceAfter).toBe(60);
  });

  it("rejects a purchase when currency is insufficient, without mutating anything", async () => {
    const alice = await createUser("alice", { currency: 10 });
    const item = await MarketplaceItem.create({ key: "crown", name: "Crown", priceCurrency: 250, category: "flair" });
    const app = createApp();

    const res = await request(app)
      .post("/api/v1/marketplace/purchase")
      .set(...auth("alice"))
      .send({ itemId: item.id });

    expect(res.status).toBe(409);
    const refreshedUser = await User.findById(alice.id);
    expect(refreshedUser!.currency).toBe(10);
    expect(await UserInventory.countDocuments({ userId: alice._id })).toBe(0);
  });

  it("rejects buying the same item twice", async () => {
    const alice = await createUser("alice", { currency: 1000 });
    const item = await MarketplaceItem.create({ key: "gold", name: "Gold Border", priceCurrency: 10, category: "flair" });
    const app = createApp();

    const first = await request(app)
      .post("/api/v1/marketplace/purchase")
      .set(...auth("alice"))
      .send({ itemId: item.id });
    expect(first.status).toBe(200);

    const second = await request(app)
      .post("/api/v1/marketplace/purchase")
      .set(...auth("alice"))
      .send({ itemId: item.id });
    expect(second.status).toBe(409);
  });
});

describe("inventory + equip", () => {
  it("equipping an item unequips any other item in the same category", async () => {
    const alice = await createUser("alice", { currency: 1000 });
    const itemA = await MarketplaceItem.create({ key: "gold", name: "Gold Border", priceCurrency: 10, category: "flair" });
    const itemB = await MarketplaceItem.create({ key: "fire", name: "Fire Badge", priceCurrency: 10, category: "flair" });
    const app = createApp();

    await request(app)
      .post("/api/v1/marketplace/purchase")
      .set(...auth("alice"))
      .send({ itemId: itemA.id });
    await request(app)
      .post("/api/v1/marketplace/purchase")
      .set(...auth("alice"))
      .send({ itemId: itemB.id });

    await request(app)
      .post(`/api/v1/users/me/inventory/${itemA.id}/equip`)
      .set(...auth("alice"));
    const equipB = await request(app)
      .post(`/api/v1/users/me/inventory/${itemB.id}/equip`)
      .set(...auth("alice"));
    expect(equipB.status).toBe(200);

    const ownedA = await UserInventory.findOne({ userId: alice._id, itemId: itemA._id });
    const ownedB = await UserInventory.findOne({ userId: alice._id, itemId: itemB._id });
    expect(ownedA!.equipped).toBe(false);
    expect(ownedB!.equipped).toBe(true);
  });

  it("surfaces equippedFlair on GET /users/:id", async () => {
    const alice = await createUser("alice", { currency: 1000 });
    const item = await MarketplaceItem.create({ key: "gold", name: "Gold Border", priceCurrency: 10, category: "flair" });
    const app = createApp();

    await request(app)
      .post("/api/v1/marketplace/purchase")
      .set(...auth("alice"))
      .send({ itemId: item.id });
    await request(app)
      .post(`/api/v1/users/me/inventory/${item.id}/equip`)
      .set(...auth("alice"));

    const res = await request(app)
      .get(`/api/v1/users/${alice.id}`)
      .set(...auth("alice"));
    expect(res.body.user.equippedFlair.key).toBe("gold");
  });
});
