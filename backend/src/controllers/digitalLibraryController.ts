import { Request, Response } from 'express';
import { digitalLibraryService } from '../services/digitalLibraryService';
import { ResourceType } from '../models/DigitalLibrary';

export const checkDownloadPermission = async (req: Request, res: Response) => {
  try {
    console.log('📥 [Digital Library] Check permission request received');
    console.log('📥 Request body:', req.body);
    console.log('📥 Request user:', req.user);

    const { tenantId, user } = req as any;
    const { fileUrl, originalOwnerId, isPaid, accessLevel } = req.body;

    console.log('📥 tenantId:', tenantId);
    console.log('📥 user.employeeId:', user?.employeeId);

    const result = await digitalLibraryService.canDownloadLocally({
      tenantId,
      employeeId: user.employeeId,
      fileUrl,
      originalOwnerId,
      isPaid,
      accessLevel,
    });

    console.log('✅ [Digital Library] Permission check result:', result);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('❌ [Digital Library] Error checking download permission:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const saveToLibrary = async (req: Request, res: Response) => {
  try {
    const { tenantId, user } = req as any;
    const {
      fileName,
      fileUrl,
      fileType,
      fileSize,
      originalOwnerId,
      sourceType,
      sourceId,
      isPaid,
      accessLevel,
      canDownload,
      canShare,
      canEdit,
      expiresAt,
      category,
      tags,
      description,
    } = req.body;

    if (!fileName || !fileUrl || !fileType || !fileSize) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'fileName, fileUrl, fileType, and fileSize are required',
        },
      });
    }

    const libraryItem = await digitalLibraryService.saveToLibrary({
      tenantId,
      employeeId: user.employeeId,
      fileName,
      fileUrl,
      fileType,
      fileSize,
      originalOwnerId,
      sourceType,
      sourceId,
      isPaid,
      accessLevel,
      canDownload,
      canShare,
      canEdit,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      category,
      tags,
      description,
    });

    res.status(201).json({
      success: true,
      data: libraryItem,
    });
  } catch (error: any) {
    console.error('Error saving to library:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const getLibraryItems = async (req: Request, res: Response) => {
  try {
    const { tenantId, user } = req as any;
    const { resourceType, category, searchTerm, includeArchived, limit, offset } = req.query;

    const result = await digitalLibraryService.getLibraryItems(tenantId, user.employeeId, {
      resourceType: resourceType as ResourceType,
      category: category as string,
      searchTerm: searchTerm as string,
      includeArchived: includeArchived === 'true',
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error getting library items:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const downloadFromLibrary = async (req: Request, res: Response) => {
  try {
    const { tenantId, user } = req as any;
    const { libraryId } = req.params;

    const result = await digitalLibraryService.downloadFromLibrary(
      libraryId,
      tenantId,
      user.employeeId
    );

    if (!result.allowed) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: result.reason,
        },
      });
    }

    res.status(200).json({
      success: true,
      data: { fileUrl: result.fileUrl },
    });
  } catch (error: any) {
    console.error('Error downloading from library:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const updateLibraryItem = async (req: Request, res: Response) => {
  try {
    const { tenantId, user } = req as any;
    const { libraryId } = req.params;
    const { category, tags, description, isArchived } = req.body;

    const libraryItem = await digitalLibraryService.updateLibraryItem(
      libraryId,
      tenantId,
      user.employeeId,
      { category, tags, description, isArchived }
    );

    if (!libraryItem) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Library item not found',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: libraryItem,
    });
  } catch (error: any) {
    console.error('Error updating library item:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const deleteLibraryItem = async (req: Request, res: Response) => {
  try {
    const { tenantId, user } = req as any;
    const { libraryId } = req.params;

    const deleted = await digitalLibraryService.deleteLibraryItem(
      libraryId,
      tenantId,
      user.employeeId
    );

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Library item not found',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: { message: 'Library item deleted successfully' },
    });
  } catch (error: any) {
    console.error('Error deleting library item:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const getLibraryStats = async (req: Request, res: Response) => {
  try {
    const { tenantId, user } = req as any;

    const stats = await digitalLibraryService.getLibraryStats(tenantId, user.employeeId);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('Error getting library stats:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};
