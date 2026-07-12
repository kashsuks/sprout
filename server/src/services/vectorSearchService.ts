import type { PipelineStage } from "mongoose";
import { Goal } from "../models/Goal";

export type VectorGoalMatch = { goalId: string; userId: string; title: string; score: number };

// Must match the index name created by scripts/setupVectorIndex.ts.
const VECTOR_INDEX_NAME = "goals_title_autoembed";

// Relies on the Atlas Vector Search "autoEmbed" index type (Voyage AI models
// built into Atlas, public preview as of May 2026): the index embeds
// Goal.title automatically on write, and $vectorSearch embeds `query` (raw
// text) automatically at query time — no embedding API call from this app.
export async function searchGoalsByText(queryText: string, limit: number): Promise<VectorGoalMatch[]> {
  // The installed mongodb driver's $vectorSearch types only know the
  // precomputed-vector form (`queryVector: number[]`), not the raw-text
  // `query` form that Atlas's autoEmbed indexes accept — this is a brand-new
  // (public preview) API surface the type defs haven't caught up to yet.
  const vectorSearchStage = {
    $vectorSearch: {
      index: VECTOR_INDEX_NAME,
      path: "title",
      query: queryText,
      numCandidates: limit * 10,
      limit,
    },
  } as unknown as PipelineStage;

  const results = await Goal.aggregate([
    vectorSearchStage,
    { $match: { active: true } },
    { $project: { userId: 1, title: 1, score: { $meta: "vectorSearchScore" } } },
  ]);

  return results.map((r) => ({
    goalId: r._id.toString(),
    userId: r.userId.toString(),
    title: r.title,
    score: r.score,
  }));
}
