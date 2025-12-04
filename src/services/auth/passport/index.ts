import passport from "passport";
import { buildGoogleStrategy } from "./strategies/google";

export function initializePassport() {
  const googleStrategy = buildGoogleStrategy();
  if (googleStrategy) {
    passport.use("google", googleStrategy);
  }
}