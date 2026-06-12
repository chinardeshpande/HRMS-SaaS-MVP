import { Router } from 'express';
import demoController from '../controllers/demoController';
import { authenticate } from '../middleware/auth';

import { tenantIsolation } from '../middleware/tenant';
const router = Router();

router.get('/personas', demoController.getDemoPersonas);
router.post('/login', demoController.startDemoSession);
router.post('/switch', authenticate, tenantIsolation, demoController.switchToDemoSession);

export default router;
