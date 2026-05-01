import { Router, Request, Response } from 'express';
import invitationService from '../services/invitationService';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../../../shared/types';

const router = Router();

/**
 * POST /api/v1/invitations/accept/:token
 * Accept invitation - PUBLIC ROUTE (no auth required)
 */
router.post('/accept/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Password is required',
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

    const result = await invitationService.acceptInvitation(token, password);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Invitation accepted successfully',
    });
  } catch (error: any) {
    res.status(error.statusCode || 400).json({
      success: false,
      error: {
        code: error.code,
        details: error.details,
        message: error.message || 'Failed to accept invitation',
      },
    });
  }
});

/**
 * GET /api/v1/invitations/verify/:token
 * Verify invitation token - PUBLIC ROUTE (no auth required)
 */
router.get('/verify/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const invitation = await invitationService.getInvitationByToken(token);

    res.status(200).json({
      success: true,
      data: {
        email: invitation.email,
        fullName: invitation.fullName,
        role: invitation.role,
        status: invitation.status,
        isValid: invitation.status === 'pending' && new Date() < invitation.tokenExpiry,
      },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        message: error.message || 'Failed to verify invitation',
      },
    });
  }
});

/**
 * All routes below require authentication
 */
router.use(authenticate);

/**
 * POST /api/v1/invitations
 * Send invitation to a user
 * Only Admin and HR can send invitations
 */
router.post(
  '/',
  authorize(UserRole.SYSTEM_ADMIN, UserRole.HR_ADMIN),
  async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;
      const invitedBy = req.user!.userId;
      const { email, fullName, role, departmentId } = req.body;

      // Validation
      if (!email || !fullName || !role) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Email, full name, and role are required',
          },
        });
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid email address',
          },
        });
      }

      const result = await invitationService.sendInvitation({
        tenantId,
        email,
        fullName,
        role,
        departmentId,
        invitedBy,
      });

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(error.statusCode || 400).json({
        success: false,
        error: {
          code: error.code,
          details: error.details,
          message: error.message || 'Failed to send invitation',
        },
      });
    }
  }
);

/**
 * GET /api/v1/invitations
 * Get all invitations for the tenant
 * Only Admin and HR can view invitations
 */
router.get(
  '/',
  authorize(UserRole.SYSTEM_ADMIN, UserRole.HR_ADMIN),
  async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;

      const invitations = await invitationService.getInvitations(tenantId);

      res.status(200).json({
        success: true,
        data: invitations,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          message: error.message || 'Failed to fetch invitations',
        },
      });
    }
  }
);

/**
 * DELETE /api/v1/invitations/:id
 * Cancel an invitation
 * Only Admin and HR can cancel invitations
 */
router.delete(
  '/:id',
  authorize(UserRole.SYSTEM_ADMIN, UserRole.HR_ADMIN),
  async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;

      const result = await invitationService.cancelInvitation(id, tenantId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          message: error.message || 'Failed to cancel invitation',
        },
      });
    }
  }
);

/**
 * POST /api/v1/invitations/resend/:id
 * Resend an invitation
 * Only Admin and HR can resend invitations
 */
router.post(
  '/resend/:id',
  authorize(UserRole.SYSTEM_ADMIN, UserRole.HR_ADMIN),
  async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;

      const result = await invitationService.resendInvitation(id, tenantId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          message: error.message || 'Failed to resend invitation',
        },
      });
    }
  }
);

/**
 * POST /api/v1/invitations/bulk
 * Bulk invite users
 * Only Admin and HR can bulk invite
 */
router.post(
  '/bulk',
  authorize(UserRole.SYSTEM_ADMIN, UserRole.HR_ADMIN),
  async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;
      const invitedBy = req.user!.userId;
      const { users } = req.body;

      if (!users || !Array.isArray(users) || users.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Users array is required and must not be empty',
          },
        });
      }

      const result = await invitationService.bulkInvite(tenantId, invitedBy, users);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          message: error.message || 'Failed to bulk invite users',
        },
      });
    }
  }
);

export default router;
