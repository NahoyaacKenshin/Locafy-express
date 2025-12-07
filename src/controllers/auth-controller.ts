import { Request, Response } from "express";
import { SignupUserService, LoginCredentialsService, VerifyEmailService, RefreshTokenService, ForgotPasswordService, ResetPasswordService } from "@/services/auth";
import { generateTempToken } from "@/services/auth/temp-token";
import { UserRepository } from "@/repositories/user-repository";

interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    role: string;
  };
}

export class AuthController {
  // Credentials Signup
  public async signup(req: Request, res: Response) {
    const { name, email, password } = req.body ?? {};
    const result = await SignupUserService(name, email, password);
    return res.status(result.code).json(result);
  }

  // Email Verification
  public async verifyEmail(req: Request, res: Response) {
    const token = req.query.token as string;
    const result = await VerifyEmailService(token);
    return res.status(result.code).json(result);
  }
  
  // Handle Login Account
  public async login(req: Request, res: Response) {
    const { email, password } = req.body ?? {};
    const result = await LoginCredentialsService(email, password);
    return res.status(result.code).json(result);
  }

  // Refresh Token Helps Generate another valid Access Token
  public async refresh(req: Request, res: Response) {
    const { refreshToken } = req.body ?? {};
    const result = await RefreshTokenService(refreshToken);
    return res.status(result.code).json(result);
  }

  // Forgot Password
  public async forgotPassword(req: Request, res: Response) {
    const { email } = req.body ?? {};
    const result = await ForgotPasswordService(email);
    return res.status(result.code).json(result);
  }

  // Reset Password
  public async resetPassword(req: Request, res: Response) {
    const { token, password } = req.body ?? {};
    const result = await ResetPasswordService(token, password);
    return res.status(result.code).json(result);
  }

  // Get Current User (Me)
  public async getCurrentUser(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.sub;

      if (!userId) {
        return res.status(401).json({
          code: 401,
          status: "error",
          message: "Authentication required"
        });
      }

      const userRepository = new UserRepository();
      const user = await userRepository.findById(userId);

      if (!user) {
        return res.status(404).json({
          code: 404,
          status: "error",
          message: "User not found"
        });
      }

      return res.status(200).json({
        code: 200,
        status: "success",
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
        }
      });
    } catch (error) {
      console.error('Get current user error:', error);
      return res.status(500).json({
        code: 500,
        status: "error",
        message: (error as Error).message || "Failed to get current user"
      });
    }
  }

  // OAuth Callback
  public async OAuthCallback(req: Request, res: Response) {
    const oauthResult = (req as any).user;
    const result = oauthResult ?? { code: 500, status: "error", message: "OAuth authentication failed" };
    
    // Get frontend URL from environment - remove trailing slash
    const frontendURL = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    const callbackPath = '/oauth-callback';
    
    console.log('OAuth callback result:', { status: result.status, hasData: !!result.data });
    
    if (result.status === 'success' && result.data) {
      // Generate temporary token with all the data
      const tempCode = generateTempToken(result.data);
      console.log('Generated temp token, redirecting to frontend');
      console.log('Temp code (original):', tempCode);
      console.log('Temp code length:', tempCode.length);
      console.log('Frontend URL:', frontendURL);
      
      // Store the original token (not encoded) in the store
      // The token in the URL will be automatically decoded by the browser
      // So we need to make sure we're comparing the decoded version
      const redirectUrl = `${frontendURL}${callbackPath}?code=${encodeURIComponent(tempCode)}`;
      console.log('Redirect URL:', redirectUrl.substring(0, 150) + '...');
      
      return res.redirect(redirectUrl);
    } else {
      // Redirect to frontend with error
      console.error('OAuth callback error:', result);
      const errorParams = new URLSearchParams({
        status: 'error',
        message: result.message || 'OAuth authentication failed',
        code: result.code?.toString() || '500',
      });
      
      return res.redirect(`${frontendURL}${callbackPath}?${errorParams.toString()}`);
    }
  }
}