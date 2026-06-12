import { Router } from 'express';
import * as digitalLibraryController from '../controllers/digitalLibraryController';
import { authenticate } from '../middleware/auth';

import { tenantIsolation } from '../middleware/tenant';
const router = Router();

// All routes require authentication
router.use(authenticate);
router.use(tenantIsolation);

// Check download permission
router.post('/check-permission', digitalLibraryController.checkDownloadPermission);

// Save to library
router.post('/save', digitalLibraryController.saveToLibrary);

// Get library items
router.get('/', digitalLibraryController.getLibraryItems);

// Download from library
router.post('/:libraryId/download', digitalLibraryController.downloadFromLibrary);

// Update library item
router.put('/:libraryId', digitalLibraryController.updateLibraryItem);

// Delete library item
router.delete('/:libraryId', digitalLibraryController.deleteLibraryItem);

// Get library stats
router.get('/stats', digitalLibraryController.getLibraryStats);

// View from library (stream binary)
router.get('/:libraryId/view', digitalLibraryController.viewLibraryFile);

export default router;
