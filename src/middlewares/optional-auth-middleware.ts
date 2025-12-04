/*
  Optional Auth Middleware Logic:
  1. If an Authorization header is present, try to extract and verify the token.
  2. If the token is valid, attach its payload to `req.user` and continue.
  3. If the token is missing or invalid, continue without setting `req.user` (don't fail).
  4. This allows routes to work for both authenticated and unauthenticated users.
*/

import { NextFunction, Request, Response } from "express";
import { verifyAccessToken, JwtPayload } from "@/services/auth/helpers/jwt";

type AuthenticatedRequest = Request & { user?: JwtPayload };

export class OptionalAuthMiddleware {
  public execute = async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const accessToken = this.extractBearerToken(req.headers.authorization);

    // If token exists, try to verify it
    if (accessToken) {
      const payload = verifyAccessToken(accessToken);
      if (payload) {
        authReq.user = payload;
      }
      // If token is invalid, just continue without setting req.user
    }
    // If no token, just continue without setting req.user

    return next();
  };

  private extractBearerToken(header?: string) {
    if (!header) return undefined;
    const [scheme, token] = header.split(" ");
    if (!scheme || scheme.toLowerCase() !== "bearer" || !token) return undefined;
    return token.trim();
  }
}

