import { Strategy as GoogleStrategy, Profile, VerifyCallback } from "passport-google-oauth20";
import { OAuthLoginService } from "@/services/auth/oauth-login";

export function buildGoogleStrategy() {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackURL = process.env.GOOGLE_CALLBACK_URL;

  if (!clientID || !clientSecret || !callbackURL) {
    console.warn("Google OAuth environment variables are not fully configured. Skipping Google strategy.");
    return null;
  }

  return new GoogleStrategy(
    {
      clientID,
      clientSecret,
      callbackURL,
      scope: ["profile", "email"],
    },
    async (accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback) => {
      try {
        // Google OAuth tokens typically expire in 1 hour (3600 seconds)
        const expiresAt = new Date(Date.now() + 3600 * 1000);
        
        const result = await OAuthLoginService({
          provider: "google",
          providerAccountId: profile.id,
          email: profile.emails?.[0]?.value,
          name: profile.displayName ?? buildNameFromProfile(profile),
          accessToken,
          refreshToken,
          expiresAt,
        });
        return done(null, result);
      } catch (error) {
        return done(error as Error);
      }
    }
  );
}

function buildNameFromProfile(profile: Profile) {
  const given = profile.name?.givenName ?? "";
  const family = profile.name?.familyName ?? "";
  const combined = `${given} ${family}`.trim();
  return combined || profile.username || "Google User";
}
