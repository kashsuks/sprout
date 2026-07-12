import { Router } from "express";
import { z } from "zod";
import { User } from "../models/User";
import { Entry } from "../models/Entry";
import { asyncHandler, HttpError } from "../middleware/errorHandler";
import { requireMongoUser } from "../middleware/attachMongoUser";
import { areFriends } from "../services/friendshipService";
import { photoDataUri } from "../utils/photo";
import { Types } from "mongoose";
import { PINS_CATALOG } from "../data/pinsCatalog";
import { UserPin } from "../models/UserPin";
import { MarketplaceItem } from "../models/MarketplaceItem";
import { UserInventory } from "../models/UserInventory";
import { getEquippedFlair } from "../services/inventoryService";

export const usersRouter = Router();

const patchMeSchema = z
  .object({
    displayName: z.string().trim().min(1).max(40),
    bio: z.string().trim().max(160),
    avatarKey: z.string().max(500).nullable(),
    friendsOnlyProfile: z.boolean(),
    // Client-computed HMAC hash of the user's own normalized phone number
    // (see hashContactValue/SECURITY.md) — enables others' contacts-match
    // lookups to find this user. Optional since phone number isn't
    // collected at signup.
    contactHash: z.string().max(128).nullable(),
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

const patchPreferencesSchema = z.object({
  contentPreferences: z.array(z.string().trim().min(1).max(40)).max(20),
});

// PATCH /api/v1/users/me/preferences
// Called once from the post-signup preferences modal (an empty array just
// means the user skipped it — hasSetPreferences is what tells the client
// not to show the modal again). Raw tags only; a separate job turns these
// into a vector embedding for Atlas Vector Search elsewhere.
usersRouter.patch(
  "/me/preferences",
  requireMongoUser,
  asyncHandler(async (req, res) => {
    const { contentPreferences } = patchPreferencesSchema.parse(req.body);
    req.user!.contentPreferences = contentPreferences;
    req.user!.hasSetPreferences = true;
    await req.user!.save();
    return res.status(200).json({ user: req.user });
  })
);

// GET /api/v1/users/me/scrapbook?cursor=&limit=
// Just a query over the caller's own entries — no separate collection.
// Cursor pagination on _id (roughly time-ordered and unique), not
// completedAt, to keep the query simple and unambiguous.
usersRouter.get(
  "/me/scrapbook",
  requireMongoUser,
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const cursor = typeof req.query.cursor === "string" ? req.query.cursor : undefined;

    const query: Record<string, unknown> = { userId: req.user!._id };
    if (cursor && Types.ObjectId.isValid(cursor)) {
      query._id = { $lt: new Types.ObjectId(cursor) };
    }

    const entries = await Entry.find(query).sort({ _id: -1 }).limit(limit);
    const nextCursor = entries.length === limit ? entries[entries.length - 1]!._id : null;

    return res.status(200).json({
      entries: entries.map((entry) => ({ ...entry.toObject(), photoUrl: photoDataUri(entry) })),
      nextCursor,
    });
  })
);

// GET /api/v1/users/me/inventory
usersRouter.get(
  "/me/inventory",
  requireMongoUser,
  asyncHandler(async (req, res) => {
    const inventory = await UserInventory.find({ userId: req.user!._id }).populate("itemId");
    return res.status(200).json({ inventory });
  })
);

// POST /api/v1/users/me/inventory/:itemId/equip
// Single active flair per category: unequips any other owned item in the
// same category before equipping this one.
usersRouter.post(
  "/me/inventory/:itemId/equip",
  requireMongoUser,
  asyncHandler(async (req, res) => {
    const owned = await UserInventory.findOne({ userId: req.user!._id, itemId: req.params.itemId });
    if (!owned) throw new HttpError(404, "Item not owned");

    const item = await MarketplaceItem.findById(req.params.itemId);
    if (!item) throw new HttpError(404, "Item not found");

    const sameCategoryItemIds = (await MarketplaceItem.find({ category: item.category }).select("_id")).map(
      (i) => i._id
    );
    await UserInventory.updateMany(
      { userId: req.user!._id, itemId: { $in: sameCategoryItemIds } },
      { $set: { equipped: false } }
    );
    owned.equipped = true;
    await owned.save();

    return res.status(200).json({ inventory: owned });
  })
);

// GET /api/v1/users/:id
// Respects friendsOnlyProfile: non-friends viewing a friends-only profile
// get a trimmed-down public view instead of the full document. Equipped
// flair is always surfaced (even in the limited view) since it's cosmetic
// and meant to be publicly visible on the profile.
usersRouter.get(
  "/:id",
  requireMongoUser,
  asyncHandler(async (req, res) => {
    const target = await User.findById(req.params.id);
    if (!target) throw new HttpError(404, "User not found");

    const isSelf = target.id === req.user!.id;
    const isFriend = isSelf ? true : await areFriends(req.user!.id, target.id);
    const equippedFlair = await getEquippedFlair(target._id);

    if (!isSelf && target.friendsOnlyProfile && !isFriend) {
      return res.status(200).json({
        user: {
          _id: target._id,
          username: target.username,
          displayName: target.displayName,
          avatarKey: target.avatarKey,
          equippedFlair,
        },
        limited: true,
      });
    }

    return res.status(200).json({ user: { ...target.toObject(), equippedFlair }, limited: false });
  })
);

// GET /api/v1/users/:id/pins
usersRouter.get(
  "/:id/pins",
  requireMongoUser,
  asyncHandler(async (req, res) => {
    const target = await User.findById(req.params.id);
    if (!target) throw new HttpError(404, "User not found");

    const earnedKeys = new Set((await UserPin.find({ userId: target._id }).select("pinKey")).map((p) => p.pinKey));
    const pins = PINS_CATALOG.filter((pin) => earnedKeys.has(pin.key));
    return res.status(200).json({ pins });
  })
);
