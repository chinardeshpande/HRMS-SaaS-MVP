import { AppDataSource } from '../config/database';
import { Employee } from '../models/Employee';
import { UserRole } from '../../../shared/types';
import logger from '../utils/logger';

/**
 * Organization Structure Service
 *
 * Provides organizational hierarchy data based on user role and permissions.
 * Used for org charts, approval chains, and reporting structures.
 */

interface OrgChartEmployee {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  designation?: { name: string };
  department?: { name: string };
  profilePictureUrl?: string;
  managerId?: string;
  directReports?: OrgChartEmployee[];
  isCurrentUser?: boolean;
  isInApprovalChain?: boolean;
  approvalLevel?: number;
}

class OrgStructureService {
  private employeeRepository = AppDataSource.getRepository(Employee);

  /**
   * Get organizational structure based on user role
   * @param tenantId - The tenant ID
   * @param userRole - The role of the user requesting data
   * @param employeeId - The employee ID of the user (if applicable)
   * @returns Hierarchical org structure
   */
  async getOrgStructure(
    tenantId: string,
    userRole: UserRole,
    employeeId: string | null
  ): Promise<OrgChartEmployee[]> {
    try {
      switch (userRole) {
        case UserRole.SYSTEM_ADMIN:
        case UserRole.HR_ADMIN:
          // HR and Admins see the entire organization
          return this.getFullOrgStructure(tenantId);

        case UserRole.MANAGER:
          // Managers see their team + their manager
          if (!employeeId) {
            logger.warn('Manager user has no employeeId');
            return [];
          }
          return this.getManagerOrgStructure(tenantId, employeeId);

        case UserRole.EMPLOYEE:
          // Employees see their manager and peers
          if (!employeeId) {
            logger.warn('Employee user has no employeeId');
            return [];
          }
          return this.getEmployeeOrgStructure(tenantId, employeeId);

        default:
          logger.warn(`Unknown user role: ${userRole}`);
          return [];
      }
    } catch (error: any) {
      logger.error('Error fetching org structure:', error);
      throw new Error(`Failed to fetch org structure: ${error.message}`);
    }
  }

  /**
   * Get full organizational structure (for HR/Admin)
   * Returns top-level managers with nested direct reports
   */
  private async getFullOrgStructure(tenantId: string): Promise<OrgChartEmployee[]> {
    // Get all active employees
    const allEmployees = await this.employeeRepository.find({
      where: {
        tenantId,
        status: 'active' as any,
      },
      relations: ['department', 'designation'],
      order: {
        firstName: 'ASC',
      },
    });

    // Find top-level employees (those without managers or whose manager is not in the system)
    const topLevelEmployees = allEmployees.filter(
      (emp) => !emp.managerId || !allEmployees.find((e) => e.employeeId === emp.managerId)
    );

    // Build hierarchical structure
    return topLevelEmployees.map((emp) =>
      this.buildEmployeeHierarchy(emp, allEmployees)
    );
  }

  /**
   * Get manager's organizational view
   * Shows: Manager's manager (if exists) -> Manager -> Direct reports
   */
  private async getManagerOrgStructure(
    tenantId: string,
    managerId: string
  ): Promise<OrgChartEmployee[]> {
    // Get the manager's data
    const manager = await this.employeeRepository.findOne({
      where: {
        employeeId: managerId,
        tenantId,
      },
      relations: ['department', 'designation', 'manager'],
    });

    if (!manager) {
      throw new Error('Manager not found');
    }

    // Get all employees for building hierarchy
    const allEmployees = await this.employeeRepository.find({
      where: {
        tenantId,
        status: 'active' as any,
      },
      relations: ['department', 'designation'],
    });

    // If manager has a manager, show from that level
    if (manager.managerId) {
      const topManager = allEmployees.find((e) => e.employeeId === manager.managerId);
      if (topManager) {
        const hierarchy = this.buildEmployeeHierarchy(topManager, allEmployees, managerId);
        return [hierarchy];
      }
    }

    // Otherwise, start from this manager
    const hierarchy = this.buildEmployeeHierarchy(manager, allEmployees, managerId);
    return [hierarchy];
  }

  /**
   * Get employee's organizational view
   * Shows: Manager and peers (other employees with same manager)
   */
  private async getEmployeeOrgStructure(
    tenantId: string,
    employeeId: string
  ): Promise<OrgChartEmployee[]> {
    // Get the employee's data
    const employee = await this.employeeRepository.findOne({
      where: {
        employeeId,
        tenantId,
      },
      relations: ['department', 'designation', 'manager'],
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // If employee has no manager, show just themselves
    if (!employee.managerId) {
      return [this.mapEmployeeToOrgChart(employee, employeeId)];
    }

    // Get the manager
    const manager = await this.employeeRepository.findOne({
      where: {
        employeeId: employee.managerId,
        tenantId,
      },
      relations: ['department', 'designation'],
    });

    if (!manager) {
      return [this.mapEmployeeToOrgChart(employee, employeeId)];
    }

    // Get all peers (employees with same manager)
    const peers = await this.employeeRepository.find({
      where: {
        managerId: employee.managerId,
        tenantId,
        status: 'active' as any,
      },
      relations: ['department', 'designation'],
      order: {
        firstName: 'ASC',
      },
    });

    // Build hierarchy: Manager with all direct reports (peers)
    const managerNode: OrgChartEmployee = {
      ...this.mapEmployeeToOrgChart(manager),
      directReports: peers.map((peer) => this.mapEmployeeToOrgChart(peer, employeeId)),
    };

    return [managerNode];
  }

  /**
   * Recursively build employee hierarchy
   */
  private buildEmployeeHierarchy(
    employee: Employee,
    allEmployees: Employee[],
    currentUserId?: string
  ): OrgChartEmployee {
    // Find direct reports
    const directReports = allEmployees.filter(
      (emp) => emp.managerId === employee.employeeId
    );

    return {
      ...this.mapEmployeeToOrgChart(employee, currentUserId),
      directReports:
        directReports.length > 0
          ? directReports.map((report) =>
              this.buildEmployeeHierarchy(report, allEmployees, currentUserId)
            )
          : undefined,
    };
  }

  /**
   * Map Employee entity to OrgChartEmployee
   */
  private mapEmployeeToOrgChart(
    employee: Employee,
    currentUserId?: string
  ): OrgChartEmployee {
    return {
      employeeId: employee.employeeId,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      designation: employee.designation ? { name: employee.designation.name } : undefined,
      department: employee.department ? { name: employee.department.name } : undefined,
      profilePictureUrl: undefined, // TODO: Add profilePictureUrl to Employee model
      managerId: employee.managerId,
      isCurrentUser: currentUserId ? employee.employeeId === currentUserId : false,
    };
  }

  /**
   * Get approval chain for a specific employee
   * Returns the chain from employee -> manager -> manager's manager -> etc.
   */
  async getApprovalChain(
    tenantId: string,
    employeeId: string
  ): Promise<OrgChartEmployee[]> {
    const chain: OrgChartEmployee[] = [];
    let currentEmployeeId: string | null = employeeId;
    let level = 1;

    while (currentEmployeeId) {
      const employee = await this.employeeRepository.findOne({
        where: {
          employeeId: currentEmployeeId,
          tenantId,
        },
        relations: ['department', 'designation'],
      });

      if (!employee) break;

      chain.push({
        ...this.mapEmployeeToOrgChart(employee, employeeId),
        isInApprovalChain: true,
        approvalLevel: level,
      });

      currentEmployeeId = employee.managerId || null;
      level++;

      // Prevent infinite loops
      if (level > 10) {
        logger.warn(`Approval chain exceeds 10 levels for employee ${employeeId}`);
        break;
      }
    }

    return chain;
  }
}

// Export singleton instance
export const orgStructureService = new OrgStructureService();
export default orgStructureService;
