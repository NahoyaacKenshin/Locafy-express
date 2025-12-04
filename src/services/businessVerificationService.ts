// services/businessVerificationService.ts
import verificationRepository from '@/repositories/verificationRepository';
import businessRepository from '@/repositories/businessRepository';

interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

class BusinessVerificationService {
  // Submit verification documents for a business
  async submitVerification(
    businessId: number,
    documentUrl: string,
    userId: string
  ): Promise<ServiceResponse> {
    try {
      // Check if business exists and user is the owner
      const business = await businessRepository.findById(businessId);
      if (!business) {
        return {
          success: false,
          message: 'Business not found',
        };
      }

      if (business.ownerId !== userId) {
        return {
          success: false,
          message: 'Unauthorized to submit verification for this business',
        };
      }

      // Check if there's already a pending verification
      const existingVerifications = await verificationRepository.findByBusinessId(businessId);
      const pendingVerification = existingVerifications.find(v => v.status === 'PENDING');
      
      if (pendingVerification) {
        return {
          success: false,
          message: 'A verification request is already pending for this business',
        };
      }

      // Create verification request
      const verification = await verificationRepository.createBusinessVerification({
        documentUrl,
        businessId,
        vendorId: userId, // Store the owner's ID for reference
      });

      return {
        success: true,
        data: verification,
        message: 'Verification documents submitted successfully',
      };
    } catch (error) {
      throw new Error(
        `Failed to submit verification: ${(error as Error).message}`
      );
    }
  }

  // Get verification status for a business
  async getBusinessVerification(businessId: number, userId: string): Promise<ServiceResponse> {
    try {
      // Check if business exists and user is the owner
      const business = await businessRepository.findById(businessId);
      if (!business) {
        return {
          success: false,
          message: 'Business not found',
        };
      }

      if (business.ownerId !== userId) {
        return {
          success: false,
          message: 'Unauthorized to view verification for this business',
        };
      }

      const verifications = await verificationRepository.findByBusinessId(businessId);
      const latestVerification = verifications.length > 0 ? verifications[0] : null;

      return {
        success: true,
        data: latestVerification,
      };
    } catch (error) {
      throw new Error(
        `Failed to get verification: ${(error as Error).message}`
      );
    }
  }
}

export default new BusinessVerificationService();

