import { Router } from "express";
import { User } from "../models/User";
import { asyncHandler } from "../middleware/errorHandler";
import { requireMongoUser } from "../middleware/attachMongoUser";
import { getFriendIds } from "../services/friendshipService";

export const leaderboardRouter = Router();
leaderboardRouter.use(requireMongoUser);

// GET /api/v1/leaderboard/friends
// Derived live from users.points — no separate leaderboard collection
// needed at friends-list scale (tens of rows, not global).
leaderboardRouter.get(
  "/friends",
  asyncHandler(async (req, res) => {
    const friendIds = await getFriendIds(req.user!.id);
    const ids = [...friendIds, req.user!.id];

    const users = await User.find({ _id: { $in: ids } })
      .select("username displayName avatarKey points")
      .sort({ points: -1 });

    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      _id: user._id,
      username: user.username,
      displayName: user.displayName,
      avatarKey: user.avatarKey,
      points: user.points,
      me: user.id === req.user!.id,
    }));

    return res.status(200).json({ leaderboard });
  })
);
