import { AppDataSource } from '../config/database';
import { PaymentMethod, PaymentMethodType } from '../models/PaymentMethod';

export class PaymentMethodService {
  private static instance: PaymentMethodService;
  private paymentMethodRepo = AppDataSource.getRepository(PaymentMethod);

  private constructor() {}

  public static getInstance(): PaymentMethodService {
    if (!PaymentMethodService.instance) {
      PaymentMethodService.instance = new PaymentMethodService();
    }
    return PaymentMethodService.instance;
  }

  // Get all payment methods for a tenant
  async getAllPaymentMethods(tenantId: string): Promise<PaymentMethod[]> {
    return await this.paymentMethodRepo.find({
      where: { tenantId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  // Get default payment method
  async getDefaultPaymentMethod(tenantId: string): Promise<PaymentMethod | null> {
    return await this.paymentMethodRepo.findOne({
      where: { tenantId, isDefault: true, isActive: true },
    });
  }

  // Create payment method
  async createPaymentMethod(data: Partial<PaymentMethod>): Promise<PaymentMethod> {
    // If this is set as default, unset other defaults
    if (data.isDefault) {
      await this.paymentMethodRepo.update(
        { tenantId: data.tenantId!, isDefault: true },
        { isDefault: false }
      );
    }

    const paymentMethod = this.paymentMethodRepo.create(data);
    return await this.paymentMethodRepo.save(paymentMethod);
  }

  // Update payment method
  async updatePaymentMethod(
    paymentMethodId: string,
    tenantId: string,
    updates: Partial<PaymentMethod>
  ): Promise<PaymentMethod | null> {
    const paymentMethod = await this.paymentMethodRepo.findOne({
      where: { paymentMethodId, tenantId },
    });

    if (!paymentMethod) return null;

    // If setting as default, unset other defaults
    if (updates.isDefault && !paymentMethod.isDefault) {
      await this.paymentMethodRepo.update(
        { tenantId, isDefault: true },
        { isDefault: false }
      );
    }

    Object.assign(paymentMethod, updates);
    return await this.paymentMethodRepo.save(paymentMethod);
  }

  // Delete payment method
  async deletePaymentMethod(paymentMethodId: string, tenantId: string): Promise<boolean> {
    const result = await this.paymentMethodRepo.delete({ paymentMethodId, tenantId });
    return (result.affected ?? 0) > 0;
  }

  // Set as default
  async setDefaultPaymentMethod(paymentMethodId: string, tenantId: string): Promise<PaymentMethod | null> {
    // Unset all defaults first
    await this.paymentMethodRepo.update(
      { tenantId, isDefault: true },
      { isDefault: false }
    );

    // Set the new default
    const paymentMethod = await this.paymentMethodRepo.findOne({
      where: { paymentMethodId, tenantId },
    });

    if (!paymentMethod) return null;

    paymentMethod.isDefault = true;
    return await this.paymentMethodRepo.save(paymentMethod);
  }

  // Process payment using a payment method
  async processPayment(data: {
    tenantId: string;
    paymentMethodId: string;
    amount: number;
    currency: string;
    description?: string;
    metadata?: Record<string, any>;
  }): Promise<{
    success: boolean;
    transactionId?: string;
    error?: string;
  }> {
    const paymentMethod = await this.paymentMethodRepo.findOne({
      where: { paymentMethodId: data.paymentMethodId, tenantId: data.tenantId },
    });

    if (!paymentMethod || !paymentMethod.isActive) {
      return { success: false, error: 'Payment method not found or inactive' };
    }

    // TODO: Integrate with actual payment gateway (Stripe, PayPal, etc.)
    // This is a placeholder for payment processing logic

    if (paymentMethod.stripePaymentMethodId) {
      // Process with Stripe
      // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      // const paymentIntent = await stripe.paymentIntents.create({
      //   amount: data.amount * 100, // Stripe uses cents
      //   currency: data.currency,
      //   payment_method: paymentMethod.stripePaymentMethodId,
      //   customer: paymentMethod.stripeCustomerId,
      //   confirm: true,
      //   description: data.description,
      //   metadata: data.metadata,
      // });
      // return { success: true, transactionId: paymentIntent.id };
    }

    // For now, return success with a mock transaction ID
    return {
      success: true,
      transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }
}

export const paymentMethodService = PaymentMethodService.getInstance();
