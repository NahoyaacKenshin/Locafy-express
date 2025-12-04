import { NextFunction, Request, Response } from "express";
import { Role } from "@prisma/client";

type AuthenticatedRequest = Request & { user?: { role?: Role } };

export class RoleMiddleware {
  private readonly allowedRoles: Role[];

  constructor(...allowedRoles: Role[]) {
    if (allowedRoles.length === 0) {
      throw new Error("RoleMiddleware requires at least one allowed role");
    }
    this.allowedRoles = allowedRoles;
    this.execute = this.execute.bind(this);
  }

  public execute(req: Request, res: Response, next: NextFunction) {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.user) {
      return res.status(401).json({ code: 401, status: "error", message: "Authentication required" });
    }

    if (!authReq.user.role || !this.allowedRoles.includes(authReq.user.role)) {
      return res.status(403).json({ code: 403, status: "error", message: "Insufficient permissions" });
    }

    return next();
  }
}