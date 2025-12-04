// repositories/favoriteRepository.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class FavoriteRepository {
  // Add business to favorites
  async create(userId: string, businessId: number) {
    return await prisma.favorite.create({
      data: {
        userId,
        businessId
      },
      include: {
        business: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        }
      }
    });
  }

  // Remove business from favorites
  async delete(userId: string, businessId: number) {
    return await prisma.favorite.deleteMany({
      where: {
        userId,
        businessId
      }
    });
  }

  // Check if business is favorited by user
  async exists(userId: string, businessId: number): Promise<boolean> {
    const favorite = await prisma.favorite.findFirst({
      where: {
        userId,
        businessId
      }
    });
    return favorite !== null;
  }

  // Get all favorites for a user
  async findByUserId(userId: string) {
    return await prisma.favorite.findMany({
      where: { userId },
      include: {
        business: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  // Get favorite with business details
  async findOne(userId: string, businessId: number) {
    return await prisma.favorite.findFirst({
      where: {
        userId,
        businessId
      },
      include: {
        business: true
      }
    });
  }

  // Count favorites for a business
  async countByBusinessId(businessId: number): Promise<number> {
    return await prisma.favorite.count({
      where: { businessId }
    });
  }

  // Count total favorites for a user
  async countByUserId(userId: string): Promise<number> {
    return await prisma.favorite.count({
      where: { userId }
    });
  }
}

export default new FavoriteRepository();