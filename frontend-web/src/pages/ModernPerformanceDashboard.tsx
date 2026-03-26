import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ModernLayout } from '../components/layout/ModernLayout';
import PerformanceStatusChip from '../components/performance/PerformanceStatusChip';
import {
  ClipboardDocumentListIcon,
  ChartBarIcon,
  TrophyIcon,
  CheckCircleIcon,
  UserGroupIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

interface PerformanceReview {
  reviewId: string;
  employeeId: string;
  employee: {
    employeeCode: string;
    firstName: string;
    lastName: string;
    department: { name: string };
    designation: { name: string };
  };
  reviewCycle: string;
  currentState: string;
  overallRating?: number;
  updatedAt: string;
}

export default function ModernPerformanceDashboard() {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<PerformanceReview[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [activeView, setActiveView] = useState<'all-reviews' | 'pending' | 'due-reviews'>('all-reviews');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [activeFilter, searchTerm, reviews]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      const mockReviews: PerformanceReview[] = [
        {
          reviewId: '1',
          employeeId: 'emp1',
          employee: {
            employeeCode: 'EMP001',
            firstName: 'John',
            lastName: 'Doe',
            department: { name: 'Engineering' },
            designation: { name: 'Senior Software Engineer' },
          },
          reviewCycle: '2026',
          currentState: 'goals_approved',
          overallRating: undefined,
          updatedAt: '2026-02-15T10:00:00Z',
        },
        {
          reviewId: '2',
          employeeId: 'emp2',
          employee: {
            employeeCode: 'EMP002',
            firstName: 'Jane',
            lastName: 'Smith',
            department: { name: 'Product' },
            designation: { name: 'Product Manager' },
          },
          reviewCycle: '2026',
          currentState: 'mid_year_completed',
          overallRating: undefined,
          updatedAt: '2026-06-20T14:30:00Z',
        },
        {
          reviewId: '3',
          employeeId: 'emp3',
          employee: {
            employeeCode: 'EMP003',
            firstName: 'Mike',
            lastName: 'Johnson',
            department: { name: 'Sales' },
            designation: { name: 'Account Executive' },
          },
          reviewCycle: '2026',
          currentState: 'annual_review_submitted',
          overallRating: undefined,
          updatedAt: '2025-12-10T09:15:00Z',
        },
        {
          reviewId: '4',
          employeeId: 'emp4',
          employee: {
            employeeCode: 'EMP004',
            firstName: 'Sarah',
            lastName: 'Williams',
            department: { name: 'Marketing' },
            designation: { name: 'Marketing Manager' },
          },
          reviewCycle: '2026',
          currentState: 'rating_approved',
          overallRating: 4.5,
          updatedAt: '2026-01-05T16:45:00Z',
        },
        {
          reviewId: '5',
          employeeId: 'emp5',
          employee: {
            employeeCode: 'EMP005',
            firstName: 'David',
            lastName: 'Brown',
            department: { name: 'Engineering' },
            designation: { name: 'DevOps Engineer' },
          },
          reviewCycle: '2026',
          currentState: 'goal_setting',
          overallRating: undefined,
          updatedAt: '2026-01-10T11:20:00Z',
        },
      ];

      setReviews(mockReviews);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...reviews];

    // Apply status filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter((review) => {
        if (activeFilter === 'goal_setting') {
          return ['goal_setting', 'goals_submitted', 'goals_approved'].includes(review.currentState);
        } else if (activeFilter === 'mid_year') {
          return ['mid_year_pending', 'mid_year_submitted', 'mid_year_completed'].includes(review.currentState);
        } else if (activeFilter === 'annual_review') {
          return ['annual_review_pending', 'annual_review_submitted', 'annual_review_completed'].includes(review.currentState);
        } else if (activeFilter === 'rating') {
          return ['rating_pending', 'rating_submitted', 'rating_approved'].includes(review.currentState);
        }
        return review.currentState === activeFilter;
      });
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((review) =>
        `${review.employee.firstName} ${review.employee.lastName} ${review.employee.employeeCode}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
    }

    setFilteredReviews(filtered);
  };

  const getStatistics = () => {
    const goalSettingCount = reviews.filter((r) =>
      ['goal_setting', 'goals_submitted', 'goals_approved'].includes(r.currentState)
    ).length;
    const midYearCount = reviews.filter((r) =>
      ['mid_year_pending', 'mid_year_submitted', 'mid_year_completed'].includes(r.currentState)
    ).length;
    const annualReviewCount = reviews.filter((r) =>
      ['annual_review_pending', 'annual_review_submitted', 'annual_review_completed'].includes(r.currentState)
    ).length;
    const ratingCount = reviews.filter((r) =>
      ['rating_pending', 'rating_submitted', 'rating_approved'].includes(r.currentState)
    ).length;

    return {
      total: reviews.length,
      goalSetting: goalSettingCount,
      midYear: midYearCount,
      annualReview: annualReviewCount,
      rating: ratingCount,
    };
  };

  const handleExportCSV = () => {
    // TODO: Implement CSV export functionality
    console.log('Exporting performance reviews to CSV');
  };

  const stats = getStatistics();

  return (
    <ModernLayout title="Performance Management">
      <div className="space-y-4">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Left: Title with Icon */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <ChartBarIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Performance Management</h1>
                <p className="text-sm text-gray-500">Manage employee performance reviews and ratings</p>
              </div>
            </div>

            {/* Center: Tab Navigation */}
            <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg flex-shrink-0">
              <button
                onClick={() => setActiveView('all-reviews')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center space-x-2 ${
                  activeView === 'all-reviews'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ClipboardDocumentListIcon className="h-4 w-4" />
                <span>All Reviews</span>
              </button>

              <button
                onClick={() => setActiveView('pending')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center space-x-2 ${
                  activeView === 'pending'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <UserGroupIcon className="h-4 w-4" />
                <span>Pending</span>
              </button>

              <button
                onClick={() => setActiveView('due-reviews')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center space-x-2 ${
                  activeView === 'due-reviews'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <TrophyIcon className="h-4 w-4" />
                <span>Due Reviews</span>
              </button>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex items-center space-x-1.5 flex-shrink-0">
              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all flex items-center space-x-1.5 text-xs font-medium"
              >
                <DocumentTextIcon className="h-3.5 w-3.5" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div
            onClick={() => setActiveFilter('all')}
            className={`bg-white rounded-xl shadow-sm border-2 p-4 hover:shadow-lg transition-all cursor-pointer ${
              activeFilter === 'all' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Total Reviews</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserGroupIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div
            onClick={() => setActiveFilter('goal_setting')}
            className={`bg-white rounded-xl shadow-sm border-2 p-4 hover:shadow-lg transition-all cursor-pointer ${
              activeFilter === 'goal_setting' ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Goal Setting</p>
                <p className="text-2xl font-bold text-gray-900">{stats.goalSetting}</p>
              </div>
              <div className="p-2 bg-indigo-100 rounded-lg">
                <ClipboardDocumentListIcon className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div
            onClick={() => setActiveFilter('mid_year')}
            className={`bg-white rounded-xl shadow-sm border-2 p-4 hover:shadow-lg transition-all cursor-pointer ${
              activeFilter === 'mid_year' ? 'border-purple-500 ring-2 ring-purple-200' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Mid-Year</p>
                <p className="text-2xl font-bold text-gray-900">{stats.midYear}</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div
            onClick={() => setActiveFilter('annual_review')}
            className={`bg-white rounded-xl shadow-sm border-2 p-4 hover:shadow-lg transition-all cursor-pointer ${
              activeFilter === 'annual_review' ? 'border-orange-500 ring-2 ring-orange-200' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Annual Review</p>
                <p className="text-2xl font-bold text-gray-900">{stats.annualReview}</p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrophyIcon className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div
            onClick={() => setActiveFilter('rating')}
            className={`bg-white rounded-xl shadow-sm border-2 p-4 hover:shadow-lg transition-all cursor-pointer ${
              activeFilter === 'rating' ? 'border-green-500 ring-2 ring-green-200' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Rating</p>
                <p className="text-2xl font-bold text-gray-900">{stats.rating}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <input
            type="text"
            placeholder="Search by employee name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Reviews List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Designation
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Review Cycle
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Last Updated
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : filteredReviews.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      No performance reviews found
                    </td>
                  </tr>
                ) : (
                  filteredReviews.map((review) => (
                    <tr
                      key={review.reviewId}
                      onClick={() => navigate(`/performance/${review.reviewId}`)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                            {review.employee.firstName[0]}
                            {review.employee.lastName[0]}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-semibold text-gray-900">
                              {review.employee.firstName} {review.employee.lastName}
                            </div>
                            <div className="text-xs text-gray-500">{review.employee.employeeCode}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                        {review.employee.department.name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                        {review.employee.designation.name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {review.reviewCycle}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <PerformanceStatusChip status={review.currentState} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                        {review.overallRating ? (
                          <span className="flex items-center">
                            <span className="text-yellow-500 mr-1">★</span>
                            <span className="font-semibold">{review.overallRating.toFixed(1)}</span>
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                        {new Date(review.updatedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ModernLayout>
  );
}
