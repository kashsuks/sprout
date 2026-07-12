import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";

// A (single-member) replica set, not a standalone instance, since Mongo
// multi-document transactions require one — kept in case a future flow
// needs them again.
let replSet: MongoMemoryReplSet | undefined;

export async function connectTestDb(): Promise<void> {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(replSet.getUri());
  // See config/db.ts: index builds are async, so explicitly wait for them
  // before tests start relying on unique constraints.
  await Promise.all(mongoose.modelNames().map((name) => mongoose.model(name).init()));
}

export async function disconnectTestDb(): Promise<void> {
  await mongoose.disconnect();
  await replSet?.stop();
}

export async function clearTestDb(): Promise<void> {
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
}
