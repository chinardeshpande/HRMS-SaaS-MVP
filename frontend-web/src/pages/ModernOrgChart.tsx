import { useState, useEffect } from 'react';
import { ModernLayout } from '../components/layout/ModernLayout';
import { OrgChart } from '../components/orgchart/OrgChart';
import { OrgChartEmployee } from '../components/orgchart/OrgChartNode';
import {
  UserGroupIcon,
  ChartBarIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  XMarkIcon,
  ArrowRightIcon,
  BuildingOffice2Icon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export const ModernOrgChart = () => {
  const { user } = useAuth();
  const [orgData, setOrgData] = useState<OrgChartEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showApprovalChain, setShowApprovalChain] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<OrgChartEmployee | null>(null);
  const [approvalChain, setApprovalChain] = useState<OrgChartEmployee[]>([]);

  useEffect(() => {
    fetchOrgStructure();
  }, []);

  const fetchOrgStructure = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get token from localStorage (stored by AuthContext)
      const tokensStr = localStorage.getItem('tokens');
      if (!tokensStr) {
        setError('Not authenticated. Please login again.');
        setLoading(false);
        return;
      }

      const tokens = JSON.parse(tokensStr);
      const token = tokens.token;

      const response = await axios.get(`${API_BASE_URL}/org-structure`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setOrgData(response.data.data);
      } else {
        setError('Failed to load organizational structure');
      }
    } catch (err: any) {
      console.error('Error fetching org structure:', err);
      setError(err.response?.data?.error || 'Failed to load organizational structure');
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovalChain = async (employeeId: string) => {
    try {
      // Get token from localStorage (stored by AuthContext)
      const tokensStr = localStorage.getItem('tokens');
      if (!tokensStr) {
        return;
      }

      const tokens = JSON.parse(tokensStr);
      const token = tokens.token;

      const response = await axios.get(
        `${API_BASE_URL}/org-structure/approval-chain/${employeeId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setApprovalChain(response.data.data);
        setShowApprovalChain(true);
      }
    } catch (err: any) {
      console.error('Error fetching approval chain:', err);
    }
  };

  const handleNodeClick = (employee: OrgChartEmployee) => {
    setSelectedEmployee(employee);
    fetchApprovalChain(employee.employeeId);
  };

  const getRoleDescription = () => {
    switch (user?.role?.toUpperCase()) {
      case 'EMPLOYEE':
        return 'You can see your manager and team members who report to the same manager.';
      case 'MANAGER':
        return 'You can see your manager (if any), yourself, and all your direct reports.';
      case 'HR_ADMIN':
      case 'SYSTEM_ADMIN':
        return 'You can see the complete organizational structure across all departments.';
      default:
        return '';
    }
  };

  const getOrgStats = () => {
    const countEmployees = (employees: OrgChartEmployee[]): number => {
      return employees.reduce((count, emp) => {
        return count + 1 + (emp.directReports ? countEmployees(emp.directReports) : 0);
      }, 0);
    };

    const totalEmployees = countEmployees(orgData);
    const currentUser = findCurrentUser(orgData);
    const teamSize = currentUser?.directReports?.length || 0;

    return { totalEmployees, teamSize };
  };

  const findCurrentUser = (employees: OrgChartEmployee[]): OrgChartEmployee | null => {
    for (const emp of employees) {
      if (emp.isCurrentUser) return emp;
      if (emp.directReports) {
        const found = findCurrentUser(emp.directReports);
        if (found) return found;
      }
    }
    return null;
  };

  const stats = getOrgStats();

  return (
    <ModernLayout>
      <div className="space-y-4">
        {/* Compact Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <BuildingOffice2Icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Organization Chart</h1>
                <p className="text-xs text-gray-500 mt-0.5">{getRoleDescription()}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* Compact Stats */}
              <div className="flex items-center space-x-4 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-2">
                  <UserGroupIcon className="w-4 h-4 text-purple-600" />
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-medium">Employees</p>
                    <p className="text-lg font-bold text-gray-900">{stats.totalEmployees}</p>
                  </div>
                </div>
                {user?.role?.toUpperCase() === 'MANAGER' && (
                  <>
                    <div className="w-px h-8 bg-gray-300"></div>
                    <div className="flex items-center space-x-2">
                      <ChartBarIcon className="w-4 h-4 text-green-600" />
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-medium">Team</p>
                        <p className="text-lg font-bold text-gray-900">{stats.teamSize}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={fetchOrgStructure}
                className="btn btn-sm btn-secondary flex items-center space-x-1.5 px-3 py-2"
                disabled={loading}
              >
                <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="text-xs">Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Org Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Hierarchy View</h2>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1.5 text-xs text-gray-600">
                <div className="w-3 h-3 bg-purple-500 rounded"></div>
                <span>You</span>
              </div>
              <div className="flex items-center space-x-1.5 text-xs text-gray-600">
                <div className="w-3 h-3 border border-gray-300 rounded bg-white"></div>
                <span>Team</span>
              </div>
              <div className="text-xs text-gray-400">
                💡 Click any employee for approval chain
              </div>
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center h-48">
              <div className="flex flex-col items-center space-y-3">
                <ArrowPathIcon className="w-10 h-10 text-purple-600 animate-spin" />
                <p className="text-sm text-gray-600">Loading...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <p className="text-sm text-red-600 mb-3">{error}</p>
                <button onClick={fetchOrgStructure} className="btn btn-sm btn-primary">
                  Try Again
                </button>
              </div>
            </div>
          )}

          {!loading && !error && orgData.length > 0 && (
            <OrgChart
              employees={orgData}
              showApprovalChain={showApprovalChain}
              onNodeClick={handleNodeClick}
            />
          )}

          {!loading && !error && orgData.length === 0 && (
            <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg">
              <div className="text-center">
                <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600">No organizational data available</p>
              </div>
            </div>
          )}
        </div>

        {/* Compact Info */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <InformationCircleIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-bold text-blue-900 mb-1.5">Approval Flow</h3>
              <p className="text-xs text-blue-800 leading-relaxed">
                Leave requests → Attendance corrections → Performance reviews all follow your reporting structure.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Approval Chain Modal */}
      {showApprovalChain && approvalChain.length > 0 && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-5 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Approval Chain</h3>
                  <p className="text-sm text-orange-100 mt-0.5">
                    {selectedEmployee?.firstName} {selectedEmployee?.lastName}
                  </p>
                </div>
                <button
                  onClick={() => setShowApprovalChain(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Modal Body - Approval Flow */}
            <div className="p-5">
              <div className="space-y-2">
                {approvalChain.map((approver, index) => (
                  <div key={approver.employeeId}>
                    {/* Approver Card */}
                    <div className="relative">
                      <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200">
                        {/* Level Badge */}
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-sm">
                          {approver.approvalLevel}
                        </div>

                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center">
                            <span className="text-white text-sm font-semibold">
                              {approver.firstName.charAt(0)}
                              {approver.lastName.charAt(0)}
                            </span>
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">
                            {approver.firstName} {approver.lastName}
                          </p>
                          <p className="text-xs text-gray-600 truncate">
                            {approver.designation?.name}
                          </p>
                        </div>

                        {/* Role Badge */}
                        {index === 0 && (
                          <span className="px-2 py-1 bg-orange-600 text-white text-[10px] font-bold rounded uppercase">
                            Self
                          </span>
                        )}
                        {index === 1 && (
                          <span className="px-2 py-1 bg-orange-700 text-white text-[10px] font-bold rounded uppercase">
                            Manager
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Arrow Connector */}
                    {index < approvalChain.length - 1 && (
                      <div className="flex items-center justify-center py-1">
                        <ArrowRightIcon className="w-5 h-5 text-orange-400 transform rotate-90" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Info Footer */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-800">
                  <strong className="font-semibold">Sequential Approval:</strong> Each level must approve before moving to the next.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </ModernLayout>
  );
};

export default ModernOrgChart;
