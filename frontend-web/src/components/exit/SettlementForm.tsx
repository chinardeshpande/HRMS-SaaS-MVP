import React, { useState, useEffect } from 'react';

export interface Settlement {
  settlementId?: string;
  salary: {
    basic: number;
    hra: number;
    allowances: number;
  };
  deductions: {
    noticePeriodShortfall: number;
    assetsNotReturned: number;
    loans: number;
    other: number;
  };
  leaveEncashment: number;
  bonus: number;
  netSettlement: number;
  paymentStatus: 'pending' | 'processed' | 'completed';
  paymentDate?: string;
}

interface SettlementFormProps {
  settlement?: Settlement;
  onSubmit: (data: Partial<Settlement>) => void;
  isSubmitting?: boolean;
}

export const SettlementForm: React.FC<SettlementFormProps> = ({
  settlement,
  onSubmit,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<Partial<Settlement>>({
    salary: {
      basic: 0,
      hra: 0,
      allowances: 0,
    },
    deductions: {
      noticePeriodShortfall: 0,
      assetsNotReturned: 0,
      loans: 0,
      other: 0,
    },
    leaveEncashment: 0,
    bonus: 0,
    netSettlement: 0,
    paymentStatus: 'pending',
    paymentDate: '',
  });

  useEffect(() => {
    if (settlement) {
      setFormData(settlement);
    }
  }, [settlement]);

  useEffect(() => {
    // Auto-calculate net settlement
    const earnings =
      (formData.salary?.basic || 0) +
      (formData.salary?.hra || 0) +
      (formData.salary?.allowances || 0) +
      (formData.leaveEncashment || 0) +
      (formData.bonus || 0);

    const totalDeductions =
      (formData.deductions?.noticePeriodShortfall || 0) +
      (formData.deductions?.assetsNotReturned || 0) +
      (formData.deductions?.loans || 0) +
      (formData.deductions?.other || 0);

    const net = earnings - totalDeductions;

    setFormData((prev) => ({
      ...prev,
      netSettlement: net,
    }));
  }, [
    formData.salary?.basic,
    formData.salary?.hra,
    formData.salary?.allowances,
    formData.leaveEncashment,
    formData.bonus,
    formData.deductions?.noticePeriodShortfall,
    formData.deductions?.assetsNotReturned,
    formData.deductions?.loans,
    formData.deductions?.other,
  ]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const numValue = type === 'number' ? Number(value) : value;

    // Handle nested objects for salary and deductions
    if (name.startsWith('salary.')) {
      const field = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        salary: {
          ...prev.salary,
          [field]: numValue,
        } as any,
      }));
    } else if (name.startsWith('deductions.')) {
      const field = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        deductions: {
          ...prev.deductions,
          [field]: numValue,
        } as any,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: numValue,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Earnings Section */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-green-900 mb-3">Earnings</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Basic Salary (Monthly)
            </label>
            <input
              type="number"
              name="basicSalary"
              value={formData.basicSalary}
              onChange={handleChange}
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unpaid Days
            </label>
            <input
              type="number"
              name="unpaidDays"
              value={formData.unpaidDays}
              onChange={handleChange}
              step="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unpaid Salary
            </label>
            <input
              type="number"
              name="unpaidSalary"
              value={formData.unpaidSalary}
              onChange={handleChange}
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Leave Encashment
            </label>
            <input
              type="number"
              name="leaveEncashment"
              value={formData.leaveEncashment}
              onChange={handleChange}
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bonus / Incentive
            </label>
            <input
              type="number"
              name="bonus"
              value={formData.bonus}
              onChange={handleChange}
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Other Earnings
            </label>
            <input
              type="number"
              name="otherEarnings"
              value={formData.otherEarnings}
              onChange={handleChange}
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={isSubmitting}
            />
          </div>
        </div>
      </div>

      {/* Deductions Section */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-red-900 mb-3">Deductions</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Advances
            </label>
            <input
              type="number"
              name="advances"
              value={formData.advances}
              onChange={handleChange}
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Asset Charges
            </label>
            <input
              type="number"
              name="assetCharges"
              value={formData.assetCharges}
              onChange={handleChange}
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notice Period Recovery
            </label>
            <input
              type="number"
              name="noticePeriodRecovery"
              value={formData.noticePeriodRecovery}
              onChange={handleChange}
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Other Deductions
            </label>
            <input
              type="number"
              name="otherDeductions"
              value={formData.otherDeductions}
              onChange={handleChange}
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              disabled={isSubmitting}
            />
          </div>
        </div>
      </div>

      {/* Settlement Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Settlement Summary</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Gross Amount:</span>
            <span className="text-lg font-semibold text-green-600">
              ₹{formData.grossAmount?.toFixed(2) || '0.00'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Total Deductions:</span>
            <span className="text-lg font-semibold text-red-600">
              ₹{formData.totalDeductions?.toFixed(2) || '0.00'}
            </span>
          </div>
          <div className="border-t-2 border-blue-300 pt-2 mt-2">
            <div className="flex justify-between items-center">
              <span className="text-base font-bold text-gray-900">Net Payable:</span>
              <span className="text-xl font-bold text-blue-600">
                ₹{formData.netAmount?.toFixed(2) || '0.00'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Details */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status *
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            <option value="draft">Draft</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Payment Mode
          </label>
          <select
            name="paymentMode"
            value={formData.paymentMode}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            <option value="">Select payment mode</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="cheque">Cheque</option>
            <option value="cash">Cash</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Approved By
          </label>
          <input
            type="text"
            name="approvedBy"
            value={formData.approvedBy}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Name of approver"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Payment Date
          </label>
          <input
            type="date"
            name="paidDate"
            value={formData.paidDate}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Remarks
        </label>
        <textarea
          name="remarks"
          value={formData.remarks}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Additional notes or comments about the settlement"
          disabled={isSubmitting}
        />
      </div>
    </form>
  );
};
