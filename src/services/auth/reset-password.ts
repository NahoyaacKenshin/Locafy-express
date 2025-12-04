import { UserRepository } from "@/repositories/user-repository";
import { TokenRepository } from "@/repositories/token-repository";
import { hashPassword } from "@/services/auth/helpers/password";

export async function ResetPasswordService(token: string, newPassword: string) {
  const userRepository = new UserRepository();
  const tokenRepository = new TokenRepository();

  // Validate fields
  if (!token || !newPassword) {
    return { code: 400, status: "error", message: "Token and new password are required" };
  }

  // Validate password strength
  if (newPassword.length < 8) {
    return { code: 400, status: "error", message: "Password must be at least 8 characters long" };
  }

  try {
    // Find active password reset token
    const resetToken = await tokenRepository.findActivePasswordResetToken(token);
    if (!resetToken) {
      return { code: 400, status: "error", message: "Invalid or expired password reset token" };
    }

    // Update user password
    const hashedPassword = hashPassword(newPassword);
    await userRepository.updatePassword(resetToken.userId, hashedPassword);

    // Consume the token
    await tokenRepository.consumeToken(resetToken.id);

    // Revoke all other password reset tokens for this user
    await tokenRepository.revokeAllPasswordResetTokensByUser(resetToken.userId);

    return {
      code: 200,
      status: "success",
      message: "Password has been reset successfully",
    };
  } catch (error) {
    console.error("ResetPasswordService error", error);
    return { code: 500, status: "error", message: "Unable to reset password" };
  }
}

