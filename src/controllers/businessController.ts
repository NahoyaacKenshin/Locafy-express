// controllers/businessController.ts
import { Request, Response } from 'express';
import businessService from '@/services/businessService';
import businessVerificationService from '@/services/businessVerificationService';

type AuthenticatedRequest = Request & { user?: { sub: string; role: string } };

class BusinessController {
  // GET /api/businesses - Get all businesses
  async getAllBusinesses(req: Request, res: Response): Promise<Response> {
    try {
      const { page, limit, category, barangay, search } = req.query;
      
      const filters = {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 6, // 3x2 grid
        category: category as string,
        barangay: barangay as string,
        search: search as string
      };

      const result = await businessService.getAllBusinesses(filters);

      return res.status(200).json(result);
    } catch (error) {
      console.error('Get all businesses error:', error);
      return res.status(500).json({
        success: false,
        message: (error as Error).message
      });
    }
  }

  // GET /api/businesses/:id - Get single business
  async getBusinessById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.sub; // Optional - for viewing own unverified businesses
      const userRole = authReq.user?.role; // Optional - for admin access

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({
          success: false,
          message: 'Valid business ID is required'
        });
      }

      const result = await businessService.getBusinessById(parseInt(id), userId, userRole);

      if (!result.success) {
        const statusCode = result.message?.includes('not verified') ? 403 : 404;
        return res.status(statusCode).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error('Get business by ID error:', error);
      return res.status(500).json({
        success: false,
        message: (error as Error).message
      });
    }
  }

  // GET /api/businesses/category/:category - Get businesses by category
  async getBusinessesByCategory(req: Request, res: Response): Promise<Response> {
    try {
      const { category } = req.params;
      const { page, limit } = req.query;

      const options = {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 6 // 3x2 grid
      };

      const result = await businessService.getBusinessesByCategory(category, options);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error('Get businesses by category error:', error);
      return res.status(500).json({
        success: false,
        message: (error as Error).message
      });
    }
  }

  // GET /api/businesses/barangay/:barangay - Get businesses by barangay
  async getBusinessesByBarangay(req: Request, res: Response): Promise<Response> {
    try {
      const { barangay } = req.params;
      const { page, limit } = req.query;

      const options = {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 6 // 3x2 grid
      };

      const result = await businessService.getBusinessesByBarangay(barangay, options);

      return res.status(200).json(result);
    } catch (error) {
      console.error('Get businesses by barangay error:', error);
      return res.status(500).json({
        success: false,
        message: (error as Error).message
      });
    }
  }

  // GET /api/businesses/filters/categories - Get all categories
  async getCategories(req: Request, res: Response): Promise<Response> {
    try {
      const result = await businessService.getCategories();
      return res.status(200).json(result);
    } catch (error) {
      console.error('Get categories error:', error);
      return res.status(500).json({
        success: false,
        message: (error as Error).message
      });
    }
  }

  // GET /api/businesses/filters/barangays - Get all barangays
  async getBarangays(req: Request, res: Response): Promise<Response> {
    try {
      const result = await businessService.getBarangays();
      return res.status(200).json(result);
    } catch (error) {
      console.error('Get barangays error:', error);
      return res.status(500).json({
        success: false,
        message: (error as Error).message
      });
    }
  }

  // GET /api/businesses/nearby - Get nearby businesses
  async getNearbyBusinesses(req: Request, res: Response): Promise<Response> {
    try {
      const { lat, lng, radius } = req.query;

      if (!lat || !lng) {
        return res.status(400).json({
          success: false,
          message: 'Latitude and longitude are required'
        });
      }

      const result = await businessService.getNearbyBusinesses(
        lat as string,
        lng as string,
        radius as string
      );

      return res.status(200).json(result);
    } catch (error) {
      console.error('Get nearby businesses error:', error);
      return res.status(500).json({
        success: false,
        message: (error as Error).message
      });
    }
  }

  // GET /api/businesses/search - Search businesses
  async searchBusinesses(req: Request, res: Response): Promise<Response> {
    try {
      const { q, page, limit, category, barangay } = req.query;

      if (!q) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      const filters = {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 6, // 3x2 grid
        category: category as string,
        barangay: barangay as string
      };

      const result = await businessService.searchBusinesses(q as string, filters);

      return res.status(200).json(result);
    } catch (error) {
      console.error('Search businesses error:', error);
      return res.status(500).json({
        success: false,
        message: (error as Error).message
      });
    }
  }

  // POST /api/businesses - Create a new business
  async createBusiness(req: Request, res: Response): Promise<Response> {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.sub;
      const userRole = authReq.user?.role;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Prevent admins from creating businesses - they should only moderate
      if (userRole === 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Admins cannot create businesses. Admins are for moderation only.'
        });
      }

      const {
        name,
        description,
        category,
        barangay,
        location,
        lat,
        lng,
        contactInfo,
        socials,
        coverPhoto,
        logo,
        gallery,
        openTime,
        closeTime,
        isVerified,
        verificationDocumentUrl
      } = req.body;

      // Validate required fields
      if (!name || !description || !category || !barangay || !location) {
        return res.status(400).json({
          success: false,
          message: 'Name, description, category, barangay, and location are required'
        });
      }

      // Verification document is optional - users can submit it later when they want to verify

      // Stringify contactInfo if it's an object (frontend sends it as an object)
      const contactInfoString = contactInfo 
        ? (typeof contactInfo === 'string' ? contactInfo : JSON.stringify(contactInfo))
        : null;

      const result = await businessService.createBusiness({
        name,
        description,
        category,
        barangay,
        location,
        ownerId: userId,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        contactInfo: contactInfoString,
        socials: socials || null,
        coverPhoto: coverPhoto || null,
        logo: logo || null,
        gallery: gallery || [],
        openTime: openTime || null,
        closeTime: closeTime || null,
        isVerified: isVerified || false
      }, userRole);

      if (!result.success) {
        return res.status(400).json(result);
      }

      // Create verification request for the business
      if (verificationDocumentUrl && result.data?.id) {
        try {
          await businessVerificationService.submitVerification(
            result.data.id,
            verificationDocumentUrl,
            userId
          );
        } catch (error) {
          console.error('Failed to create verification:', error);
          // Don't fail the business creation if verification fails
          // The business owner can submit verification later
        }
      }

      return res.status(201).json(result);
    } catch (error) {
      console.error('Create business error:', error);
      console.error('Error details:', {
        message: (error as Error).message,
        stack: (error as Error).stack,
        body: req.body ? {
          ...req.body,
          coverPhoto: req.body.coverPhoto ? `${req.body.coverPhoto.substring(0, 50)}...` : null,
          logo: req.body.logo ? `${req.body.logo.substring(0, 50)}...` : null,
          gallery: req.body.gallery ? `${req.body.gallery.length} items` : null,
          verificationDocumentUrl: req.body.verificationDocumentUrl ? `${req.body.verificationDocumentUrl.substring(0, 50)}...` : null
        } : null
      });
      return res.status(500).json({
        success: false,
        message: (error as Error).message || 'Failed to create business'
      });
    }
  }

  // PUT /api/businesses/:id - Update a business
  async updateBusiness(req: Request, res: Response): Promise<Response> {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.sub;
      const userRole = authReq.user?.role || 'CUSTOMER';
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
          message: 'Valid business ID is required'
        });
      }

      const {
        name,
        description,
        category,
        barangay,
        location,
        lat,
        lng,
        contactInfo,
        socials,
        coverPhoto,
        logo,
        gallery,
        openTime,
        closeTime,
        isVerified
      } = req.body;

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (category !== undefined) updateData.category = category;
      if (barangay !== undefined) updateData.barangay = barangay;
      if (location !== undefined) updateData.location = location;
      if (lat !== undefined) updateData.lat = lat ? parseFloat(lat) : null;
      if (lng !== undefined) updateData.lng = lng ? parseFloat(lng) : null;
      if (contactInfo !== undefined) {
        // Stringify contactInfo if it's an object (frontend sends it as an object)
        updateData.contactInfo = contactInfo 
          ? (typeof contactInfo === 'string' ? contactInfo : JSON.stringify(contactInfo))
          : null;
      }
      if (socials !== undefined) updateData.socials = socials || null;
      if (coverPhoto !== undefined) updateData.coverPhoto = coverPhoto || null;
      if (logo !== undefined) updateData.logo = logo || null;
      if (gallery !== undefined) updateData.gallery = gallery || [];
      if (openTime !== undefined) updateData.openTime = openTime || null;
      if (closeTime !== undefined) updateData.closeTime = closeTime || null;
      if (isVerified !== undefined && userRole === 'ADMIN') updateData.isVerified = isVerified;

      const result = await businessService.updateBusiness(
        parseInt(id),
        userId,
        userRole,
        updateData
      );

      if (!result.success) {
        const statusCode = result.message?.includes('Unauthorized') ? 403 : 
                          result.message?.includes('not found') ? 404 : 400;
        return res.status(statusCode).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error('Update business error:', error);
      return res.status(500).json({
        success: false,
        message: (error as Error).message
      });
    }
  }

  // GET /api/businesses/my-businesses - Get current user's businesses (including unverified)
  async getMyBusinesses(req: Request, res: Response): Promise<Response> {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.sub;
      const { page, limit, category, barangay, search } = req.query;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const filters = {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        category: category as string,
        barangay: barangay as string,
        search: search as string
      };

      const result = await businessService.getMyBusinesses(userId, filters);

      return res.status(200).json(result);
    } catch (error) {
      console.error('Get my businesses error:', error);
      return res.status(500).json({
        success: false,
        message: (error as Error).message
      });
    }
  }

  // DELETE /api/businesses/:id - Delete a business
  async deleteBusiness(req: Request, res: Response): Promise<Response> {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.sub;
      const userRole = authReq.user?.role || 'CUSTOMER';
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
          message: 'Valid business ID is required'
        });
      }

      const result = await businessService.deleteBusiness(parseInt(id), userId, userRole);

      if (!result.success) {
        const statusCode = result.message?.includes('Unauthorized') ? 403 : 
                          result.message?.includes('not found') ? 404 : 400;
        return res.status(statusCode).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error('Delete business error:', error);
      return res.status(500).json({
        success: false,
        message: (error as Error).message
      });
    }
  }

  // POST /api/businesses/:id/verification - Submit verification documents
  async submitVerification(req: Request, res: Response): Promise<Response> {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.sub;
      const { id } = req.params;
      const { documentUrl } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({
          success: false,
          message: 'Valid business ID is required'
        });
      }

      if (!documentUrl) {
        return res.status(400).json({
          success: false,
          message: 'Document URL is required'
        });
      }

      const result = await businessVerificationService.submitVerification(
        parseInt(id),
        documentUrl,
        userId
      );

      if (!result.success) {
        const statusCode = result.message?.includes('Unauthorized') ? 403 : 
                          result.message?.includes('not found') ? 404 : 400;
        return res.status(statusCode).json(result);
      }

      return res.status(201).json(result);
    } catch (error) {
      console.error('Submit verification error:', error);
      return res.status(500).json({
        success: false,
        message: (error as Error).message
      });
    }
  }

  // GET /api/businesses/:id/verification - Get verification status
  async getVerification(req: Request, res: Response): Promise<Response> {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.sub;
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
          message: 'Valid business ID is required'
        });
      }

      const result = await businessVerificationService.getBusinessVerification(
        parseInt(id),
        userId
      );

      if (!result.success) {
        const statusCode = result.message?.includes('Unauthorized') ? 403 : 
                          result.message?.includes('not found') ? 404 : 400;
        return res.status(statusCode).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error('Get verification error:', error);
      return res.status(500).json({
        success: false,
        message: (error as Error).message
      });
    }
  }
}

export default new BusinessController();