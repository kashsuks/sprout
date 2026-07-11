import { Schema, model, type InferSchemaType } from "mongoose";

const marketplaceItemSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    priceCurrency: { type: Number, required: true, min: 0 },
    category: { type: String, enum: ["flair"], required: true, default: "flair" },
    imageKey: { type: String, default: null },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

marketplaceItemSchema.index({ active: 1 });

export type MarketplaceItemDoc = InferSchemaType<typeof marketplaceItemSchema>;
export const MarketplaceItem = model("MarketplaceItem", marketplaceItemSchema);
