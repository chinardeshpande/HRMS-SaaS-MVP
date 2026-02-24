import React, { useState, useEffect } from 'react';
import probationService from '../services/probationService';
import ProbationStatusChip from '../components/probation/ProbationStatusChip';

interface ProbationCase {
  probationId: string;
  employee: {
    employeeId: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
    department?: { departmentName: string };
  };
  currentState: string;
  probationStartDate: string;
  probationEndDate: string;
  isAtRisk: boolean;
  riskLevel?: string;
  review30Completed: boolean;
  review60Completed: boolean;
  finalReviewCompleted: boolean;
}

const ModernProbationTracker: React.FC = () => {
  const [probationCases, setProbationCases] = useState<ProbationCase[]>([]);
  const [statistics, setStatistics] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'at-risk'>('all');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [casesRes, statsRes] = await Promise.all([
        activeTab === 'at-risk'
          ? probationService.getAtRiskEmployees()
          : probationService.getAllProbationCases(),
        probationService.getProbationStatistics(),
      ]);

      setProbationCases(casesRes.data || []);
      setStatistics(statsRes.data || {});
    } catch (error) {
      console.error('Error fetching probation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getProgressPercentage = (probationCase: ProbationCase) => {
    const completed = [
      probationCase.review30Completed,
      probationCase.review60Completed,
      probationCase.finalReviewCompleted,
    ].filter(Boolean).length;
    return (completed / 3) * 100;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Probation Tracker</h1>
        <p className="text-gray-600">Monitor employees in probation period</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="text-sm font-medium text-gray-600 mb-1">Total Cases</div>
          <div className="text-3xl font-bold text-gray-900">{statistics.total || 0}</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="text-sm font-medium text-gray-600 mb-1">Active</div>
          <div className="text-3xl font-bold text-gray-900">{statistics.active || 0}</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
          <div className="text-sm font-medium text-gray-600 mb-1">At Risk</div>
          <div className="text-3xl font-bold text-gray-900">{statistics.atRisk || 0}</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <div className="text-sm font-medium text-gray-600 mb-1">Extended</div>
          <div className="text-3xl font-bold text-gray-900">{statistics.extended || 0}</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-emerald-500">
          <div className="text-sm font-medium text-gray-600 mb-1">Confirmed</div>
          <div className="text-3xl font-bold text-gray-900">{statistics.confirmed || 0}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-8">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Probation Cases
            </button>
            <button
              onClick={() => setActiveTab('at-risk')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'at-risk'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              At Risk ({statistics.atRisk || 0})
            </button>
          </nav>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading probation cases...</p>
          </div>
        ) : probationCases.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No probation cases found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Days Remaining
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    End Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {probationCases.map((probationCase) => {
                  const daysRemaining = calculateDaysRemaining(probationCase.probationEndDate);
                  const progress = getProgressPercentage(probationCase);

                  return (
                    <tr key={probationCase.probationId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <span className="text-purple-600 font-semibold">
                              {probationCase.employee.firstName[0]}{probationCase.employee.lastName[0]}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {probationCase.employee.firstName} {probationCase.employee.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{probationCase.employee.employeeCode}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {probationCase.employee.department?.departmentName || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <ProbationStatusChip state={probationCase.currentState} />
                          {probationCase.isAtRisk && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
                              ⚠ At Risk - {probationCase.riskLevel}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                          <span className="ml-2 text-sm text-gray-600">{Math.round(progress)}%</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {probationCase.review30Completed && '30✓ '}
                          {probationCase.review60Completed && '60✓ '}
                          {probationCase.finalReviewCompleted && 'Final✓'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`text-sm font-medium ${
                            daysRemaining < 7
                              ? 'text-red-600'
                              : daysRemaining < 30
                              ? 'text-yellow-600'
                              : 'text-gray-900'
                          }`}
                        >
                          {daysRemaining} days
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(probationCase.probationEndDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-3">
                          View Details
                        </button>
                        <button className="text-green-600 hover:text-green-900">
                          Submit Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernProbationTracker;
