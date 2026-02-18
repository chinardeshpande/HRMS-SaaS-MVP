import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ModernLayout } from '../components/layout/ModernLayout';
import { ArrowLeftIcon, BanknotesIcon, ChartBarIcon } from '@heroicons/react/24/outline';

export default function ModernCompensation() {
  const navigate = useNavigate();
  const location = useLocation();
  const employee = location.state?.employee;

  const [formData, setFormData] = useState({
    newSalary: employee?.salary || 0,
    adjustmentType: 'percentage',
    adjustmentValue: 0,
    effectiveDate: new Date().toISOString().split('T')[0],
    reason: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  });

  useEffect(() => {
    if (!employee) navigate('/employees');
  }, [employee, navigate]);

  useEffect(() => {
    if (formData.adjustmentType === 'percentage' && formData.adjustmentValue > 0) {
      const increase = (employee.salary || 0) * (formData.adjustmentValue / 100);
      setFormData((prev) => ({ ...prev, newSalary: (employee.salary || 0) + increase }));
    } else if (formData.adjustmentType === 'amount' && formData.adjustmentValue > 0) {
      setFormData((prev) => ({ ...prev, newSalary: (employee.salary || 0) + formData.adjustmentValue }));
    }
  }, [formData.adjustmentType, formData.adjustmentValue, employee?.salary]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const numericFields = ['newSalary', 'adjustmentValue'];
    setFormData((prev) => ({
      ...prev,
      [name]: numericFields.includes(name) ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showNotification('Compensation updated successfully!', 'success');
      setTimeout(() => navigate(`/employees/${employee.employeeId}`), 1500);
    } catch (err: any) {
      showNotification('Failed to update compensation', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  const calculateIncrease = () => {
    if (!employee?.salary || !formData.newSalary) return { amount: 0, percentage: '0.0' };
    const amount = formData.newSalary - employee.salary;
    const percentage = ((amount / employee.salary) * 100).toFixed(1);
    return { amount, percentage };
  };

  if (!employee) return null;

  const increase = calculateIncrease();

  return (
    <ModernLayout>
      {notification.show && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className={`rounded-lg px-4 py-3 shadow-xl ${notification.type === 'success' ? 'bg-success-600' : 'bg-danger-600'}`}>
            <p className="text-sm font-medium text-white">{notification.message}</p>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate(`/employees/${employee.employeeId}`)} className="btn btn-secondary mb-4">
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Adjust Compensation</h1>
          <p className="text-sm text-gray-600 mt-1">{employee.firstName} {employee.lastName} • ${employee.salary?.toLocaleString()}/year</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Visual Summary */}
          {formData.newSalary > 0 && increase.amount > 0 && (
            <div className="card overflow-hidden border-2 border-green-200">
              <div className="bg-gradient-to-br from-green-500 via-emerald-600 to-teal-600 p-5">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-xs text-white/80 mb-2 font-bold">CURRENT SALARY</p>
                    <div className="bg-white/95 backdrop-blur rounded-lg p-3 shadow-xl">
                      <div className="w-10 h-10 rounded-full bg-gray-100 mx-auto mb-2 flex items-center justify-center">
                        <span className="text-xl">💵</span>
                      </div>
                      <p className="text-xl font-bold text-gray-900">${employee.salary?.toLocaleString() || '0'}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Annual</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-white/80 mb-2 font-bold">INCREASE</p>
                    <div className="bg-white backdrop-blur rounded-lg p-3 shadow-xl border-2 border-yellow-400">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 mx-auto mb-2 flex items-center justify-center animate-pulse">
                        <span className="text-xl">📈</span>
                      </div>
                      <p className="text-xl font-bold text-success-600">+${increase.amount.toLocaleString()}</p>
                      <p className="text-sm font-bold text-success-600 mt-0.5">+{increase.percentage}%</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-white/80 mb-2 font-bold">NEW SALARY</p>
                    <div className="bg-white/95 backdrop-blur rounded-lg p-3 shadow-xl">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 mx-auto mb-2 flex items-center justify-center">
                        <span className="text-xl">💰</span>
                      </div>
                      <p className="text-xl font-bold text-success-600">${formData.newSalary.toLocaleString()}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Annual</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Calculator */}
          <div className="card">
            <div className="card-body p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">Salary Calculator</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Adjustment Type *</label>
                  <select name="adjustmentType" value={formData.adjustmentType} onChange={handleChange} className="input input-sm">
                    <option value="percentage">Percentage Increase</option>
                    <option value="amount">Fixed Amount</option>
                    <option value="manual">Manual Entry</option>
                  </select>
                </div>

                {formData.adjustmentType !== 'manual' ? (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {formData.adjustmentType === 'percentage' ? 'Percentage (%)' : 'Amount ($)'} *
                    </label>
                    <input
                      type="number"
                      name="adjustmentValue"
                      value={formData.adjustmentValue}
                      onChange={handleChange}
                      required
                      min="0"
                      step={formData.adjustmentType === 'percentage' ? '0.1' : '100'}
                      className="input input-sm"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">New Salary *</label>
                    <input
                      type="number"
                      name="newSalary"
                      value={formData.newSalary}
                      onChange={handleChange}
                      required
                      min={0}
                      step="1000"
                      className="input input-sm"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Effective Date *</label>
                  <input type="date" name="effectiveDate" value={formData.effectiveDate} onChange={handleChange} required className="input input-sm" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Reason *</label>
                  <select name="reason" value={formData.reason} onChange={handleChange} required className="input input-sm">
                    <option value="">Select Reason</option>
                    <option value="annual_review">Annual Review</option>
                    <option value="promotion">Promotion</option>
                    <option value="market_adjustment">Market Adjustment</option>
                    <option value="merit_increase">Merit Increase</option>
                    <option value="retention">Retention</option>
                    <option value="cost_of_living">Cost of Living</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Notes</label>
                  <textarea name="notes" value={formData.notes} onChange={handleChange} rows={2} placeholder="Additional justification..." className="input input-sm" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button type="button" onClick={() => navigate(`/employees/${employee.employeeId}`)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading || formData.newSalary <= 0 || !formData.reason} className="btn btn-primary">
              {loading ? 'Processing...' : 'Confirm Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </ModernLayout>
  );
}
