import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ModernLayout } from '../components/layout/ModernLayout';
import onboardingService from '../services/onboardingService';
import probationService from '../services/probationService';
import OnboardingStatusChip from '../components/onboarding/OnboardingStatusChip';
import ProbationStatusChip from '../components/probation/ProbationStatusChip';
import {
  UserPlusIcon,
  ClipboardDocumentCheckIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface Candidate {
  candidateId: string;
  firstName: string;
  lastName: string;
  email: string;
  currentState: string;
  offeredSalary: number;
  expectedJoinDate: string;
  department?: { name: string };
  designation?: { name: string };
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

export default function ModernOnboarding() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'onboarding' | 'probation'>('onboarding');

  // Onboarding state
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [pipeline, setPipeline] = useState<Record<string, number>>({});
  const [onboardingLoading, setOnboardingLoading] = useState(true);

  // Probation state
  const [probationCases, setProbationCases] = useState<ProbationCase[]>([]);
  const [probationStats, setProbationStats] = useState<Record<string, number>>({});
  const [probationLoading, setProbationLoading] = useState(true);

  // Filters
  const [atRiskOnly, setAtRiskOnly] = useState(false);
  const [selectedOnboardingState, setSelectedOnboardingState] = useState<string | null>(null);
  const [selectedProbationState, setSelectedProbationState] = useState<string | null>(null);

  // Create Candidate Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCandidate, setNewCandidate] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    departmentId: '',
    designationId: '',
    offeredSalary: '',
    expectedJoinDate: '',
  });

  // Notification
  const [notification, setNotification] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  });

  useEffect(() => {
    if (activeTab === 'onboarding') {
      fetchOnboardingData();
    } else {
      fetchProbationData();
    }
  }, [activeTab, atRiskOnly]);

  const fetchOnboardingData = async () => {
    try {
      setOnboardingLoading(true);
      const [candidatesRes, pipelineRes] = await Promise.all([
        onboardingService.getAllCandidates(),
        onboardingService.getOnboardingPipeline(),
      ]);
      setCandidates(candidatesRes.data || []);
      setPipeline(pipelineRes.data || {});
    } catch (error) {
      console.error('Error fetching onboarding data:', error);
      showNotification('Failed to load onboarding data', 'error');
    } finally {
      setOnboardingLoading(false);
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
      showNotification('Failed to load probation data', 'error');
    } finally {
      setProbationLoading(false);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleCreateCandidate = async () => {
    try {
      await onboardingService.createCandidate(newCandidate);
      showNotification('Candidate created successfully', 'success');
      setShowCreateModal(false);
      setNewCandidate({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        departmentId: '',
        designationId: '',
        offeredSalary: '',
        expectedJoinDate: '',
      });
      fetchOnboardingData();
    } catch (error: any) {
      showNotification(error.response?.data?.error?.message || 'Failed to create candidate', 'error');
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

  const getTotalCandidates = () => {
    return Object.values(pipeline).reduce((sum, count) => sum + count, 0);
  };

  const getFilteredCandidates = () => {
    if (!selectedOnboardingState) return candidates;
    return candidates.filter((c) => c.currentState === selectedOnboardingState);
  };

  const getFilteredProbationCases = () => {
    if (!selectedProbationState) return probationCases;
    return probationCases.filter((p) => p.currentState === selectedProbationState);
  };

  const handleOnboardingTileClick = (state: string | null) => {
    setSelectedOnboardingState(selectedOnboardingState === state ? null : state);
  };

  const handleProbationTileClick = (state: string | null) => {
    setSelectedProbationState(selectedProbationState === state ? null : state);
  };

  return (
    <ModernLayout>
      {/* Notification */}
      {notification.show && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className={`rounded-lg px-4 py-3 shadow-xl ${notification.type === 'success' ? 'bg-success-600' : 'bg-danger-600'}`}>
            <p className="text-sm font-medium text-white">{notification.message}</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Onboarding & Probation Management</h1>
          <p className="text-sm text-gray-600 mt-1">Manage candidates and probation period employees</p>
        </div>

        {/* Tabs */}
        <div className="card border-2 border-gray-200 mb-4">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('onboarding')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'onboarding'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <UserPlusIcon className="h-5 w-5 mr-2" />
                  Candidate Pipeline
                </div>
              </button>
              <button
                onClick={() => setActiveTab('probation')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'probation'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <ClipboardDocumentCheckIcon className="h-5 w-5 mr-2" />
                  Probation Tracker
                  {probationStats.atRisk > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                      {probationStats.atRisk}
                    </span>
                  )}
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Onboarding Tab */}
        {activeTab === 'onboarding' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div
                onClick={() => handleOnboardingTileClick(null)}
                className={`card border-2 cursor-pointer transition-all hover:shadow-lg ${
                  selectedOnboardingState === null
                    ? 'border-blue-500 bg-gradient-to-br from-blue-100 to-cyan-100 ring-2 ring-blue-300'
                    : 'border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50'
                }`}
              >
                <div className="card-body p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-blue-700">TOTAL</p>
                      <p className="text-2xl font-bold text-primary-600">{getTotalCandidates()}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <UserPlusIcon className="h-6 w-6 text-primary-600" />
                    </div>
                  </div>
                </div>
              </div>

              <div
                onClick={() => handleOnboardingTileClick('hr_review')}
                className={`card border-2 cursor-pointer transition-all hover:shadow-lg ${
                  selectedOnboardingState === 'hr_review'
                    ? 'border-yellow-500 bg-gradient-to-br from-yellow-100 to-amber-100 ring-2 ring-yellow-300'
                    : 'border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50'
                }`}
              >
                <div className="card-body p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-yellow-700">PENDING VERIFY</p>
                      <p className="text-2xl font-bold text-warning-600">{pipeline.hr_review || 0}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-warning-100 flex items-center justify-center">
                      <ClipboardDocumentCheckIcon className="h-6 w-6 text-warning-600" />
                    </div>
                  </div>
                </div>
              </div>

              <div
                onClick={() => handleOnboardingTileClick('bgv_in_progress')}
                className={`card border-2 cursor-pointer transition-all hover:shadow-lg ${
                  selectedOnboardingState === 'bgv_in_progress'
                    ? 'border-orange-500 bg-gradient-to-br from-orange-100 to-red-100 ring-2 ring-orange-300'
                    : 'border-orange-200 bg-gradient-to-br from-orange-50 to-red-50'
                }`}
              >
                <div className="card-body p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-orange-700">BGV PROGRESS</p>
                      <p className="text-2xl font-bold text-orange-600">{pipeline.bgv_in_progress || 0}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                      <ArrowPathIcon className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </div>
              </div>

              <div
                onClick={() => handleOnboardingTileClick('pre_joining_setup')}
                className={`card border-2 cursor-pointer transition-all hover:shadow-lg ${
                  selectedOnboardingState === 'pre_joining_setup'
                    ? 'border-green-500 bg-gradient-to-br from-green-100 to-emerald-100 ring-2 ring-green-300'
                    : 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50'
                }`}
              >
                <div className="card-body p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-green-700">JOINING SOON</p>
                      <p className="text-2xl font-bold text-success-600">{pipeline.pre_joining_setup || 0}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-success-100 flex items-center justify-center">
                      <CheckCircleIcon className="h-6 w-6 text-success-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Candidates Table */}
            <div className="card border-2 border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Candidate Pipeline</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn btn-sm bg-blue-600 text-white hover:bg-blue-700"
                  >
                    <UserPlusIcon className="h-4 w-4 mr-1" />
                    Add Candidate
                  </button>
                  <button
                    onClick={fetchOnboardingData}
                    className="btn btn-sm btn-secondary"
                  >
                    <ArrowPathIcon className="h-4 w-4 mr-1" />
                    Refresh
                  </button>
                </div>
              </div>

              {onboardingLoading ? (
                <div className="p-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600 text-sm">Loading candidates...</p>
                </div>
              ) : getFilteredCandidates().length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">
                  {selectedOnboardingState ? `No candidates in ${selectedOnboardingState} state` : 'No candidates found'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Candidate
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
                          Expected Join
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getFilteredCandidates().map((candidate) => (
                        <tr
                          key={candidate.candidateId}
                          onClick={() => navigate(`/onboarding/candidate/${candidate.candidateId}`)}
                          className="hover:bg-gray-50 cursor-pointer"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-blue-600 font-semibold text-sm">
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {candidate.department?.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {candidate.designation?.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <OnboardingStatusChip state={candidate.currentState} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(candidate.expectedJoinDate).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* Probation Tab */}
        {activeTab === 'probation' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-5 gap-3 mb-4">
              <div
                onClick={() => handleProbationTileClick(null)}
                className={`card border-2 cursor-pointer transition-all hover:shadow-lg ${
                  selectedProbationState === null
                    ? 'border-blue-500 bg-gradient-to-br from-blue-100 to-cyan-100 ring-2 ring-blue-300'
                    : 'border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50'
                }`}
              >
                <div className="card-body p-3">
                  <p className="text-xs font-bold text-blue-700">TOTAL</p>
                  <p className="text-2xl font-bold text-primary-600">{probationStats.total || 0}</p>
                </div>
              </div>

              <div
                onClick={() => handleProbationTileClick('probation_active')}
                className={`card border-2 cursor-pointer transition-all hover:shadow-lg ${
                  selectedProbationState === 'probation_active'
                    ? 'border-green-500 bg-gradient-to-br from-green-100 to-emerald-100 ring-2 ring-green-300'
                    : 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50'
                }`}
              >
                <div className="card-body p-3">
                  <p className="text-xs font-bold text-green-700">ACTIVE</p>
                  <p className="text-2xl font-bold text-success-600">{probationStats.active || 0}</p>
                </div>
              </div>

              <div
                onClick={() => {
                  setAtRiskOnly(true);
                  setSelectedProbationState(null);
                }}
                className={`card border-2 cursor-pointer transition-all hover:shadow-lg ${
                  atRiskOnly
                    ? 'border-red-500 bg-gradient-to-br from-red-100 to-pink-100 ring-2 ring-red-300'
                    : 'border-red-200 bg-gradient-to-br from-red-50 to-pink-50'
                }`}
              >
                <div className="card-body p-3">
                  <p className="text-xs font-bold text-red-700">AT RISK</p>
                  <p className="text-2xl font-bold text-danger-600">{probationStats.atRisk || 0}</p>
                </div>
              </div>

              <div
                onClick={() => handleProbationTileClick('probation_extended')}
                className={`card border-2 cursor-pointer transition-all hover:shadow-lg ${
                  selectedProbationState === 'probation_extended'
                    ? 'border-purple-500 bg-gradient-to-br from-purple-100 to-indigo-100 ring-2 ring-purple-300'
                    : 'border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50'
                }`}
              >
                <div className="card-body p-3">
                  <p className="text-xs font-bold text-purple-700">EXTENDED</p>
                  <p className="text-2xl font-bold text-purple-600">{probationStats.extended || 0}</p>
                </div>
              </div>

              <div
                onClick={() => handleProbationTileClick('confirmed')}
                className={`card border-2 cursor-pointer transition-all hover:shadow-lg ${
                  selectedProbationState === 'confirmed'
                    ? 'border-emerald-500 bg-gradient-to-br from-emerald-100 to-teal-100 ring-2 ring-emerald-300'
                    : 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50'
                }`}
              >
                <div className="card-body p-3">
                  <p className="text-xs font-bold text-emerald-700">CONFIRMED</p>
                  <p className="text-2xl font-bold text-emerald-600">{probationStats.confirmed || 0}</p>
                </div>
              </div>
            </div>

            {/* Probation Table */}
            <div className="card border-2 border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Probation Cases</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAtRiskOnly(!atRiskOnly)}
                    className={`btn btn-sm ${atRiskOnly ? 'bg-red-600 text-white hover:bg-red-700' : 'btn-secondary'}`}
                  >
                    <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                    At Risk Only
                  </button>
                  <button
                    onClick={fetchProbationData}
                    className="btn btn-sm btn-secondary"
                  >
                    <ArrowPathIcon className="h-4 w-4 mr-1" />
                    Refresh
                  </button>
                </div>
              </div>

              {probationLoading ? (
                <div className="p-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600 text-sm">Loading probation cases...</p>
                </div>
              ) : getFilteredProbationCases().length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">
                  {selectedProbationState
                    ? `No probation cases in ${selectedProbationState} state`
                    : atRiskOnly
                    ? 'No at-risk probation cases found'
                    : 'No probation cases found'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
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
                          Days Left
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          End Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getFilteredProbationCases().map((probationCase) => {
                        const daysRemaining = calculateDaysRemaining(probationCase.probationEndDate);
                        const progress = getProgressPercentage(probationCase);

                        return (
                          <tr
                            key={probationCase.probationId}
                            onClick={() => navigate(`/probation/case/${probationCase.probationId}`)}
                            className="hover:bg-gray-50 cursor-pointer"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                  <span className="text-purple-600 font-semibold text-sm">
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
                              {probationCase.employee.department?.name || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col gap-1">
                                <ProbationStatusChip state={probationCase.currentState} />
                                {probationCase.isAtRisk && (
                                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
                                    ⚠ {probationCase.riskLevel || 'At Risk'}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="w-32">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-gray-600">{Math.round(progress)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full transition-all"
                                    style={{ width: `${progress}%` }}
                                  ></div>
                                </div>
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
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Create Candidate Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Candidate</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                <input
                  type="text"
                  value={newCandidate.firstName}
                  onChange={(e) => setNewCandidate({ ...newCandidate, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                <input
                  type="text"
                  value={newCandidate.lastName}
                  onChange={(e) => setNewCandidate({ ...newCandidate, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter last name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={newCandidate.email}
                  onChange={(e) => setNewCandidate({ ...newCandidate, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                <input
                  type="tel"
                  value={newCandidate.phone}
                  onChange={(e) => setNewCandidate({ ...newCandidate, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="+1-555-1234"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Offered Salary *</label>
                <input
                  type="number"
                  value={newCandidate.offeredSalary}
                  onChange={(e) => setNewCandidate({ ...newCandidate, offeredSalary: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="85000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expected Join Date *</label>
                <input
                  type="date"
                  value={newCandidate.expectedJoinDate}
                  onChange={(e) => setNewCandidate({ ...newCandidate, expectedJoinDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewCandidate({
                    firstName: '',
                    lastName: '',
                    email: '',
                    phone: '',
                    departmentId: '',
                    designationId: '',
                    offeredSalary: '',
                    expectedJoinDate: '',
                  });
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCandidate}
                disabled={!newCandidate.firstName || !newCandidate.lastName || !newCandidate.email || !newCandidate.phone || !newCandidate.offeredSalary || !newCandidate.expectedJoinDate}
                className="btn bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Create Candidate
              </button>
            </div>
          </div>
        </div>
      )}
    </ModernLayout>
  );
}
