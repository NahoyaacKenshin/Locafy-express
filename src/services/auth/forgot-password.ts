import crypto from "crypto";
import { UserRepository } from "@/repositories/user-repository";
import { TokenRepository } from "@/repositories/token-repository";
import { renderTemplate } from "@/utils/template";
import { sendEmail } from "@/services/mail/mailer";

export async function ForgotPasswordService(email: string) {
  const userRepository = new UserRepository();
  const tokenRepository = new TokenRepository();

  // Check if Email is provided
  if (!email) {
    return { code: 400, status: "error", message: "Email is required" };
  }

  try {
    // Check if User is found
    const user = await userRepository.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists or not for security
      return { 
        code: 200, 
        status: "success", 
        message: "If an account with that email exists, a password reset link has been sent." 
      };
    }

    // Check if user has a password (OAuth users might not have passwords)
    if (!user.password) {
      return { 
        code: 400, 
        status: "error", 
        message: "This account was created with OAuth and does not have a password. Please use OAuth to sign in." 
      };
    }

    // Revoke all existing password reset tokens for this user
    await tokenRepository.revokeAllPasswordResetTokensByUser(user.id);

    // Generate new password reset token
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // expires after 1 hour

    await tokenRepository.createPasswordResetToken({ userId: user.id, token, expiresAt });

    const resetPasswordURL = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${encodeURIComponent(token)}`;

    // Format Email HTML
    const html = renderTemplate("reset-password.html", {
      name: user.name ?? "there",
      resetPasswordURL,
      expiresAt: expiresAt.toUTCString(),
    });

    // Send Password Reset Email
    await sendEmail({
      to: user.email ?? email,
      subject: "Reset your password",
      html,
    });

    return {
      code: 200,
      status: "success",
      message: "If an account with that email exists, a password reset link has been sent.",
    };
  } catch (error) {
    console.error("ForgotPasswordService error", error);
    return { code: 500, status: "error", message: "Unable to process password reset request" };
  }
}

