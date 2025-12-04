// routes/discussionRoutes.ts
import { Router } from 'express';
import discussionController from '@/controllers/discussionController';
import { AuthMiddleware } from '@/middlewares/auth-middleware';
import { EmailVerificationMiddleware } from '@/middlewares/email-verification-middleware';

const router = Router();
const authMiddleware = new AuthMiddleware();
const emailVerificationMiddleware = new EmailVerificationMiddleware();

// Public routes
// Get discussions for a specific business
router.get(
  '/business/:businessId', 
  discussionController.getBusinessDiscussions.bind(discussionController)
);

// Get single discussion
router.get(
  '/:id', 
  discussionController.getDiscussionById.bind(discussionController)
);

// Protected routes - require authentication

// Get current user's discussions (requires auth + email verified)
router.get(
  '/user/my-discussions',
  (req, res, next) => authMiddleware.execute(req, res, next),
  (req, res, next) => emailVerificationMiddleware.execute(req, res, next),
  discussionController.getMyDiscussions.bind(discussionController)
);

// Create new discussion (requires auth + email verified)
router.post(
  '/',
  (req, res, next) => authMiddleware.execute(req, res, next),
  (req, res, next) => emailVerificationMiddleware.execute(req, res, next),
  discussionController.createDiscussion.bind(discussionController)
);

// Update discussion (requires auth + email verified + ownership)
router.put(
  '/:id',
  (req, res, next) => authMiddleware.execute(req, res, next),
  (req, res, next) => emailVerificationMiddleware.execute(req, res, next),
  discussionController.updateDiscussion.bind(discussionController)
);

// Delete discussion (requires auth + email verified + ownership)
router.delete(
  '/:id',
  (req, res, next) => authMiddleware.execute(req, res, next),
  (req, res, next) => emailVerificationMiddleware.execute(req, res, next),
  discussionController.deleteDiscussion.bind(discussionController)
);

export default router;