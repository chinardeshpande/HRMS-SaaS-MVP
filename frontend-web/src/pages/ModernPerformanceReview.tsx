import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ModernLayout } from '../components/layout/ModernLayout';
import { ArrowLeftIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface Competency {
  id: string;
  name: string;
  rating: number;
}

export default function ModernPerformanceReview() {
  const navigate = useNavigate();
  const location = useLocation();
  const employee = location.state?.employee;

  const [competencies, setCompetencies] = useState<Competency[]>([
    { id: '1', name: 'Technical Skills', rating: 0 },
    { id: '2', name: 'Communication', rating: 0 },
    { id: '3', name: 'Teamwork', rating: 0 },
    { id: '4', name: 'Problem Solving', rating: 0 },
    { id: '5', name: 'Initiative', rating: 0 },
    { id: '6', name: 'Leadership', rating: 0 },
  ]);

  const [formData, setFormData] = useState({
    reviewPeriodStart: '',
    reviewPeriodEnd: '',
    overallRating: '',
    achievements: '',
    areasForImprovement: '',
    goals: '',
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRatingChange = (competencyId: string, rating: number) => {
    setCompetencies((prev) =>
      prev.map((comp) => (comp.id === competencyId ? { ...comp, rating } : comp))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showNotification('Performance review submitted!', 'success');
      setTimeout(() => navigate(`/employees/${employee.employeeId}`), 1500);
    } catch (err: any) {
      showNotification('Failed to submit review', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  const calculateAvg = () => {
    const ratings = competencies.map((c) => c.rating).filter((r) => r > 0);
    return ratings.length > 0 ? (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1) : '0';
  };

  if (!employee) return null;

  const avgRating = parseFloat(calculateAvg());

  return (
    <ModernLayout>
      {notification.show && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className={`rounded-lg px-4 py-3 shadow-xl ${notification.type === 'success' ? 'bg-success-600' : 'bg-danger-600'}`}>
            <p className="text-sm font-medium text-white">{notification.message}</p>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate(`/employees/${employee.employeeId}`)} className="btn btn-secondary mb-4">
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Performance Review</h1>
          <p className="text-sm text-gray-600 mt-1">{employee.firstName} {employee.lastName} • {employee.designation?.title}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Review Period */}
          <div className="card">
            <div className="card-body p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">Review Period</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Start Date *</label>
                  <input type="date" name="reviewPeriodStart" value={formData.reviewPeriodStart} onChange={handleChange} required className="input input-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">End Date *</label>
                  <input type="date" name="reviewPeriodEnd" value={formData.reviewPeriodEnd} onChange={handleChange} required className="input input-sm" />
                </div>
              </div>
            </div>
          </div>

          {/* Competency Ratings */}
          <div className="card border-2 border-orange-200">
            <div className="card-body p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <span className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 text-white flex items-center justify-center text-sm mr-2">⭐</span>
                  <h3 className="text-sm font-bold text-gray-900">Competency Assessment</h3>
                </div>
                {avgRating > 0 && (
                  <div className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-orange-100 to-yellow-100 border border-orange-300">
                    <p className="text-xs text-orange-700 font-semibold">Average Rating</p>
                    <p className={`text-lg font-bold ${avgRating >= 4 ? 'text-success-600' : avgRating >= 3 ? 'text-warning-600' : 'text-danger-600'}`}>{avgRating}</p>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {competencies.map((comp, idx) => (
                  <div key={comp.id} className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                    comp.rating >= 4 ? 'bg-green-50 border-green-200' :
                    comp.rating >= 3 ? 'bg-blue-50 border-blue-200' :
                    comp.rating >= 1 ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <span className="text-sm font-semibold text-gray-900">{comp.name}</span>
                    <div className="flex items-center space-x-0.5">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => handleRatingChange(comp.id, rating)}
                          className="focus:outline-none transition-all hover:scale-125"
                        >
                          {comp.rating >= rating ? (
                            <StarIconSolid className="h-5 w-5 text-amber-400" />
                          ) : (
                            <StarIcon className="h-5 w-5 text-gray-300 hover:text-amber-300" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Overall Assessment */}
          <div className="card">
            <div className="card-body p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">Overall Assessment</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Overall Rating *</label>
                  <select name="overallRating" value={formData.overallRating} onChange={handleChange} required className="input input-sm">
                    <option value="">Select Rating</option>
                    <option value="5">5 - Outstanding</option>
                    <option value="4">4 - Exceeds Expectations</option>
                    <option value="3">3 - Meets Expectations</option>
                    <option value="2">2 - Needs Improvement</option>
                    <option value="1">1 - Unsatisfactory</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Key Achievements</label>
                  <textarea name="achievements" value={formData.achievements} onChange={handleChange} rows={2} placeholder="Major accomplishments..." className="input input-sm" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Areas for Improvement</label>
                  <textarea name="areasForImprovement" value={formData.areasForImprovement} onChange={handleChange} rows={2} placeholder="Development areas..." className="input input-sm" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Goals for Next Period</label>
                  <textarea name="goals" value={formData.goals} onChange={handleChange} rows={2} placeholder="Future goals..." className="input input-sm" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button type="button" onClick={() => navigate(`/employees/${employee.employeeId}`)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading || !formData.overallRating || avgRating === 0} className="btn btn-primary">
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </ModernLayout>
  );
}
