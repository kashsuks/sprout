import { Schema, model, type InferSchemaType } from "mongoose";

const duoSchema = new Schema(
  {
    userAId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userBId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    taskTitle: { type: String, required: true, trim: true },
    userAGoalId: { type: Schema.Types.ObjectId, ref: "Goal", required: true },
    userBGoalId: { type: Schema.Types.ObjectId, ref: "Goal", required: true },
    streak: { type: Number, default: 0 },
    lastBothCompletedLocalDate: { type: String, default: null },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

duoSchema.index({ userAId: 1, active: 1 });
duoSchema.index({ userBId: 1, active: 1 });

export type DuoDoc = InferSchemaType<typeof duoSchema>;
export const Duo = model("Duo", duoSchema);
