import { connectDb, disconnectDb } from "../config/db";
import mongoose from "mongoose";

// One-time setup: creates the Atlas Vector Search index that
// services/vectorSearchService.ts queries against. Index creation is
// cluster-level, not something a mongoose schema expresses, so this must be
// run once per environment (dev cluster, prod cluster) via
// `npm run setup:vector-index`.
//
// Uses Atlas's "autoEmbed" index type (Voyage AI models built into Atlas
// Vector Search, public preview as of May 2026): Atlas embeds Goal.title
// automatically on write, so no embedding API key/call is needed here. The
// exact `definition.fields[]` shape below is this preview feature's syntax
// as of this writing — confirm against current Atlas docs if index creation
// fails, and prefer that over trusting this comment.
//
// If the app's DB user lacks index-creation permissions, create it manually
// instead: Atlas UI -> cluster -> Atlas Search tab -> Create Search Index ->
// JSON editor -> paste the same `definition` below.
async function main() {
  await connectDb();
  const db = mongoose.connection.db!;

  await db.collection("goals").createSearchIndex({
    name: "goals_title_autoembed",
    type: "vectorSearch",
    definition: {
      fields: [{ type: "autoEmbed", path: "title", modality: "text", model: "voyage-4-lite" }],
    },
  });

  console.log("Vector index creation requested — check Atlas UI > Atlas Search tab for build status (can take several minutes).");
  await disconnectDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
