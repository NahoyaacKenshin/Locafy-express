// services/discussionService.ts
import discussionRepository from '../repositories/discussionRepository';
import businessRepository from '../repositories/businessRepository';

interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

interface CreateDiscussionInput {
  content: string;
  businessId: number;
  userId: string;
  parentId?: number | null;
}

class DiscussionService {
  // Create a new discussion or reply
  async createDiscussion(input: CreateDiscussionInput): Promise<ServiceResponse> {
    try {
      const { content, businessId, userId, parentId } = input;

      // Validate content
      if (!content || content.trim().length === 0) {
        return {
          success: false,
          message: 'Discussion content is required'
        };
      }

      // Different character limits for replies vs top-level discussions
      const maxLength = parentId ? 500 : 1000;
      if (content.length > maxLength) {
        return {
          success: false,
          message: parentId 
            ? 'Reply content must be less than 500 characters'
            : 'Discussion content must be less than 1000 characters'
        };
      }

      // Check if business exists and is verified
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
          message: 'Cannot post discussion on unverified business'
        };
      }

      // If this is a reply, validate that the parent discussion exists
      if (parentId) {
        const parentDiscussion = await discussionRepository.findById(parentId);
        if (!parentDiscussion) {
          return {
            success: false,
            message: 'Parent discussion not found'
          };
        }
        
        // Ensure the parent discussion belongs to the same business
        if (parentDiscussion.businessId !== businessId) {
          return {
            success: false,
            message: 'Parent discussion does not belong to this business'
          };
        }
      }

      const discussion = await discussionRepository.create({
        content: content.trim(),
        businessId,
        userId,
        parentId: parentId || null
      });

      return {
        success: true,
        data: discussion,
        message: parentId ? 'Reply posted successfully' : 'Discussion posted successfully'
      };
    } catch (error) {
      throw new Error(`Failed to create discussion: ${(error as Error).message}`);
    }
  }

  // Get all discussions for a business
  async getBusinessDiscussions(businessId: number): Promise<ServiceResponse> {
    try {
      const discussions = await discussionRepository.findByBusinessId(businessId);
      
      return {
        success: true,
        data: discussions
      };
    } catch (error) {
      throw new Error(`Failed to fetch discussions: ${(error as Error).message}`);
    }
  }

  // Get single discussion
  async getDiscussionById(id: number): Promise<ServiceResponse> {
    try {
      const discussion = await discussionRepository.findById(id);
      
      if (!discussion) {
        return {
          success: false,
          message: 'Discussion not found'
        };
      }

      return {
        success: true,
        data: discussion
      };
    } catch (error) {
      throw new Error(`Failed to fetch discussion: ${(error as Error).message}`);
    }
  }

  // Update discussion (user can only edit their own)
  async updateDiscussion(id: number, content: string, userId: string): Promise<ServiceResponse> {
    try {
      if (!content || content.trim().length === 0) {
        return {
          success: false,
          message: 'Discussion content is required'
        };
      }

      if (content.length > 1000) {
        return {
          success: false,
          message: 'Discussion content must be less than 1000 characters'
        };
      }

      const discussion = await discussionRepository.findById(id);
      
      if (!discussion) {
        return {
          success: false,
          message: 'Discussion not found'
        };
      }

      // Check if user owns the discussion
      if (discussion.userId !== userId) {
        return {
          success: false,
          message: 'Unauthorized to edit this discussion'
        };
      }

      const updated = await discussionRepository.update(id, content.trim());

      return {
        success: true,
        data: updated,
        message: 'Discussion updated successfully'
      };
    } catch (error) {
      throw new Error(`Failed to update discussion: ${(error as Error).message}`);
    }
  }

  // Delete discussion (user can delete their own, admins can delete any)
  async deleteDiscussion(id: number, userId: string, userRole?: string): Promise<ServiceResponse> {
    try {
      const discussion = await discussionRepository.findById(id);
      
      if (!discussion) {
        return {
          success: false,
          message: 'Discussion not found'
        };
      }

      // Check if user owns the discussion or is an admin
      const isOwner = discussion.userId === userId;
      const isAdmin = userRole === 'ADMIN';
      
      if (!isOwner && !isAdmin) {
        return {
          success: false,
          message: 'Unauthorized to delete this discussion'
        };
      }

      await discussionRepository.delete(id);

      return {
        success: true,
        message: 'Discussion deleted successfully'
      };
    } catch (error) {
      throw new Error(`Failed to delete discussion: ${(error as Error).message}`);
    }
  }

  // Get user's discussions
  async getUserDiscussions(userId: string): Promise<ServiceResponse> {
    try {
      const discussions = await discussionRepository.findByUserId(userId);
      
      return {
        success: true,
        data: discussions
      };
    } catch (error) {
      throw new Error(`Failed to fetch user discussions: ${(error as Error).message}`);
    }
  }
}

export default new DiscussionService();