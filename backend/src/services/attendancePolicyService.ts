import { AppDataSource } from '../config/database';
import { AttendancePolicy } from '../models/AttendancePolicy';
import logger from '../utils/logger';

export class AttendancePolicyService {
  private attendancePolicyRepo = AppDataSource.getRepository(AttendancePolicy);

  /**
   * Create a new attendance policy
   */
  async createPolicy(tenantId: string, data: Partial<AttendancePolicy>): Promise<AttendancePolicy> {
    try {
      const policy = this.attendancePolicyRepo.create({
        ...data,
        tenantId,
      });

      const saved = await this.attendancePolicyRepo.save(policy);
      logger.info(`Attendance policy created: ${saved.policyId}`);
      return saved;
    } catch (error: any) {
      logger.error('Error creating attendance policy:', error);
      throw new Error(`Failed to create attendance policy: ${error.message}`);
    }
  }

  /**
   * Get all attendance policies for a tenant
   */
  async getAllPolicies(tenantId: string, filters?: { isActive?: boolean }): Promise<AttendancePolicy[]> {
    try {
      const query: any = { tenantId };

      if (filters?.isActive !== undefined) {
        query.isActive = filters.isActive;
      }

      return await this.attendancePolicyRepo.find({
        where: query,
        order: { createdAt: 'DESC' },
      });
    } catch (error: any) {
      logger.error('Error fetching attendance policies:', error);
      throw new Error(`Failed to fetch attendance policies: ${error.message}`);
    }
  }

  /**
   * Get a single attendance policy by ID
   */
  async getPolicyById(policyId: string, tenantId: string): Promise<AttendancePolicy> {
    try {
      const policy = await this.attendancePolicyRepo.findOne({
        where: { policyId, tenantId },
      });

      if (!policy) {
        throw new Error('Attendance policy not found');
      }

      return policy;
    } catch (error: any) {
      logger.error('Error fetching attendance policy:', error);
      throw new Error(`Failed to fetch attendance policy: ${error.message}`);
    }
  }

  /**
   * Update an attendance policy
   */
  async updatePolicy(policyId: string, tenantId: string, data: Partial<AttendancePolicy>): Promise<AttendancePolicy> {
    try {
      const policy = await this.getPolicyById(policyId, tenantId);

      Object.assign(policy, data);
      const saved = await this.attendancePolicyRepo.save(policy);
      logger.info(`Attendance policy updated: ${saved.policyId}`);
      return saved;
    } catch (error: any) {
      logger.error('Error updating attendance policy:', error);
      throw new Error(`Failed to update attendance policy: ${error.message}`);
    }
  }

  /**
   * Delete (soft delete) an attendance policy
   */
  async deletePolicy(policyId: string, tenantId: string): Promise<void> {
    try {
      const policy = await this.getPolicyById(policyId, tenantId);

      // Soft delete by setting isActive to false
      policy.isActive = false;
      await this.attendancePolicyRepo.save(policy);
      logger.info(`Attendance policy deleted: ${policyId}`);
    } catch (error: any) {
      logger.error('Error deleting attendance policy:', error);
      throw new Error(`Failed to delete attendance policy: ${error.message}`);
    }
  }

  /**
   * Get active policy for tenant
   */
  async getActivePolicy(tenantId: string): Promise<AttendancePolicy | null> {
    try {
      return await this.attendancePolicyRepo.findOne({
        where: {
          tenantId,
          isActive: true,
        },
        order: {
          createdAt: 'DESC',
        },
      });
    } catch (error: any) {
      logger.error('Error fetching active attendance policy:', error);
      throw new Error(`Failed to fetch active attendance policy: ${error.message}`);
    }
  }
}

export default new AttendancePolicyService();
