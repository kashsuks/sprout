import { Schema, model, type InferSchemaType } from "mongoose";

// Audit trail for every points/currency delta, so a bad award or a
// disputed purchase can be traced or reversed. Not exposed as a
// user-facing feature — purely for support/debugging.
const currencyTransactionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    delta: { type: Number, required: true },
    reason: { type: String, enum: ["entry_completed", "admin_adjustment"], required: true },
    relatedEntryId: { type: Schema.Types.ObjectId, ref: "Entry", default: null },
    balanceAfter: { type: Number, required: true },
  },
  { timestamps: true }
);

currencyTransactionSchema.index({ userId: 1, createdAt: -1 });

export type CurrencyTransactionDoc = InferSchemaType<typeof currencyTransactionSchema>;
export const CurrencyTransaction = model("CurrencyTransaction", currencyTransactionSchema);
