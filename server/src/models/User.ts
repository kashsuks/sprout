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

    // Chosen once in the post-signup preferences modal. Raw tags for now —
    // a separate embedding pipeline turns these into a vector (stored in
    // its own field/index by that job) for Atlas Vector Search-based content
    // recommendations. hasSetPreferences distinguishes "answered with zero
    // picks" from "never saw the modal", so it's only ever set server-side.
    contentPreferences: { type: [String], default: [] },
    hasSetPreferences: { type: Boolean, default: false },

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
