// types/express.d.ts
// Create this file in your src/types folder

import { JwtPayload } from '@/services/auth/helpers/jwt';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// This export is required for module augmentation
export {};