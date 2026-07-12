import { Schema, model, type InferSchemaType } from "mongoose";

// A completed-goal "stamp"/post. Photos are stored inline in Mongo (base64)
// rather than in object storage — simplest option for this project's scale,
// no external storage account needed. See photoDataUri() in utils/photo.ts
// for how photoData/photoContentType become a displayable URL at read time.
const entrySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    goalId: { type: Schema.Types.ObjectId, ref: "Goal", required: true },
    taskTitle: { type: String, required: true }, // denormalized snapshot of goal.title at completion time
    caption: { type: String, default: "", maxlength: 280 },
    stickerEmoji: { type: String, default: null },
    photoData: { type: String, required: true }, // base64-encoded image bytes
    photoContentType: { type: String, required: true },
    pointsAwarded: { type: Number, required: true, default: 0 },
    completedAt: { type: Date, required: true, default: () => new Date() },
    // "YYYY-MM-DD" in the user's timezone at completion — drives same-day
    // comparisons for streaks/duo without re-deriving tz math on every read.
    localDate: { type: String, required: true },
    duoId: { type: Schema.Types.ObjectId, ref: "Duo", default: null },
    likedBy: { type: [{ type: Schema.Types.ObjectId, ref: "User" }], default: [] },
  },
  { timestamps: true }
);

entrySchema.index({ userId: 1, goalId: 1, localDate: 1 }, { unique: true });
entrySchema.index({ userId: 1, completedAt: -1 });
entrySchema.index({ duoId: 1, localDate: -1 });

export type EntryDoc = InferSchemaType<typeof entrySchema>;
export const Entry = model("Entry", entrySchema);