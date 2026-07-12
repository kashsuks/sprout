import type { Types } from "mongoose";
import { Entry } from "../models/Entry";
import { User } from "../models/User";
import { getFriendIds } from "./friendshipService";
import { searchGoalsByText, type VectorGoalMatch } from "./vectorSearchService";
import { photoDataUri } from "../utils/photo";

// Fills the feed for users with no friends (or no friend activity) by
// vector-matching other public users' goals against the caller's
// contentPreferences (set once via the post-signup preferences modal).
export async function getDiscoverEntries(userId: string, limit: number) {
  const user = await User.findById(userId);
  const contentPreferences = user?.contentPreferences ?? [];
  if (contentPreferences.length === 0) return [];

  const friendIds = new Set(await getFriendIds(userId));
  const candidates = await searchGoalsByText(contentPreferences.join(", "), limit * 4);

  const ownerIds = [...new Set(candidates.map((c) => c.userId))].filter(
    (id) => id !== userId && !friendIds.has(id)
  );
  const discoverableOwners = await User.find({
    _id: { $in: ownerIds },
    friendsOnlyProfile: { $ne: true }, // reuse existing privacy flag as the discoverability signal
  }).select("username displayName avatarKey");
  const allowedOwnerIds = new Set(discoverableOwners.map((o) => o.id));

  const bestGoalByOwner = new Map<string, VectorGoalMatch>();
  for (const candidate of candidates) {
    if (!allowedOwnerIds.has(candidate.userId) || bestGoalByOwner.has(candidate.userId)) continue;
    bestGoalByOwner.set(candidate.userId, candidate);
    if (bestGoalByOwner.size >= limit) break;
  }

  const authorById = new Map(discoverableOwners.map((o) => [o.id, o]));
  const entries = await Promise.all(
    [...bestGoalByOwner.values()].map(async (goal) => {
      const entry =
        (await Entry.findOne({ goalId: goal.goalId }).sort({ _id: -1 })) ??
        (await Entry.findOne({ userId: goal.userId }).sort({ _id: -1 }));
      if (!entry) return null;
      // Same response shape as the friends-feed path (routes/feed.ts) minus
      // the raw likedBy array. Discover entries are only ever surfaced from
      // public (non friends-only) profiles, which routes/feed.ts's like
      // guard also permits liking, so likedByMe reflects real state here too.
      const { likedBy, ...rest } = entry.toObject();
      return {
        ...rest,
        photoUrl: photoDataUri(entry),
        author: authorById.get(goal.userId) ?? null,
        likeCount: likedBy?.length ?? 0,
        likedByMe: (likedBy ?? []).some((id: Types.ObjectId) => id.toString() === userId),
      };
    })
  );

  return entries.filter((entry): entry is NonNullable<typeof entry> => entry !== null);
}
