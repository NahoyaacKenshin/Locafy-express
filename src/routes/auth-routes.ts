import { Router } from "express";
import passport from "passport";
import { AuthController } from "@/controllers/auth-controller";
import { exchangeTempToken, getTempTokenStoreSize } from "@/services/auth/temp-token";
import { AuthMiddleware } from "@/middlewares/auth-middleware";

// Initialize
const router = Router();
const authController = new AuthController();
const authMiddleware = new AuthMiddleware();

// Authentication Routes
router.post("/v1/signup", authController.signup);
router.post("/v1/login", authController.login);
router.get("/v1/verify-email", authController.verifyEmail);
router.post("/v1/refresh-token", authController.refresh);
router.post("/v1/forgot-password", authController.forgotPassword);
router.post("/v1/reset-password", authController.resetPassword);
router.get("/v1/me", authMiddleware.execute, authController.getCurrentUser);

// OAuth (Google & GitHub) Routes
router.get("/v1/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));
router.get("/v1/google/callback", 
  (req, res, next) => {
    passport.authenticate("google", { session: false }, (err: any, user: any, info: any) => {
      if (err) {
        // Handle authentication errors
        const frontendURL = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
        const callbackPath = '/oauth-callback';
        const errorParams = new URLSearchParams({
          status: 'error',
          message: err.message || 'OAuth authentication failed',
          code: '500',
        });
        return res.redirect(`${frontendURL}${callbackPath}?${errorParams.toString()}`);
      }
      if (!user) {
        // Handle case where user is not authenticated
        const frontendURL = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
        const callbackPath = '/oauth-callback';
        const errorParams = new URLSearchParams({
          status: 'error',
          message: info?.message || 'OAuth authentication failed',
          code: '401',
        });
        return res.redirect(`${frontendURL}${callbackPath}?${errorParams.toString()}`);
      }
      // Success - attach user to request and continue
      (req as any).user = user;
      next();
    })(req, res, next);
  },
  authController.OAuthCallback
);

// Debug endpoint to check token store (remove in production)
router.get("/v1/oauth/debug-store", (req, res) => {
  const { getTempTokenStoreSize } = require("@/services/auth/temp-token");
  return res.json({
    storeSize: getTempTokenStoreSize(),
    message: "Token store debug info"
  });
});

// OAuth Token Exchange Route
router.get("/v1/oauth/exchange", (req, res) => {
  const { code } = req.query;
  
  console.log('OAuth exchange request received');
  console.log('Query params:', req.query);
  console.log('Code present:', !!code, 'Type:', typeof code);
  
  if (!code || typeof code !== 'string') {
    console.error('Missing or invalid code parameter');
    return res.status(400).json({
      code: 400,
      status: "error",
      message: "Missing or invalid code"
    });
  }
  
  console.log('Attempting to exchange token');
  console.log('Raw code from query:', code);
  console.log('Code length:', code.length);
  console.log('Code type:', typeof code);
  
  // The code comes from URL query params, which Express automatically decodes
  // But if it was double-encoded or there are issues, try decoding again
  let decodedCode = code;
  try {
    // Try decoding - Express usually does this automatically, but be safe
    const testDecode = decodeURIComponent(code);
    if (testDecode !== code) {
      console.log('Code was URL encoded, decoded it');
      decodedCode = testDecode;
    } else {
      console.log('Code appears to already be decoded');
    }
  } catch (e) {
    console.log('Decode error (code might not be encoded):', e);
    decodedCode = code; // Use as-is if decode fails
  }
  
  console.log('Final code to exchange:', decodedCode);
  console.log('Final code length:', decodedCode.length);
  const data = exchangeTempToken(decodedCode);
  
  if (!data) {
    console.error('Token exchange failed - invalid or expired code');
    console.error('Code received:', code);
    console.error('Code length:', code.length);
    const storeSize = getTempTokenStoreSize();
    console.error('Store size at time of exchange:', storeSize);
    
    // Check if store is empty (server might have restarted)
    if (storeSize === 0) {
      console.error('Token store is empty - server may have restarted or tokens were cleared');
      return res.status(400).json({
        code: 400,
        status: "error",
        message: "Authentication code expired or invalid. The server may have restarted. Please try logging in again."
      });
    }
    
    return res.status(400).json({
      code: 400,
      status: "error",
      message: "Invalid or expired code. Please try logging in again."
    });
  }
  
  console.log('Token exchange successful, user ID:', data.user?.id);
  return res.status(200).json({
    code: 200,
    status: "success",
    data: data
  });
});

export default router;