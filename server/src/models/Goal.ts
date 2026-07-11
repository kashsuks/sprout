import { Schema, model, type InferSchemaType } from "mongoose";

const recurrenceSchema = new Schema(
  {
    type: { type: String, enum: ["daily", "weekly", "once"], required: true },
    // 0=Sunday..6=Saturday. Only meaningful (and required) for "weekly".
    daysOfWeek: { type: [Number], default: undefined },
  },
  { _id: false }
);

const goalSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true, maxlength: 80 },
    icon: { type: String, default: null },
    source: { type: String, enum: ["recommended", "custom"], required: true },
    recurrence: { type: recurrenceSchema, required: true },
    dueTime: { type: String, default: null }, // "HH:mm" local wall-clock, optional
    timezone: { type: String, required: true }, // IANA tz captured at creation
    active: { type: Boolean, default: true },
    duoId: { type: Schema.Types.ObjectId, ref: "Duo", default: null },
  },
  { timestamps: true }
);

goalSchema.index({ userId: 1, active: 1 });
goalSchema.index({ userId: 1, createdAt: -1 });

export type GoalDoc = InferSchemaType<typeof goalSchema>;
export const Goal = model("Goal", goalSchema);
