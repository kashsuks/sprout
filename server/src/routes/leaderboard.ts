import { Router } from "express";
import { Types } from "mongoose";
import { Entry } from "../models/Entry";
import { User } from "../models/User";
import { asyncHandler, HttpError } from "../middleware/errorHandler";
import { requireMongoUser } from "../middleware/attachMongoUser";
import { getFriendIds } from "../services/friendshipService";
import { isValidLocalDate } from "../utils/date";

export const leaderboardRouter = Router();
leaderboardRouter.use(requireMongoUser);

// GET /api/v1/leaderboard/friends?localDate=YYYY-MM-DD
// Derived live from users.points/currentStreak plus a same-day Entry sum —
// no separate leaderboard collection needed at friends-list scale (tens of
// rows, not global). All three metrics come back in one response; the
// client picks which to sort/rank by per its lifetime/today/streak tab.
leaderboardRouter.get(
  "/friends",
  asyncHandler(async (req, res) => {
    const localDate = String(req.query.localDate ?? "");
    if (!isValidLocalDate(localDate)) {
      throw new HttpError(400, "localDate query param is required, format YYYY-MM-DD");
    }

    const friendIds = await getFriendIds(req.user!.id);
    const ids = [...friendIds, req.user!.id];

    const users = await User.find({ _id: { $in: ids } }).select(
      "username displayName avatarKey points currentStreak"
    );

    // Mongoose's find() casts string ids against the ObjectId schema type
    // automatically; raw aggregate() pipelines don't, so cast explicitly.
    const objectIds = ids.map((id) => new Types.ObjectId(id));
    const todayTotals = await Entry.aggregate<{ _id: Types.ObjectId; total: number }>([
      { $match: { userId: { $in: objectIds }, localDate } },
      { $group: { _id: "$userId", total: { $sum: "$pointsAwarded" } } },
    ]);
    const todayByUserId = new Map(todayTotals.map((t) => [t._id.toString(), t.total]));

    const leaderboard = users.map((user) => ({
      _id: user._id,
      username: user.username,
      displayName: user.displayName,
      avatarKey: user.avatarKey,
      points: user.points,
      currentStreak: user.currentStreak,
      todayPoints: todayByUserId.get(user.id) ?? 0,
      me: user.id === req.user!.id,
    }));

    return res.status(200).json({ leaderboard });
  })
);
