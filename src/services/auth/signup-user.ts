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
    const emailVerificationURL = `${frontendUrl}/api/auth/v1/verify-email?token=${encodeURIComponent(token)}`;
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
      // Log email error but don't fail the registration
      console.error("Failed to send verification email:", emailError);
      // Email will be sent in background
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