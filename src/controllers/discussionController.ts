// controllers/discussionController.ts
import { Request, Response } from 'express';
import discussionService from '@/services/discussionService';

type AuthenticatedRequest = Request & { user?: { sub: string; role: string } };

class DiscussionController {
  // GET /api/discussions/business/:businessId - Get discussions for a business
  async getBusinessDiscussions(req: Request, res: Response): Promise<Response> {
    try {
      const { businessId } = req.params;

      if (!businessId || isNaN(Number(businessId))) {
        return res.status(400).json({
          success: false,
          message: 'Valid business ID is required'
        });
      }

      const result = await discussionService.getBusinessDiscussions(parseInt(businessId));

      return res.status(200).json(result);
    } catch (error) {
      console.error('Get business discussions error:', error);
      return res.status(500).json({
        success: false,
        message: (error as Error).message
      });
    }
  }

  // GET /api/discussions/:id - Get single discussion
  async getDiscussionById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({
          success: false,
          message: 'Valid discussion ID is required'
        });
      }

      const result = await discussionService.getDiscussionById(parseInt(id));

      if (!result.success) {
        return res.status(404).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error('Get discussion by ID error:', error);
      return res.status(500).json({
        success: false,
        message: (error as Error).message
      });
    }
  }

  // GET /api/discussions/user/my-discussions - Get current user's discussions
  async getMyDiscussions(req: Request, res: Response): Promise<Response> {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.sub;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const result = await discussionService.getUserDiscussions(userId);

      return res.status(200).json(result);
    } catch (error) {
      console.error('Get my discussions error:', error);
      return res.status(500).json({
        success: false,
        message: (error as Error).message
      });
    }
  }

  // POST /api/discussions - Create new discussion or reply
  async createDiscussion(req: Request, res: Response): Promise<Response> {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.sub;
      const { content, businessId, parentId } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      if (!content || !businessId) {
        return res.status(400).json({
          success: false,
          message: 'Content and business ID are required'
        });
      }

      if (isNaN(Number(businessId))) {
        return res.status(400).json({
          success: false,
          message: 'Valid business ID is required'
        });
      }

      // Validate parentId if provided
      if (parentId !== undefined && parentId !== null) {
        if (isNaN(Number(parentId))) {
          return res.status(400).json({
            success: false,
            message: 'Valid parent discussion ID is required'
          });
        }
      }

      const result = await discussionService.createDiscussion({
        content,
        businessId: parseInt(businessId),
        userId,
        parentId: parentId ? parseInt(parentId) : null
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(201).json(result);
    } catch (error) {
      console.error('Create discussion error:', error);
      return res.status(500).json({
        success: false,
        message: (error as Error).message
      });
    }
  }

  // PUT /api/discussions/:id - Update discussion
  async updateDiscussion(req: Request, res: Response): Promise<Response> {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.sub;
      const { id } = req.params;
      const { content } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({
          success: false,
          message: 'Valid discussion ID is required'
        });
      }

      if (!content) {
        return res.status(400).json({
          success: false,
          message: 'Content is required'
        });
      }

      const result = await discussionService.updateDiscussion(parseInt(id), content, userId);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error('Update discussion error:', error);
      return res.status(500).json({
        success: false,
        message: (error as Error).message
      });
    }
  }

  // DELETE /api/discussions/:id - Delete discussion
  async deleteDiscussion(req: Request, res: Response): Promise<Response> {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.sub;
      const userRole = authReq.user?.role;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({
          success: false,
          message: 'Valid discussion ID is required'
        });
      }

      const result = await discussionService.deleteDiscussion(parseInt(id), userId, userRole);

      if (!result.success) {
        const statusCode = result.message?.includes('Unauthorized') ? 403 : 400;
        return res.status(statusCode).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error('Delete discussion error:', error);
      return res.status(500).json({
        success: false,
        message: (error as Error).message
      });
    }
  }
}

export default new DiscussionController();
