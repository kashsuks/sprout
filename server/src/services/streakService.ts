import type { HydratedDocument } from "mongoose";
import type { UserDoc } from "../models/User";
import { daysBetween } from "../utils/date";

// Updates the user's own overall streak counter given a newly-completed
// entry's localDate. Consecutive-day logic only — duo-specific shared-streak
// evaluation is separate (Milestone 7).
export function applyStreakUpdate(user: HydratedDocument<UserDoc>, localDate: string): void {
  if (!user.lastCompletedLocalDate) {
    user.currentStreak = 1;
    user.lastCompletedLocalDate = localDate;
    return;
  }

  const diff = daysBetween(user.lastCompletedLocalDate, localDate);
  if (diff < 0) return; // backfilled entry earlier than the current streak anchor; ignore
  if (diff === 0) return; // already logged something today, streak unchanged
  user.currentStreak = diff === 1 ? user.currentStreak + 1 : 1;
  user.lastCompletedLocalDate = localDate;
}
