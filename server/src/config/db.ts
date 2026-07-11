import mongoose from "mongoose";
import { env } from "./env";

export async function connectDb(): Promise<typeof mongoose> {
  mongoose.set("strictQuery", true);
  const connection = await mongoose.connect(env.MONGODB_URI);

  // Mongoose builds indexes in the background after a model is first
  // compiled/connected — unique constraints (username, entry double-stamp,
  // friendship pair, etc.) are NOT guaranteed to be enforced until that
  // finishes. Explicitly await it here so the server never serves requests
  // during that race window.
  await Promise.all(mongoose.modelNames().map((name) => mongoose.model(name).init()));

  return connection;
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}
