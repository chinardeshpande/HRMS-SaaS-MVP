import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ModernLayout } from '../components/layout/ModernLayout';
import exitService from '../services/exitService';
import ExitStatusChip from '../components/exit/ExitStatusChip';

interface ExitCase {
  exitId: string;
  employeeId: string;
  currentState: string;
  resignationType: string;
  lastWorkingDate: string;
  resignationSubmittedDate: string;
  employee: {
    firstName: string;
    lastName: string;
    email: string;
    department?: { departmentName: string };
    designation?: { designationName: string };
  };
}

const ModernExitDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [exitCases, setExitCases] = useState<ExitCase[]>([]);
  const [pipeline, setPipeline] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, [activeFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [casesRes, statsRes] = await Promise.all([
        exitService.getAllExitCases(activeFilter !== 'all' ? { state: activeFilter } : {}),
        exitService.getExitStatistics(),
      ]);

      setExitCases(casesRes.data || []);
      // Convert statistics to pipeline format
      const stats = statsRes.data || {};
      setPipeline({
        resignation_submitted: stats.pending_approval || 0,
        notice_period_active: stats.notice_period || 0,
        clearance_in_progress: stats.clearance_pending || 0,
        assets_pending: stats.assets_pending || 0,
        exit_completed: stats.exit_completed || 0,
        total: stats.total || 0,
      });
    } catch (error) {
      console.error('Error fetching exit data:', error);
    } finally {
      setLoading(false);
    }
  };

  const pipelineStages = [
    { key: 'resignation_submitted', label: 'Pending Approval', color: 'bg-yellow-500' },
    { key: 'notice_period_active', label: 'Notice Period', color: 'bg-blue-500' },
    { key: 'clearance_in_progress', label: 'Clearance', color: 'bg-indigo-500' },
    { key: 'assets_pending', label: 'Assets Pending', color: 'bg-orange-500' },
    { key: 'exit_interview_pending', label: 'Exit Interview', color: 'bg-purple-500' },
    { key: 'settlement_calculated', label: 'Settlement', color: 'bg-green-500' },
    { key: 'exit_completed', label: 'Completed', color: 'bg-emerald-500' },
  ];

  return (
    <ModernLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Exit Management Dashboard</h1>
          <p className="text-gray-600">Manage employee exits and offboarding process</p>
        </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="text-sm font-medium text-gray-600 mb-1">Total Exit Cases</div>
          <div className="text-3xl font-bold text-gray-900">{pipeline.total || 0}</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
          <div className="text-sm font-medium text-gray-600 mb-1">Pending Approval</div>
          <div className="text-3xl font-bold text-gray-900">{pipeline.resignation_submitted || 0}</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
          <div className="text-sm font-medium text-gray-600 mb-1">In Clearance</div>
          <div className="text-3xl font-bold text-gray-900">{pipeline.clearance_in_progress || 0}</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="text-sm font-medium text-gray-600 mb-1">Exiting This Month</div>
          <div className="text-3xl font-bold text-gray-900">{pipeline.assets_pending || 0}</div>
        </div>
      </div>

      {/* Pipeline Overview */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Pipeline Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {pipelineStages.map((stage) => (
            <div
              key={stage.key}
              className="text-center cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors"
              onClick={() => setActiveFilter(stage.key)}
            >
              <div className={`${stage.color} text-white rounded-lg p-3 mb-2`}>
                <div className="text-2xl font-bold">{pipeline[stage.key] || 0}</div>
              </div>
              <div className="text-xs font-medium text-gray-700">{stage.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Exit Cases Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Exit Cases {activeFilter !== 'all' && `- ${activeFilter.replace(/_/g, ' ').toUpperCase()}`}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                activeFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading exit cases...</p>
          </div>
        ) : exitCases.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No exit cases found {activeFilter !== 'all' && `in ${activeFilter.replace(/_/g, ' ')} state`}
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
                    Designation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Working Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {exitCases.map((exitCase) => (
                    <tr key={exitCase.exitId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-semibold">
                              {exitCase.employee.firstName[0]}{exitCase.employee.lastName[0]}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {exitCase.employee.firstName} {exitCase.employee.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{exitCase.employee.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {exitCase.employee.department?.departmentName || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {exitCase.employee.designation?.designationName || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <ExitStatusChip state={exitCase.currentState} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(exitCase.lastWorkingDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => navigate(`/exit/${exitCase.exitId}`)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
    </ModernLayout>
  );
};

export default ModernExitDashboard;
