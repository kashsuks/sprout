import type { HydratedDocument, Types } from "mongoose";
import { CurrencyTransaction } from "../models/CurrencyTransaction";
import type { UserDoc } from "../models/User";

export async function recordCurrencyDelta(
  user: HydratedDocument<UserDoc>,
  delta: number,
  reason: "entry_completed" | "admin_adjustment",
  related: { relatedEntryId?: Types.ObjectId | string } = {}
): Promise<void> {
  await CurrencyTransaction.create({
    userId: user._id,
    delta,
    reason,
    balanceAfter: user.currency,
    ...related,
  });
}
