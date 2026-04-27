import { api } from './api';

export interface DocumentCategory {
  categoryId: string;
  tenantId: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
}

class DocumentCategoryService {
  async getCategories(): Promise<DocumentCategory[]> {
    const response = await api.get('/document-categories');
    return response.data;
  }

  async getCategoryById(categoryId: string): Promise<DocumentCategory> {
    const response = await api.get(`/document-categories/${categoryId}`);
    return response.data;
  }

  async createCategory(data: CreateCategoryRequest): Promise<DocumentCategory> {
    const response = await api.post('/document-categories', data);
    return response.data;
  }

  async updateCategory(categoryId: string, data: UpdateCategoryRequest): Promise<DocumentCategory> {
    const response = await api.put(`/document-categories/${categoryId}`, data);
    return response.data;
  }

  async deleteCategory(categoryId: string): Promise<void> {
    await api.delete(`/document-categories/${categoryId}`);
  }
}

export const documentCategoryService = new DocumentCategoryService();
