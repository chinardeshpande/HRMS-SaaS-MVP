import { Request, Response } from 'express';
import assistantService from '../services/assistantService';
import { ManuConversationTurn, ManuScreenContext } from '../assistant/types';

const cleanText = (value: unknown, max = 200) =>
  typeof value === 'string' ? value.trim().slice(0, max) : undefined;

const cleanRecord = (value: unknown, maxEntries = 12) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .slice(0, maxEntries)
      .map(([key, item]) => [key.slice(0, 80), cleanText(item, 160) || ''])
  );
};

const parseScreenContext = (value: unknown): ManuScreenContext | undefined => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const screen = value as Record<string, unknown>;
  const selectedEntity = screen.selectedEntity && typeof screen.selectedEntity === 'object'
    ? screen.selectedEntity as Record<string, unknown>
    : undefined;

  return {
    pathname: cleanText(screen.pathname, 300),
    pageTitle: cleanText(screen.pageTitle, 160),
    routeParams: cleanRecord(screen.routeParams),
    query: cleanRecord(screen.query),
    activeTab: cleanText(screen.activeTab, 120),
    selectedEntity: selectedEntity
      ? {
          type: cleanText(selectedEntity.type, 80) || 'record',
          id: cleanText(selectedEntity.id, 160),
          label: cleanText(selectedEntity.label, 160),
        }
      : undefined,
    visibleSections: Array.isArray(screen.visibleSections)
      ? screen.visibleSections.map((item) => cleanText(item, 120)).filter(Boolean).slice(0, 12) as string[]
      : undefined,
    visibleColumns: Array.isArray(screen.visibleColumns)
      ? screen.visibleColumns.map((item) => cleanText(item, 120)).filter(Boolean).slice(0, 16) as string[]
      : undefined,
  };
};

const parseConversation = (value: unknown): ManuConversationTurn[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((turn) => {
      if (!turn || typeof turn !== 'object') return null;
      const record = turn as Record<string, unknown>;
      const role = record.role === 'assistant' ? 'assistant' : record.role === 'user' ? 'user' : null;
      const content = cleanText(record.content, 1200);
      return role && content ? { role, content } : null;
    })
    .filter(Boolean)
    .slice(-8) as ManuConversationTurn[];
};

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
          context: {
            screen: parseScreenContext(req.body.context?.screen),
            conversation: parseConversation(req.body.context?.conversation),
          },
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
