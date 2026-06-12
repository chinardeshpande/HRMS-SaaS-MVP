import { Router, Request, Response } from 'express';
import onboardingWizardService from '../services/onboardingWizardService';
import { authenticate, authorize } from '../middleware/auth';
import { tenantIsolation } from '../middleware/tenant';
import { UserRole } from '../../../shared/types';

const router = Router();

/**
 * All routes require authentication
 */
router.use(authenticate);
router.use(tenantIsolation);
router.use(authorize(UserRole.SYSTEM_ADMIN, UserRole.HR_ADMIN));

/**
 * GET /api/v1/onboarding-wizard/progress
 * Get current onboarding progress
 */
router.get('/progress', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;

    const progress = await onboardingWizardService.getProgress(tenantId);

    res.status(200).json({
      success: true,
      data: progress,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch onboarding progress',
      },
    });
  }
});

/**
 * POST /api/v1/onboarding-wizard/step/:stepNumber
 * Save step data
 */
router.post('/step/:stepNumber', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const stepNumber = parseInt(req.params.stepNumber);
    const stepData = req.body;

    // Validate step number
    if (isNaN(stepNumber) || stepNumber < 1 || stepNumber > 6) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid step number. Must be between 1 and 6',
        },
      });
    }

    const progress = await onboardingWizardService.saveStepData(
      tenantId,
      stepNumber,
      stepData
    );

    res.status(200).json({
      success: true,
      data: progress,
      message: 'Step data saved successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        message: error.message || 'Failed to save step data',
      },
    });
  }
});

/**
 * PUT /api/v1/onboarding-wizard/complete
 * Mark onboarding as complete and create resources
 */
router.put('/complete', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.userId;

    const result = await onboardingWizardService.completeOnboarding(tenantId, userId);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Onboarding completed successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        message: error.message || 'Failed to complete onboarding',
      },
    });
  }
});

/**
 * POST /api/v1/onboarding-wizard/skip-step/:stepNumber
 * Skip an optional step
 */
router.post('/skip-step/:stepNumber', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const stepNumber = parseInt(req.params.stepNumber);

    // Validate step number
    if (isNaN(stepNumber) || stepNumber < 1 || stepNumber > 6) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid step number. Must be between 1 and 6',
        },
      });
    }

    const progress = await onboardingWizardService.skipStep(tenantId, stepNumber);

    res.status(200).json({
      success: true,
      data: progress,
      message: 'Step skipped successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        message: error.message || 'Failed to skip step',
      },
    });
  }
});

/**
 * GET /api/v1/onboarding-wizard/data
 * Get all wizard data
 */
router.get('/data', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;

    const wizardData = await onboardingWizardService.getWizardData(tenantId);

    res.status(200).json({
      success: true,
      data: wizardData,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch wizard data',
      },
    });
  }
});

export default router;
