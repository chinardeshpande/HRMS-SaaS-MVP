import React, { useState, useEffect } from 'react';
import { Feedback360 } from '../../services/performanceService';

interface Feedback360FormProps {
  feedback?: Feedback360;
  onSubmit: (data: Partial<Feedback360>) => void;
  isSubmitting?: boolean;
}

export const Feedback360Form: React.FC<Feedback360FormProps> = ({
  feedback,
  onSubmit,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<Partial<Feedback360>>({
    feedbackFrom: '',
    relationship: 'peer',
    rating: 3,
    comments: '',
  });

  useEffect(() => {
    if (feedback) {
      setFormData({
        feedbackFrom: feedback.feedbackFrom,
        relationship: feedback.relationship,
        rating: feedback.rating,
        comments: feedback.comments,
      });
    }
  }, [feedback]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
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
          Feedback From *
        </label>
        <input
          type="text"
          name="feedbackFrom"
          value={formData.feedbackFrom}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Name or ID of the feedback provider"
          disabled={isSubmitting}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Relationship *
          </label>
          <select
            name="relationship"
            value={formData.relationship}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            <option value="peer">Peer</option>
            <option value="subordinate">Subordinate</option>
            <option value="stakeholder">Stakeholder</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Overall Rating * (1-5)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              name="rating"
              value={formData.rating}
              onChange={handleChange}
              required
              min="1"
              max="5"
              step="1"
              className="flex-1"
              disabled={isSubmitting}
            />
            <span className="w-8 text-center font-semibold text-lg text-blue-600">
              {formData.rating}
            </span>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Poor</span>
            <span>Excellent</span>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Feedback Comments *
        </label>
        <textarea
          name="comments"
          value={formData.comments}
          onChange={handleChange}
          required
          rows={5}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Provide detailed feedback on strengths, areas for improvement, and collaboration"
          disabled={isSubmitting}
        />
      </div>

      <div className="bg-green-50 border border-green-200 rounded-md p-3">
        <p className="text-sm text-green-800">
          <strong>360° Feedback:</strong> Your honest feedback helps in holistic performance
          evaluation. Focus on specific examples and constructive observations.
        </p>
      </div>
    </form>
  );
};
