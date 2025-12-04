// types/express.d.ts
// Create this file in your src/types folder

import { Role } from '@prisma/client';
import { Jwt } from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayLoad;
    }
  }
}

// This export is required for module augmentation
export {};