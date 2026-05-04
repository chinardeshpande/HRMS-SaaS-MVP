import { Request, Response } from 'express';
import { createDemoSession, demoPersonas, DEMO_PASSWORD } from '../services/demoService';

export const getDemoPersonas = async (_req: Request, res: Response) => {
  return res.json({
    success: true,
    data: {
      password: DEMO_PASSWORD,
      personas: demoPersonas,
    },
  });
};

export const startDemoSession = async (req: Request, res: Response) => {
  try {
    const session = await createDemoSession(req.body?.persona);

    return res.json({
      success: true,
      data: session,
    });
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({
      success: false,
      error: {
        code: error.code || 'DEMO_SESSION_ERROR',
        message: error.message || 'Unable to start demo session',
      },
    });
  }
};

export const switchToDemoSession = async (req: Request, res: Response) => {
  try {
    const session = await createDemoSession(req.body?.persona);

    return res.json({
      success: true,
      data: session,
    });
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({
      success: false,
      error: {
        code: error.code || 'DEMO_SWITCH_ERROR',
        message: error.message || 'Unable to switch to demo mode',
      },
    });
  }
};

export default {
  getDemoPersonas,
  startDemoSession,
  switchToDemoSession,
};
