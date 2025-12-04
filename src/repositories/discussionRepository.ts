// repositories/discussionRepository.ts
import { PrismaClient, Discussion } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateDiscussionData {
  content: string;
  businessId: number;
  userId: string;
  parentId?: number | null;
}

class DiscussionRepository {
  // Create a new discussion (or reply)
  async create(data: CreateDiscussionData) {
    return await prisma.discussion.create({
      data: {
        content: data.content,
        businessId: data.businessId,
        userId: data.userId,
        parentId: data.parentId || null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        business: {
          select: {
            id: true,
            name: true
          }
        },
        parent: data.parentId ? {
          select: {
            id: true,
            content: true,
            userId: true
          }
        } : undefined
      }
    });
  }

  // Recursively fetch nested replies
  private async fetchRepliesRecursive(parentId: number): Promise<any[]> {
    const replies = await prisma.discussion.findMany({
      where: { parentId },
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
        createdAt: 'asc'
      }
    });

    // Recursively fetch nested replies for each reply
    const repliesWithNested = await Promise.all(
      replies.map(async (reply) => {
        const nestedReplies = await this.fetchRepliesRecursive(reply.id);
        return {
          ...reply,
          replies: nestedReplies
        };
      })
    );

    return repliesWithNested;
  }

  // Get all discussions for a business (only top-level, with nested replies)
  async findByBusinessId(businessId: number) {
    const topLevelDiscussions = await prisma.discussion.findMany({
      where: { 
        businessId,
        parentId: null // Only get top-level discussions
      },
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
    });

    // Fetch nested replies recursively for each discussion
    const discussionsWithReplies = await Promise.all(
      topLevelDiscussions.map(async (discussion) => {
        const replies = await this.fetchRepliesRecursive(discussion.id);
        return {
          ...discussion,
          replies
        };
      })
    );
    
    return discussionsWithReplies;
  }

  // Get single discussion by ID
  async findById(id: number) {
    return await prisma.discussion.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        business: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
  }

  // Update discussion (for editing)
  async update(id: number, content: string) {
    return await prisma.discussion.update({
      where: { id },
      data: { content },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });
  }

  // Delete discussion
  async delete(id: number) {
    return await prisma.discussion.delete({
      where: { id }
    });
  }

  // Get discussions by user ID
  async findByUserId(userId: string) {
    return await prisma.discussion.findMany({
      where: { userId },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            coverPhoto: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  // Count discussions for a business
  async countByBusinessId(businessId: number): Promise<number> {
    return await prisma.discussion.count({
      where: { businessId }
    });
  }
}

export default new DiscussionRepository();