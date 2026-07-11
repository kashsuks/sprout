import { Router } from "express";
import { z } from "zod";
import { canonicalPair, Friendship } from "../models/Friendship";
import { User } from "../models/User";
import { asyncHandler, HttpError } from "../middleware/errorHandler";
import { requireMongoUser } from "../middleware/attachMongoUser";
import { getFriendIds } from "../services/friendshipService";

export const friendsRouter = Router();
friendsRouter.use(requireMongoUser);

// GET /api/v1/friends/search?q=username_prefix
// Excludes self; annotates each match with the caller's relationship to
// them so the client can show "add" / "pending" / "friends" appropriately.
friendsRouter.get(
  "/search",
  asyncHandler(async (req, res) => {
    const q = String(req.query.q ?? "").trim().toLowerCase();
    if (q.length === 0) return res.status(200).json({ users: [] });

    const matches = await User.find({
      username: { $regex: `^${escapeRegex(q)}`, $options: "i" },
      _id: { $ne: req.user!._id },
    })
      .limit(20)
      .select("username displayName avatarKey");

    const edges = await Friendship.find({
      $or: matches.map((m) => canonicalPair(req.user!.id, m.id)),
    });

    const users = matches.map((m) => {
      const pair = canonicalPair(req.user!.id, m.id);
      const edge = edges.find((e) => e.userA.toString() === pair.userA && e.userB.toString() === pair.userB);
      let status: "none" | "friends" | "pending_outgoing" | "pending_incoming" = "none";
      if (edge?.status === "accepted") status = "friends";
      else if (edge?.status === "pending") {
        status = edge.requestedBy.toString() === req.user!.id ? "pending_outgoing" : "pending_incoming";
      }
      return { _id: m._id, username: m.username, displayName: m.displayName, avatarKey: m.avatarKey, status };
    });

    return res.status(200).json({ users });
  })
);

const contactsMatchSchema = z.object({ hashes: z.array(z.string()).min(1).max(2000) });

// POST /api/v1/friends/contacts-match
// Body contains only client-computed hashes of the device's address book
// (never raw phone numbers/emails, see SECURITY.md). Matches against each
// existing user's own contactHash/emailHash, computed the same way at
// signup — the server never learns which contact matched which hash.
friendsRouter.post(
  "/contacts-match",
  asyncHandler(async (req, res) => {
    const { hashes } = contactsMatchSchema.parse(req.body);

    const matches = await User.find({
      _id: { $ne: req.user!._id },
      $or: [{ contactHash: { $in: hashes } }, { emailHash: { $in: hashes } }],
    }).select("username displayName avatarKey");

    return res.status(200).json({
      users: matches.map((m) => ({ _id: m._id, username: m.username, displayName: m.displayName, avatarKey: m.avatarKey })),
    });
  })
);

const requestSchema = z.object({ toUserId: z.string().min(1) });

// POST /api/v1/friends/requests
friendsRouter.post(
  "/requests",
  asyncHandler(async (req, res) => {
    const { toUserId } = requestSchema.parse(req.body);
    if (toUserId === req.user!.id) throw new HttpError(400, "Cannot friend-request yourself");

    const target = await User.findById(toUserId);
    if (!target) throw new HttpError(404, "User not found");

    const pair = canonicalPair(req.user!.id, toUserId);
    const existing = await Friendship.findOne(pair);
    if (existing) {
      const message =
        existing.status === "accepted"
          ? "Already friends"
          : existing.requestedBy.toString() === req.user!.id
            ? "Request already pending"
            : "This user has already sent you a request — accept it instead";
      throw new HttpError(409, message);
    }

    const friendship = await Friendship.create({ ...pair, requestedBy: req.user!._id, status: "pending" });
    return res.status(201).json({ friendship });
  })
);

async function loadOwnedFriendship(friendshipId: string, userId: string) {
  const friendship = await Friendship.findById(friendshipId);
  if (!friendship) throw new HttpError(404, "Friend request not found");
  if (friendship.userA.toString() !== userId && friendship.userB.toString() !== userId) {
    throw new HttpError(403, "Not part of this friend request");
  }
  return friendship;
}

// POST /api/v1/friends/requests/:friendshipId/accept
friendsRouter.post(
  "/requests/:friendshipId/accept",
  asyncHandler(async (req, res) => {
    const friendship = await loadOwnedFriendship(req.params.friendshipId, req.user!.id);
    if (friendship.status !== "pending") throw new HttpError(409, "Request is not pending");
    if (friendship.requestedBy.toString() === req.user!.id) {
      throw new HttpError(403, "Only the recipient can accept a request");
    }
    friendship.status = "accepted";
    await friendship.save();
    return res.status(200).json({ friendship });
  })
);

// POST /api/v1/friends/requests/:friendshipId/decline
// Deletes the edge (rather than a permanent "declined" status) so the pair
// can re-request later.
friendsRouter.post(
  "/requests/:friendshipId/decline",
  asyncHandler(async (req, res) => {
    const friendship = await loadOwnedFriendship(req.params.friendshipId, req.user!.id);
    if (friendship.status !== "pending") throw new HttpError(409, "Request is not pending");
    await friendship.deleteOne();
    return res.status(204).send();
  })
);

// GET /api/v1/friends
friendsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const friendIds = await getFriendIds(req.user!.id);
    const friends = await User.find({ _id: { $in: friendIds } }).select("username displayName avatarKey points");
    return res.status(200).json({ friends });
  })
);

// GET /api/v1/friends/requests/incoming
friendsRouter.get(
  "/requests/incoming",
  asyncHandler(async (req, res) => {
    const requests = await Friendship.find({
      status: "pending",
      requestedBy: { $ne: req.user!._id },
      $or: [{ userA: req.user!._id }, { userB: req.user!._id }],
    });
    return res.status(200).json({ requests });
  })
);

// GET /api/v1/friends/requests/outgoing
friendsRouter.get(
  "/requests/outgoing",
  asyncHandler(async (req, res) => {
    const requests = await Friendship.find({ status: "pending", requestedBy: req.user!._id });
    return res.status(200).json({ requests });
  })
);

// DELETE /api/v1/friends/:friendshipId — unfriend
friendsRouter.delete(
  "/:friendshipId",
  asyncHandler(async (req, res) => {
    const friendship = await loadOwnedFriendship(req.params.friendshipId, req.user!.id);
    await friendship.deleteOne();
    return res.status(204).send();
  })
);

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
