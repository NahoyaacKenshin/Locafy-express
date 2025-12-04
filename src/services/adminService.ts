// services/adminService.ts
import { PrismaClient, Role } from '@prisma/client';
import businessRepository from '@/repositories/businessRepository';
import { UserRepository } from '@/repositories/user-repository';
import verificationRepository from '@/repositories/verificationRepository';

const prisma = new PrismaClient();

interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

class AdminService {
  // Get all users with filters
  async getAllUsers(filters: {
    role?: Role;
    page?: number;
    limit?: number;
    search?: string;
  } = {}): Promise<ServiceResponse> {
    try {
      const { role, page = 1, limit = 20, search } = filters;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (role) where.role = role;
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            emailVerified: true,
            createdAt: true,
            _count: {
              select: {
                businesses: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
        prisma.user.count({ where }),
      ]);

      return {
        success: true,
        data: {
          users,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
      };
    } catch (error) {
      throw new Error(`Failed to fetch users: ${(error as Error).message}`);
    }
  }

  // Get user by ID
  async getUserById(userId: string): Promise<ServiceResponse> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          businesses: {
            select: {
              id: true,
              name: true,
              isVerified: true,
              createdAt: true,
            },
          },
        },
      });

      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      return {
        success: true,
        data: user,
      };
    } catch (error) {
      throw new Error(`Failed to fetch user: ${(error as Error).message}`);
    }
  }

  // Update user role
  async updateUserRole(
    userId: string,
    newRole: Role
  ): Promise<ServiceResponse> {
    try {
      // First, check if the user exists and get their current role
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true },
      });

      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      // Prevent changing admin roles
      if (user.role === 'ADMIN') {
        return {
          success: false,
          message: 'Cannot change the role of an admin user',
        };
      }

      const userRepository = new UserRepository();
      const updated = await userRepository.updateRole(userId, newRole);

      return {
        success: true,
        data: updated,
        message: `User role updated to ${newRole}`,
      };
    } catch (error) {
      throw new Error(`Failed to update user role: ${(error as Error).message}`);
    }
  }

  // Get all businesses (including unverified) for admin
  async getAllBusinessesAdmin(filters: {
    isVerified?: boolean;
    page?: number;
    limit?: number;
    search?: string;
  } = {}): Promise<ServiceResponse> {
    try {
      const { isVerified, page = 1, limit = 20, search } = filters;

      const where: any = {};
      if (isVerified !== undefined) where.isVerified = isVerified;
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const skip = (page - 1) * limit;

      const [businesses, total] = await Promise.all([
        prisma.business.findMany({
          where,
          skip,
          take: limit,
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
        prisma.business.count({ where }),
      ]);

      return {
        success: true,
        data: {
          businesses,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch businesses: ${(error as Error).message}`
      );
    }
  }

  // Get pending businesses (unverified)
  async getPendingBusinesses(filters: {
    page?: number;
    limit?: number;
  } = {}): Promise<ServiceResponse> {
    try {
      const result = await this.getAllBusinessesAdmin({
        isVerified: false,
        ...filters,
      });
      return result;
    } catch (error) {
      throw new Error(
        `Failed to fetch pending businesses: ${(error as Error).message}`
      );
    }
  }

  // Verify a business
  async verifyBusiness(
    businessId: number,
    adminId: string
  ): Promise<ServiceResponse> {
    try {
      const business = await businessRepository.findById(businessId);
      if (!business) {
        return {
          success: false,
          message: 'Business not found',
        };
      }

      const updated = await businessRepository.update(businessId, {
        isVerified: true,
      });

      return {
        success: true,
        data: updated,
        message: 'Business verified successfully',
      };
    } catch (error) {
      throw new Error(`Failed to verify business: ${(error as Error).message}`);
    }
  }

  // Reject/Unverify a business
  async unverifyBusiness(
    businessId: number,
    adminId: string
  ): Promise<ServiceResponse> {
    try {
      const business = await businessRepository.findById(businessId);
      if (!business) {
        return {
          success: false,
          message: 'Business not found',
        };
      }

      const updated = await businessRepository.update(businessId, {
        isVerified: false,
      });

      return {
        success: true,
        data: updated,
        message: 'Business unverified successfully',
      };
    } catch (error) {
      throw new Error(
        `Failed to unverify business: ${(error as Error).message}`
      );
    }
  }

  // Get all verifications (for businesses by default, can filter by vendorId for vendor verifications)
  async getAllVerifications(filters: {
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';
    businessId?: number;
    vendorId?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<ServiceResponse> {
    try {
      // Pass filters directly - repository will handle businessId filtering
      const result = await verificationRepository.findAll(filters);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch verifications: ${(error as Error).message}`
      );
    }
  }

  // Approve verification
  async approveVerification(
    verificationId: number,
    adminId: string
  ): Promise<ServiceResponse> {
    try {
      const verification = await verificationRepository.findById(
        verificationId
      );
      if (!verification) {
        return {
          success: false,
          message: 'Verification not found',
        };
      }

      const updated = await verificationRepository.updateStatus(
        verificationId,
        'APPROVED',
        adminId
      );

      // If this is a business verification, mark the business as verified
      if (updated.businessId) {
        await businessRepository.update(updated.businessId, {
          isVerified: true,
        });
      }

      return {
        success: true,
        data: updated,
        message: 'Verification approved successfully',
      };
    } catch (error) {
      throw new Error(
        `Failed to approve verification: ${(error as Error).message}`
      );
    }
  }

  // Reject verification
  async rejectVerification(
    verificationId: number,
    adminId: string
  ): Promise<ServiceResponse> {
    try {
      const verification = await verificationRepository.findById(
        verificationId
      );
      if (!verification) {
        return {
          success: false,
          message: 'Verification not found',
        };
      }

      const updated = await verificationRepository.updateStatus(
        verificationId,
        'REJECTED',
        adminId
      );

      return {
        success: true,
        data: updated,
        message: 'Verification rejected successfully',
      };
    } catch (error) {
      throw new Error(
        `Failed to reject verification: ${(error as Error).message}`
      );
    }
  }

  // Delete a business (admin only)
  async deleteBusiness(businessId: number): Promise<ServiceResponse> {
    try {
      await businessRepository.delete(businessId);
      return {
        success: true,
        message: 'Business deleted successfully',
      };
    } catch (error) {
      throw new Error(`Failed to delete business: ${(error as Error).message}`);
    }
  }

  // Delete a user (admin only)
  async deleteUser(userId: string): Promise<ServiceResponse> {
    try {
      await prisma.user.delete({
        where: { id: userId },
      });
      return {
        success: true,
        message: 'User deleted successfully',
      };
    } catch (error) {
      throw new Error(`Failed to delete user: ${(error as Error).message}`);
    }
  }

  // Get dashboard statistics
  async getDashboardStats(): Promise<ServiceResponse> {
    try {
      const [
        totalUsers,
        totalVendors,
        totalCustomers,
        totalBusinesses,
        verifiedBusinesses,
        pendingBusinesses,
        totalDiscussions,
        totalFavorites,
        pendingVerifications,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: 'VENDOR' } }),
        prisma.user.count({ where: { role: 'CUSTOMER' } }),
        prisma.business.count(),
        prisma.business.count({ where: { isVerified: true } }),
        prisma.business.count({ where: { isVerified: false } }),
        prisma.discussion.count(),
        prisma.favorite.count(),
        prisma.verification.count({ where: { status: 'PENDING' } }),
      ]);

      return {
        success: true,
        data: {
          users: {
            total: totalUsers,
            vendors: totalVendors,
            customers: totalCustomers,
            admins: totalUsers - totalVendors - totalCustomers,
          },
          businesses: {
            total: totalBusinesses,
            verified: verifiedBusinesses,
            pending: pendingBusinesses,
          },
          discussions: {
            total: totalDiscussions,
          },
          favorites: {
            total: totalFavorites,
          },
          verifications: {
            pending: pendingVerifications,
          },
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch dashboard stats: ${(error as Error).message}`
      );
    }
  }
}

export default new AdminService();

