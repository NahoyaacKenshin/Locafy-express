// routes/favoriteRoutes.ts
import { Router } from 'express';
import favoriteController from '@/controllers/favoriteController';
import { AuthMiddleware } from '@/middlewares/auth-middleware';
import { EmailVerificationMiddleware } from '@/middlewares/email-verification-middleware';

const router = Router();
const authMiddleware = new AuthMiddleware();
const emailVerificationMiddleware = new EmailVerificationMiddleware();

// All favorite routes require authentication except the public count endpoint

// Public route - Get favorite count for a business
router.get(
  '/business/:businessId/count', 
  favoriteController.getBusinessFavoriteCount.bind(favoriteController)
);

// Protected routes (requires auth + email verified)
// Get user's favorites
router.get(
  '/',
  (req, res, next) => authMiddleware.execute(req, res, next),
  (req, res, next) => emailVerificationMiddleware.execute(req, res, next),
  favoriteController.getUserFavorites.bind(favoriteController)
);

// Check if business is favorited
router.get(
  '/check/:businessId',
  (req, res, next) => authMiddleware.execute(req, res, next),
  (req, res, next) => emailVerificationMiddleware.execute(req, res, next),
  favoriteController.checkFavorite.bind(favoriteController)
);

// Add business to favorites
router.post(
  '/',
  (req, res, next) => authMiddleware.execute(req, res, next),
  (req, res, next) => emailVerificationMiddleware.execute(req, res, next),
  favoriteController.addFavorite.bind(favoriteController)
);

// Toggle favorite
router.post(
  '/toggle',
  (req, res, next) => authMiddleware.execute(req, res, next),
  (req, res, next) => emailVerificationMiddleware.execute(req, res, next),
  favoriteController.toggleFavorite.bind(favoriteController)
);

// Remove business from favorites
router.delete(
  '/:businessId',
  (req, res, next) => authMiddleware.execute(req, res, next),
  (req, res, next) => emailVerificationMiddleware.execute(req, res, next),
  favoriteController.removeFavorite.bind(favoriteController)
);

export default router;