import api from './api';

export interface Designation {
  designationId: string;
  name: string;
  tenantId: string;
  level?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

class DesignationService {
  async getAll(): Promise<Designation[]> {
    const response = await api.get<Designation[]>('/designations');
    return response.data || [];
  }

  async getById(id: string): Promise<Designation> {
    const response = await api.get<Designation>(`/designations/${id}`);
    return response.data!;
  }

  async create(data: Partial<Designation>): Promise<Designation> {
    const response = await api.post<Designation>('/designations', data);
    return response.data!;
  }

  async update(id: string, data: Partial<Designation>): Promise<Designation> {
    const response = await api.put<Designation>(`/designations/${id}`, data);
    return response.data!;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/designations/${id}`);
  }
}

export default new DesignationService();
