import crypto from "crypto";
import { UserRepository } from "@/repositories/user-repository";
import { TokenRepository } from "@/repositories/token-repository";
import { hashPassword } from "@/services/auth/helpers/password";
import { renderTemplate } from "@/utils/template";
import { sendEmail } from "@/services/mail/mailer";

export async function SignupUserService(name: string, email: string, password: string) {
  const userRepository = new UserRepository();
  const tokenRepository = new TokenRepository();

  // Validate fields
  if (!name || !email || !password) {
    return { code: 400, status: "error", message: "Missing fields" };
  }

  // Account Creation Logic
  try {
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // expires after 24hrs

    // Check if email is existing
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      return { code: 409, status: "error", message: "Email already registered" };
    }

    // Insert User Account
    const created = await userRepository.create({ name, email, password: hashPassword(password) });

    // Insert Email Verification Token
    await tokenRepository.createEmailVerificationToken({ userId: created.id, token, expiresAt });
    
    // Format URLs - ensure they're properly formatted (no trailing slashes)
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    const emailVerificationURL = `${frontendUrl}/verify-email?token=${encodeURIComponent(token)}`;
    const logoURL = `${frontendUrl}/logo.jpg`;
    const html = renderTemplate("verify-email.html", {
      name: created.name ?? "there",
      emailVerificationURL,
      expiresAt: expiresAt.toUTCString(),
      logoURL,
    });

    // Send Email Verification (non-blocking - don't await to prevent timeout)
    // Return success immediately, email will be sent in background
    sendEmail({
      to: created.email ?? email,
      subject: "Verify your email address",
      html,
    }).catch((emailError) => {
      // Log detailed email error for debugging
      console.error("=== EMAIL SENDING ERROR ===");
      console.error("Failed to send verification email to:", created.email ?? email);
      console.error("Error message:", emailError?.message || emailError);
      console.error("Error stack:", emailError?.stack);
      console.error("SMTP Configuration Check:");
      console.error("  SMTP_HOST:", process.env.SMTP_HOST ? "✓ Set" : "✗ Missing");
      console.error("  SMTP_PORT:", process.env.SMTP_PORT ? `✓ Set (${process.env.SMTP_PORT})` : "✗ Missing");
      console.error("  SMTP_USER:", process.env.SMTP_USER ? "✓ Set" : "✗ Missing");
      console.error("  SMTP_PASSWORD:", process.env.SMTP_PASSWORD ? "✓ Set" : "✗ Missing");
      console.error("  SMTP_FROM:", process.env.SMTP_FROM ? `✓ Set (${process.env.SMTP_FROM})` : "✗ Missing");
      console.error("  APP_NAME:", process.env.APP_NAME ? `✓ Set (${process.env.APP_NAME})` : "✗ Missing");
      console.error("  FRONTEND_URL:", process.env.FRONTEND_URL ? `✓ Set (${process.env.FRONTEND_URL})` : "✗ Missing");
      console.error("===========================");
    });

    // Success message - return immediately without waiting for email
    return {
      code: 200,
      status: "success",
      message: "Created account successfully! Please verify your email.",
      data: { user: created },
    };

  } catch (error) {
    console.error("SignupUserService error", error);
    return { code: 500, status: "error", message: "Unable to create account" };
  }
}