import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ModernLayout } from '../components/layout/ModernLayout';
import exitService from '../services/exitService';
import ExitStatusChip from '../components/exit/ExitStatusChip';
import {
  ArrowRightOnRectangleIcon,
  PlusIcon,
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

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
  const [allExitCases, setAllExitCases] = useState<ExitCase[]>([]);
  const [pipeline, setPipeline] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [activeView, setActiveView] = useState<'all-cases' | 'pending' | 'active'>('all-cases');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterCases();
  }, [activeFilter, activeView, searchTerm, allExitCases]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [casesRes, statsRes] = await Promise.all([
        exitService.getAllExitCases({}),
        exitService.getExitStatistics(),
      ]);

      setAllExitCases(casesRes.data || []);

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

  const filterCases = () => {
    let filtered = [...allExitCases];

    // Filter by active view
    if (activeView === 'pending') {
      filtered = filtered.filter(c => c.currentState === 'resignation_submitted');
    } else if (activeView === 'active') {
      filtered = filtered.filter(c =>
        c.currentState === 'notice_period_active' ||
        c.currentState === 'clearance_in_progress' ||
        c.currentState === 'assets_pending'
      );
    }

    // Filter by status dropdown
    if (activeFilter !== 'all') {
      filtered = filtered.filter(c => c.currentState === activeFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.employee.firstName.toLowerCase().includes(search) ||
        c.employee.lastName.toLowerCase().includes(search) ||
        c.employee.email.toLowerCase().includes(search)
      );
    }

    setExitCases(filtered);
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

  const handleExportCSV = () => {
    if (exitCases.length === 0) {
      alert('No records to export');
      return;
    }

    const headers = ['Employee Code', 'Employee Name', 'Department', 'Designation', 'Status', 'Resignation Date', 'Last Working Date'];
    const rows = exitCases.map(exitCase => [
      exitCase.employee?.email?.split('@')[0] || '-',
      `${exitCase.employee?.firstName} ${exitCase.employee?.lastName}`,
      exitCase.employee?.department?.departmentName || '-',
      exitCase.employee?.designation?.designationName || '-',
      exitCase.currentState.replace(/_/g, ' ').toUpperCase(),
      exitCase.resignationSubmittedDate || '-',
      exitCase.lastWorkingDate || '-',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `exit-cases-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <ModernLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Left: Title with Icon */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/30">
                <ArrowRightOnRectangleIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Exit Management</h1>
                <p className="text-sm text-gray-500">Manage employee exits and offboarding process</p>
              </div>
            </div>

            {/* Center: Tab Navigation */}
            <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg flex-shrink-0">
              <button
                onClick={() => setActiveView('all-cases')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center space-x-2 ${
                  activeView === 'all-cases'
                    ? 'bg-white text-red-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ClipboardDocumentCheckIcon className="h-4 w-4" />
                <span>All Cases</span>
              </button>

              <button
                onClick={() => setActiveView('pending')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center space-x-2 ${
                  activeView === 'pending'
                    ? 'bg-white text-red-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <UserGroupIcon className="h-4 w-4" />
                <span>Pending Approvals</span>
              </button>

              <button
                onClick={() => setActiveView('active')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center space-x-2 ${
                  activeView === 'active'
                    ? 'bg-white text-red-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <BuildingOfficeIcon className="h-4 w-4" />
                <span>In Progress</span>
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

      {/* Stats Cards - Matching Leave Management Design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Total Exit Cases */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Exit Cases</p>
              <p className="text-3xl font-bold text-gray-900">{pipeline.total || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Pending</p>
              <p className="text-3xl font-bold text-gray-900">{pipeline.resignation_submitted || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-warning-100 flex items-center justify-center">
              <ClockIcon className="h-6 w-6 text-warning-600" />
            </div>
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">In Progress</p>
              <p className="text-3xl font-bold text-gray-900">{(pipeline.notice_period_active || 0) + (pipeline.clearance_in_progress || 0)}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <ArrowRightOnRectangleIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Completed</p>
              <p className="text-3xl font-bold text-gray-900">{pipeline.exit_completed || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-success-100 flex items-center justify-center">
              <CheckCircleIcon className="h-6 w-6 text-success-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section - Matching Leave Management Design */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by employee name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Status Filter */}
          <div className="sm:w-56">
            <select
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
              onChange={(e) => setActiveFilter(e.target.value)}
              value={activeFilter}
            >
              <option value="all">All Status</option>
              <option value="resignation_submitted">Pending Approval</option>
              <option value="notice_period_active">Notice Period</option>
              <option value="clearance_in_progress">Clearance</option>
              <option value="assets_pending">Assets Pending</option>
              <option value="exit_interview_pending">Exit Interview</option>
              <option value="settlement_calculated">Settlement</option>
              <option value="exit_completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Exit Cases Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Exit Cases</h2>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-red-600"></div>
            <p className="mt-4 text-gray-600">Loading exit cases...</p>
          </div>
        ) : exitCases.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">No exit cases found</p>
            {activeFilter !== 'all' && (
              <p className="text-sm text-gray-400 mt-2">Try changing the filter</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Resignation Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Last Working Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {exitCases.map((exitCase) => (
                    <tr key={exitCase.exitId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-sm">
                            <span className="text-white font-semibold text-sm">
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
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{exitCase.employee.department?.departmentName || '-'}</div>
                        <div className="text-xs text-gray-500">{exitCase.employee.designation?.designationName || '-'}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {exitCase.resignationSubmittedDate ? new Date(exitCase.resignationSubmittedDate).toLocaleDateString('en-GB') : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {new Date(exitCase.lastWorkingDate).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-6 py-4">
                        <ExitStatusChip state={exitCase.currentState} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => navigate(`/exit/${exitCase.exitId}`)}
                          className="text-red-600 hover:text-red-800 font-medium text-sm transition-colors"
                        >
                          View Details →
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
