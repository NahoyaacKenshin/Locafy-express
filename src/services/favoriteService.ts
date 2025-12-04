// services/favoriteService.ts
import favoriteRepository from '../repositories/favoriteRepository';
import businessRepository from '../repositories/businessRepository';

interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

class FavoriteService {
  // Add business to favorites
  async addFavorite(userId: string, businessId: number): Promise<ServiceResponse> {
    try {
      // Check if business exists
      const business = await businessRepository.findById(businessId);
      if (!business) {
        return {
          success: false,
          message: 'Business not found'
        };
      }

      if (!business.isVerified) {
        return {
          success: false,
          message: 'Cannot favorite unverified business'
        };
      }

      // Check if already favorited
      const exists = await favoriteRepository.exists(userId, businessId);
      if (exists) {
        return {
          success: false,
          message: 'Business already in favorites'
        };
      }

      const favorite = await favoriteRepository.create(userId, businessId);

      return {
        success: true,
        data: favorite,
        message: 'Business added to favorites'
      };
    } catch (error) {
      throw new Error(`Failed to add favorite: ${(error as Error).message}`);
    }
  }

  // Remove business from favorites
  async removeFavorite(userId: string, businessId: number): Promise<ServiceResponse> {
    try {
      // Check if favorite exists
      const exists = await favoriteRepository.exists(userId, businessId);
      if (!exists) {
        return {
          success: false,
          message: 'Business not in favorites'
        };
      }

      await favoriteRepository.delete(userId, businessId);

      return {
        success: true,
        message: 'Business removed from favorites'
      };
    } catch (error) {
      throw new Error(`Failed to remove favorite: ${(error as Error).message}`);
    }
  }

  // Toggle favorite status
  async toggleFavorite(userId: string, businessId: number): Promise<ServiceResponse> {
    try {
      const exists = await favoriteRepository.exists(userId, businessId);

      if (exists) {
        return await this.removeFavorite(userId, businessId);
      } else {
        return await this.addFavorite(userId, businessId);
      }
    } catch (error) {
      throw new Error(`Failed to toggle favorite: ${(error as Error).message}`);
    }
  }

  // Check if business is favorited
  async isFavorited(userId: string, businessId: number): Promise<ServiceResponse> {
    try {
      const exists = await favoriteRepository.exists(userId, businessId);

      return {
        success: true,
        data: { isFavorited: exists }
      };
    } catch (error) {
      throw new Error(`Failed to check favorite status: ${(error as Error).message}`);
    }
  }

  // Get all user favorites
  async getUserFavorites(userId: string): Promise<ServiceResponse> {
    try {
      const favorites = await favoriteRepository.findByUserId(userId);

      return {
        success: true,
        data: favorites
      };
    } catch (error) {
      throw new Error(`Failed to fetch favorites: ${(error as Error).message}`);
    }
  }

  // Get favorite count for a business
  async getBusinessFavoriteCount(businessId: number): Promise<ServiceResponse> {
    try {
      const count = await favoriteRepository.countByBusinessId(businessId);

      return {
        success: true,
        data: { count }
      };
    } catch (error) {
      throw new Error(`Failed to fetch favorite count: ${(error as Error).message}`);
    }
  }
}

export default new FavoriteService();