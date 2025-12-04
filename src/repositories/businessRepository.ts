// repositories/businessRepository.ts
import { PrismaClient, Business, User } from '@prisma/client';

const prisma = new PrismaClient();

interface BusinessFilters {
  page?: number;
  limit?: number;
  category?: string;
  barangay?: string;
  search?: string;
  isVerified?: boolean;
}

interface PaginationResult {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface BusinessWithRelations extends Business {
  owner: Pick<User, 'id' | 'name' | 'image'>;
  discussions: { id: number }[];
}

interface BusinessListResult {
  businesses: BusinessWithRelations[];
  pagination: PaginationResult;
}

class BusinessRepository {
  // Get all verified businesses with pagination and filters
  async findAll(filters: BusinessFilters = {}): Promise<BusinessListResult> {
    const { 
      page = 1, 
      limit = 6, // 3x2 grid = 6 items per page
      category, 
      barangay, 
      search,
      isVerified = true // Only show verified businesses by default
    } = filters;

    const skip = (page - 1) * limit;
    
    // Build filter conditions - use OR logic when both category and barangay are provided
    const filterConditions: any[] = [];
    
    if (category && barangay) {
      // If both filters are present, use OR logic
      filterConditions.push({ category });
      filterConditions.push({ barangay });
    } else {
      // If only one filter is present, use it directly
      if (category) {
        filterConditions.push({ category });
      }
      if (barangay) {
        filterConditions.push({ barangay });
      }
    }
    
    // Build the where clause
    const where: any = {
      isVerified
    };
    
    // If we have category/barangay filters and search, combine them with AND
    if (filterConditions.length > 0 && search) {
      where.AND = [
        { OR: filterConditions },
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
          ]
        }
      ];
    } else if (filterConditions.length > 0) {
      // Only category/barangay filters, use OR
      where.OR = filterConditions;
    } else if (search) {
      // Only search, use OR for name/description
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [businesses, total] = await Promise.all([
      prisma.business.findMany({
        where,
        skip,
        take: parseInt(String(limit)),
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              image: true
            }
          },
          discussions: {
            select: {
              id: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.business.count({ where })
    ]);

    return {
      businesses: businesses as BusinessWithRelations[],
      pagination: {
        total,
        page: parseInt(String(page)),
        limit: parseInt(String(limit)),
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // Get single business by ID
  async findById(id: number) {
    return await prisma.business.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        discussions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });
  }

  // Get businesses by category
  async findByCategory(category: string, options: BusinessFilters = {}): Promise<BusinessListResult> {
    return await this.findAll({ ...options, category });
  }

  // Get businesses by barangay
  async findByBarangay(barangay: string, options: BusinessFilters = {}): Promise<BusinessListResult> {
    return await this.findAll({ ...options, barangay });
  }

  // Get all unique categories
  async getCategories(): Promise<string[]> {
    const categories = await prisma.business.findMany({
      where: { isVerified: true },
      select: { category: true },
      distinct: ['category']
    });
    return categories.map(c => c.category);
  }

  // Get all unique barangays
  async getBarangays(): Promise<string[]> {
    // Return hardcoded list of barangays in Cordova, Cebu
    return [
      'Alegria',
      'Bangbang',
      'Buagsong',
      'Catarman',
      'Cogon',
      'Dapitan',
      'Day-as',
      'Gabi',
      'Gilutongan',
      'Ibabao',
      'Pilipog',
      'Poblacion',
      'San Miguel'
    ];
  }

  // Search businesses by location (lat/lng radius)
  async findNearby(lat: number, lng: number, radiusKm: number = 5) {
    // Simple distance calculation - for production, consider PostGIS
    const businesses = await prisma.business.findMany({
      where: {
        isVerified: true,
        lat: { not: null },
        lng: { not: null }
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });

    // Filter by distance (Haversine formula)
    return businesses.filter(business => {
      if (!business.lat || !business.lng) return false;
      const distance = this.calculateDistance(lat, lng, business.lat, business.lng);
      return distance <= radiusKm;
    }).map(business => ({
      ...business,
      distance: this.calculateDistance(lat, lng, business.lat!, business.lng!)
    }));
  }

  // Helper: Calculate distance between two coordinates
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Create a new business
  async create(data: {
    name: string;
    description: string;
    category: string;
    barangay: string;
    location: string;
    ownerId: string;
    lat?: number | null;
    lng?: number | null;
    contactInfo?: string | null;
    socials?: any;
    coverPhoto?: string | null;
    logo?: string | null;
    gallery?: string[];
    openTime?: string | null;
    closeTime?: string | null;
    isVerified?: boolean;
  }) {
    return await prisma.business.create({
      data,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });
  }

  // Update a business
  async update(id: number, data: {
    name?: string;
    description?: string;
    category?: string;
    barangay?: string;
    location?: string;
    lat?: number | null;
    lng?: number | null;
    contactInfo?: string | null;
    socials?: any;
    coverPhoto?: string | null;
    logo?: string | null;
    gallery?: string[];
    openTime?: string | null;
    closeTime?: string | null;
    isVerified?: boolean;
  }) {
    return await prisma.business.update({
      where: { id },
      data,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });
  }

  // Delete a business
  async delete(id: number) {
    return await prisma.business.delete({
      where: { id },
    });
  }

  // Check if user owns the business
  async isOwner(businessId: number, userId: string): Promise<boolean> {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { ownerId: true },
    });
    return business?.ownerId === userId;
  }

  // Count businesses owned by a user
  async countByOwnerId(ownerId: string): Promise<number> {
    return await prisma.business.count({
      where: { ownerId },
    });
  }

  // Get all businesses owned by a user (including unverified)
  async findByOwnerId(ownerId: string, filters: BusinessFilters = {}): Promise<BusinessListResult> {
    const {
      page = 1,
      limit = 10,
      category,
      barangay,
      search,
    } = filters;

    const skip = (page - 1) * limit;

    // Build filter conditions - use OR logic when both category and barangay are provided
    const filterConditions: any[] = [];
    
    if (category && barangay) {
      // If both filters are present, use OR logic
      filterConditions.push({ category });
      filterConditions.push({ barangay });
    } else {
      // If only one filter is present, use it directly
      if (category) {
        filterConditions.push({ category });
      }
      if (barangay) {
        filterConditions.push({ barangay });
      }
    }

    // Build the where clause
    const where: any = {
      ownerId
    };
    
    // If we have category/barangay filters and search, combine them with AND
    if (filterConditions.length > 0 && search) {
      where.AND = [
        { OR: filterConditions },
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
          ]
        }
      ];
    } else if (filterConditions.length > 0) {
      // Only category/barangay filters, use OR
      where.OR = filterConditions;
    } else if (search) {
      // Only search, use OR for name/description
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [businesses, total] = await Promise.all([
      prisma.business.findMany({
        where,
        skip,
        take: parseInt(String(limit)),
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              image: true
            }
          },
          discussions: {
            select: {
              id: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.business.count({ where })
    ]);

    return {
      businesses: businesses as BusinessWithRelations[],
      pagination: {
        total,
        page: parseInt(String(page)),
        limit: parseInt(String(limit)),
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}

export default new BusinessRepository();