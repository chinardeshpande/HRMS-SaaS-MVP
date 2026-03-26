import React, { useState, useEffect } from 'react';
import { KPI } from '../../services/performanceService';

interface KPIFormProps {
  kpi?: KPI;
  onSubmit: (data: Partial<KPI>) => void;
  isSubmitting?: boolean;
}

export const KPIForm: React.FC<KPIFormProps> = ({
  kpi,
  onSubmit,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<Partial<KPI>>({
    metric: '',
    target: '',
    actual: '',
    unit: '',
    status: 'on_track',
  });

  useEffect(() => {
    if (kpi) {
      setFormData({
        metric: kpi.metric,
        target: kpi.target,
        actual: kpi.actual || '',
        unit: kpi.unit,
        status: kpi.status,
      });
    }
  }, [kpi]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Metric Name *
        </label>
        <input
          type="text"
          name="metric"
          value={formData.metric}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Revenue Growth, Customer Satisfaction"
          disabled={isSubmitting}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Target Value *
          </label>
          <input
            type="text"
            name="target"
            value={formData.target}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 100, 90%"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Actual Value
          </label>
          <input
            type="text"
            name="actual"
            value={formData.actual}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 85, 75%"
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Unit *
          </label>
          <input
            type="text"
            name="unit"
            value={formData.unit}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., %, USD, Count"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            <option value="on_track">On Track</option>
            <option value="at_risk">At Risk</option>
            <option value="off_track">Off Track</option>
            <option value="achieved">Achieved</option>
          </select>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> Target and Actual values can be numbers, percentages, or text.
          The Unit field helps clarify what these values represent.
        </p>
      </div>
    </form>
  );
};
