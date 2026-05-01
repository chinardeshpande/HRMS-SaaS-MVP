import { Request, Response } from 'express';
import { paymentMethodService } from '../services/paymentMethodService';
import { CardBrand, PaymentMethod, PaymentMethodType } from '../models/PaymentMethod';

const allowedPaymentMethodUpdateFields: Array<keyof PaymentMethod> = [
  'nickname',
  'billingAddress',
  'billingCity',
  'billingState',
  'billingZip',
  'billingCountry',
  'metadata',
];

function pickPaymentMethodUpdates(body: Record<string, any>): Partial<PaymentMethod> {
  return allowedPaymentMethodUpdateFields.reduce((updates, field) => {
    if (body[field] !== undefined) {
      (updates as Record<string, any>)[field] = body[field];
    }

    return updates;
  }, {} as Partial<PaymentMethod>);
}

function normalizePaymentMethodInput(body: Record<string, any>): Partial<PaymentMethod> {
  const type = body.type as PaymentMethodType;

  if (!Object.values(PaymentMethodType).includes(type)) {
    throw new Error('A valid payment method type is required');
  }

  const payload: Partial<PaymentMethod> = {
    type,
    isDefault: Boolean(body.isDefault),
    nickname: body.nickname?.trim() || undefined,
    billingAddress: body.billingAddress?.trim() || undefined,
    billingCity: body.billingCity?.trim() || undefined,
    billingState: body.billingState?.trim() || undefined,
    billingZip: body.billingZip?.trim() || undefined,
    billingCountry: body.billingCountry?.trim() || undefined,
    metadata: body.metadata,
  };

  if (type === PaymentMethodType.CREDIT_CARD || type === PaymentMethodType.DEBIT_CARD) {
    const cardLast4 = String(body.cardLast4 || '').replace(/\D/g, '');
    const expiryMonth = String(body.expiryMonth || '').padStart(2, '0');
    const expiryYear = String(body.expiryYear || '');
    const cardBrand = body.cardBrand as CardBrand;

    if (!/^\d{4}$/.test(cardLast4)) {
      throw new Error('Card last four digits are required');
    }

    if (!Object.values(CardBrand).includes(cardBrand)) {
      throw new Error('A valid card brand is required');
    }

    if (!/^(0[1-9]|1[0-2])$/.test(expiryMonth) || !/^\d{4}$/.test(expiryYear)) {
      throw new Error('A valid card expiry month and year are required');
    }

    payload.cardLast4 = cardLast4;
    payload.cardBrand = cardBrand;
    payload.expiryMonth = expiryMonth;
    payload.expiryYear = expiryYear;
    payload.cardholderName = body.cardholderName?.trim() || undefined;
  }

  if (type === PaymentMethodType.BANK_ACCOUNT) {
    const accountLast4 = String(body.accountLast4 || '').replace(/\D/g, '');

    if (!body.bankName?.trim() || !/^\d{4}$/.test(accountLast4)) {
      throw new Error('Bank name and account last four digits are required');
    }

    payload.bankName = body.bankName.trim();
    payload.accountLast4 = accountLast4;
    payload.accountType = body.accountType;
    payload.routingNumber = body.routingNumber?.trim() || undefined;
  }

  if (type === PaymentMethodType.PAYPAL && !body.paypalEmail?.trim()) {
    throw new Error('PayPal email is required');
  }

  if (type === PaymentMethodType.PAYPAL) {
    payload.paypalEmail = body.paypalEmail.trim();
  }

  if (type === PaymentMethodType.STRIPE && !body.stripePaymentMethodId?.trim()) {
    throw new Error('Stripe payment method ID is required');
  }

  if (type === PaymentMethodType.STRIPE) {
    payload.stripePaymentMethodId = body.stripePaymentMethodId.trim();
    payload.stripeCustomerId = body.stripeCustomerId?.trim() || undefined;
  }

  return payload;
}

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
    const paymentMethodData = normalizePaymentMethodInput(req.body);

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
    res.status(error.message?.includes('required') || error.message?.includes('valid') ? 400 : 500).json({
      success: false,
      error: {
        code: error.message?.includes('required') || error.message?.includes('valid') ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

export const updatePaymentMethod = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req as any;
    const { paymentMethodId } = req.params;
    const updates = pickPaymentMethodUpdates(req.body);

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
