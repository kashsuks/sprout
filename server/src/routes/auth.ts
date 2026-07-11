import { Router } from "express";
import { z } from "zod";
import { User } from "../models/User";
import { asyncHandler } from "../middleware/errorHandler";
import { hashContactValue, normalizeEmail } from "../utils/hash";

export const authRouter = Router();

const bootstrapSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(24)
    .regex(/^[a-z0-9_]+$/, "username may only contain lowercase letters, numbers, and underscores"),
  displayName: z.string().trim().min(1).max(40),
  bio: z.string().trim().max(160).optional().default(""),
});

// POST /api/v1/auth/bootstrap
// Idempotent: if a Mongo profile already exists for this Firebase UID, just
// returns it and ignores the body. Otherwise creates it from the submitted
// fields. Called once by the client right after first successful sign-in.
authRouter.post(
  "/bootstrap",
  asyncHandler(async (req, res) => {
    if (!req.firebaseUid || !req.firebaseEmail) {
      return res.status(401).json({ error: "Missing verified Firebase identity" });
    }

    const existing = await User.findOne({ firebaseUid: req.firebaseUid });
    if (existing) {
      return res.status(200).json({ user: existing });
    }

    const body = bootstrapSchema.parse(req.body);

    const usernameTaken = await User.exists({ username: body.username });
    if (usernameTaken) {
      return res.status(409).json({ error: "Username is already taken" });
    }

    const emailHash = hashContactValue(normalizeEmail(req.firebaseEmail));

    const user = await User.create({
      firebaseUid: req.firebaseUid,
      username: body.username,
      displayName: body.displayName,
      bio: body.bio,
      emailHash,
    });

    return res.status(201).json({ user });
  })
);

// GET /api/v1/auth/me
// 200 with the profile if onboarding is complete; 404 if the Firebase
// account exists but no Mongo profile has been bootstrapped yet.
authRouter.get(
  "/me",
  asyncHandler(async (req, res) => {
    if (!req.user) {
      return res.status(404).json({ error: "Profile not found. Complete POST /auth/bootstrap first." });
    }
    return res.status(200).json({ user: req.user });
  })
);
