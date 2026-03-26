import React, { useState, useEffect } from 'react';
import { ActionItem } from '../../services/performanceService';

interface ActionItemFormProps {
  actionItem?: ActionItem;
  onSubmit: (data: Partial<ActionItem>) => void;
  isSubmitting?: boolean;
}

export const ActionItemForm: React.FC<ActionItemFormProps> = ({
  actionItem,
  onSubmit,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<Partial<ActionItem>>({
    action: '',
    timeline: '',
    status: 'pending',
  });

  useEffect(() => {
    if (actionItem) {
      setFormData({
        action: actionItem.action,
        timeline: actionItem.timeline,
        status: actionItem.status,
      });
    }
  }, [actionItem]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
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
          Action Description *
        </label>
        <textarea
          name="action"
          value={formData.action}
          onChange={handleChange}
          required
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Describe the action to be taken"
          disabled={isSubmitting}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Timeline *
          </label>
          <input
            type="text"
            name="timeline"
            value={formData.timeline}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Q1 2026, 3 months, By March 31"
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
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
        <p className="text-sm text-amber-800">
          <strong>Note:</strong> Action items are part of the Development Plan and help track
          progress on skill development and career growth initiatives.
        </p>
      </div>
    </form>
  );
};
