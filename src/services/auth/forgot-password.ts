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

    // Format URLs - ensure they're properly formatted (no trailing slashes)
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    const resetPasswordURL = `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;
    const logoURL = `${frontendUrl}/logo.jpg`;
    const html = renderTemplate("reset-password.html", {
      name: user.name ?? "there",
      resetPasswordURL,
      expiresAt: expiresAt.toUTCString(),
      logoURL,
    });

    // Send Password Reset Email
    try {
      await sendEmail({
        to: user.email ?? email,
        subject: "Reset your password",
        html,
      });
      console.log(`✓ Password reset email sent successfully to: ${user.email ?? email}`);
    } catch (emailError: any) {
      // Log detailed email error for debugging
      console.error("=== PASSWORD RESET EMAIL ERROR ===");
      console.error("Failed to send password reset email to:", user.email ?? email);
      console.error("Error message:", emailError?.message || emailError);
      console.error("Error stack:", emailError?.stack);
      console.error("SMTP Configuration Check:");
      console.error("  SMTP_HOST:", process.env.SMTP_HOST ? "✓ Set" : "✗ Missing");
      console.error("  SMTP_PORT:", process.env.SMTP_PORT ? `✓ Set (${process.env.SMTP_PORT})` : "✗ Missing");
      console.error("  SMTP_USER:", process.env.SMTP_USER ? "✓ Set" : "✗ Missing");
      console.error("  SMTP_PASSWORD:", process.env.SMTP_PASSWORD ? "✓ Set" : "✗ Missing");
      console.error("  SMTP_FROM:", process.env.SMTP_FROM ? `✓ Set (${process.env.SMTP_FROM})` : "✗ Missing");
      console.error("  APP_NAME:", process.env.APP_NAME ? `✓ Set (${process.env.APP_NAME})` : "✗ Missing");
      console.error("==================================");
      // Re-throw to be caught by outer catch
      throw emailError;
    }

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

