// routes/businessRoutes.ts
import express, { Router } from 'express';
import businessController from '@/controllers/businessController';
import { AuthMiddleware } from '@/middlewares/auth-middleware';
import { RoleMiddleware } from '@/middlewares/role-middleware';
import { Role } from '@prisma/client';

const router: Router = express.Router();
const authMiddleware = new AuthMiddleware();
const vendorOrAdmin = new RoleMiddleware(Role.VENDOR, Role.ADMIN);

// Public routes - no authentication required for browsing

// Get filter options
router.get('/filters/categories', businessController.getCategories);
router.get('/filters/barangays', businessController.getBarangays);

// Search businesses
router.get('/search', businessController.searchBusinesses);

// Get nearby businesses
router.get('/nearby', businessController.getNearbyBusinesses);

// Get businesses by category
router.get('/category/:category', businessController.getBusinessesByCategory);

// Get businesses by barangay
router.get('/barangay/:barangay', businessController.getBusinessesByBarangay);

// Protected routes - require authentication
// Get my businesses (All authenticated users - customers can create businesses and will be upgraded to VENDOR)
router.get(
  '/my-businesses',
  (req, res, next) => authMiddleware.execute(req, res, next),
  businessController.getMyBusinesses.bind(businessController)
);

// Create business (Any authenticated user - auto-upgrades CUSTOMER to VENDOR)
router.post(
  '/',
  (req, res, next) => authMiddleware.execute(req, res, next),
  businessController.createBusiness.bind(businessController)
);

// Update business (must be before /:id route)
router.put(
  '/:id',
  (req, res, next) => authMiddleware.execute(req, res, next),
  businessController.updateBusiness.bind(businessController)
);

// Delete business (must be before /:id route)
router.delete(
  '/:id',
  (req, res, next) => authMiddleware.execute(req, res, next),
  businessController.deleteBusiness.bind(businessController)
);

// Business verification routes (must be before /:id route)
router.post(
  '/:id/verification',
  (req, res, next) => authMiddleware.execute(req, res, next),
  businessController.submitVerification.bind(businessController)
);

router.get(
  '/:id/verification',
  (req, res, next) => authMiddleware.execute(req, res, next),
  businessController.getVerification.bind(businessController)
);

// Get single business (must be after other routes to avoid conflicts)
router.get('/:id', businessController.getBusinessById);

// Get all businesses
router.get('/', businessController.getAllBusinesses);

export default router;