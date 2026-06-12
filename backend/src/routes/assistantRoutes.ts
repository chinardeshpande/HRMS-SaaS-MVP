import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { tenantIsolation } from '../middleware/tenant';
import assistantController from '../controllers/assistantController';

const router = Router();

router.use(authenticate);
router.use(tenantIsolation);

router.post('/ask', assistantController.ask.bind(assistantController));
router.post('/proposals/preview-confirmation', assistantController.previewConfirmation.bind(assistantController));
router.post('/proposals/request-execution', assistantController.requestControlledExecution.bind(assistantController));

export default router;
