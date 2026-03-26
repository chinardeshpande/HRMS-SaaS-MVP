import React, { useState, useEffect } from 'react';

export interface Review {
  reviewType?: string;
  selfRating: number;
  managerRating?: number;
  selfComments: string;
  managerComments?: string;
  achievements: string[];
  challenges: string[];
  submittedDate?: string;
  completedDate?: string;
}

interface MidYearReviewFormProps {
  review?: Review;
  onSubmit: (data: Partial<Review>) => void;
  isSubmitting?: boolean;
  isManagerView?: boolean;
}

export const MidYearReviewForm: React.FC<MidYearReviewFormProps> = ({
  review,
  onSubmit,
  isSubmitting = false,
  isManagerView = false,
}) => {
  const [formData, setFormData] = useState<Partial<Review>>({
    reviewType: 'mid_year',
    selfRating: 3,
    managerRating: 3,
    selfComments: '',
    managerComments: '',
    achievements: [''],
    challenges: [''],
  });

  useEffect(() => {
    if (review) {
      setFormData({
        reviewType: 'mid_year',
        selfRating: review.selfRating,
        managerRating: review.managerRating || 3,
        selfComments: review.selfComments,
        managerComments: review.managerComments || '',
        achievements: review.achievements.length > 0 ? review.achievements : [''],
        challenges: review.challenges.length > 0 ? review.challenges : [''],
      });
    }
  }, [review]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleAchievementChange = (index: number, value: string) => {
    const newAchievements = [...(formData.achievements || [])];
    newAchievements[index] = value;
    setFormData((prev) => ({ ...prev, achievements: newAchievements }));
  };

  const handleChallengeChange = (index: number, value: string) => {
    const newChallenges = [...(formData.challenges || [])];
    newChallenges[index] = value;
    setFormData((prev) => ({ ...prev, challenges: newChallenges }));
  };

  const addAchievement = () => {
    setFormData((prev) => ({
      ...prev,
      achievements: [...(prev.achievements || []), ''],
    }));
  };

  const addChallenge = () => {
    setFormData((prev) => ({
      ...prev,
      challenges: [...(prev.challenges || []), ''],
    }));
  };

  const removeAchievement = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      achievements: (prev.achievements || []).filter((_, i) => i !== index),
    }));
  };

  const removeChallenge = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      challenges: (prev.challenges || []).filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Filter out empty achievements and challenges
    const cleanedData = {
      ...formData,
      achievements: (formData.achievements || []).filter(a => a.trim() !== ''),
      challenges: (formData.challenges || []).filter(c => c.trim() !== ''),
    };
    onSubmit(cleanedData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Self Rating (1-5) *
          </label>
          <input
            type="number"
            name="selfRating"
            value={formData.selfRating}
            onChange={handleChange}
            required
            min="1"
            max="5"
            step="0.1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          />
        </div>

        {isManagerView && (
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
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Self Comments *
        </label>
        <textarea
          name="selfComments"
          value={formData.selfComments}
          onChange={handleChange}
          required
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Share your thoughts on your performance during this period"
          disabled={isSubmitting}
        />
      </div>

      {isManagerView && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Manager Comments *
          </label>
          <textarea
            name="managerComments"
            value={formData.managerComments}
            onChange={handleChange}
            required
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Provide feedback on employee's performance"
            disabled={isSubmitting}
          />
        </div>
      )}

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Key Achievements *
          </label>
          <button
            type="button"
            onClick={addAchievement}
            className="text-xs text-blue-600 hover:text-blue-700"
            disabled={isSubmitting}
          >
            + Add Achievement
          </button>
        </div>
        <div className="space-y-2">
          {(formData.achievements || ['']).map((achievement, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={achievement}
                onChange={(e) => handleAchievementChange(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe an achievement"
                disabled={isSubmitting}
              />
              {(formData.achievements || []).length > 1 && (
                <button
                  type="button"
                  onClick={() => removeAchievement(index)}
                  className="px-3 py-2 text-red-600 hover:text-red-700"
                  disabled={isSubmitting}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Challenges Faced *
          </label>
          <button
            type="button"
            onClick={addChallenge}
            className="text-xs text-blue-600 hover:text-blue-700"
            disabled={isSubmitting}
          >
            + Add Challenge
          </button>
        </div>
        <div className="space-y-2">
          {(formData.challenges || ['']).map((challenge, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={challenge}
                onChange={(e) => handleChallengeChange(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe a challenge"
                disabled={isSubmitting}
              />
              {(formData.challenges || []).length > 1 && (
                <button
                  type="button"
                  onClick={() => removeChallenge(index)}
                  className="px-3 py-2 text-red-600 hover:text-red-700"
                  disabled={isSubmitting}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </form>
  );
};
