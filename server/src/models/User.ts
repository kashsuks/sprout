import { Schema, model, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    firebaseUid: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    displayName: { type: String, required: true, trim: true },
    bio: { type: String, default: "", maxlength: 160 },
    avatarKey: { type: String, default: null },

    points: { type: Number, default: 0 },
    currency: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    lastCompletedLocalDate: { type: String, default: null },

    friendsOnlyProfile: { type: Boolean, default: true },

    // sha256/HMAC hashes of the user's own normalized phone/email, used to
    // match against other users' device contacts. Never store raw contact data.
    contactHash: { type: String, default: null, index: true },
    emailHash: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

userSchema.index({ username: "text" });

export type UserDoc = InferSchemaType<typeof userSchema>;
export const User = model("User", userSchema);
