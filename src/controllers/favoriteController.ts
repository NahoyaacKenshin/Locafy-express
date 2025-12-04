// controllers/favoriteController.ts
import { Request, Response } from 'express';
import favoriteService from '@/services/favoriteService';

type AuthenticatedRequest = Request & { user?: { sub: string; role: string } };

class FavoriteController {
  // GET /api/favorites/business/:businessId/count - Get favorite count for a business
  async getBusinessFavoriteCount(req: Request, res: Response): Promise<Response> {
    try {
      const { businessId } = req.params;

      if (!businessId || isNaN(Number(businessId))) {
        return res.status(400).json({
          success: false,
          message: 'Valid business ID is required'
        });
      }

      const result = await favoriteService.getBusinessFavoriteCount(parseInt(businessId));

      return res.status(200).json(result);
    } catch (error) {
      console.error('Get business favorite count error:', error);
      return res.status(500).json({
        success: false,
        message: (error as Error).message
      });
    }
  }

  // GET /api/favorites - Get user's favorites
  async getUserFavorites(req: Request, res: Response): Promise<Response> {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.sub;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const result = await favoriteService.getUserFavorites(userId);

      return res.status(200).json(result);
    } catch (error) {
      console.error('Get user favorites error:', error);
      return res.status(500).json({
        success: false,
        message: (error as Error).message
      });
    }
  }

  // GET /api/favorites/check/:businessId - Check if business is favorited
  async checkFavorite(req: Request, res: Response): Promise<Response> {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.sub;
      const { businessId } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      if (!businessId || isNaN(Number(businessId))) {
        return res.status(400).json({
          success: false,
          message: 'Valid business ID is required'
        });
      }

      const result = await favoriteService.isFavorited(userId, parseInt(businessId));

      return res.status(200).json(result);
    } catch (error) {
      console.error('Check favorite error:', error);
      return res.status(500).json({
        success: false,
        message: (error as Error).message
      });
    }
  }

  // POST /api/favorites - Add business to favorites
  async addFavorite(req: Request, res: Response): Promise<Response> {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.sub;
      const userRole = authReq.user?.role;
      const { businessId } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Prevent admins from favoriting - they should only moderate
      if (userRole === 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Admins cannot add favorites. Admins are for moderation only.'
        });
      }

      if (!businessId || isNaN(Number(businessId))) {
        return res.status(400).json({
          success: false,
          message: 'Valid business ID is required'
        });
      }

      const result = await favoriteService.addFavorite(userId, parseInt(businessId));

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(201).json(result);
    } catch (error) {
      console.error('Add favorite error:', error);
      return res.status(500).json({
        success: false,
        message: (error as Error).message
      });
    }
  }

  // POST /api/favorites/toggle - Toggle favorite status
  async toggleFavorite(req: Request, res: Response): Promise<Response> {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.sub;
      const userRole = authReq.user?.role;
      const { businessId } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Prevent admins from favoriting - they should only moderate
      if (userRole === 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Admins cannot toggle favorites. Admins are for moderation only.'
        });
      }

      if (!businessId || isNaN(Number(businessId))) {
        return res.status(400).json({
          success: false,
          message: 'Valid business ID is required'
        });
      }

      const result = await favoriteService.toggleFavorite(userId, parseInt(businessId));

      return res.status(200).json(result);
    } catch (error) {
      console.error('Toggle favorite error:', error);
      return res.status(500).json({
        success: false,
        message: (error as Error).message
      });
    }
  }

  // DELETE /api/favorites/:businessId - Remove business from favorites
  async removeFavorite(req: Request, res: Response): Promise<Response> {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.sub;
      const userRole = authReq.user?.role;
      const { businessId } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Prevent admins from removing favorites - they should only moderate
      if (userRole === 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Admins cannot remove favorites. Admins are for moderation only.'
        });
      }

      if (!businessId || isNaN(Number(businessId))) {
        return res.status(400).json({
          success: false,
          message: 'Valid business ID is required'
        });
      }

      const result = await favoriteService.removeFavorite(userId, parseInt(businessId));

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error('Remove favorite error:', error);
      return res.status(500).json({
        success: false,
        message: (error as Error).message
      });
    }
  }
}

export default new FavoriteController();
