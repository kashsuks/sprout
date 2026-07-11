import { Router } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import { CurrencyTransaction } from "../models/CurrencyTransaction";
import { MarketplaceItem } from "../models/MarketplaceItem";
import { User } from "../models/User";
import { UserInventory } from "../models/UserInventory";
import { asyncHandler, HttpError } from "../middleware/errorHandler";
import { requireMongoUser } from "../middleware/attachMongoUser";

export const marketplaceRouter = Router();
marketplaceRouter.use(requireMongoUser);

// GET /api/v1/marketplace/items
marketplaceRouter.get(
  "/items",
  asyncHandler(async (_req, res) => {
    const items = await MarketplaceItem.find({ active: true });
    return res.status(200).json({ items });
  })
);

const purchaseSchema = z.object({ itemId: z.string().min(1) });

// POST /api/v1/marketplace/purchase
// Atomic conditional decrement (currency: {$gte: price}) prevents
// concurrent-purchase overspend races; wrapped in a Mongo transaction
// alongside the inventory insert and audit-trail write so a currency debit
// can never happen without a matching inventory credit (Atlas replica-set
// clusters support multi-document ACID transactions).
marketplaceRouter.post(
  "/purchase",
  asyncHandler(async (req, res) => {
    const { itemId } = purchaseSchema.parse(req.body);
    const item = await MarketplaceItem.findOne({ _id: itemId, active: true });
    if (!item) throw new HttpError(404, "Item not found");

    const alreadyOwned = await UserInventory.exists({ userId: req.user!._id, itemId: item._id });
    if (alreadyOwned) throw new HttpError(409, "Item already owned");

    const session = await mongoose.startSession();
    let newBalance: number | undefined;

    try {
      await session.withTransaction(async () => {
        const updatedUser = await User.findOneAndUpdate(
          { _id: req.user!._id, currency: { $gte: item.priceCurrency } },
          { $inc: { currency: -item.priceCurrency } },
          { new: true, session }
        );
        if (!updatedUser) throw new HttpError(409, "Insufficient currency");

        await UserInventory.create([{ userId: req.user!._id, itemId: item._id }], { session });
        await CurrencyTransaction.create(
          [
            {
              userId: req.user!._id,
              delta: -item.priceCurrency,
              reason: "marketplace_purchase",
              relatedItemId: item._id,
              balanceAfter: updatedUser.currency,
            },
          ],
          { session }
        );

        newBalance = updatedUser.currency;
      });
    } finally {
      await session.endSession();
    }

    return res.status(200).json({ currency: newBalance });
  })
);
