import api from './api';

export interface PermissionCheckRequest {
  fileUrl: string;
  originalOwnerId?: string;
  isPaid?: boolean;
  accessLevel?: 'private' | 'shared' | 'public';
}

export interface PermissionCheckResponse {
  canDownloadLocally: boolean;
  canSaveToLibrary: boolean;
  isPaid: boolean;
  accessLevel?: string;
  reason?: string;
}

export interface SaveToLibraryRequest {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  originalOwnerId?: string;
  sourceType?: string;
  sourceId?: string;
  isPaid?: boolean;
  accessLevel?: 'private' | 'shared' | 'public';
  canDownload?: boolean;
  canShare?: boolean;
  canEdit?: boolean;
  expiresAt?: string;
  category?: string;
  tags?: string[];
  description?: string;
}

export interface LibraryItem {
  libraryId: string;
  tenantId: string;
  employeeId: string;
  originalOwnerId?: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  resourceType: string;
  sourceType?: string;
  sourceId?: string;
  isPaid: boolean;
  accessLevel: string;
  canDownload: boolean;
  canShare: boolean;
  canEdit: boolean;
  category?: string;
  tags?: string[];
  description?: string;
  viewCount: number;
  downloadCount: number;
  lastAccessedAt?: string;
  expiresAt?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LibraryStats {
  totalItems: number;
  totalSize: number;
  byResourceType: Record<string, number>;
}

class DigitalLibraryService {
  async checkDownloadPermission(request: PermissionCheckRequest): Promise<PermissionCheckResponse> {
    try {
      console.log('📡 [Digital Library] Checking download permission:', request);
      const response = await api.post('/digital-library/check-permission', request);
      console.log('✅ [Digital Library] Full response:', response);
      console.log('✅ [Digital Library] response.data:', response.data);

      const result = response.data;  // ApiClient already unwraps response.data
      console.log('✅ [Digital Library] Final result to return:', result);
      return result;
    } catch (error: any) {
      console.error('❌ [Digital Library] Permission check failed:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error message:', error.message);
      throw error;
    }
  }

  async saveToLibrary(request: SaveToLibraryRequest): Promise<LibraryItem> {
    const response = await api.post('/digital-library/save', request);
    return response.data;  // ApiClient already unwraps response.data
  }

  async getLibraryItems(params?: {
    resourceType?: string;
    category?: string;
    searchTerm?: string;
    includeArchived?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ items: LibraryItem[]; total: number }> {
    const response = await api.get('/digital-library', { params });
    return response.data;  // ApiClient already unwraps response.data
  }

  async downloadFromLibrary(libraryId: string): Promise<{ fileUrl: string }> {
    const response = await api.post(`/digital-library/${libraryId}/download`);
    return response.data;  // ApiClient already unwraps response.data
  }

  async updateLibraryItem(
    libraryId: string,
    updates: {
      category?: string;
      tags?: string[];
      description?: string;
      isArchived?: boolean;
    }
  ): Promise<LibraryItem> {
    const response = await api.put(`/digital-library/${libraryId}`, updates);
    return response.data;  // ApiClient already unwraps response.data
  }

  async deleteLibraryItem(libraryId: string): Promise<void> {
    await api.delete(`/digital-library/${libraryId}`);
  }

  async getLibraryStats(): Promise<LibraryStats> {
    const response = await api.get('/digital-library/stats');
    return response.data;  // ApiClient already unwraps response.data
  }
}

export const digitalLibraryService = new DigitalLibraryService();
