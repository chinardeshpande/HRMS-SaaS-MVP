import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ModernLayout } from '../components/layout/ModernLayout';
import onboardingService from '../services/onboardingService';
import probationService from '../services/probationService';
import OnboardingStatusChip from '../components/onboarding/OnboardingStatusChip';
import ProbationStatusChip from '../components/probation/ProbationStatusChip';
import {
  UserPlusIcon,
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface Candidate {
  candidateId: string;
  firstName: string;
  lastName: string;
  email: string;
  currentState: string;
  offeredSalary: number;
  expectedJoinDate: string;
  department?: { departmentName: string; name?: string };
  designation?: { designationName: string; name?: string };
}

interface ProbationCase {
  probationId: string;
  employee: {
    employeeId: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
    department?: { name: string };
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

const ModernOnboardingDashboard: React.FC = () => {
  const navigate = useNavigate();

  // Onboarding state
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);
  const [pipeline, setPipeline] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Probation state
  const [probationCases, setProbationCases] = useState<ProbationCase[]>([]);
  const [probationStats, setProbationStats] = useState<Record<string, number>>({});
  const [probationLoading, setProbationLoading] = useState(true);
  const [atRiskOnly, setAtRiskOnly] = useState(false);

  // Active view
  const [activeView, setActiveView] = useState<'all-candidates' | 'pending'>('all-candidates');

  useEffect(() => {
    if (activeView === 'all-candidates') {
      fetchData();
    } else {
      fetchProbationData();
    }
  }, [activeView, atRiskOnly]);

  useEffect(() => {
    filterCandidates();
  }, [activeFilter, searchTerm, allCandidates]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [candidatesRes, pipelineRes] = await Promise.all([
        onboardingService.getAllCandidates({}),
        onboardingService.getOnboardingPipeline(),
      ]);

      setAllCandidates(candidatesRes.data || []);
      setPipeline(pipelineRes.data || {});
    } catch (error) {
      console.error('Error fetching onboarding data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProbationData = async () => {
    try {
      setProbationLoading(true);
      const [casesRes, statsRes] = await Promise.all([
        atRiskOnly
          ? probationService.getAtRiskEmployees()
          : probationService.getAllProbationCases(),
        probationService.getProbationStatistics(),
      ]);
      setProbationCases(casesRes.data || []);
      setProbationStats(statsRes.data || {});
    } catch (error) {
      console.error('Error fetching probation data:', error);
    } finally {
      setProbationLoading(false);
    }
  };

  const filterCandidates = () => {
    let filtered = [...allCandidates];

    // EXCLUDE candidates who have completed onboarding (they should appear in Employee list instead)
    const completedStates = ['joined', 'orientation', 'onboarding_complete'];
    filtered = filtered.filter(c => !completedStates.includes(c.currentState));

    // Filter by status dropdown
    if (activeFilter !== 'all') {
      filtered = filtered.filter(c => c.currentState === activeFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.firstName.toLowerCase().includes(search) ||
        c.lastName.toLowerCase().includes(search) ||
        c.email.toLowerCase().includes(search)
      );
    }

    setCandidates(filtered);
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

  const getTotalCandidates = () => {
    return Object.values(pipeline).reduce((sum, count) => sum + count, 0);
  };

  const pipelineStages = [
    { key: 'offer_approved', label: 'Offer Approved', color: 'bg-blue-500' },
    { key: 'offer_sent', label: 'Offer Sent', color: 'bg-indigo-500' },
    { key: 'offer_accepted', label: 'Offer Accepted', color: 'bg-green-500' },
    { key: 'docs_pending', label: 'Docs Pending', color: 'bg-yellow-500' },
    { key: 'bgv_in_progress', label: 'BGV In Progress', color: 'bg-orange-500' },
    { key: 'pre_joining_setup', label: 'Pre-Joining Setup', color: 'bg-cyan-500' },
    // Note: 'joined', 'orientation', 'onboarding_complete' are excluded - they appear in Employee list
  ];

  const handleExportCSV = () => {
    if (candidates.length === 0) {
      alert('No records to export');
      return;
    }

    const headers = ['Name', 'Email', 'Department', 'Designation', 'Status', 'Expected Join Date', 'Offered Salary'];
    const rows = candidates.map(candidate => [
      `${candidate.firstName} ${candidate.lastName}`,
      candidate.email,
      candidate.department?.departmentName || '-',
      candidate.designation?.designationName || '-',
      candidate.currentState.replace(/_/g, ' ').toUpperCase(),
      candidate.expectedJoinDate ? new Date(candidate.expectedJoinDate).toLocaleDateString('en-GB') : '-',
      candidate.offeredSalary || '-',
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
    link.download = `candidates-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <ModernLayout>
      <div className="space-y-6">
        {/* Header - Matching Leave Management Design */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Left: Title with Icon */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <UserPlusIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Onboarding & Probation</h1>
                <p className="text-sm text-gray-500">Manage candidates and probation period employees</p>
              </div>
            </div>

            {/* Center: Tab Navigation */}
            <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg flex-shrink-0">
              <button
                onClick={() => setActiveView('all-candidates')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center space-x-2 ${
                  activeView === 'all-candidates'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ClipboardDocumentCheckIcon className="h-4 w-4" />
                <span>Candidate Pipeline</span>
              </button>

              <button
                onClick={() => setActiveView('pending')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center space-x-2 ${
                  activeView === 'pending'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <UserGroupIcon className="h-4 w-4" />
                <span>Probation Tracker</span>
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
        {activeView === 'all-candidates' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Total Candidates */}
            <div
              onClick={() => setActiveFilter('all')}
              className={`bg-white rounded-xl shadow-sm border-2 p-6 hover:shadow-lg transition-all cursor-pointer ${
                activeFilter === 'all' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Candidates</p>
                  <p className="text-3xl font-bold text-gray-900">{getTotalCandidates()}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <ChartBarIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Pending Verification */}
            <div
              onClick={() => setActiveFilter('hr_review')}
              className={`bg-white rounded-xl shadow-sm border-2 p-6 hover:shadow-lg transition-all cursor-pointer ${
                activeFilter === 'hr_review' ? 'border-warning-500 ring-2 ring-warning-200' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Pending Verification</p>
                  <p className="text-3xl font-bold text-gray-900">{pipeline.hr_review || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-warning-100 flex items-center justify-center">
                  <ClockIcon className="h-6 w-6 text-warning-600" />
                </div>
              </div>
            </div>

            {/* BGV In Progress */}
            <div
              onClick={() => setActiveFilter('bgv_in_progress')}
              className={`bg-white rounded-xl shadow-sm border-2 p-6 hover:shadow-lg transition-all cursor-pointer ${
                activeFilter === 'bgv_in_progress' ? 'border-orange-500 ring-2 ring-orange-200' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">BGV In Progress</p>
                  <p className="text-3xl font-bold text-gray-900">{pipeline.bgv_in_progress || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <ShieldCheckIcon className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>

            {/* Joining This Month */}
            <div
              onClick={() => setActiveFilter('pre_joining_setup')}
              className={`bg-white rounded-xl shadow-sm border-2 p-6 hover:shadow-lg transition-all cursor-pointer ${
                activeFilter === 'pre_joining_setup' ? 'border-success-500 ring-2 ring-success-200' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Joining This Month</p>
                  <p className="text-3xl font-bold text-gray-900">{pipeline.pre_joining_setup || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-success-100 flex items-center justify-center">
                  <CheckCircleIcon className="h-6 w-6 text-success-600" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Total Probation */}
            <div
              onClick={() => setAtRiskOnly(false)}
              className={`bg-white rounded-xl shadow-sm border-2 p-6 hover:shadow-lg transition-all cursor-pointer ${
                !atRiskOnly ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Probation</p>
                  <p className="text-3xl font-bold text-gray-900">{probationStats.total || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <UserGroupIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Active Probation */}
            <div
              onClick={() => setAtRiskOnly(false)}
              className={`bg-white rounded-xl shadow-sm border-2 p-6 hover:shadow-lg transition-all cursor-pointer ${
                !atRiskOnly ? 'border-success-500 ring-2 ring-success-200' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Active Probation</p>
                  <p className="text-3xl font-bold text-gray-900">{probationStats.active || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-success-100 flex items-center justify-center">
                  <ClockIcon className="h-6 w-6 text-success-600" />
                </div>
              </div>
            </div>

            {/* At Risk */}
            <div
              onClick={() => setAtRiskOnly(true)}
              className={`bg-white rounded-xl shadow-sm border-2 p-6 hover:shadow-lg transition-all cursor-pointer ${
                atRiskOnly ? 'border-danger-500 ring-2 ring-danger-200' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">At Risk</p>
                  <p className="text-3xl font-bold text-gray-900">{probationStats.atRisk || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-danger-100 flex items-center justify-center">
                  <ExclamationTriangleIcon className="h-6 w-6 text-danger-600" />
                </div>
              </div>
            </div>

            {/* Confirmed */}
            <div
              onClick={() => setAtRiskOnly(false)}
              className={`bg-white rounded-xl shadow-sm border-2 p-6 hover:shadow-lg transition-all cursor-pointer ${
                !atRiskOnly ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Confirmed</p>
                  <p className="text-3xl font-bold text-gray-900">{probationStats.confirmed || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircleIcon className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters Section - Matching Leave Management Design */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by candidate name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Status Filter */}
            <div className="sm:w-56">
              <select
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                onChange={(e) => setActiveFilter(e.target.value)}
                value={activeFilter}
              >
                <option value="all">All Status</option>
                <option value="offer_approved">Offer Approved</option>
                <option value="offer_sent">Offer Sent</option>
                <option value="offer_accepted">Offer Accepted</option>
                <option value="docs_pending">Docs Pending</option>
                <option value="hr_review">HR Review</option>
                <option value="bgv_in_progress">BGV In Progress</option>
                <option value="pre_joining_setup">Pre-Joining Setup</option>
                <option value="joined">Joined</option>
              </select>
            </div>
          </div>
        </div>

        {/* Candidates/Probation Table */}
        {activeView === 'all-candidates' ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Candidates</h2>
              <button
                onClick={fetchData}
                className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all flex items-center space-x-1.5 text-xs font-medium"
              >
                <ArrowPathIcon className="h-3.5 w-3.5" />
                <span>Refresh</span>
              </button>
            </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-indigo-600"></div>
            <p className="mt-4 text-gray-600">Loading candidates...</p>
          </div>
        ) : candidates.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">No candidates found</p>
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
                    Candidate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Expected Join Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Offered Salary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {candidates.map((candidate) => (
                  <tr
                    key={candidate.candidateId}
                    onClick={() => navigate(`/onboarding/candidate/${candidate.candidateId}`)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-sm">
                          <span className="text-white font-semibold text-sm">
                            {candidate.firstName[0]}{candidate.lastName[0]}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {candidate.firstName} {candidate.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{candidate.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{candidate.department?.departmentName || '-'}</div>
                      <div className="text-xs text-gray-500">{candidate.designation?.designationName || '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {candidate.expectedJoinDate ? new Date(candidate.expectedJoinDate).toLocaleDateString('en-GB') : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {candidate.offeredSalary ? `₹${candidate.offeredSalary.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <OnboardingStatusChip state={candidate.currentState} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Probation Cases</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setAtRiskOnly(!atRiskOnly)}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 text-xs font-medium ${
                    atRiskOnly
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <ExclamationTriangleIcon className="h-3.5 w-3.5" />
                  <span>At Risk Only</span>
                </button>
                <button
                  onClick={fetchProbationData}
                  className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all flex items-center space-x-1.5 text-xs font-medium"
                >
                  <ArrowPathIcon className="h-3.5 w-3.5" />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {probationLoading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-indigo-600"></div>
                <p className="mt-4 text-gray-600">Loading probation cases...</p>
              </div>
            ) : probationCases.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-500">
                  {atRiskOnly ? 'No at-risk probation cases found' : 'No probation cases found'}
                </p>
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
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Progress
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Days Left
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        End Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {probationCases.map((probationCase) => {
                      const daysRemaining = calculateDaysRemaining(probationCase.probationEndDate);
                      const progress = getProgressPercentage(probationCase);

                      return (
                        <tr
                          key={probationCase.probationId}
                          onClick={() => navigate(`/probation/case/${probationCase.probationId}`)}
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-sm">
                                <span className="text-white font-semibold text-sm">
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
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {probationCase.employee.department?.name || '-'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <ProbationStatusChip state={probationCase.currentState} />
                              {probationCase.isAtRisk && (
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
                                  ⚠ {probationCase.riskLevel || 'At Risk'}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="w-32">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-gray-600">{Math.round(progress)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-indigo-600 h-2 rounded-full transition-all"
                                  style={{ width: `${progress}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
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
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {new Date(probationCase.probationEndDate).toLocaleDateString('en-GB')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </ModernLayout>
  );
};

export default ModernOnboardingDashboard;
