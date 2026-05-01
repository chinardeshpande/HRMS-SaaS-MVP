import { AppDataSource } from '../config/database';
import { DigitalLibrary, ResourceType, AccessLevel } from '../models/DigitalLibrary';
import { Employee } from '../models/Employee';

export class DigitalLibraryService {
  private static instance: DigitalLibraryService;
  private libraryRepo = AppDataSource.getRepository(DigitalLibrary);
  private employeeRepo = AppDataSource.getRepository(Employee);

  private constructor() {}

  public static getInstance(): DigitalLibraryService {
    if (!DigitalLibraryService.instance) {
      DigitalLibraryService.instance = new DigitalLibraryService();
    }
    return DigitalLibraryService.instance;
  }

  /**
   * Check if user has permission to download a file locally
   */
  async canDownloadLocally(data: {
    tenantId: string;
    employeeId: string;
    fileUrl: string;
    originalOwnerId?: string;
    isPaid?: boolean;
    accessLevel?: string;
  }): Promise<{
    canDownloadLocally: boolean;
    canSaveToLibrary: boolean;
    isPaid: boolean;
    accessLevel?: string;
    reason?: string;
  }> {
    const { tenantId, employeeId, originalOwnerId, isPaid, accessLevel } = data;

    // Owner can always download locally
    if (originalOwnerId && originalOwnerId === employeeId) {
      return {
        canDownloadLocally: true,
        canSaveToLibrary: true,
        isPaid: isPaid || false,
        accessLevel: accessLevel || 'private',
      };
    }

    // Paid resources cannot be downloaded locally by non-owners
    if (isPaid) {
      return {
        canDownloadLocally: false,
        canSaveToLibrary: true,
        isPaid: true,
        accessLevel: accessLevel || 'shared',
        reason: 'Paid resources can only be saved to Digital Library',
      };
    }

    // Shared resources - can download
    if (accessLevel === 'shared') {
      return {
        canDownloadLocally: true,
        canSaveToLibrary: true,
        isPaid: false,
        accessLevel: 'shared',
      };
    }

    // Private resources - only owner can download
    if (accessLevel === 'private' && originalOwnerId !== employeeId) {
      return {
        canDownloadLocally: false,
        canSaveToLibrary: false,
        isPaid: false,
        accessLevel: 'private',
        reason: 'Private resources cannot be downloaded by others',
      };
    }

    // Public resources - everyone can download
    if (accessLevel === 'public') {
      return {
        canDownloadLocally: true,
        canSaveToLibrary: true,
        isPaid: false,
        accessLevel: 'public',
      };
    }

    // Default: allow download
    return {
      canDownloadLocally: true,
      canSaveToLibrary: true,
      isPaid: isPaid || false,
      accessLevel: accessLevel || 'private',
    };
  }

  /**
   * Save a file to user's Digital Library
   */
  async saveToLibrary(data: {
    tenantId: string;
    employeeId: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    originalOwnerId?: string;
    sourceType?: string;
    sourceId?: string;
    isPaid?: boolean;
    accessLevel?: string;
    canDownload?: boolean;
    canShare?: boolean;
    canEdit?: boolean;
    expiresAt?: Date;
    category?: string;
    tags?: string[];
    description?: string;
  }): Promise<DigitalLibrary> {
    // Check if already saved
    const existing = await this.libraryRepo.findOne({
      where: {
        tenantId: data.tenantId,
        employeeId: data.employeeId,
        fileUrl: data.fileUrl,
      },
    });

    if (existing) {
      // Update access time
      existing.lastAccessedAt = new Date();
      return await this.libraryRepo.save(existing);
    }

    // Determine resource type from MIME type
    let resourceType = ResourceType.OTHER;
    if (data.fileType.startsWith('image/')) resourceType = ResourceType.IMAGE;
    else if (data.fileType.startsWith('video/')) resourceType = ResourceType.VIDEO;
    else if (data.fileType.startsWith('audio/')) resourceType = ResourceType.AUDIO;
    else if (data.fileType.includes('pdf') || data.fileType.includes('document'))
      resourceType = ResourceType.DOCUMENT;

    // Create new library entry
    const libraryItem = this.libraryRepo.create({
      tenantId: data.tenantId,
      employeeId: data.employeeId,
      originalOwnerId: data.originalOwnerId,
      fileName: data.fileName,
      fileUrl: data.fileUrl,
      fileType: data.fileType,
      fileSize: data.fileSize,
      resourceType,
      accessLevel: (data.accessLevel as AccessLevel) || AccessLevel.PRIVATE,
      isPaid: data.isPaid || false,
      canDownload: data.canDownload !== undefined ? data.canDownload : true,
      canShare: data.canShare || false,
      canEdit: data.canEdit || false,
      sourceType: data.sourceType,
      sourceId: data.sourceId,
      category: data.category,
      tags: data.tags,
      description: data.description,
      expiresAt: data.expiresAt,
      viewCount: 0,
      downloadCount: 0,
      lastAccessedAt: new Date(),
    });

    return await this.libraryRepo.save(libraryItem);
  }

  /**
   * Get all library items for a user
   */
  async getLibraryItems(
    tenantId: string,
    employeeId: string,
    options: {
      resourceType?: ResourceType;
      category?: string;
      searchTerm?: string;
      includeArchived?: boolean;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ items: DigitalLibrary[]; total: number }> {
    const query = this.libraryRepo
      .createQueryBuilder('lib')
      .leftJoinAndSelect('lib.employee', 'employee')
      .leftJoinAndSelect('lib.originalOwner', 'originalOwner')
      .where('lib.tenantId = :tenantId', { tenantId })
      .andWhere('lib.employeeId = :employeeId', { employeeId });

    if (!options.includeArchived) {
      query.andWhere('lib.isArchived = :isArchived', { isArchived: false });
    }

    if (options.resourceType) {
      query.andWhere('lib.resourceType = :resourceType', { resourceType: options.resourceType });
    }

    if (options.category) {
      query.andWhere('lib.category = :category', { category: options.category });
    }

    if (options.searchTerm) {
      query.andWhere(
        '(lib.fileName ILIKE :searchTerm OR lib.description ILIKE :searchTerm OR lib.tags ILIKE :searchTerm)',
        { searchTerm: `%${options.searchTerm}%` }
      );
    }

    query.orderBy('lib.createdAt', 'DESC');

    if (options.limit) {
      query.take(options.limit);
    }

    if (options.offset) {
      query.skip(options.offset);
    }

    const [items, total] = await query.getManyAndCount();

    return { items, total };
  }

  /**
   * Download a file from library (increments download count)
   */
  async downloadFromLibrary(
    libraryId: string,
    tenantId: string,
    employeeId: string
  ): Promise<{ allowed: boolean; fileUrl?: string; reason?: string }> {
    const item = await this.libraryRepo.findOne({
      where: { libraryId, tenantId, employeeId },
    });

    if (!item) {
      return { allowed: false, reason: 'Item not found in your library' };
    }

    // Check if expired
    if (item.expiresAt && item.expiresAt < new Date()) {
      return { allowed: false, reason: 'Access to this resource has expired' };
    }

    // Check if download is allowed
    if (!item.canDownload) {
      return { allowed: false, reason: 'Download not permitted for this resource' };
    }

    // Update stats
    item.downloadCount += 1;
    item.lastAccessedAt = new Date();
    await this.libraryRepo.save(item);

    return { allowed: true, fileUrl: item.fileUrl };
  }

  /**
   * Update library item metadata
   */
  async updateLibraryItem(
    libraryId: string,
    tenantId: string,
    employeeId: string,
    updates: {
      category?: string;
      tags?: string[];
      description?: string;
      isArchived?: boolean;
    }
  ): Promise<DigitalLibrary | null> {
    const item = await this.libraryRepo.findOne({
      where: { libraryId, tenantId, employeeId },
    });

    if (!item) {
      return null;
    }

    Object.assign(item, updates);
    return await this.libraryRepo.save(item);
  }

  /**
   * Delete library item
   */
  async deleteLibraryItem(
    libraryId: string,
    tenantId: string,
    employeeId: string
  ): Promise<boolean> {
    const result = await this.libraryRepo.delete({
      libraryId,
      tenantId,
      employeeId,
    });

    return (result.affected !== null && result.affected !== undefined && result.affected > 0);
  }

  /**
   * Get library statistics
   */
  async getLibraryStats(tenantId: string, employeeId: string): Promise<{
    totalItems: number;
    byType: Record<ResourceType, number>;
    totalSize: number;
  }> {
    const items = await this.libraryRepo.find({
      where: { tenantId, employeeId, isArchived: false },
    });

    const stats = {
      totalItems: items.length,
      byType: {
        [ResourceType.IMAGE]: 0,
        [ResourceType.DOCUMENT]: 0,
        [ResourceType.VIDEO]: 0,
        [ResourceType.AUDIO]: 0,
        [ResourceType.OTHER]: 0,
      },
      totalSize: 0,
    };

    items.forEach((item) => {
      stats.byType[item.resourceType]++;
      stats.totalSize += Number(item.fileSize);
    });

    return stats;
  }
}

export const digitalLibraryService = DigitalLibraryService.getInstance();
