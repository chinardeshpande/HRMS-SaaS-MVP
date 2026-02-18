import api from './api';

export interface Department {
  departmentId: string;
  name: string;
  tenantId: string;
  code?: string;
  parentId?: string;
  headId?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

class DepartmentService {
  async getAll(): Promise<Department[]> {
    const response = await api.get<Department[]>('/departments');
    return response.data || [];
  }

  async getById(id: string): Promise<Department> {
    const response = await api.get<Department>(`/departments/${id}`);
    return response.data!;
  }

  async create(data: Partial<Department>): Promise<Department> {
    const response = await api.post<Department>('/departments', data);
    return response.data!;
  }

  async update(id: string, data: Partial<Department>): Promise<Department> {
    const response = await api.put<Department>(`/departments/${id}`, data);
    return response.data!;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/departments/${id}`);
  }
}

export default new DepartmentService();
