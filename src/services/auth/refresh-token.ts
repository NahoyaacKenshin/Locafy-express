import { UserRepository } from "@/repositories/user-repository";
import { signAccessToken, signRefreshToken, TokenExpiry, verifyRefreshToken } from "@/services/auth/helpers/jwt";

export async function RefreshTokenService(refreshToken?: string) {
  if (!refreshToken) {
    return { code: 401, status: "error", message: "Refresh token is required" };
  }

  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    return { code: 401, status: "error", message: "Invalid refresh token" };
  }

  const userRepository = new UserRepository();
  const user = await userRepository.findById(payload.sub);

  if (!user) {
    return { code: 404, status: "error", message: "User not found" };
  }

  // Release Token if User is Verified
  if (!user.emailVerified) {
    return { code: 403, status: "error", message: "Email not verified" };
  }

  const accessToken = signAccessToken(user.id, user.role, TokenExpiry.ACCESS_TOKEN_EXPIRES);
  const newRefreshToken = signRefreshToken(user.id, user.role, TokenExpiry.REFRESH_TOKEN_EXPIRES);

  return {
    code: 200,
    status: "success",
    message: "Session refreshed",
    data: {
      tokens: {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: TokenExpiry.ACCESS_TOKEN_EXPIRES,
        refreshExpiresIn: TokenExpiry.REFRESH_TOKEN_EXPIRES,
      },
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    },
  };
}

