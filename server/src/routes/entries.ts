import { Router } from "express";
import { z } from "zod";
import { Duo } from "../models/Duo";
import { Entry } from "../models/Entry";
import { Goal } from "../models/Goal";
import { evaluateDuoStreakOnEntry } from "../services/duoStreakService";
import { asyncHandler, HttpError } from "../middleware/errorHandler";
import { requireMongoUser } from "../middleware/attachMongoUser";
import { isValidLocalDate } from "../utils/date";
import { isAllowedImageContentType, MAX_PHOTO_BYTES, photoDataUri } from "../utils/photo";
import { awardEntryRewards, POINTS_PER_ENTRY } from "../services/pointsService";
import { applyStreakUpdate } from "../services/streakService";
import { evaluateAndAwardPins } from "../services/pinsService";
import { recordCurrencyDelta } from "../services/currencyLedgerService";
import { CURRENCY_PER_ENTRY } from "../services/pointsService";

export const entriesRouter = Router();
entriesRouter.use(requireMongoUser);

const createEntrySchema = z.object({
  goalId: z.string().min(1),
  photoData: z.string().min(1),
  photoContentType: z.string().refine(isAllowedImageContentType, "photoContentType must be image/jpeg or image/png"),
  caption: z.string().max(280).optional().default(""),
  stickerEmoji: z.string().max(8).nullable().optional(),
  localDate: z.string().refine(isValidLocalDate, "localDate must be YYYY-MM-DD"),
});

// POST /api/v1/entries
// Completes a goal for the day: creates the entry (photo stored inline as
// base64 in Mongo), awards points/currency, updates the streak, and (if the
// goal is a "once" goal) deactivates it. Returns updated stats inline so the
// client's completion screen can show them without a second round-trip.
entriesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const body = createEntrySchema.parse(req.body);

    const goal = await Goal.findOne({ _id: body.goalId, userId: req.user!._id });
    if (!goal) throw new HttpError(404, "Goal not found");

    const decodedSize = Math.ceil((body.photoData.length * 3) / 4);
    if (decodedSize > MAX_PHOTO_BYTES) {
      throw new HttpError(400, `Photo is too large (max ${Math.floor(MAX_PHOTO_BYTES / 1024 / 1024)}MB)`);
    }

    let entry;
    try {
      entry = await Entry.create({
        userId: req.user!._id,
        goalId: goal._id,
        taskTitle: goal.title,
        caption: body.caption,
        stickerEmoji: body.stickerEmoji ?? null,
        photoData: body.photoData,
        photoContentType: body.photoContentType,
        pointsAwarded: POINTS_PER_ENTRY,
        localDate: body.localDate,
        duoId: goal.duoId ?? null,
      });
    } catch (err: unknown) {
      if (err && typeof err === "object" && "code" in err && err.code === 11000) {
        throw new HttpError(409, "This goal has already been completed today");
      }
      throw err;
    }

    awardEntryRewards(req.user!);
    applyStreakUpdate(req.user!, body.localDate);
    await req.user!.save();
    await recordCurrencyDelta(req.user!, CURRENCY_PER_ENTRY, "entry_completed", { relatedEntryId: entry._id });

    if (goal.recurrence.type === "once") {
      goal.active = false;
      await goal.save();
    }

    if (goal.duoId) {
      const duo = await Duo.findById(goal.duoId);
      if (duo && duo.active) {
        await evaluateDuoStreakOnEntry(duo, goal._id, body.localDate);
      }
    }

    const newlyEarnedPins = await evaluateAndAwardPins(req.user!);

    return res.status(201).json({
      entry: { ...entry.toObject(), photoUrl: photoDataUri(entry) },
      user: {
        points: req.user!.points,
        currency: req.user!.currency,
        currentStreak: req.user!.currentStreak,
      },
      newlyEarnedPins,
    });
  })
);

// GET /api/v1/entries/:id
entriesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const entry = await Entry.findById(req.params.id);
    if (!entry) throw new HttpError(404, "Entry not found");
    return res.status(200).json({ entry: { ...entry.toObject(), photoUrl: photoDataUri(entry) } });
  })
);

// DELETE /api/v1/entries/:id — does not refund points/currency (documented
// business decision to avoid gaming via delete-and-redo).
entriesRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const entry = await Entry.findOne({ _id: req.params.id, userId: req.user!._id });
    if (!entry) throw new HttpError(404, "Entry not found");
    await entry.deleteOne();
    return res.status(204).send();
  })
);
