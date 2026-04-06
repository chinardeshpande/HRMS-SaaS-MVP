import { Router, Request, Response } from 'express';
import registrationService from '../services/registrationService';
import { PlanType } from '../models/CompanyRegistration';

const router = Router();

/**
 * POST /api/v1/registration/signup
 * Initiate company signup
 */
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const {
      companyName,
      adminEmail,
      adminFullName,
      phone,
      industry,
      companySize,
      selectedPlan,
      utmSource,
      utmCampaign,
    } = req.body;

    // Validation
    if (!companyName || !adminEmail || !adminFullName) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Company name, admin email, and admin name are required',
        },
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminEmail)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid email address',
        },
      });
    }

    const result = await registrationService.initiateSignup({
      companyName,
      adminEmail,
      adminFullName,
      phone,
      industry,
      companySize,
      selectedPlan: selectedPlan as PlanType,
      utmSource,
      utmCampaign,
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        message: error.message || 'Signup failed',
      },
    });
  }
});

/**
 * POST /api/v1/registration/verify-email
 * Verify email with token
 */
router.post('/verify-email', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Verification token is required',
        },
      });
    }

    const result = await registrationService.verifyEmail(token);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        message: error.message || 'Email verification failed',
      },
    });
  }
});

/**
 * POST /api/v1/registration/complete
 * Complete registration - create tenant and admin user
 */
router.post('/complete', async (req: Request, res: Response) => {
  try {
    const { registrationId, password } = req.body;

    if (!registrationId || !password) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Registration ID and password are required',
        },
      });
    }

    // Password validation
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Password must be at least 8 characters long',
        },
      });
    }

    const result = await registrationService.completeRegistration(registrationId, password);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        message: error.message || 'Registration completion failed',
      },
    });
  }
});

/**
 * POST /api/v1/registration/resend-verification
 * Resend verification email
 */
router.post('/resend-verification', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Email is required',
        },
      });
    }

    const result = await registrationService.resendVerification(email);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        message: error.message || 'Failed to resend verification email',
      },
    });
  }
});

/**
 * GET /api/v1/registration/check-email/:email
 * Check if email is available
 */
router.get('/check-email/:email', async (req: Request, res: Response) => {
  try {
    const { email } = req.params;

    const result = await registrationService.checkEmailAvailability(email);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        message: error.message || 'Email check failed',
      },
    });
  }
});

/**
 * GET /api/v1/registration/plans
 * Get available subscription plans
 */
router.get('/plans', async (req: Request, res: Response) => {
  try {
    const plans = [
      {
        id: 'free',
        name: 'Free Trial',
        price: 0,
        duration: '14 days',
        features: [
          'Up to 10 employees',
          'Basic attendance tracking',
          'Leave management',
          'Basic reports',
        ],
      },
      {
        id: 'starter',
        name: 'Starter',
        price: 999,
        duration: 'per month',
        features: [
          'Up to 50 employees',
          'Full attendance tracking',
          'Leave management',
          'Performance reviews',
          'Advanced reports',
          'Email support',
        ],
      },
      {
        id: 'professional',
        name: 'Professional',
        price: 2499,
        duration: 'per month',
        features: [
          'Up to 200 employees',
          'All Starter features',
          'Onboarding management',
          'Exit management',
          'Custom workflows',
          'API access',
          'Priority support',
        ],
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        price: 'Custom',
        duration: 'contact sales',
        features: [
          'Unlimited employees',
          'All Professional features',
          'Dedicated account manager',
          'Custom integrations',
          'Advanced security',
          '24/7 support',
          'SLA guarantee',
        ],
      },
    ];

    res.status(200).json({
      success: true,
      data: plans,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch plans',
      },
    });
  }
});

export default router;
