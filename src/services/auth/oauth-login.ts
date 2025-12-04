import { TokenExpiry, signAccessToken, signRefreshToken } from "@/services/auth/helpers/jwt";
import { UserRepository } from "@/repositories/user-repository";
import { AccountRepository } from "@/repositories/account-repository";

export type OAuthProvider = "google";

export type OAuthProfile = {
  provider: OAuthProvider;
  providerAccountId: string;
  email?: string | null;
  name?: string | null;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date | null;
};

export async function OAuthLoginService(profile: OAuthProfile) {
  const userRepository = new UserRepository();
  const accountRepository = new AccountRepository();

  if (!profile.provider || !profile.providerAccountId) {
    return { code: 400, status: "error", message: "Missing OAuth profile data" };
  }

  try {
    const existingAccount = await accountRepository.findByProviderAccount(profile.provider, profile.providerAccountId);

    let user =
      existingAccount && existingAccount.userId
        ? await userRepository.findById(existingAccount.userId)
        : profile.email
        ? await userRepository.findByEmail(profile.email)
        : null;

    if (!user) {
      const fallbackEmail = profile.email ?? buildFallbackEmail(profile.provider, profile.providerAccountId);
      user = await userRepository.create({
        name: profile.name ?? fallbackEmail,
        email: fallbackEmail,
        password: null,
        emailVerified: new Date(),
      });
    } else if (!user.emailVerified) {
      const verified = await userRepository.markEmailVerified(user.id);
      user = { ...user, emailVerified: verified.emailVerified };
    }

    if (!user) {
      return { code: 500, status: "error", message: "Unable to resolve user from OAuth profile" };
    }

    if (existingAccount) {
      await accountRepository.updateAccountTokens(existingAccount.id, {
        accessToken: profile.accessToken ?? null,
        refreshToken: profile.refreshToken ?? null,
        expiresAt: profile.expiresAt ?? null,
      });
    } else {
      await accountRepository.createAccount({
        userId: user.id,
        provider: profile.provider,
        providerAccountId: profile.providerAccountId,
        accessToken: profile.accessToken ?? null,
        refreshToken: profile.refreshToken ?? null,
        expiresAt: profile.expiresAt ?? null,
      });
    }

    const accessToken = signAccessToken(user.id, user.role, TokenExpiry.ACCESS_TOKEN_EXPIRES);
    const refreshToken = signRefreshToken(user.id, user.role, TokenExpiry.REFRESH_TOKEN_EXPIRES);

    return {
      code: 200,
      status: "success",
      message: "Login successful",
      data: {
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: TokenExpiry.ACCESS_TOKEN_EXPIRES,
          refreshExpiresIn: TokenExpiry.REFRESH_TOKEN_EXPIRES,
        },
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          emailVerified: user.emailVerified,
        },
      },
    };
  } catch (error) {
    console.error("OAuthLoginService error", error);
    return { code: 500, status: "error", message: "Unable to complete OAuth login" };
  }
}

function buildFallbackEmail(provider: string, providerAccountId: string) {
  const sanitizedProvider = provider.replace(/\s+/g, "-").toLowerCase();
  const domain = process.env.APP_DOMAIN || "oauth.local";
  return `${sanitizedProvider}-${providerAccountId}@${domain}`;
}

