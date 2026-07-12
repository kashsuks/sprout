import type { HydratedDocument } from "mongoose";
import type { UserDoc } from "../models/User";

// Flat award per completion for V1, matching the CompleteStampScreen mock's
// "+15 pts". points is lifetime (drives leaderboard, never decremented);
// currency is a separate earned balance, tracked for a future spend feature.
export const POINTS_PER_ENTRY = 15;
export const CURRENCY_PER_ENTRY = 10;

export function awardEntryRewards(user: HydratedDocument<UserDoc>): void {
  user.points += POINTS_PER_ENTRY;
  user.currency += CURRENCY_PER_ENTRY;
}
