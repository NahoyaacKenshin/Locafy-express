// routes/adminRoutes.ts
import { Router } from 'express';
import adminController from '@/controllers/adminController';
import { AuthMiddleware } from '@/middlewares/auth-middleware';
import { RoleMiddleware } from '@/middlewares/role-middleware';
import { Role } from '@prisma/client';

const router = Router();
const authMiddleware = new AuthMiddleware();
const adminOnly = new RoleMiddleware(Role.ADMIN);

// All admin routes require authentication and ADMIN role
router.use((req, res, next) => authMiddleware.execute(req, res, next));
router.use((req, res, next) => adminOnly.execute(req, res, next));

// Dashboard
router.get('/dashboard', adminController.getDashboardStats.bind(adminController));

// User management
router.get('/users', adminController.getAllUsers.bind(adminController));
router.get('/users/:id', adminController.getUserById.bind(adminController));
router.put('/users/:id/role', adminController.updateUserRole.bind(adminController));
router.delete('/users/:id', adminController.deleteUser.bind(adminController));

// Business management
router.get('/businesses', adminController.getAllBusinesses.bind(adminController));
router.get('/businesses/pending', adminController.getPendingBusinesses.bind(adminController));
router.post('/businesses/:id/verify', adminController.verifyBusiness.bind(adminController));
router.post('/businesses/:id/unverify', adminController.unverifyBusiness.bind(adminController));
router.delete('/businesses/:id', adminController.deleteBusiness.bind(adminController));

// Verification management
router.get('/verifications', adminController.getAllVerifications.bind(adminController));
router.post('/verifications/:id/approve', adminController.approveVerification.bind(adminController));
router.post('/verifications/:id/reject', adminController.rejectVerification.bind(adminController));

export default router;

