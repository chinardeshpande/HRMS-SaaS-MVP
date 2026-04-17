import { AppDataSource } from '../config/database';
import { Employee } from '../models/Employee';
import { UserRole } from '../../../shared/types';
import logger from '../utils/logger';

/**
 * Manager Team Service
 *
 * Handles all logic related to manager-employee relationships
 * and team-based data filtering for role-based access control.
 */

interface TeamStats {
  totalTeamMembers: number;
  presentToday: number;
  onLeaveToday: number;
  activeProbation: number;
}

class ManagerTeamService {
  private employeeRepository = AppDataSource.getRepository(Employee);

  /**
   * Get all direct reports for a manager
   * @param managerId - The employee ID of the manager
   * @param tenantId - The tenant ID for multi-tenant isolation
   * @returns Array of direct report employees
   */
  async getDirectReports(managerId: string, tenantId: string): Promise<Employee[]> {
    try {
      const directReports = await this.employeeRepository.find({
        where: {
          managerId,
          tenantId,
          status: 'active' as any,
        },
        relations: ['department', 'designation', 'manager'],
        order: {
          firstName: 'ASC',
        },
      });

      logger.info(`Manager ${managerId} has ${directReports.length} direct reports`);
      return directReports;
    } catch (error: any) {
      logger.error('Error fetching direct reports:', error);
      throw new Error(`Failed to fetch direct reports: ${error.message}`);
    }
  }

  /**
   * Get all employee IDs in a manager's team (for filtering queries)
   * @param managerId - The employee ID of the manager
   * @param tenantId - The tenant ID
   * @returns Array of employee IDs
   */
  async getTeamEmployeeIds(managerId: string, tenantId: string): Promise<string[]> {
    const directReports = await this.getDirectReports(managerId, tenantId);
    return directReports.map(emp => emp.employeeId);
  }

  /**
   * Check if a manager can access a specific employee's data
   * @param managerId - The employee ID of the manager
   * @param targetEmployeeId - The employee ID being accessed
   * @param tenantId - The tenant ID
   * @returns true if manager can access, false otherwise
   */
  async canAccessEmployee(
    managerId: string,
    targetEmployeeId: string,
    tenantId: string
  ): Promise<boolean> {
    try {
      // Manager can always access their own data
      if (managerId === targetEmployeeId) {
        return true;
      }

      // Check if target employee is a direct report
      const employee = await this.employeeRepository.findOne({
        where: {
          employeeId: targetEmployeeId,
          managerId,
          tenantId,
        },
      });

      return employee !== null;
    } catch (error: any) {
      logger.error('Error checking employee access:', error);
      return false;
    }
  }

  /**
   * Get team statistics for a manager's dashboard
   * @param managerId - The employee ID of the manager
   * @param tenantId - The tenant ID
   * @returns Team statistics object
   */
  async getTeamStats(managerId: string, tenantId: string): Promise<TeamStats> {
    try {
      const directReports = await this.getDirectReports(managerId, tenantId);

      // Calculate basic team stats
      const totalTeamMembers = directReports.length;

      // Count employees on probation
      const today = new Date();
      const activeProbation = directReports.filter(emp => {
        return emp.probationEndDate && new Date(emp.probationEndDate) > today;
      }).length;

      // Note: presentToday and onLeaveToday would require attendance/leave data
      // These will be calculated when those services are updated

      return {
        totalTeamMembers,
        presentToday: 0, // TODO: Calculate from attendance service
        onLeaveToday: 0,  // TODO: Calculate from leave service
        activeProbation,
      };
    } catch (error: any) {
      logger.error('Error calculating team stats:', error);
      throw new Error(`Failed to calculate team stats: ${error.message}`);
    }
  }

  /**
   * Filter employees based on user role
   * @param userId - The user ID making the request
   * @param userRole - The role of the user
   * @param employeeId - The employee ID of the user (if applicable)
   * @param tenantId - The tenant ID
   * @param allEmployees - Array of all employees to filter
   * @returns Filtered array of employees based on role
   */
  async filterEmployeesByRole(
    userId: string,
    userRole: UserRole,
    employeeId: string | null,
    tenantId: string,
    allEmployees: Employee[]
  ): Promise<Employee[]> {
    switch (userRole) {
      case UserRole.SYSTEM_ADMIN:
      case UserRole.HR_ADMIN:
        // HR and System Admins can see all employees
        return allEmployees;

      case UserRole.MANAGER:
        // Managers can only see their direct reports + themselves
        if (!employeeId) {
          logger.warn(`Manager user ${userId} has no associated employeeId`);
          return [];
        }

        const teamEmployeeIds = await this.getTeamEmployeeIds(employeeId, tenantId);

        // Include the manager themselves in the results
        return allEmployees.filter(emp =>
          emp.employeeId === employeeId || teamEmployeeIds.includes(emp.employeeId)
        );

      case UserRole.EMPLOYEE:
        // Employees can only see their own data
        if (!employeeId) {
          logger.warn(`Employee user ${userId} has no associated employeeId`);
          return [];
        }

        return allEmployees.filter(emp => emp.employeeId === employeeId);

      default:
        logger.warn(`Unknown user role: ${userRole}`);
        return [];
    }
  }

  /**
   * Check if a manager has any direct reports
   * @param managerId - The employee ID of the manager
   * @param tenantId - The tenant ID
   * @returns true if manager has at least one direct report
   */
  async hasDirectReports(managerId: string, tenantId: string): Promise<boolean> {
    const count = await this.employeeRepository.count({
      where: {
        managerId,
        tenantId,
        status: 'active' as any,
      },
    });

    return count > 0;
  }

  /**
   * Get count of direct reports for a manager
   * @param managerId - The employee ID of the manager
   * @param tenantId - The tenant ID
   * @returns Number of direct reports
   */
  async getDirectReportsCount(managerId: string, tenantId: string): Promise<number> {
    return await this.employeeRepository.count({
      where: {
        managerId,
        tenantId,
        status: 'active' as any,
      },
    });
  }
}

// Export singleton instance
export const managerTeamService = new ManagerTeamService();
export default managerTeamService;
