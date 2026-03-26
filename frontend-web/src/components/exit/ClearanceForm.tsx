import React, { useState, useEffect } from 'react';

interface Clearance {
  clearanceId?: string;
  department: string;
  approverName: string;
  approverId?: string;
  status: 'pending' | 'approved' | 'rejected';
  remarks?: string;
  approvedDate?: string;
}

interface ClearanceFormProps {
  clearance?: Clearance;
  onSubmit: (data: Partial<Clearance>) => void;
  isSubmitting?: boolean;
}

export const ClearanceForm: React.FC<ClearanceFormProps> = ({
  clearance,
  onSubmit,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<Partial<Clearance>>({
    department: '',
    approverName: '',
    approverId: '',
    status: 'pending',
    remarks: '',
  });

  useEffect(() => {
    if (clearance) {
      setFormData({
        department: clearance.department,
        approverName: clearance.approverName,
        approverId: clearance.approverId || '',
        status: clearance.status,
        remarks: clearance.remarks || '',
      });
    }
  }, [clearance]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Department *
        </label>
        <select
          name="department"
          value={formData.department}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isSubmitting}
        >
          <option value="">Select department</option>
          <option value="IT">IT Department</option>
          <option value="HR">HR Department</option>
          <option value="Finance">Finance Department</option>
          <option value="Admin">Admin Department</option>
          <option value="Operations">Operations</option>
          <option value="Sales">Sales</option>
          <option value="Marketing">Marketing</option>
          <option value="Engineering">Engineering</option>
          <option value="Product">Product</option>
          <option value="Support">Support</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Approver Name *
        </label>
        <input
          type="text"
          name="approverName"
          value={formData.approverName}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Name of the department head or approver"
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Approver ID
        </label>
        <input
          type="text"
          name="approverId"
          value={formData.approverId}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Employee ID of the approver (optional)"
          disabled={isSubmitting}
        />
      </div>

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
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
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
          placeholder="Additional notes or conditions for clearance"
          disabled={isSubmitting}
        />
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
        <p className="text-sm text-amber-800">
          <strong>Clearance Process:</strong> Each department must verify that the employee has
          returned all materials, completed handovers, and has no pending obligations.
        </p>
      </div>
    </form>
  );
};
