import { useState } from 'react';
import {
  CreditCardIcon,
  BanknotesIcon,
  XMarkIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import paymentMethodService, { PaymentMethod } from '../../services/paymentMethodService';

interface AddPaymentMethodWizardProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddPaymentMethodWizard({
  onClose,
  onSuccess,
}: AddPaymentMethodWizardProps) {
  const [step, setStep] = useState(1);
  const [paymentType, setPaymentType] = useState<'credit_card' | 'debit_card' | 'bank_account'>(
    'credit_card'
  );
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    nickname: '',
    isDefault: false,

    // Card fields
    cardNumber: '',
    cardholderName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardBrand: '',

    // Bank fields
    bankName: '',
    accountNumber: '',
    routingNumber: '',
    accountType: 'checking' as 'checking' | 'savings',

    // Billing address
    billingAddress: '',
    billingCity: '',
    billingState: '',
    billingZip: '',
    billingCountry: 'United States',
  });

  const detectCardBrand = (cardNumber: string): string => {
    const cleaned = cardNumber.replace(/\s/g, '');
    if (/^4/.test(cleaned)) return 'visa';
    if (/^5[1-5]/.test(cleaned)) return 'mastercard';
    if (/^3[47]/.test(cleaned)) return 'amex';
    if (/^6(?:011|5)/.test(cleaned)) return 'discover';
    return '';
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const chunks = cleaned.match(/.{1,4}/g) || [];
    return chunks.join(' ').substr(0, 19);
  };

  const handleCardNumberChange = (value: string) => {
    const formatted = formatCardNumber(value);
    const brand = detectCardBrand(value);
    setFormData({ ...formData, cardNumber: formatted, cardBrand: brand });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload: Partial<PaymentMethod> = {
        type: paymentType,
        nickname: formData.nickname,
        isDefault: formData.isDefault,
        billingAddress: formData.billingAddress,
        billingCity: formData.billingCity,
        billingState: formData.billingState,
        billingZip: formData.billingZip,
        billingCountry: formData.billingCountry,
      };

      if (paymentType === 'credit_card' || paymentType === 'debit_card') {
        // In production, you would tokenize this with Stripe/PayPal
        // NEVER send raw card numbers to your backend
        payload.cardLast4 = formData.cardNumber.replace(/\s/g, '').slice(-4);
        payload.cardBrand = formData.cardBrand as any;
        payload.cardholderName = formData.cardholderName;
        payload.expiryMonth = formData.expiryMonth;
        payload.expiryYear = formData.expiryYear;
        // CVV should NEVER be stored
      } else if (paymentType === 'bank_account') {
        payload.bankName = formData.bankName;
        payload.accountLast4 = formData.accountNumber.slice(-4);
        payload.accountType = formData.accountType;
        payload.routingNumber = formData.routingNumber;
      }

      await paymentMethodService.createPaymentMethod(payload);
      alert('Payment method added successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding payment method:', error);
      alert('Failed to add payment method');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />
        <div className="relative w-full max-w-2xl transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all">
          {/* Header */}
          <div className="border-b border-gray-200 bg-gradient-to-r from-purple-600 to-indigo-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Add Payment Method</h2>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            {/* Progress Steps */}
            <div className="mt-4 flex items-center space-x-2">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex-1">
                  <div
                    className={`h-2 rounded-full ${
                      step >= s ? 'bg-white' : 'bg-white/30'
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* Step 1: Choose Payment Type */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Choose Payment Method Type
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => setPaymentType('credit_card')}
                      className={`p-6 border-2 rounded-lg transition-all ${
                        paymentType === 'credit_card'
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <CreditCardIcon className="h-12 w-12 text-purple-600 mx-auto mb-3" />
                      <p className="font-semibold text-gray-900">Credit Card</p>
                      <p className="text-sm text-gray-500 mt-1">Visa, Mastercard, Amex</p>
                    </button>

                    <button
                      onClick={() => setPaymentType('bank_account')}
                      className={`p-6 border-2 rounded-lg transition-all ${
                        paymentType === 'bank_account'
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <BanknotesIcon className="h-12 w-12 text-purple-600 mx-auto mb-3" />
                      <p className="font-semibold text-gray-900">Bank Account</p>
                      <p className="text-sm text-gray-500 mt-1">ACH Direct Debit</p>
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button onClick={() => setStep(2)} className="btn btn-primary">
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Payment Details */}
            {step === 2 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {paymentType === 'bank_account' ? 'Bank Account' : 'Card'} Details
                </h3>

                {(paymentType === 'credit_card' || paymentType === 'debit_card') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Card Number *
                      </label>
                      <input
                        type="text"
                        value={formData.cardNumber}
                        onChange={(e) => handleCardNumberChange(e.target.value)}
                        maxLength={19}
                        className="input w-full"
                        placeholder="1234 5678 9012 3456"
                      />
                      {formData.cardBrand && (
                        <p className="text-sm text-green-600 mt-1 capitalize">
                          {formData.cardBrand} detected
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cardholder Name *
                      </label>
                      <input
                        type="text"
                        value={formData.cardholderName}
                        onChange={(e) =>
                          setFormData({ ...formData, cardholderName: e.target.value })
                        }
                        className="input w-full"
                        placeholder="John Doe"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Month *
                        </label>
                        <input
                          type="text"
                          value={formData.expiryMonth}
                          onChange={(e) =>
                            setFormData({ ...formData, expiryMonth: e.target.value })
                          }
                          maxLength={2}
                          className="input w-full"
                          placeholder="MM"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Year *
                        </label>
                        <input
                          type="text"
                          value={formData.expiryYear}
                          onChange={(e) =>
                            setFormData({ ...formData, expiryYear: e.target.value })
                          }
                          maxLength={4}
                          className="input w-full"
                          placeholder="YYYY"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          CVV *
                        </label>
                        <input
                          type="text"
                          value={formData.cvv}
                          onChange={(e) => setFormData({ ...formData, cvv: e.target.value })}
                          maxLength={4}
                          className="input w-full"
                          placeholder="123"
                        />
                      </div>
                    </div>
                  </>
                )}

                {paymentType === 'bank_account' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bank Name *
                      </label>
                      <input
                        type="text"
                        value={formData.bankName}
                        onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                        className="input w-full"
                        placeholder="Bank of America"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Account Type *
                      </label>
                      <select
                        value={formData.accountType}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            accountType: e.target.value as 'checking' | 'savings',
                          })
                        }
                        className="input w-full"
                      >
                        <option value="checking">Checking</option>
                        <option value="savings">Savings</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Routing Number *
                      </label>
                      <input
                        type="text"
                        value={formData.routingNumber}
                        onChange={(e) =>
                          setFormData({ ...formData, routingNumber: e.target.value })
                        }
                        maxLength={9}
                        className="input w-full"
                        placeholder="123456789"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Account Number *
                      </label>
                      <input
                        type="text"
                        value={formData.accountNumber}
                        onChange={(e) =>
                          setFormData({ ...formData, accountNumber: e.target.value })
                        }
                        className="input w-full"
                        placeholder="1234567890"
                      />
                    </div>
                  </>
                )}

                <div className="flex justify-between pt-4">
                  <button onClick={() => setStep(1)} className="btn btn-secondary">
                    Back
                  </button>
                  <button onClick={() => setStep(3)} className="btn btn-primary">
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Billing Address */}
            {step === 3 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Billing Address</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nickname (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.nickname}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    className="input w-full"
                    placeholder="e.g., Personal Visa, Work Account"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    value={formData.billingAddress}
                    onChange={(e) =>
                      setFormData({ ...formData, billingAddress: e.target.value })
                    }
                    className="input w-full"
                    placeholder="123 Main Street"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      value={formData.billingCity}
                      onChange={(e) =>
                        setFormData({ ...formData, billingCity: e.target.value })
                      }
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      value={formData.billingState}
                      onChange={(e) =>
                        setFormData({ ...formData, billingState: e.target.value })
                      }
                      className="input w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ZIP Code *
                    </label>
                    <input
                      type="text"
                      value={formData.billingZip}
                      onChange={(e) =>
                        setFormData({ ...formData, billingZip: e.target.value })
                      }
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country *
                    </label>
                    <input
                      type="text"
                      value={formData.billingCountry}
                      onChange={(e) =>
                        setFormData({ ...formData, billingCountry: e.target.value })
                      }
                      className="input w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.isDefault}
                      onChange={(e) =>
                        setFormData({ ...formData, isDefault: e.target.checked })
                      }
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Set as default payment method</span>
                  </label>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircleIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">Secure Payment Processing</p>
                      <p className="mt-1">
                        Your payment information is encrypted and secure. We use industry-standard
                        security measures to protect your data.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button onClick={() => setStep(2)} className="btn btn-secondary">
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="btn btn-primary"
                  >
                    {loading ? 'Adding...' : 'Add Payment Method'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
