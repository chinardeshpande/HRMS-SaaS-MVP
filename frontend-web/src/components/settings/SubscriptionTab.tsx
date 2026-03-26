import { useState, useEffect } from 'react';
import settingsService, { Subscription } from '../../services/settingsService';
import {
  CheckCircleIcon,
  SparklesIcon,
  ArrowUpCircleIcon,
  XCircleIcon,
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
      features: ['Up to 200 users', '200GB storage', 'API access', 'Custom branding', 'Priority support', 'AI insights'],
      color: 'purple',
      popular: true,
    },
    {
      name: 'Enterprise',
      value: 'enterprise' as const,
      price: 299,
      features: ['Unlimited users', '1TB storage', 'SSO integration', 'Dedicated support', 'Custom workflows', 'SLA guarantee'],
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
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <XCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-800">Error Loading Subscription</h4>
              <p className="text-sm text-red-700 mt-1">{error}</p>
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
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-8 text-center">
          <SparklesIcon className="h-16 w-16 text-purple-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Active Subscription</h3>
          <p className="text-gray-600 mb-6">Get started by choosing a plan below to unlock all features</p>
          <div className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium">
            <ArrowUpCircleIcon className="h-5 w-5 mr-2" />
            Select a plan to get started
          </div>
        </div>
      )}

      {/* Current Subscription */}
      {subscription && (
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-6 text-white">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold">{subscription.plan.toUpperCase()} Plan</h3>
              <p className="text-purple-100 mt-1">Your current subscription</p>
            </div>
            {getStatusBadge(subscription.status)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <p className="text-purple-100 text-sm">Users</p>
              <p className="text-2xl font-bold mt-1">
                {subscription.currentUsers}/{subscription.maxUsers}
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <p className="text-purple-100 text-sm">Storage</p>
              <p className="text-2xl font-bold mt-1">
                {Number(subscription.currentStorageGB).toFixed(1)}/{subscription.maxStorageGB}GB
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <p className="text-purple-100 text-sm">Billing Cycle</p>
              <p className="text-2xl font-bold mt-1 capitalize">{subscription.billingCycle}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <p className="text-purple-100 text-sm">Price</p>
              <p className="text-2xl font-bold mt-1">${Number(subscription.price).toFixed(2)}/mo</p>
            </div>
          </div>

          {subscription.nextBillingDate && (
            <div className="mt-4 text-sm text-purple-100">
              Next billing date: {new Date(subscription.nextBillingDate).toLocaleDateString()}
            </div>
          )}

          {/* Billing Settings */}
          <div className="mt-6 pt-6 border-t border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Billing Cycle</p>
                <p className="text-xs text-purple-100 mt-1">Change how often you're billed</p>
              </div>
              <select
                value={subscription.billingCycle}
                onChange={(e) => handleChangeBillingCycle(e.target.value as Subscription['billingCycle'])}
                className="input text-sm bg-white/10 text-white border-white/20"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div>
                <p className="text-sm font-medium text-white">Auto-Renew</p>
                <p className="text-xs text-purple-100 mt-1">Automatically renew subscription</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={subscription.autoRenew}
                  onChange={handleToggleAutoRenew}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/20 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-white/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white/40"></div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Available Plans */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                className={`relative rounded-xl border-2 ${
                  isCurrentPlan ? 'border-purple-600 shadow-lg' : 'border-gray-200'
                } bg-white overflow-hidden transition-all hover:shadow-xl`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0">
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                      POPULAR
                    </div>
                  </div>
                )}

                <div className={`bg-gradient-to-br ${colorClasses[plan.color]} p-6 text-white`}>
                  <h4 className="text-xl font-bold">{plan.name}</h4>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-white/80">/month</span>
                  </div>
                </div>

                <div className="p-6">
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start space-x-2 text-sm">
                        <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {isCurrentPlan ? (
                    <button disabled className="btn btn-secondary w-full cursor-not-allowed">
                      Current Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(plan.value)}
                      disabled={upgrading}
                      className="btn btn-primary w-full"
                    >
                      {upgrading ? (
                        'Upgrading...'
                      ) : (
                        <>
                          <ArrowUpCircleIcon className="h-5 w-5 mr-2" />
                          Upgrade
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

      {/* Features Comparison */}
      {subscription && subscription.features && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Your Features</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(subscription.features).map(([key, enabled]) => (
                <div key={key} className="flex items-center space-x-2">
                  {enabled ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircleIcon className="h-5 w-5 text-gray-300" />
                  )}
                  <span className={`text-sm ${enabled ? 'text-gray-900' : 'text-gray-400'}`}>
                    {key
                      .replace(/([A-Z])/g, ' $1')
                      .trim()
                      .split(' ')
                      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      {subscription && subscription.status === 'active' && (
        <div className="card border-red-200 bg-red-50">
          <div className="card-body">
            <h3 className="text-lg font-semibold text-red-900 mb-2">Danger Zone</h3>
            <p className="text-sm text-red-700 mb-4">
              Cancel your subscription. You will lose access at the end of your billing period.
            </p>
            <button onClick={handleCancelSubscription} className="btn bg-red-600 hover:bg-red-700 text-white">
              Cancel Subscription
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
