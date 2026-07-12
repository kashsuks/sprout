import type { HydratedDocument, Types } from "mongoose";
import { Entry } from "../models/Entry";
import type { DuoDoc } from "../models/Duo";
import { daysBetween } from "../utils/date";

/**
 * Called when an entry is created for a goal that belongs to an active duo.
 * The streak only advances once BOTH sides have completed for the same
 * localDate; if the other side hasn't gone yet, this is a no-op (we're
 * waiting on them).
 *
 * Tradeoff: a "miss" (neither side completing on a due day) is only
 * detected lazily, the next time either side completes again — there is no
 * background job scanning for elapsed due-days without a completion. This
 * keeps Milestone 7 free of a cron/scheduler dependency; if instant
 * miss-detection is needed later, add a scheduled job that walks active
 * duos and zeroes out streak/lastBothCompletedLocalDate once too many days
 * have elapsed since the last joint completion.
 */
export async function evaluateDuoStreakOnEntry(
  duo: HydratedDocument<DuoDoc>,
  completingGoalId: Types.ObjectId | string,
  localDate: string
): Promise<void> {
  const otherGoalId = duo.userAGoalId.toString() === completingGoalId.toString() ? duo.userBGoalId : duo.userAGoalId;
  const otherCompletedToday = await Entry.exists({ goalId: otherGoalId, localDate });
  if (!otherCompletedToday) return;

  if (!duo.lastBothCompletedLocalDate) {
    duo.streak = 1;
  } else {
    const diff = daysBetween(duo.lastBothCompletedLocalDate, localDate);
    if (diff > 1) {
      duo.streak = 1; // one or more days were missed since the last joint completion
    } else if (diff === 1) {
      duo.streak += 1;
    }
    // diff <= 0: already counted today or an out-of-order backfill; leave as-is
  }
  duo.lastBothCompletedLocalDate = localDate;
  await duo.save();
}
