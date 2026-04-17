import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import orgStructureController from '../controllers/orgStructureController';

const router = Router();

// GET /api/v1/org-structure - Get org structure (role-based view)
router.get('/', authenticate, (req, res) => orgStructureController.getOrgStructure(req, res));

// GET /api/v1/org-structure/approval-chain/:employeeId - Get approval chain for employee
router.get('/approval-chain/:employeeId', authenticate, (req, res) =>
  orgStructureController.getApprovalChain(req, res)
);

export default router;
