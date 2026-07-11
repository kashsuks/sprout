import type { Types } from "mongoose";
import { MarketplaceItem } from "../models/MarketplaceItem";
import { UserInventory } from "../models/UserInventory";

export async function getEquippedFlair(userId: Types.ObjectId | string) {
  const equipped = await UserInventory.findOne({ userId, equipped: true });
  if (!equipped) return null;
  return MarketplaceItem.findById(equipped.itemId);
}
