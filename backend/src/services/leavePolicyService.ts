import { AppDataSource } from '../config/database';
import { LeavePolicy } from '../models/LeavePolicy';
import logger from '../utils/logger';

export class LeavePolicyService {
  private leavePolicyRepo = AppDataSource.getRepository(LeavePolicy);

  /**
   * Create a new leave policy
   */
  async createPolicy(tenantId: string, data: Partial<LeavePolicy>): Promise<LeavePolicy> {
    try {
      // Check for duplicate policy for same leave type
      const existing = await this.leavePolicyRepo.findOne({
        where: {
          tenantId,
          leaveType: data.leaveType,
          isActive: true,
        },
      });

      if (existing) {
        throw new Error(`Active policy for ${data.leaveType} leave type already exists`);
      }

      const policy = this.leavePolicyRepo.create({
        ...data,
        tenantId,
      });

      const saved = await this.leavePolicyRepo.save(policy);
      logger.info(`Leave policy created: ${saved.policyId}`);
      return saved;
    } catch (error: any) {
      logger.error('Error creating leave policy:', error);
      throw new Error(`Failed to create leave policy: ${error.message}`);
    }
  }

  /**
   * Get all leave policies for a tenant
   */
  async getAllPolicies(tenantId: string, filters?: { isActive?: boolean }): Promise<LeavePolicy[]> {
    try {
      const query: any = { tenantId };

      if (filters?.isActive !== undefined) {
        query.isActive = filters.isActive;
      }

      return await this.leavePolicyRepo.find({
        where: query,
        order: { leaveType: 'ASC', createdAt: 'DESC' },
      });
    } catch (error: any) {
      logger.error('Error fetching leave policies:', error);
      throw new Error(`Failed to fetch leave policies: ${error.message}`);
    }
  }

  /**
   * Get a single leave policy by ID
   */
  async getPolicyById(policyId: string, tenantId: string): Promise<LeavePolicy> {
    try {
      const policy = await this.leavePolicyRepo.findOne({
        where: { policyId, tenantId },
      });

      if (!policy) {
        throw new Error('Leave policy not found');
      }

      return policy;
    } catch (error: any) {
      logger.error('Error fetching leave policy:', error);
      throw new Error(`Failed to fetch leave policy: ${error.message}`);
    }
  }

  /**
   * Update a leave policy
   */
  async updatePolicy(policyId: string, tenantId: string, data: Partial<LeavePolicy>): Promise<LeavePolicy> {
    try {
      const policy = await this.getPolicyById(policyId, tenantId);

      // If changing leave type, check for duplicates
      if (data.leaveType && data.leaveType !== policy.leaveType) {
        const existing = await this.leavePolicyRepo.findOne({
          where: {
            tenantId,
            leaveType: data.leaveType,
            isActive: true,
          },
        });

        if (existing && existing.policyId !== policyId) {
          throw new Error(`Active policy for ${data.leaveType} leave type already exists`);
        }
      }

      Object.assign(policy, data);
      const saved = await this.leavePolicyRepo.save(policy);
      logger.info(`Leave policy updated: ${saved.policyId}`);
      return saved;
    } catch (error: any) {
      logger.error('Error updating leave policy:', error);
      throw new Error(`Failed to update leave policy: ${error.message}`);
    }
  }

  /**
   * Delete (soft delete) a leave policy
   */
  async deletePolicy(policyId: string, tenantId: string): Promise<void> {
    try {
      const policy = await this.getPolicyById(policyId, tenantId);

      // Soft delete by setting isActive to false
      policy.isActive = false;
      await this.leavePolicyRepo.save(policy);
      logger.info(`Leave policy deleted: ${policyId}`);
    } catch (error: any) {
      logger.error('Error deleting leave policy:', error);
      throw new Error(`Failed to delete leave policy: ${error.message}`);
    }
  }

  /**
   * Get policy by leave type
   */
  async getPolicyByType(tenantId: string, leaveType: string): Promise<LeavePolicy | null> {
    try {
      return await this.leavePolicyRepo.findOne({
        where: {
          tenantId,
          leaveType: leaveType as any,
          isActive: true,
        },
      });
    } catch (error: any) {
      logger.error('Error fetching leave policy by type:', error);
      throw new Error(`Failed to fetch leave policy: ${error.message}`);
    }
  }
}

export default new LeavePolicyService();
