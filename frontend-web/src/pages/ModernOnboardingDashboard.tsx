import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import onboardingService from '../services/onboardingService';
import OnboardingStatusChip from '../components/onboarding/OnboardingStatusChip';

interface Candidate {
  candidateId: string;
  firstName: string;
  lastName: string;
  email: string;
  currentState: string;
  offeredSalary: number;
  expectedJoinDate: string;
  department?: { departmentName: string };
  designation?: { designationName: string };
}

const ModernOnboardingDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [pipeline, setPipeline] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, [activeFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [candidatesRes, pipelineRes] = await Promise.all([
        onboardingService.getAllCandidates(activeFilter !== 'all' ? { state: activeFilter } : {}),
        onboardingService.getOnboardingPipeline(),
      ]);

      setCandidates(candidatesRes.data || []);
      setPipeline(pipelineRes.data || {});
    } catch (error) {
      console.error('Error fetching onboarding data:', error);
    } finally {
      setLoading(false);
    }
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
    { key: 'joined', label: 'Joined', color: 'bg-emerald-500' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Onboarding Dashboard</h1>
        <p className="text-gray-600">Manage candidates through the onboarding process</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="text-sm font-medium text-gray-600 mb-1">Total Candidates</div>
          <div className="text-3xl font-bold text-gray-900">{getTotalCandidates()}</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
          <div className="text-sm font-medium text-gray-600 mb-1">Pending Verification</div>
          <div className="text-3xl font-bold text-gray-900">{pipeline.hr_review || 0}</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
          <div className="text-sm font-medium text-gray-600 mb-1">BGV In Progress</div>
          <div className="text-3xl font-bold text-gray-900">{pipeline.bgv_in_progress || 0}</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="text-sm font-medium text-gray-600 mb-1">Joining This Month</div>
          <div className="text-3xl font-bold text-gray-900">{pipeline.pre_joining_setup || 0}</div>
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

      {/* Candidates Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Candidates {activeFilter !== 'all' && `- ${activeFilter.replace(/_/g, ' ').toUpperCase()}`}
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
            <p className="mt-2 text-gray-600">Loading candidates...</p>
          </div>
        ) : candidates.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No candidates found {activeFilter !== 'all' && `in ${activeFilter.replace(/_/g, ' ')} state`}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
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
                    Expected Join Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {candidates.map((candidate) => (
                  <tr key={candidate.candidateId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
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
                      {candidate.department?.departmentName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {candidate.designation?.designationName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <OnboardingStatusChip state={candidate.currentState} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(candidate.expectedJoinDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => navigate(`/onboarding/${candidate.candidateId}`)}
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
  );
};

export default ModernOnboardingDashboard;
