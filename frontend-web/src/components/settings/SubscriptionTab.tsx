import { useState, useEffect } from 'react';
import settingsService, { Subscription } from '../../services/settingsService';
import {
  CheckCircleIcon,
  SparklesIcon,
  ArrowUpCircleIcon,
  XCircleIcon,
  CreditCardIcon,
  UserGroupIcon,
  ServerIcon,
  CalendarIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

export default function SubscriptionTab() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      setError(null);
      const data = await settingsService.getSubscription();
      setSubscription(data);
    } catch (error: any) {
      console.error('Error loading subscription:', error);
      setError(error.response?.data?.error?.message || error.message || 'Failed to load subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (newPlan: Subscription['plan']) => {
    if (!confirm(`Are you sure you want to upgrade to ${newPlan.toUpperCase()} plan?`)) return;

    setUpgrading(true);
    try {
      await settingsService.upgradePlan(newPlan);
      await loadSubscription();
      alert('Plan upgraded successfully!');
    } catch (error) {
      console.error('Error upgrading plan:', error);
      alert('Failed to upgrade plan');
    } finally {
      setUpgrading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) return;

    try {
      await settingsService.cancelSubscription();
      await loadSubscription();
      alert('Subscription cancelled');
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert('Failed to cancel subscription');
    }
  };

  const handleChangeBillingCycle = async (newCycle: Subscription['billingCycle']) => {
    if (!subscription) return;
    if (!confirm(`Change billing cycle to ${newCycle}?`)) return;

    try {
      await settingsService.updateSubscription({ billingCycle: newCycle });
      await loadSubscription();
      alert('Billing cycle updated successfully!');
    } catch (error) {
      console.error('Error updating billing cycle:', error);
      alert('Failed to update billing cycle');
    }
  };

  const handleToggleAutoRenew = async () => {
    if (!subscription) return;

    try {
      await settingsService.updateSubscription({ autoRenew: !subscription.autoRenew });
      await loadSubscription();
      alert(`Auto-renew ${!subscription.autoRenew ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error toggling auto-renew:', error);
      alert('Failed to update auto-renew');
    }
  };

  const plans = [
    {
      name: 'Free',
      value: 'free' as const,
      price: 0,
      features: ['Up to 10 users', '5GB storage', 'Basic features', 'Community support'],
      color: 'gray',
    },
    {
      name: 'Starter',
      value: 'starter' as const,
      price: 29,
      features: ['Up to 50 users', '50GB storage', 'Advanced reporting', 'Email support'],
      color: 'blue',
    },
    {
      name: 'Professional',
      value: 'professional' as const,
      price: 99,
      features: ['Up to 200 users', '200GB storage', 'API access', 'Custom branding', 'Priority support'],
      color: 'purple',
      popular: true,
    },
    {
      name: 'Enterprise',
      value: 'enterprise' as const,
      price: 299,
      features: ['Unlimited users', '1TB storage', 'SSO integration', 'Dedicated support', 'SLA guarantee'],
      color: 'indigo',
    },
  ];

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; text: string }> = {
      active: { color: 'bg-green-100 text-green-800', text: 'Active' },
      trial: { color: 'bg-blue-100 text-blue-800', text: 'Trial' },
      expired: { color: 'bg-red-100 text-red-800', text: 'Expired' },
      cancelled: { color: 'bg-gray-100 text-gray-800', text: 'Cancelled' },
      suspended: { color: 'bg-yellow-100 text-yellow-800', text: 'Suspended' },
    };
    const badge = badges[status] || badges.active;
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>{badge.text}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <XCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-800">Error Loading Subscription</h4>
              <p className="text-sm text-red-700 mt-0.5">{error}</p>
              <button
                onClick={loadSubscription}
                className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No Subscription Message */}
      {!subscription && !error && (
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6 text-center">
          <SparklesIcon className="h-12 w-12 text-purple-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900 mb-1">No Active Subscription</h3>
          <p className="text-sm text-gray-600 mb-4">Choose a plan below to unlock all features</p>
        </div>
      )}

      {/* Current Subscription - Compact */}
      {subscription && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CreditCardIcon className="h-5 w-5 text-white" />
              <div>
                <h3 className="text-lg font-bold text-white">{subscription.plan.toUpperCase()} Plan</h3>
                <p className="text-xs text-purple-100">Your current subscription</p>
              </div>
            </div>
            {getStatusBadge(subscription.status)}
          </div>

          {/* Stats Grid - Compact */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-gray-50">
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-center space-x-2 mb-1">
                <UserGroupIcon className="h-4 w-4 text-purple-600" />
                <p className="text-xs text-gray-600">Users</p>
              </div>
              <p className="text-xl font-bold text-gray-900">
                {subscription.currentUsers}/{subscription.maxUsers}
              </p>
            </div>

            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-center space-x-2 mb-1">
                <ServerIcon className="h-4 w-4 text-blue-600" />
                <p className="text-xs text-gray-600">Storage</p>
              </div>
              <p className="text-xl font-bold text-gray-900">
                {Number(subscription.currentStorageGB).toFixed(1)}/{subscription.maxStorageGB}GB
              </p>
            </div>

            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-center space-x-2 mb-1">
                <CalendarIcon className="h-4 w-4 text-green-600" />
                <p className="text-xs text-gray-600">Billing</p>
              </div>
              <p className="text-xl font-bold text-gray-900 capitalize">{subscription.billingCycle}</p>
            </div>

            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-center space-x-2 mb-1">
                <CurrencyDollarIcon className="h-4 w-4 text-orange-600" />
                <p className="text-xs text-gray-600">Price</p>
              </div>
              <p className="text-xl font-bold text-gray-900">${Number(subscription.price).toFixed(0)}/mo</p>
            </div>
          </div>

          {/* Billing Settings - Compact Inline */}
          <div className="px-4 py-3 border-t border-gray-200 bg-white space-y-3">
            {subscription.nextBillingDate && (
              <div className="text-xs text-gray-600">
                Next billing: <span className="font-medium text-gray-900">{new Date(subscription.nextBillingDate).toLocaleDateString()}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Billing Cycle</label>
                  <p className="text-xs text-gray-500">Change frequency</p>
                </div>
                <select
                  value={subscription.billingCycle}
                  onChange={(e) => handleChangeBillingCycle(e.target.value as Subscription['billingCycle'])}
                  className="input text-sm w-32"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div className="flex items-center space-x-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Auto-Renew</label>
                  <p className="text-xs text-gray-500">Automatic renewal</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={subscription.autoRenew}
                    onChange={handleToggleAutoRenew}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Available Plans - Compact */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-3">Available Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => {
            const isCurrentPlan = subscription?.plan === plan.value;
            const colorClasses: Record<string, string> = {
              gray: 'from-gray-500 to-gray-600',
              blue: 'from-blue-500 to-blue-600',
              purple: 'from-purple-500 to-purple-600',
              indigo: 'from-indigo-500 to-indigo-600',
            };

            return (
              <div
                key={plan.value}
                className={`relative rounded-lg border-2 ${
                  isCurrentPlan ? 'border-purple-600 shadow-lg' : 'border-gray-200'
                } bg-white overflow-hidden transition-all hover:shadow-lg`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 z-10">
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-bl-lg">
                      POPULAR
                    </div>
                  </div>
                )}

                <div className={`bg-gradient-to-br ${colorClasses[plan.color]} p-4 text-white`}>
                  <h4 className="text-lg font-bold">{plan.name}</h4>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">${plan.price}</span>
                    <span className="text-sm text-white/80">/mo</span>
                  </div>
                </div>

                <div className="p-4">
                  <ul className="space-y-2 mb-4">
                    {plan.features.slice(0, 4).map((feature, idx) => (
                      <li key={idx} className="flex items-start space-x-2 text-xs">
                        <CheckCircleIcon className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {isCurrentPlan ? (
                    <button disabled className="w-full px-3 py-2 text-sm rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed">
                      Current Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(plan.value)}
                      disabled={upgrading}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors flex items-center justify-center space-x-1"
                    >
                      {upgrading ? (
                        'Upgrading...'
                      ) : (
                        <>
                          <ArrowUpCircleIcon className="h-4 w-4" />
                          <span>Upgrade</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Danger Zone - Compact */}
      {subscription && subscription.status === 'active' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-red-900">Cancel Subscription</h3>
              <p className="text-xs text-red-700 mt-0.5">
                You will lose access at the end of your billing period
              </p>
            </div>
            <button
              onClick={handleCancelSubscription}
              className="px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors whitespace-nowrap"
            >
              Cancel Subscription
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
