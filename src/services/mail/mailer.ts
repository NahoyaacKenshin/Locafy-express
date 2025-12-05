import nodemailer, { Transporter } from "nodemailer";

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
};

let transporter: Transporter | null = null;

function buildTransporter(): Transporter {
  if (!process.env.SMTP_HOST || !process.env.SMTP_PORT) {
    throw new Error("SMTP_HOST and SMTP_PORT must be configured");
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    throw new Error("SMTP_USER and SMTP_PASSWORD must be configured");
  }

  const isSecure = process.env.SMTP_SECURE === "true";
  const port = Number(process.env.SMTP_PORT);

  // Gmail SMTP configuration
  const transportOptions: any = {
    host: process.env.SMTP_HOST,
    port: port,
    secure: isSecure, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    // Connection timeout settings
    connectionTimeout: 10000, // 10 seconds to establish connection
    greetingTimeout: 10000, // 10 seconds for SMTP greeting
    socketTimeout: 30000, // 30 seconds for socket operations
    // For Gmail with port 587 (STARTTLS)
    requireTLS: !isSecure && port === 587,
    tls: {
      // Do not fail on invalid certificates (useful for some SMTP servers)
      rejectUnauthorized: false,
    },
  };

  return nodemailer.createTransport(transportOptions);
}

function getTransporter(): Transporter {
  // Recreate transporter on each call to avoid stale connections
  // This helps with connection issues in cloud environments
  transporter = buildTransporter();
  return transporter;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  if (!process.env.SMTP_FROM || !process.env.APP_NAME) {
    throw new Error("SMTP_FROM / APP_NAME must be configured");
  }

  const emailTransporter = getTransporter();
  
  try {
    // Verify connection first (with shorter timeout)
    console.log(`Attempting to verify SMTP connection to ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}...`);
    const verifyPromise = emailTransporter.verify();
    const verifyTimeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("SMTP connection verification timeout after 15 seconds")), 15000);
    });
    
    await Promise.race([verifyPromise, verifyTimeout]);
    console.log(`✓ SMTP connection verified successfully`);

    // Send email with longer timeout (60 seconds for actual sending)
    console.log(`Sending email to ${to}...`);
    const emailPromise = emailTransporter.sendMail({
      from: `"${process.env.APP_NAME}" <${process.env.SMTP_FROM}>`,
      to,
      subject,
      html,
    });

    // Create a timeout promise (60 seconds for sending)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Email sending timeout after 60 seconds")), 60000);
    });

    // Race between email sending and timeout
    const result = await Promise.race([emailPromise, timeoutPromise]);
    console.log(`✓ Email sent successfully to: ${to}`);
    
    // Close the connection after sending
    emailTransporter.close();
    
    return result;
  } catch (error: any) {
    // Close connection on error
    try {
      emailTransporter.close();
    } catch (closeError) {
      // Ignore close errors
    }
    
    // Enhanced error logging
    console.error("Email sending failed:", {
      to,
      subject,
      error: error?.message || error,
      code: error?.code,
      command: error?.command,
      response: error?.response,
      responseCode: error?.responseCode,
      errno: error?.errno,
      syscall: error?.syscall,
      address: error?.address,
      port: error?.port,
    });
    
    // Log SMTP configuration for debugging
    console.error("SMTP Configuration:", {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE,
      user: process.env.SMTP_USER ? "✓ Set" : "✗ Missing",
      password: process.env.SMTP_PASSWORD ? "✓ Set" : "✗ Missing",
      from: process.env.SMTP_FROM,
    });
    
    throw error;
  }
}

