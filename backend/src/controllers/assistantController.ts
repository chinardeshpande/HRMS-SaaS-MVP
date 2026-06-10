import { Request, Response } from 'express';
import assistantService from '../services/assistantService';

export class AssistantController {
  async ask(req: Request, res: Response) {
    try {
      const prompt = typeof req.body.prompt === 'string' ? req.body.prompt.trim() : '';

      if (!prompt) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'PROMPT_REQUIRED',
            message: 'Prompt is required.',
          },
        });
      }

      const response = await assistantService.ask(
        {
          prompt,
          pathname: typeof req.body.pathname === 'string' ? req.body.pathname : undefined,
          pageTitle: typeof req.body.pageTitle === 'string' ? req.body.pageTitle : undefined,
        },
        {
          tenantId: req.user!.tenantId,
          userId: req.user!.userId,
          role: req.user!.role,
          employeeId: req.user!.employeeId,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        }
      );

      return res.json({ success: true, data: response });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'ASSISTANT_QUERY_ERROR',
          message: error.message || 'Manu could not process this request.',
        },
      });
    }
  }

  async previewConfirmation(req: Request, res: Response) {
    try {
      const proposalId = typeof req.body.proposalId === 'string' ? req.body.proposalId.trim() : '';

      if (!proposalId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'PROPOSAL_ID_REQUIRED',
            message: 'Proposal id is required.',
          },
        });
      }

      const response = await assistantService.previewConfirmation(
        {
          proposalId,
          prompt: typeof req.body.prompt === 'string' ? req.body.prompt : undefined,
          pathname: typeof req.body.pathname === 'string' ? req.body.pathname : undefined,
          pageTitle: typeof req.body.pageTitle === 'string' ? req.body.pageTitle : undefined,
        },
        {
          tenantId: req.user!.tenantId,
          userId: req.user!.userId,
          role: req.user!.role,
          employeeId: req.user!.employeeId,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        }
      );

      return res.json({ success: true, data: response });
    } catch (error: any) {
      const isUnknownProposal = typeof error.message === 'string' && error.message.includes('Unknown Manu proposal');

      return res.status(isUnknownProposal ? 404 : 500).json({
        success: false,
        error: {
          code: isUnknownProposal ? 'UNKNOWN_PROPOSAL' : 'ASSISTANT_CONFIRMATION_PREVIEW_ERROR',
          message: error.message || 'Manu could not preview this confirmation.',
        },
      });
    }
  }

  async requestControlledExecution(req: Request, res: Response) {
    try {
      const proposalId = typeof req.body.proposalId === 'string' ? req.body.proposalId.trim() : '';

      if (!proposalId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'PROPOSAL_ID_REQUIRED',
            message: 'Proposal id is required.',
          },
        });
      }

      const response = await assistantService.requestControlledExecution(
        {
          proposalId,
          confirmationText: typeof req.body.confirmationText === 'string' ? req.body.confirmationText : undefined,
          prompt: typeof req.body.prompt === 'string' ? req.body.prompt : undefined,
          pathname: typeof req.body.pathname === 'string' ? req.body.pathname : undefined,
          pageTitle: typeof req.body.pageTitle === 'string' ? req.body.pageTitle : undefined,
        },
        {
          tenantId: req.user!.tenantId,
          userId: req.user!.userId,
          role: req.user!.role,
          employeeId: req.user!.employeeId,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        }
      );

      return res.json({ success: true, data: response });
    } catch (error: any) {
      const isUnknownProposal = typeof error.message === 'string' && error.message.includes('Unknown Manu proposal');

      return res.status(isUnknownProposal ? 404 : 500).json({
        success: false,
        error: {
          code: isUnknownProposal ? 'UNKNOWN_PROPOSAL' : 'ASSISTANT_CONTROLLED_EXECUTION_ERROR',
          message: error.message || 'Manu could not process this controlled execution request.',
        },
      });
    }
  }
}

export const assistantController = new AssistantController();
export default assistantController;
