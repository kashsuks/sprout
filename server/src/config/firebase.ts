import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { env } from "./env";

function initFirebaseAdmin() {
  if (getApps().length > 0) return;

  initializeApp({
    credential: cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      // Service account keys are typically stored in env vars with literal
      // "\n" sequences instead of real newlines — restore them here.
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

initFirebaseAdmin();

export const firebaseAuth = getAuth();
