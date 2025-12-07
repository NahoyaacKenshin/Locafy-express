// services/businessService.ts
import businessRepository from '@/repositories/businessRepository';
import { isValidCategory, CATEGORY_LIST, CategoryValue } from '@/constants/categories';
import { UserRepository } from '@/repositories/user-repository';

interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

interface BusinessFilters {
  page?: number;
  limit?: number;
  category?: string;
  barangay?: string;
  search?: string;
}

class BusinessService {
  // Get all businesses with filters
  async getAllBusinesses(filters: BusinessFilters): Promise<ServiceResponse> {
    try {
      const result = await businessRepository.findAll(filters);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      throw new Error(`Failed to fetch businesses: ${(error as Error).message}`);
    }
  }

  // Get single business details
  async getBusinessById(id: number, userId?: string, userRole?: string): Promise<ServiceResponse> {
    try {
      const business = await businessRepository.findById(id);
      
      if (!business) {
        return {
          success: false,
          message: 'Business not found'
        };
      }

      // If business is not verified, only owner or admin can view it
      if (!business.isVerified) {
        const isOwner = business.ownerId === userId;
        const isAdmin = userRole === 'ADMIN';
        
        if (!isOwner && !isAdmin) {
          return {
            success: false,
            message: 'Business is not verified'
          };
        }
      }

      return {
        success: true,
        data: business
      };
    } catch (error) {
      throw new Error(`Failed to fetch business: ${(error as Error).message}`);
    }
  }

  // Get businesses by category
  async getBusinessesByCategory(category: string, options: BusinessFilters): Promise<ServiceResponse> {
    try {
      // Validate category
      if (!isValidCategory(category)) {
        return {
          success: false,
          message: 'Invalid category'
        };
      }

      const result = await businessRepository.findByCategory(category, options);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      throw new Error(`Failed to fetch businesses by category: ${(error as Error).message}`);
    }
  }

  // Get businesses by barangay
  async getBusinessesByBarangay(barangay: string, options: BusinessFilters): Promise<ServiceResponse> {
    try {
      const result = await businessRepository.findByBarangay(barangay, options);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      throw new Error(`Failed to fetch businesses by barangay: ${(error as Error).message}`);
    }
  }

  // Get all available categories
  async getCategories(): Promise<ServiceResponse> {
    try {
      // Return predefined categories list
      return {
        success: true,
        data: CATEGORY_LIST
      };
    } catch (error) {
      throw new Error(`Failed to fetch categories: ${(error as Error).message}`);
    }
  }

  // Get all available barangays
  async getBarangays(): Promise<ServiceResponse> {
    try {
      const barangays = await businessRepository.getBarangays();
      return {
        success: true,
        data: barangays
      };
    } catch (error) {
      throw new Error(`Failed to fetch barangays: ${(error as Error).message}`);
    }
  }

  // Get nearby businesses
  async getNearbyBusinesses(lat: string | number, lng: string | number, radius?: string | number): Promise<ServiceResponse> {
    try {
      if (!lat || !lng) {
        return {
          success: false,
          message: 'Latitude and longitude are required'
        };
      }

      const businesses = await businessRepository.findNearby(
        parseFloat(String(lat)),
        parseFloat(String(lng)),
        parseFloat(String(radius || 5))
      );

      return {
        success: true,
        data: businesses
      };
    } catch (error) {
      throw new Error(`Failed to fetch nearby businesses: ${(error as Error).message}`);
    }
  }

  // Search businesses
  async searchBusinesses(searchTerm: string, filters: BusinessFilters = {}): Promise<ServiceResponse> {
    try {
      const result = await businessRepository.findAll({
        ...filters,
        search: searchTerm
      });

      return {
        success: true,
        data: result
      };
    } catch (error) {
      throw new Error(`Failed to search businesses: ${(error as Error).message}`);
    }
  }

  // Create a new business
  async createBusiness(data: {
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
  }, userRole?: string): Promise<ServiceResponse> {
    try {
      // Validate required fields
      if (!data.name || !data.description || !data.category || !data.barangay || !data.location || !data.ownerId) {
        return {
          success: false,
          message: 'Name, description, category, barangay, location, and ownerId are required'
        };
      }

      // Validate category
      if (!isValidCategory(data.category)) {
        return {
          success: false,
          message: 'Invalid category'
        };
      }

      // Prevent admins from creating businesses - they should only moderate
      if (userRole === 'ADMIN') {
        return {
          success: false,
          message: 'Admins cannot create businesses. Admins are for moderation only.'
        };
      }

      const business = await businessRepository.create(data);

      return {
        success: true,
        data: business,
        message: 'Business created successfully'
      };
    } catch (error) {
      throw new Error(`Failed to create business: ${(error as Error).message}`);
    }
  }

  // Update a business
  async updateBusiness(id: number, userId: string, userRole: string, data: {
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
  }): Promise<ServiceResponse> {
    try {
      // Check if business exists
      const business = await businessRepository.findById(id);
      if (!business) {
        return {
          success: false,
          message: 'Business not found'
        };
      }

      // Check if user is owner
      // Only owners can edit their businesses (admins can only edit their own businesses)
      // Customers cannot edit businesses
      const isOwner = await businessRepository.isOwner(id, userId);
      if (!isOwner) {
        return {
          success: false,
          message: 'Unauthorized to update this business'
        };
      }

      // Prevent customers from editing businesses
      if (userRole === 'CUSTOMER') {
        return {
          success: false,
          message: 'Customers cannot edit businesses'
        };
      }

      // Validate category if provided
      if (data.category && !isValidCategory(data.category)) {
        return {
          success: false,
          message: 'Invalid category'
        };
      }

      // Only admins can change verification status
      if (data.isVerified !== undefined && userRole !== 'ADMIN') {
        delete data.isVerified;
      }

      const updated = await businessRepository.update(id, data);

      return {
        success: true,
        data: updated,
        message: 'Business updated successfully'
      };
    } catch (error) {
      throw new Error(`Failed to update business: ${(error as Error).message}`);
    }
  }

  // Get user's own businesses (including unverified)
  async getMyBusinesses(userId: string, filters: BusinessFilters = {}): Promise<ServiceResponse> {
    try {
      const result = await businessRepository.findByOwnerId(userId, filters);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      throw new Error(`Failed to fetch user businesses: ${(error as Error).message}`);
    }
  }

  // Delete a business
  async deleteBusiness(id: number, userId: string, userRole: string): Promise<ServiceResponse> {
    try {
      // Check if business exists
      const business = await businessRepository.findById(id);
      if (!business) {
        return {
          success: false,
          message: 'Business not found'
        };
      }

      // Check if user is owner or admin
      const isOwner = await businessRepository.isOwner(id, userId);
      if (!isOwner && userRole !== 'ADMIN') {
        return {
          success: false,
          message: 'Unauthorized to delete this business'
        };
      }

      await businessRepository.delete(id);

      return {
        success: true,
        message: 'Business deleted successfully'
      };
    } catch (error) {
      throw new Error(`Failed to delete business: ${(error as Error).message}`);
    }
  }
}

export default new BusinessService();