import { describe, expect, it, vi } from "vitest";

// env.ts validates required vars at import time; supply throwaway values so
// config loading succeeds without real Mongo/Firebase credentials.
process.env.MONGODB_URI ??= "mongodb://localhost:27017/sprout-test";
process.env.FIREBASE_PROJECT_ID ??= "test-project";
process.env.FIREBASE_CLIENT_EMAIL ??= "test@example.com";
process.env.FIREBASE_PRIVATE_KEY ??= "test-key";

// firebase-admin needs real credentials to initialize; stub it out so this
// test only exercises Express wiring (health check + 401 on missing auth),
// not live Firebase/Mongo connectivity.
vi.mock("../src/config/firebase", () => ({
  firebaseAuth: { verifyIdToken: vi.fn() },
}));

const { createApp } = await import("../src/app");
const request = (await import("supertest")).default;

describe("app", () => {
  it("GET /health returns ok", async () => {
    const res = await request(createApp()).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it("GET /api/v1/auth/me without a token returns 401", async () => {
    const res = await request(createApp()).get("/api/v1/auth/me");
    expect(res.status).toBe(401);
  });
});
