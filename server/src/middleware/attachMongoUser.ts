import type { NextFunction, Request, Response } from "express";
import { User, type UserDoc } from "../models/User";
import type { HydratedDocument } from "mongoose";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: HydratedDocument<UserDoc>;
    }
  }
}

/**
 * Looks up the Mongo user for the verified Firebase UID and attaches it to
 * req.user if it exists. Does NOT create it — account creation only happens
 * explicitly via POST /auth/bootstrap. Routes that require an existing
 * profile should use requireMongoUser after this middleware.
 */
export async function attachMongoUser(req: Request, _res: Response, next: NextFunction) {
  if (!req.firebaseUid) return next();
  const user = await User.findOne({ firebaseUid: req.firebaseUid });
  if (user) req.user = user;
  next();
}

export function requireMongoUser(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(404).json({ error: "Profile not found. Complete POST /auth/bootstrap first." });
  }
  next();
}
