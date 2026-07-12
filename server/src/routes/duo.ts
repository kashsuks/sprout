import { Router } from "express";
import { z } from "zod";
import { Duo } from "../models/Duo";
import { Goal } from "../models/Goal";
import { User } from "../models/User";
import { asyncHandler, HttpError } from "../middleware/errorHandler";
import { requireMongoUser } from "../middleware/attachMongoUser";
import { areFriends, getFriendIds } from "../services/friendshipService";

export const duoRouter = Router();
duoRouter.use(requireMongoUser);

// GET /api/v1/duo/linkable-friends?taskTitle=
// Powers LinkDuoScreen: list accepted friends annotated with whether an
// active duo already links the caller and that friend on this task.
duoRouter.get(
  "/linkable-friends",
  asyncHandler(async (req, res) => {
    const taskTitle = String(req.query.taskTitle ?? "").trim();
    if (!taskTitle) throw new HttpError(400, "taskTitle query param is required");

    const friendIds = await getFriendIds(req.user!.id);
    const friends = await User.find({ _id: { $in: friendIds } }).select("username displayName avatarKey");

    const activeDuos = await Duo.find({
      active: true,
      taskTitle: { $regex: `^${escapeRegex(taskTitle)}$`, $options: "i" },
      $or: [{ userAId: req.user!._id }, { userBId: req.user!._id }],
    });

    const friends_ = friends.map((friend) => {
      const linked = activeDuos.some(
        (duo) => duo.userAId.toString() === friend.id || duo.userBId.toString() === friend.id
      );
      return {
        _id: friend._id,
        username: friend.username,
        displayName: friend.displayName,
        avatarKey: friend.avatarKey,
        linked,
      };
    });

    return res.status(200).json({ friends: friends_ });
  })
);

const createDuoSchema = z.object({
  friendUserId: z.string().min(1),
  taskTitle: z.string().trim().min(1).max(80),
  myGoalId: z.string().min(1),
});

// POST /api/v1/duo
// Auto-links (no separate invite/accept step) to match LinkDuoScreen's
// existing UX, which is a simple link/unlink toggle rather than a
// request-response flow. If the friend doesn't already have an active goal
// with a matching title, one is created for them using the caller's
// recurrence/timezone as a starting point.
duoRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const body = createDuoSchema.parse(req.body);

    if (!(await areFriends(req.user!.id, body.friendUserId))) {
      throw new HttpError(403, "Can only link a duo with an accepted friend");
    }

    const myGoal = await Goal.findOne({ _id: body.myGoalId, userId: req.user!._id });
    if (!myGoal) throw new HttpError(404, "Goal not found");

    const existing = await Duo.findOne({
      active: true,
      taskTitle: { $regex: `^${escapeRegex(body.taskTitle)}$`, $options: "i" },
      $or: [
        { userAId: req.user!._id, userBId: body.friendUserId },
        { userAId: body.friendUserId, userBId: req.user!._id },
      ],
    });
    if (existing) throw new HttpError(409, "Already linked with this friend on this task");

    let friendGoal = await Goal.findOne({
      userId: body.friendUserId,
      title: { $regex: `^${escapeRegex(body.taskTitle)}$`, $options: "i" },
      active: true,
    });
    if (!friendGoal) {
      friendGoal = await Goal.create({
        userId: body.friendUserId,
        title: body.taskTitle,
        source: "custom",
        recurrence: myGoal.recurrence,
        timezone: myGoal.timezone,
      });
    }

    const duo = await Duo.create({
      userAId: req.user!._id,
      userBId: body.friendUserId,
      taskTitle: body.taskTitle,
      userAGoalId: myGoal._id,
      userBGoalId: friendGoal._id,
    });

    myGoal.duoId = duo._id;
    friendGoal.duoId = duo._id;
    await myGoal.save();
    await friendGoal.save();

    return res.status(201).json({ duo });
  })
);

// GET /api/v1/duo/active — the caller's current active duo (V1: at most
// surfaced one at a time for the FeedScreen's pinned duo card).
duoRouter.get(
  "/active",
  asyncHandler(async (req, res) => {
    const duo = await Duo.findOne({
      active: true,
      $or: [{ userAId: req.user!._id }, { userBId: req.user!._id }],
    });
    return res.status(200).json({ duo: duo ?? null });
  })
);

// DELETE /api/v1/duo/:id — unlink, clears duoId on both goals, streak lost
duoRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const duo = await Duo.findById(req.params.id);
    if (!duo) throw new HttpError(404, "Duo not found");
    if (duo.userAId.toString() !== req.user!.id && duo.userBId.toString() !== req.user!.id) {
      throw new HttpError(403, "Not part of this duo");
    }

    duo.active = false;
    await duo.save();
    await Goal.updateMany({ duoId: duo._id }, { $set: { duoId: null } });

    return res.status(204).send();
  })
);

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
