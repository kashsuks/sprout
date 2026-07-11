import cors from "cors";
import express, { type Express } from "express";
import { corsAllowedOrigins } from "./config/env";
import { attachMongoUser } from "./middleware/attachMongoUser";
import { errorHandler } from "./middleware/errorHandler";
import { verifyFirebaseToken } from "./middleware/verifyFirebaseToken";
import { authRouter } from "./routes/auth";
import { usersRouter } from "./routes/users";

export function createApp(): Express {
  const app = express();

  app.use(express.json());
  app.use(
    cors({
      origin: corsAllowedOrigins.length > 0 ? corsAllowedOrigins : false,
    })
  );

  app.get("/health", (_req, res) => res.status(200).json({ ok: true }));

  // Every /api/v1 route requires a verified Firebase identity; attachMongoUser
  // then loads (but does not create) the corresponding Mongo profile.
  app.use("/api/v1", verifyFirebaseToken, attachMongoUser);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/users", usersRouter);

  app.use(errorHandler);

  return app;
}
