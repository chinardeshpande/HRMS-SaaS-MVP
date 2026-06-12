import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { tenantIsolation } from '../middleware/tenant';
import orgStructureController from '../controllers/orgStructureController';

const router = Router();

// GET /api/v1/org-structure - Get org structure (role-based view)
router.get('/', authenticate, tenantIsolation, (req, res) => orgStructureController.getOrgStructure(req, res));

// GET /api/v1/org-structure/approval-chain/:employeeId - Get approval chain for employee
router.get('/approval-chain/:employeeId', authenticate, tenantIsolation, (req, res) =>
  orgStructureController.getApprovalChain(req, res)
);

export default router;
