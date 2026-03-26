import api from './api';

export interface PaymentMethod {
  paymentMethodId: string;
  tenantId: string;
  type: 'credit_card' | 'debit_card' | 'bank_account' | 'paypal' | 'stripe';
  isDefault: boolean;
  isActive: boolean;

  // Card details
  cardLast4?: string;
  cardBrand?: 'visa' | 'mastercard' | 'amex' | 'discover' | 'diners' | 'jcb' | 'unionpay';
  expiryMonth?: string;
  expiryYear?: string;
  cardholderName?: string;

  // Bank account details
  bankName?: string;
  accountLast4?: string;
  accountType?: string;
  routingNumber?: string;

  // Billing address
  billingAddress?: string;
  billingCity?: string;
  billingState?: string;
  billingZip?: string;
  billingCountry?: string;

  // Payment gateway integration
  stripePaymentMethodId?: string;
  stripeCustomerId?: string;
  paypalEmail?: string;

  metadata?: Record<string, any>;
  nickname?: string;

  createdAt: string;
  updatedAt: string;
}

class PaymentMethodService {
  async getAllPaymentMethods(): Promise<PaymentMethod[]> {
    const response = await api.get('/payment-methods');
    return response.data;
  }

  async getDefaultPaymentMethod(): Promise<PaymentMethod> {
    const response = await api.get('/payment-methods/default');
    return response.data;
  }

  async createPaymentMethod(data: Partial<PaymentMethod>): Promise<PaymentMethod> {
    const response = await api.post('/payment-methods', data);
    return response.data;
  }

  async updatePaymentMethod(
    paymentMethodId: string,
    data: Partial<PaymentMethod>
  ): Promise<PaymentMethod> {
    const response = await api.put(`/payment-methods/${paymentMethodId}`, data);
    return response.data;
  }

  async deletePaymentMethod(paymentMethodId: string): Promise<void> {
    await api.delete(`/payment-methods/${paymentMethodId}`);
  }

  async setDefaultPaymentMethod(paymentMethodId: string): Promise<PaymentMethod> {
    const response = await api.post(`/payment-methods/${paymentMethodId}/set-default`);
    return response.data;
  }

  async processPayment(data: {
    paymentMethodId: string;
    amount: number;
    currency: string;
    description?: string;
    metadata?: Record<string, any>;
  }): Promise<{ transactionId: string; amount: number; currency: string }> {
    const response = await api.post('/payment-methods/process', data);
    return response.data;
  }
}

export default new PaymentMethodService();
