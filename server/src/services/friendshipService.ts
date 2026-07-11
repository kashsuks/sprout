import type { Types } from "mongoose";
import { canonicalPair, Friendship } from "../models/Friendship";

export async function areFriends(userIdA: Types.ObjectId | string, userIdB: Types.ObjectId | string): Promise<boolean> {
  if (userIdA.toString() === userIdB.toString()) return true;
  const pair = canonicalPair(userIdA, userIdB);
  const edge = await Friendship.exists({ ...pair, status: "accepted" });
  return Boolean(edge);
}

// Returns the ids of all users this user has an accepted friendship with.
// Centralized here so feed/leaderboard/duo queries share one implementation
// instead of re-deriving the $or-on-both-sides query at each call site.
export async function getFriendIds(userId: Types.ObjectId | string): Promise<string[]> {
  const id = userId.toString();
  const edges = await Friendship.find({
    status: "accepted",
    $or: [{ userA: id }, { userB: id }],
  }).lean();

  return edges.map((edge) => (edge.userA.toString() === id ? edge.userB.toString() : edge.userA.toString()));
}
