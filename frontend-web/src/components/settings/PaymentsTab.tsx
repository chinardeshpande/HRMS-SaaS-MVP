import { useState, useEffect } from 'react';
import settingsService, { PaymentHistory } from '../../services/settingsService';
import paymentMethodService, { PaymentMethod } from '../../services/paymentMethodService';
import AddPaymentMethodWizard from './AddPaymentMethodWizard';
import {
  CreditCardIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PlusIcon,
  TrashIcon,
  StarIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

type PaymentTabView = 'methods' | 'history';

export default function PaymentsTab() {
  const [activeView, setActiveView] = useState<PaymentTabView>('methods');

  // Payment Methods State
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [methodsLoading, setMethodsLoading] = useState(true);
  const [showAddMethodWizard, setShowAddMethodWizard] = useState(false);

  // Payment History State
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (activeView === 'methods') {
      loadPaymentMethods();
    } else {
      loadPayments();
    }
  }, [activeView, statusFilter]);

  const loadPaymentMethods = async () => {
    setMethodsLoading(true);
    try {
      const data = await paymentMethodService.getAllPaymentMethods();
      setPaymentMethods(data);
    } catch (error) {
      console.error('Error loading payment methods:', error);
    } finally {
      setMethodsLoading(false);
    }
  };

  const loadPayments = async () => {
    setHistoryLoading(true);
    try {
      const data = await settingsService.getAllPayments({
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      setPayments(data.payments);
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    try {
      await paymentMethodService.setDefaultPaymentMethod(paymentMethodId);
      await loadPaymentMethods();
      alert('Default payment method updated!');
    } catch (error) {
      console.error('Error setting default:', error);
      alert('Failed to update default payment method');
    }
  };

  const handleDeleteMethod = async (paymentMethodId: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return;

    try {
      await paymentMethodService.deletePaymentMethod(paymentMethodId);
      await loadPaymentMethods();
      alert('Payment method deleted successfully!');
    } catch (error) {
      console.error('Error deleting payment method:', error);
      alert('Failed to delete payment method');
    }
  };

  const getCardIcon = (brand?: string) => {
    // You can add card brand specific icons here
    return <CreditCardIcon className="h-8 w-8" />;
  };

  const getBankIcon = () => {
    return <BanknotesIcon className="h-8 w-8" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'failed':
      case 'cancelled':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return badges[status] || badges.pending;
  };

  return (
    <div className="space-y-6">
      {/* Header with View Switcher */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Billing & Payments</h3>
          {activeView === 'methods' && (
            <button
              onClick={() => setShowAddMethodWizard(true)}
              className="btn btn-primary flex items-center space-x-2"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Add Payment Method</span>
            </button>
          )}
        </div>

        {/* View Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveView('methods')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeView === 'methods'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Payment Methods
            </button>
            <button
              onClick={() => setActiveView('history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeView === 'history'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Payment History
            </button>
          </nav>
        </div>
      </div>

      {/* Payment Methods View */}
      {activeView === 'methods' && (
        <div>
          {methodsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-purple-600"></div>
            </div>
          ) : paymentMethods.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <CreditCardIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No payment methods added yet</p>
              <button
                onClick={() => setShowAddMethodWizard(true)}
                className="btn btn-primary"
              >
                Add Your First Payment Method
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paymentMethods.map((method) => (
                <div
                  key={method.paymentMethodId}
                  className={`border-2 rounded-lg p-6 relative ${
                    method.isDefault
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  {method.isDefault && (
                    <div className="absolute top-3 right-3">
                      <StarIconSolid className="h-6 w-6 text-purple-600" />
                    </div>
                  )}

                  <div className="flex items-start space-x-4">
                    <div className="text-purple-600">
                      {method.type === 'bank_account' ? getBankIcon() : getCardIcon(method.cardBrand)}
                    </div>
                    <div className="flex-1">
                      {method.type === 'bank_account' ? (
                        <>
                          <p className="font-semibold text-gray-900">{method.bankName}</p>
                          <p className="text-sm text-gray-600 capitalize">
                            {method.accountType} ••••{method.accountLast4}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-semibold text-gray-900 capitalize">
                            {method.cardBrand || 'Card'} ••••{method.cardLast4}
                          </p>
                          <p className="text-sm text-gray-600">
                            Expires {method.expiryMonth}/{method.expiryYear}
                          </p>
                        </>
                      )}
                      {method.nickname && (
                        <p className="text-xs text-gray-500 mt-1">{method.nickname}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    {!method.isDefault && (
                      <button
                        onClick={() => handleSetDefault(method.paymentMethodId)}
                        className="text-sm text-purple-600 hover:text-purple-800 flex items-center space-x-1"
                      >
                        <StarIcon className="h-4 w-4" />
                        <span>Set as Default</span>
                      </button>
                    )}
                    {method.isDefault && (
                      <span className="text-sm text-purple-600 font-medium">Default</span>
                    )}
                    <button
                      onClick={() => handleDeleteMethod(method.paymentMethodId)}
                      className="text-sm text-red-600 hover:text-red-800 flex items-center space-x-1"
                    >
                      <TrashIcon className="h-4 w-4" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Payment History View */}
      {activeView === 'history' && (
        <div className="space-y-6">
          {/* Filter */}
          <div className="flex items-center space-x-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="all">All Payments</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          {/* Payments Table */}
          <div className="card">
            <div className="card-body p-0">
              {historyLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-purple-600"></div>
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCardIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No payment history found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Invoice
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {payments.map((payment) => (
                        <tr key={payment.paymentId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getStatusIcon(payment.status)}
                              <span className="ml-2 text-sm font-medium text-gray-900">
                                {payment.invoiceNumber}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(payment.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {payment.description || 'Subscription payment'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(payment.billingPeriodStart).toLocaleDateString()} -{' '}
                              {new Date(payment.billingPeriodEnd).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {payment.currency} {Number(payment.totalAmount).toFixed(2)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                                payment.status
                              )}`}
                            >
                              {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {payment.invoiceUrl && (
                              <a
                                href={payment.invoiceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-purple-600 hover:text-purple-900 flex items-center space-x-1"
                              >
                                <DocumentArrowDownIcon className="h-4 w-4" />
                                <span>Invoice</span>
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card">
              <div className="card-body">
                <p className="text-sm text-gray-600">Total Paid</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  $
                  {payments
                    .filter((p) => p.status === 'completed')
                    .reduce((sum, p) => sum + Number(p.totalAmount), 0)
                    .toFixed(2)}
                </p>
              </div>
            </div>
            <div className="card">
              <div className="card-body">
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">
                  $
                  {payments
                    .filter((p) => p.status === 'pending')
                    .reduce((sum, p) => sum + Number(p.totalAmount), 0)
                    .toFixed(2)}
                </p>
              </div>
            </div>
            <div className="card">
              <div className="card-body">
                <p className="text-sm text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  $
                  {payments
                    .filter((p) => p.status === 'failed')
                    .reduce((sum, p) => sum + Number(p.totalAmount), 0)
                    .toFixed(2)}
                </p>
              </div>
            </div>
            <div className="card">
              <div className="card-body">
                <p className="text-sm text-gray-600">Total Invoices</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{payments.length}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Method Wizard */}
      {showAddMethodWizard && (
        <AddPaymentMethodWizard
          onClose={() => setShowAddMethodWizard(false)}
          onSuccess={loadPaymentMethods}
        />
      )}
    </div>
  );
}
