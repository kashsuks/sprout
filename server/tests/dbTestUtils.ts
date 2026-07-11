import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";

// A (single-member) replica set, not a standalone instance, because the
// marketplace purchase flow uses a multi-document Mongo transaction, which
// standalone MongoDB doesn't support.
let replSet: MongoMemoryReplSet | undefined;

export async function connectTestDb(): Promise<void> {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(replSet.getUri());
}

export async function disconnectTestDb(): Promise<void> {
  await mongoose.disconnect();
  await replSet?.stop();
}

export async function clearTestDb(): Promise<void> {
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
}
