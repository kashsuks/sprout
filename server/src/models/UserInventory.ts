import { Schema, model, type InferSchemaType } from "mongoose";

const userInventorySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    itemId: { type: Schema.Types.ObjectId, ref: "MarketplaceItem", required: true },
    acquiredAt: { type: Date, default: () => new Date() },
    equipped: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userInventorySchema.index({ userId: 1, itemId: 1 }, { unique: true });
userInventorySchema.index({ userId: 1, equipped: 1 });

export type UserInventoryDoc = InferSchemaType<typeof userInventorySchema>;
export const UserInventory = model("UserInventory", userInventorySchema);
