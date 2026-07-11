import { connectDb, disconnectDb } from "../config/db";
import { MarketplaceItem } from "../models/MarketplaceItem";

const SEED_ITEMS = [
  {
    key: "flair_gold_border",
    name: "Gold Border",
    description: "A shiny gold profile border",
    priceCurrency: 100,
    category: "flair" as const,
  },
  {
    key: "flair_fire_badge",
    name: "Fire Badge",
    description: "Show off your dedication",
    priceCurrency: 50,
    category: "flair" as const,
  },
  {
    key: "flair_crown",
    name: "Crown",
    description: "For the leaderboard champions",
    priceCurrency: 250,
    category: "flair" as const,
  },
];

async function main() {
  await connectDb();
  for (const item of SEED_ITEMS) {
    await MarketplaceItem.updateOne({ key: item.key }, { $setOnInsert: item }, { upsert: true });
  }
  console.log(`Seeded ${SEED_ITEMS.length} marketplace items`);
  await disconnectDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
