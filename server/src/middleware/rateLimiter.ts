import rateLimit from "express-rate-limit";

// Applied globally as defense-in-depth. Generous enough not to interfere
// with normal client polling/pagination.
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

// Tighter limit on auth-adjacent endpoints (currently just bootstrap, which
// is the one unauthenticated-until-Firebase-verified write). Firebase's own
// email-link sign-in already has Google-side abuse protection; this covers
// our own endpoint against enumeration/spam independent of that.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});
