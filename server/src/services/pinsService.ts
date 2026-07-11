import type { HydratedDocument } from "mongoose";
import { PINS_CATALOG } from "../data/pinsCatalog";
import { Entry } from "../models/Entry";
import type { UserDoc } from "../models/User";
import { UserPin } from "../models/UserPin";

// Called after an entry's points/streak have been applied to `user` (so
// user.currentStreak reflects this completion). Awards any newly-earned
// pins and returns their keys.
export async function evaluateAndAwardPins(user: HydratedDocument<UserDoc>): Promise<string[]> {
  const entryCount = await Entry.countDocuments({ userId: user._id });
  const alreadyEarned = new Set(
    (await UserPin.find({ userId: user._id }).select("pinKey")).map((p) => p.pinKey)
  );

  const newlyEarnedKeys = PINS_CATALOG.filter((pin) => {
    if (alreadyEarned.has(pin.key)) return false;
    return pin.criteria.type === "entryCount"
      ? entryCount >= pin.criteria.count
      : user.currentStreak >= pin.criteria.days;
  }).map((pin) => pin.key);

  if (newlyEarnedKeys.length > 0) {
    await UserPin.insertMany(newlyEarnedKeys.map((pinKey) => ({ userId: user._id, pinKey })));
  }

  return newlyEarnedKeys;
}
