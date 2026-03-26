import api from './api';

export interface Employee {
  employeeId: string;
  tenantId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  departmentId?: string;
  designationId?: string;
  managerId?: string;
  dateOfJoining: string;
  probationEndDate?: string;
  employmentType?: string;
  status: 'active' | 'inactive' | 'exited';
  createdAt?: string;
  updatedAt?: string;
  // Relations
  department?: {
    departmentId: string;
    name: string;
    code?: string;
  };
  designation?: {
    designationId: string;
    title: string;
    level?: string;
  };
  manager?: {
    employeeId: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
  };
  subordinates?: Employee[];
}

export interface EmployeeFilters {
  search?: string;
  departmentId?: string;
  designationId?: string;
  status?: 'active' | 'inactive' | 'exited';
}

export interface EmployeeStats {
  total: number;
  active: number;
  inactive: number;
  exited: number;
  byDepartment: Array<{
    departmentName: string;
    count: number;
  }>;
}

export interface CreateEmployeeData {
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  departmentId?: string;
  designationId?: string;
  managerId?: string;
  dateOfJoining: string;
  probationEndDate?: string;
  employmentType?: string;
  status?: 'active' | 'inactive' | 'exited';
  // User creation options
  createUser?: boolean;
  userRole?: 'EMPLOYEE' | 'MANAGER' | 'HR_ADMIN' | 'SYSTEM_ADMIN';
  password?: string;
}

class EmployeeService {
  /**
   * Get all employees with optional filters
   */
  async getAll(filters?: EmployeeFilters): Promise<Employee[]> {
    const params = new URLSearchParams();

    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (filters?.departmentId) {
      params.append('departmentId', filters.departmentId);
    }
    if (filters?.designationId) {
      params.append('designationId', filters.designationId);
    }
    if (filters?.status) {
      params.append('status', filters.status);
    }

    const queryString = params.toString();
    const url = queryString ? `/employees?${queryString}` : '/employees';

    const response = await api.get<Employee[]>(url);
    return response.data || [];
  }

  /**
   * Get employee by ID
   */
  async getById(id: string): Promise<Employee> {
    const response = await api.get<Employee>(`/employees/${id}`);
    return response.data!;
  }

  /**
   * Get employee statistics
   */
  async getStats(): Promise<EmployeeStats> {
    const response = await api.get<EmployeeStats>('/employees/stats');
    return response.data!;
  }

  /**
   * Create new employee
   */
  async create(data: CreateEmployeeData): Promise<Employee> {
    const response = await api.post<Employee>('/employees', data);
    return response.data!;
  }

  /**
   * Update employee
   */
  async update(id: string, data: Partial<CreateEmployeeData>): Promise<Employee> {
    const response = await api.put<Employee>(`/employees/${id}`, data);
    return response.data!;
  }

  /**
   * Delete employee (soft delete - sets status to 'exited')
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/employees/${id}`);
  }

  /**
   * Convenience aliases
   */
  async getEmployee(id: string): Promise<{ data: Employee }> {
    const employee = await this.getById(id);
    return { data: employee };
  }

  async updateEmployee(id: string, data: Partial<CreateEmployeeData>): Promise<void> {
    await this.update(id, data);
  }
}

export default new EmployeeService();
