import { Schema, model, type InferSchemaType } from "mongoose";

const userPinSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    pinKey: { type: String, required: true },
    awardedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

userPinSchema.index({ userId: 1, pinKey: 1 }, { unique: true });

export type UserPinDoc = InferSchemaType<typeof userPinSchema>;
export const UserPin = model("UserPin", userPinSchema);
