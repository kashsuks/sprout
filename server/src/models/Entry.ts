import { Schema, model, type InferSchemaType } from "mongoose";

// A completed-goal "stamp"/post. photoKey/upload wiring lands in Milestone 4;
// the schema is defined in full now since Goals' "today" view already needs
// to cross-reference entries to know which of today's goals are done.
const entrySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    goalId: { type: Schema.Types.ObjectId, ref: "Goal", required: true },
    taskTitle: { type: String, required: true }, // denormalized snapshot of goal.title at completion time
    caption: { type: String, default: "", maxlength: 280 },
    stickerEmoji: { type: String, default: null },
    photoKey: { type: String, required: true },
    pointsAwarded: { type: Number, required: true, default: 0 },
    completedAt: { type: Date, required: true, default: () => new Date() },
    // "YYYY-MM-DD" in the user's timezone at completion — drives same-day
    // comparisons for streaks/duo without re-deriving tz math on every read.
    localDate: { type: String, required: true },
    duoId: { type: Schema.Types.ObjectId, ref: "Duo", default: null },
  },
  { timestamps: true }
);

entrySchema.index({ userId: 1, goalId: 1, localDate: 1 }, { unique: true });
entrySchema.index({ userId: 1, completedAt: -1 });
entrySchema.index({ duoId: 1, localDate: -1 });

export type EntryDoc = InferSchemaType<typeof entrySchema>;
export const Entry = model("Entry", entrySchema);
