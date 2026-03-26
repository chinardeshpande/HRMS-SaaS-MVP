import React, { useState, useEffect } from 'react';

export interface FinalRating {
  managerRating: number;
  normalizationRating?: number;
  finalRating: number;
  ratingCategory: string;
  promotionRecommended: boolean;
  incrementPercentage?: number;
  comments: string;
}

interface PerformanceRatingFormProps {
  rating?: FinalRating;
  onSubmit: (data: Partial<FinalRating>) => void;
  isSubmitting?: boolean;
}

export const PerformanceRatingForm: React.FC<PerformanceRatingFormProps> = ({
  rating,
  onSubmit,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<Partial<FinalRating>>({
    managerRating: 3,
    normalizationRating: 3,
    finalRating: 3,
    ratingCategory: 'meets_expectations',
    promotionRecommended: false,
    incrementPercentage: 0,
    comments: '',
  });

  useEffect(() => {
    if (rating) {
      setFormData({
        managerRating: rating.managerRating,
        normalizationRating: rating.normalizationRating || 3,
        finalRating: rating.finalRating,
        ratingCategory: rating.ratingCategory,
        promotionRecommended: rating.promotionRecommended,
        incrementPercentage: rating.incrementPercentage || 0,
        comments: rating.comments,
      });
    }
  }, [rating]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    let processedValue: any = value;
    if (type === 'number') {
      processedValue = Number(value);
    } else if (type === 'checkbox') {
      processedValue = (e.target as HTMLInputElement).checked;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));

    // Auto-calculate final rating when manager rating or normalization rating changes
    if (name === 'managerRating' || name === 'normalizationRating') {
      const managerRating = name === 'managerRating' ? Number(value) : (formData.managerRating || 0);
      const normalizationRating = name === 'normalizationRating' ? Number(value) : (formData.normalizationRating || 0);
      const calculatedFinalRating = normalizationRating || managerRating;

      setFormData((prev) => ({
        ...prev,
        [name]: Number(value),
        finalRating: calculatedFinalRating,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Manager Rating (1-5) *
          </label>
          <input
            type="number"
            name="managerRating"
            value={formData.managerRating}
            onChange={handleChange}
            required
            min="1"
            max="5"
            step="0.1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          />
          <p className="text-xs text-gray-500 mt-1">Initial rating from manager</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Normalization Rating (1-5)
          </label>
          <input
            type="number"
            name="normalizationRating"
            value={formData.normalizationRating}
            onChange={handleChange}
            min="1"
            max="5"
            step="0.1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          />
          <p className="text-xs text-gray-500 mt-1">Adjusted rating after calibration</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Final Rating (1-5) *
          </label>
          <input
            type="number"
            name="finalRating"
            value={formData.finalRating}
            onChange={handleChange}
            required
            min="1"
            max="5"
            step="0.1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            disabled={isSubmitting}
          />
          <p className="text-xs text-gray-500 mt-1">Auto-calculated or manual override</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rating Category *
          </label>
          <select
            name="ratingCategory"
            value={formData.ratingCategory}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            <option value="exceeds_expectations">Exceeds Expectations</option>
            <option value="meets_expectations">Meets Expectations</option>
            <option value="needs_improvement">Needs Improvement</option>
            <option value="unsatisfactory">Unsatisfactory</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Increment Percentage (%)
          </label>
          <input
            type="number"
            name="incrementPercentage"
            value={formData.incrementPercentage}
            onChange={handleChange}
            min="0"
            max="100"
            step="0.1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          />
          <p className="text-xs text-gray-500 mt-1">Salary increment percentage</p>
        </div>
      </div>

      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            name="promotionRecommended"
            checked={formData.promotionRecommended}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            disabled={isSubmitting}
          />
          <span className="ml-2 text-sm font-medium text-gray-700">
            Recommend for Promotion
          </span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Manager Comments *
        </label>
        <textarea
          name="comments"
          value={formData.comments}
          onChange={handleChange}
          required
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Provide detailed feedback on the employee's overall performance"
          disabled={isSubmitting}
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-gray-700">
          <strong>Rating Guide:</strong>
          1.0-1.9 = Unsatisfactory |
          2.0-2.9 = Needs Improvement |
          3.0-3.9 = Meets Expectations |
          4.0-5.0 = Exceeds Expectations
        </p>
      </div>
    </form>
  );
};
