// repositories/verificationRepository.ts
import { PrismaClient, VerificationStatus } from '@prisma/client';

const prisma = new PrismaClient();

class VerificationRepository {
  // Create a verification request (for vendor)
  async create(data: {
    documentUrl: string;
    vendorId: string;
  }) {
    return await prisma.verification.create({
      data: {
        documentUrl: data.documentUrl,
        vendorId: data.vendorId,
        status: 'PENDING',
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        business: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  // Create a business verification request
  async createBusinessVerification(data: {
    documentUrl: string;
    businessId: number;
    vendorId?: string;
  }) {
    return await prisma.verification.create({
      data: {
        documentUrl: data.documentUrl,
        businessId: data.businessId,
        vendorId: data.vendorId,
        status: 'PENDING',
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        business: {
          select: {
            id: true,
            name: true,
            ownerId: true,
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  // Get verification by ID
  async findById(id: number) {
    return await prisma.verification.findUnique({
      where: { id },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        business: {
          select: {
            id: true,
            name: true,
            ownerId: true,
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  // Get all verifications with filters
  async findAll(filters: {
    status?: VerificationStatus;
    vendorId?: string;
    businessId?: number;
    page?: number;
    limit?: number;
  } = {}) {
    const { status, vendorId, businessId, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (vendorId) where.vendorId = vendorId;
    if (businessId) where.businessId = businessId;

    const [verifications, total] = await Promise.all([
      prisma.verification.findMany({
        where,
        skip,
        take: limit,
        include: {
          vendor: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          admin: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          business: {
            select: {
              id: true,
              name: true,
              ownerId: true,
              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.verification.count({ where }),
    ]);

    return {
      verifications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Update verification status (approve/reject)
  async updateStatus(
    id: number,
    status: VerificationStatus,
    adminId: string
  ) {
    return await prisma.verification.update({
      where: { id },
      data: {
        status,
        adminId,
        verifiedAt: status === 'APPROVED' ? new Date() : null,
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        business: {
          select: {
            id: true,
            name: true,
            ownerId: true,
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  // Get verification by vendor ID
  async findByVendorId(vendorId: string) {
    return await prisma.verification.findMany({
      where: { vendorId },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        business: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Get verification by business ID
  async findByBusinessId(businessId: number) {
    return await prisma.verification.findMany({
      where: { businessId },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        business: {
          select: {
            id: true,
            name: true,
            ownerId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Delete verification
  async delete(id: number) {
    return await prisma.verification.delete({
      where: { id },
    });
  }
}

export default new VerificationRepository();

