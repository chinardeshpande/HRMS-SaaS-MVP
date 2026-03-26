import React, { useState, useEffect } from 'react';

export interface ExitInterview {
  interviewId?: string;
  completed: boolean;
  overallRating?: number;
  managementRating?: number;
  cultureRating?: number;
  growthRating?: number;
  compensationRating?: number;
  wouldRecommend?: boolean;
  reasonsForLeaving?: string[];
  feedback?: string;
  conductedBy?: string;
  conductedDate?: string;
}

const LEAVING_REASONS = [
  'Better Opportunity',
  'Career Growth',
  'Compensation',
  'Work-Life Balance',
  'Location',
  'Personal Reasons',
  'Management Issues',
  'Company Culture',
  'Relocation',
  'Health Reasons',
];

interface ExitInterviewFormProps {
  interview?: ExitInterview;
  onSubmit: (data: Partial<ExitInterview>) => void;
  isSubmitting?: boolean;
}

export const ExitInterviewForm: React.FC<ExitInterviewFormProps> = ({
  interview,
  onSubmit,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<Partial<ExitInterview>>({
    completed: true,
    overallRating: 3,
    managementRating: 3,
    cultureRating: 3,
    growthRating: 3,
    compensationRating: 3,
    wouldRecommend: true,
    reasonsForLeaving: [],
    feedback: '',
    conductedBy: '',
    conductedDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (interview) {
      setFormData({
        completed: interview.completed,
        overallRating: interview.overallRating || 3,
        managementRating: interview.managementRating || 3,
        cultureRating: interview.cultureRating || 3,
        growthRating: interview.growthRating || 3,
        compensationRating: interview.compensationRating || 3,
        wouldRecommend: interview.wouldRecommend ?? true,
        reasonsForLeaving: interview.reasonsForLeaving || [],
        feedback: interview.feedback || '',
        conductedBy: interview.conductedBy || '',
        conductedDate: interview.conductedDate || new Date().toISOString().split('T')[0],
      });
    }
  }, [interview]);

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
  };

  const handleReasonToggle = (reason: string) => {
    setFormData((prev) => {
      const currentReasons = prev.reasonsForLeaving || [];
      const newReasons = currentReasons.includes(reason)
        ? currentReasons.filter((r) => r !== reason)
        : [...currentReasons, reason];
      return { ...prev, reasonsForLeaving: newReasons };
    });
  };

  const handleRecommendChange = (value: boolean) => {
    setFormData((prev) => ({ ...prev, wouldRecommend: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Overall Rating (1-5) *
          </label>
          <input
            type="number"
            name="overallRating"
            value={formData.overallRating}
            onChange={handleChange}
            required
            min="1"
            max="5"
            step="0.1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Management (1-5) *
          </label>
          <input
            type="number"
            name="managementRating"
            value={formData.managementRating}
            onChange={handleChange}
            required
            min="1"
            max="5"
            step="0.1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Culture (1-5) *
          </label>
          <input
            type="number"
            name="cultureRating"
            value={formData.cultureRating}
            onChange={handleChange}
            required
            min="1"
            max="5"
            step="0.1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Growth (1-5) *
          </label>
          <input
            type="number"
            name="growthRating"
            value={formData.growthRating}
            onChange={handleChange}
            required
            min="1"
            max="5"
            step="0.1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Compensation Rating (1-5) *
        </label>
        <input
          type="number"
          name="compensationRating"
          value={formData.compensationRating}
          onChange={handleChange}
          required
          min="1"
          max="5"
          step="0.1"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Reasons for Leaving (Select all that apply) *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {LEAVING_REASONS.map((reason) => (
            <label key={reason} className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={(formData.reasonsForLeaving || []).includes(reason)}
                onChange={() => handleReasonToggle(reason)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                disabled={isSubmitting}
              />
              {reason}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Would you recommend this company? *
        </label>
        <div className="flex gap-4">
          <label className="flex items-center text-sm">
            <input
              type="radio"
              checked={formData.wouldRecommend === true}
              onChange={() => handleRecommendChange(true)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 mr-2"
              disabled={isSubmitting}
            />
            Yes, definitely
          </label>
          <label className="flex items-center text-sm">
            <input
              type="radio"
              checked={formData.wouldRecommend === false}
              onChange={() => handleRecommendChange(false)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 mr-2"
              disabled={isSubmitting}
            />
            No
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Additional Feedback *
        </label>
        <textarea
          name="feedback"
          value={formData.feedback}
          onChange={handleChange}
          required
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Share your thoughts, suggestions, or any other feedback..."
          disabled={isSubmitting}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Conducted By *
          </label>
          <input
            type="text"
            name="conductedBy"
            value={formData.conductedBy}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Name of interviewer"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Interview Date *
          </label>
          <input
            type="date"
            name="conductedDate"
            value={formData.conductedDate}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-gray-700">
          <strong>Rating Guide:</strong> 1 = Very Dissatisfied | 2 = Dissatisfied | 3 = Neutral | 4 = Satisfied | 5 = Very Satisfied
        </p>
      </div>
    </form>
  );
};
