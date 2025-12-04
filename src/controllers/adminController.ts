// controllers/adminController.ts
import { Request, Response } from 'express';
import adminService from '@/services/adminService';

type AuthenticatedRequest = Request & { user?: { sub: string; role: string } };

class AdminController {
  // GET /api/admin/dashboard - Get dashboard statistics
  async getDashboardStats(req: Request, res: Response): Promise<Response> {
    try {
      const result = await adminService.getDashboardStats();
      return res.status(200).json(result);
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      return res.status(500).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  // GET /api/admin/users - Get all users
  async getAllUsers(req: Request, res: Response): Promise<Response> {
    try {
      const { role, page, limit, search } = req.query;

      const result = await adminService.getAllUsers({
        role: role as any,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
        search: search as string,
      });

      return res.status(200).json(result);
    } catch (error) {
      console.error('Get all users error:', error);
      return res.status(500).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  // GET /api/admin/users/:id - Get user by ID
  async getUserById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required',
        });
      }

      const result = await adminService.getUserById(id);

      if (!result.success) {
        return res.status(404).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error('Get user by ID error:', error);
      return res.status(500).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  // PUT /api/admin/users/:id/role - Update user role
  async updateUserRole(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required',
        });
      }

      if (!role || !['CUSTOMER', 'VENDOR', 'ADMIN'].includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Valid role (CUSTOMER, VENDOR, ADMIN) is required',
        });
      }

      const result = await adminService.updateUserRole(id, role);

      return res.status(200).json(result);
    } catch (error) {
      console.error('Update user role error:', error);
      return res.status(500).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  // DELETE /api/admin/users/:id - Delete user
  async deleteUser(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required',
        });
      }

      const result = await adminService.deleteUser(id);

      return res.status(200).json(result);
    } catch (error) {
      console.error('Delete user error:', error);
      return res.status(500).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  // GET /api/admin/businesses - Get all businesses (admin view)
  async getAllBusinesses(req: Request, res: Response): Promise<Response> {
    try {
      const { isVerified, page, limit, search } = req.query;

      const result = await adminService.getAllBusinessesAdmin({
        isVerified:
          isVerified !== undefined ? isVerified === 'true' : undefined,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
        search: search as string,
      });

      return res.status(200).json(result);
    } catch (error) {
      console.error('Get all businesses error:', error);
      return res.status(500).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  // GET /api/admin/businesses/pending - Get pending businesses
  async getPendingBusinesses(req: Request, res: Response): Promise<Response> {
    try {
      const { page, limit } = req.query;

      const result = await adminService.getPendingBusinesses({
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
      });

      return res.status(200).json(result);
    } catch (error) {
      console.error('Get pending businesses error:', error);
      return res.status(500).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  // POST /api/admin/businesses/:id/verify - Verify a business
  async verifyBusiness(req: Request, res: Response): Promise<Response> {
    try {
      const authReq = req as AuthenticatedRequest;
      const adminId = authReq.user?.sub;
      const { id } = req.params;

      if (!adminId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({
          success: false,
          message: 'Valid business ID is required',
        });
      }

      const result = await adminService.verifyBusiness(
        parseInt(id),
        adminId
      );

      if (!result.success) {
        return res.status(404).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error('Verify business error:', error);
      return res.status(500).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  // POST /api/admin/businesses/:id/unverify - Unverify a business
  async unverifyBusiness(req: Request, res: Response): Promise<Response> {
    try {
      const authReq = req as AuthenticatedRequest;
      const adminId = authReq.user?.sub;
      const { id } = req.params;

      if (!adminId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({
          success: false,
          message: 'Valid business ID is required',
        });
      }

      const result = await adminService.unverifyBusiness(
        parseInt(id),
        adminId
      );

      if (!result.success) {
        return res.status(404).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error('Unverify business error:', error);
      return res.status(500).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  // DELETE /api/admin/businesses/:id - Delete business (admin)
  async deleteBusiness(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({
          success: false,
          message: 'Valid business ID is required',
        });
      }

      const result = await adminService.deleteBusiness(parseInt(id));

      return res.status(200).json(result);
    } catch (error) {
      console.error('Delete business error:', error);
      return res.status(500).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  // GET /api/admin/verifications - Get all verifications
  async getAllVerifications(req: Request, res: Response): Promise<Response> {
    try {
      const { status, page, limit } = req.query;

      const result = await adminService.getAllVerifications({
        status: status as any,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
      });

      return res.status(200).json(result);
    } catch (error) {
      console.error('Get all verifications error:', error);
      return res.status(500).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  // POST /api/admin/verifications/:id/approve - Approve verification
  async approveVerification(req: Request, res: Response): Promise<Response> {
    try {
      const authReq = req as AuthenticatedRequest;
      const adminId = authReq.user?.sub;
      const { id } = req.params;

      if (!adminId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({
          success: false,
          message: 'Valid verification ID is required',
        });
      }

      const result = await adminService.approveVerification(
        parseInt(id),
        adminId
      );

      if (!result.success) {
        return res.status(404).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error('Approve verification error:', error);
      return res.status(500).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  // POST /api/admin/verifications/:id/reject - Reject verification
  async rejectVerification(req: Request, res: Response): Promise<Response> {
    try {
      const authReq = req as AuthenticatedRequest;
      const adminId = authReq.user?.sub;
      const { id } = req.params;

      if (!adminId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({
          success: false,
          message: 'Valid verification ID is required',
        });
      }

      const result = await adminService.rejectVerification(
        parseInt(id),
        adminId
      );

      if (!result.success) {
        return res.status(404).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error('Reject verification error:', error);
      return res.status(500).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }
}

export default new AdminController();

