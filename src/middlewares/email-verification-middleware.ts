// middlewares/email-verification-middleware.ts
import { NextFunction, Request, Response } from 'express';
import { UserRepository } from '@/repositories/user-repository';

type AuthenticatedRequest = Request & { user?: { sub: string; role: string } };

export class EmailVerificationMiddleware {
  public execute = async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.sub;

    if (!userId) {
      return res.status(401).json({
        code: 401,
        status: 'error',
        message: 'Authentication required'
      });
    }

    try {
      const userRepository = new UserRepository();
      const user = await userRepository.findById(userId);

      if (!user) {
        return res.status(404).json({
          code: 404,
          status: 'error',
          message: 'User not found'
        });
      }

      if (!user.emailVerified) {
        return res.status(403).json({
          code: 403,
          status: 'error',
          message: 'Email verification required. Please verify your email to participate in discussions and favorites.'
        });
      }

      return next();
    } catch (error) {
      console.error('Email verification middleware error:', error);
      return res.status(500).json({
        code: 500,
        status: 'error',
        message: 'Failed to verify email status'
      });
    }
  };
}

