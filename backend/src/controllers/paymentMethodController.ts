import { Request, Response } from 'express';
import { paymentMethodService } from '../services/paymentMethodService';

export const getAllPaymentMethods = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as any;

    const paymentMethods = await paymentMethodService.getAllPaymentMethods(tenantId);

    res.status(200).json({
      success: true,
      data: paymentMethods,
    });
  } catch (error: any) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const getDefaultPaymentMethod = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as any;

    const paymentMethod = await paymentMethodService.getDefaultPaymentMethod(tenantId);

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'No default payment method found',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: paymentMethod,
    });
  } catch (error: any) {
    console.error('Error fetching default payment method:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const createPaymentMethod = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as any;
    const paymentMethodData = req.body;

    const paymentMethod = await paymentMethodService.createPaymentMethod({
      tenantId,
      ...paymentMethodData,
    });

    res.status(201).json({
      success: true,
      data: paymentMethod,
    });
  } catch (error: any) {
    console.error('Error creating payment method:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const updatePaymentMethod = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as any;
    const { paymentMethodId } = req.params;
    const updates = req.body;

    const paymentMethod = await paymentMethodService.updatePaymentMethod(
      paymentMethodId,
      tenantId,
      updates
    );

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Payment method not found',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: paymentMethod,
    });
  } catch (error: any) {
    console.error('Error updating payment method:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const deletePaymentMethod = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as any;
    const { paymentMethodId } = req.params;

    const deleted = await paymentMethodService.deletePaymentMethod(paymentMethodId, tenantId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Payment method not found',
        },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payment method deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting payment method:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const setDefaultPaymentMethod = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as any;
    const { paymentMethodId } = req.params;

    const paymentMethod = await paymentMethodService.setDefaultPaymentMethod(
      paymentMethodId,
      tenantId
    );

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Payment method not found',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: paymentMethod,
    });
  } catch (error: any) {
    console.error('Error setting default payment method:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const processPayment = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as any;
    const { paymentMethodId, amount, currency, description, metadata } = req.body;

    if (!paymentMethodId || !amount || !currency) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Payment method ID, amount, and currency are required',
        },
      });
    }

    const result = await paymentMethodService.processPayment({
      tenantId,
      paymentMethodId,
      amount,
      currency,
      description,
      metadata,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'PAYMENT_FAILED',
          message: result.error || 'Payment processing failed',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        transactionId: result.transactionId,
        amount,
        currency,
      },
    });
  } catch (error: any) {
    console.error('Error processing payment:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};
