import { Schema, model, Types, type InferSchemaType } from "mongoose";

// A single undirected edge per pair, using canonical ordering (userA is
// always the lexicographically smaller ObjectId) so a unique index on
// {userA, userB} prevents duplicate/directional edges without an app-level
// race-prone pre-check. Always build documents via canonicalPair() below.
const friendshipSchema = new Schema(
  {
    userA: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userB: { type: Schema.Types.ObjectId, ref: "User", required: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "accepted", "blocked"], required: true, default: "pending" },
  },
  { timestamps: true }
);

friendshipSchema.index({ userA: 1, userB: 1 }, { unique: true });
friendshipSchema.index({ userB: 1, status: 1 });
friendshipSchema.index({ userA: 1, status: 1 });

export function canonicalPair(idA: Types.ObjectId | string, idB: Types.ObjectId | string) {
  const a = idA.toString();
  const b = idB.toString();
  return a < b ? { userA: a, userB: b } : { userA: b, userB: a };
}

export type FriendshipDoc = InferSchemaType<typeof friendshipSchema>;
export const Friendship = model("Friendship", friendshipSchema);
