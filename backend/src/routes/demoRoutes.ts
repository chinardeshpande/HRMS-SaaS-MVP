import { Router } from 'express';
import demoController from '../controllers/demoController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/personas', demoController.getDemoPersonas);
router.post('/login', demoController.startDemoSession);
router.post('/switch', authenticate, demoController.switchToDemoSession);

export default router;
