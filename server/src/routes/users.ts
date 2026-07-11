import { Router } from "express";
import { z } from "zod";
import { User } from "../models/User";
import { asyncHandler, HttpError } from "../middleware/errorHandler";
import { requireMongoUser } from "../middleware/attachMongoUser";
import { areFriends } from "../services/friendshipService";

export const usersRouter = Router();

const patchMeSchema = z
  .object({
    displayName: z.string().trim().min(1).max(40),
    bio: z.string().trim().max(160),
    avatarKey: z.string().max(500).nullable(),
    friendsOnlyProfile: z.boolean(),
  })
  .partial();

// PATCH /api/v1/users/me
usersRouter.patch(
  "/me",
  requireMongoUser,
  asyncHandler(async (req, res) => {
    const updates = patchMeSchema.parse(req.body);
    Object.assign(req.user!, updates);
    await req.user!.save();
    return res.status(200).json({ user: req.user });
  })
);

// GET /api/v1/users/:id
// Respects friendsOnlyProfile: non-friends viewing a friends-only profile
// get a trimmed-down public view instead of the full document.
usersRouter.get(
  "/:id",
  requireMongoUser,
  asyncHandler(async (req, res) => {
    const target = await User.findById(req.params.id);
    if (!target) throw new HttpError(404, "User not found");

    const isSelf = target.id === req.user!.id;
    const isFriend = isSelf ? true : await areFriends(req.user!.id, target.id);

    if (!isSelf && target.friendsOnlyProfile && !isFriend) {
      return res.status(200).json({
        user: {
          _id: target._id,
          username: target.username,
          displayName: target.displayName,
          avatarKey: target.avatarKey,
        },
        limited: true,
      });
    }

    return res.status(200).json({ user: target, limited: false });
  })
);
