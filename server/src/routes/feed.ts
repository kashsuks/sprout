import { Router } from "express";
import { Types } from "mongoose";
import { Duo } from "../models/Duo";
import { Entry } from "../models/Entry";
import { User } from "../models/User";
import { asyncHandler } from "../middleware/errorHandler";
import { requireMongoUser } from "../middleware/attachMongoUser";
import { getFriendIds } from "../services/friendshipService";
import { photoUrlFor } from "../services/spacesService";

export const feedRouter = Router();
feedRouter.use(requireMongoUser);

// GET /api/v1/feed?cursor=&limit=
// Entries authored by the caller's accepted friends only, newest first,
// cursor-paginated on _id. Author info is denormalized into the response
// via a single follow-up User lookup rather than N+1 queries per entry.
feedRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const cursor = typeof req.query.cursor === "string" ? req.query.cursor : undefined;

    const friendIds = await getFriendIds(req.user!.id);
    if (friendIds.length === 0) return res.status(200).json({ entries: [], nextCursor: null });

    const query: Record<string, unknown> = { userId: { $in: friendIds } };
    if (cursor && Types.ObjectId.isValid(cursor)) {
      query._id = { $lt: new Types.ObjectId(cursor) };
    }

    const entries = await Entry.find(query).sort({ _id: -1 }).limit(limit);
    const authorIds = [...new Set(entries.map((e) => e.userId.toString()))];
    const authors = await User.find({ _id: { $in: authorIds } }).select("username displayName avatarKey");
    const authorById = new Map(authors.map((a) => [a.id, a]));

    const nextCursor = entries.length === limit ? entries[entries.length - 1]!._id : null;

    return res.status(200).json({
      entries: entries.map((entry) => ({
        ...entry.toObject(),
        photoUrl: photoUrlFor(entry.photoKey),
        author: authorById.get(entry.userId.toString()) ?? null,
      })),
      nextCursor,
    });
  })
);

// GET /api/v1/feed/duo
// The caller's own pinned duo card (V1 simplification: only the viewer's
// own duo is shown, not duos among their friends).
feedRouter.get(
  "/duo",
  asyncHandler(async (req, res) => {
    const duo = await Duo.findOne({
      active: true,
      $or: [{ userAId: req.user!._id }, { userBId: req.user!._id }],
    });
    if (!duo) return res.status(200).json({ duo: null });

    const [userA, userB] = await Promise.all([User.findById(duo.userAId), User.findById(duo.userBId)]);
    const [entryA, entryB] = await Promise.all([
      Entry.findOne({ goalId: duo.userAGoalId }).sort({ _id: -1 }),
      Entry.findOne({ goalId: duo.userBGoalId }).sort({ _id: -1 }),
    ]);

    return res.status(200).json({
      duo: {
        _id: duo._id,
        taskTitle: duo.taskTitle,
        streak: duo.streak,
        names: [userA?.displayName ?? null, userB?.displayName ?? null],
        photos: [entryA ? photoUrlFor(entryA.photoKey) : null, entryB ? photoUrlFor(entryB.photoKey) : null],
        caption: entryB?.caption || entryA?.caption || "",
      },
    });
  })
);
