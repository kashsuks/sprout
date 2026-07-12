import { Router } from "express";
import { PINS_CATALOG } from "../data/pinsCatalog";
import { UserPin } from "../models/UserPin";
import { asyncHandler } from "../middleware/errorHandler";
import { requireMongoUser } from "../middleware/attachMongoUser";

export const pinsRouter = Router();
pinsRouter.use(requireMongoUser);

// GET /api/v1/pins — full catalog, annotated with whether the caller earned each one.
// Pins are never awarded via POST — only automatically by the entry-completion service.
pinsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const earned = new Set((await UserPin.find({ userId: req.user!._id }).select("pinKey")).map((p) => p.pinKey));
    const pins = PINS_CATALOG.map((pin) => ({ ...pin, earned: earned.has(pin.key) }));
    return res.status(200).json({ pins });
  })
);
