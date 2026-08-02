import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SparklesIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { API_BASE_URL } from '../../config/runtime';

interface Department {
  name: string;
  parentDepartmentId?: string;
}

interface Designation {
  name: string;
  level: number;
}

interface User {
  email: string;
  fullName: string;
  role: string;
  departmentId?: string;
}

interface LeavePolicy {
  name: string;
  type: string;
  daysAllowed: number;
}

interface AttendancePolicy {
  workingHoursPerDay: number;
  weekends: string[];
}

interface BusinessRules {
  leavePolicies: LeavePolicy[];
  attendancePolicy: AttendancePolicy;
}

interface WizardData {
  departments: Department[];
  designations: Designation[];
  users: User[];
  businessRules: BusinessRules;
}

const steps = [
  {
    id: 1,
    title: 'Welcome',
    icon: SparklesIcon,
    description: 'Get started with your HR journey',
  },
  {
    id: 2,
    title: 'Departments',
    icon: BuildingOfficeIcon,
    description: 'Set up your organizational structure',
  },
  {
    id: 3,
    title: 'Designations',
    icon: BriefcaseIcon,
    description: 'Define job roles and levels',
  },
  {
    id: 4,
    title: 'Users',
    icon: UserGroupIcon,
    description: 'Invite your team members',
  },
  {
    id: 5,
    title: 'Rules',
    icon: DocumentTextIcon,
    description: 'Configure policies and rules',
  },
  {
    id: 6,
    title: 'Completion',
    icon: CheckCircleIcon,
    description: 'Review and finish setup',
  },
];

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [wizardData, setWizardData] = useState<WizardData>({
    departments: [],
    designations: [],
    users: [],
    businessRules: {
      leavePolicies: [
        { name: 'Sick Leave', type: 'sick', daysAllowed: 12 },
        { name: 'Casual Leave', type: 'casual', daysAllowed: 12 },
        { name: 'Earned Leave', type: 'earned', daysAllowed: 21 },
      ],
      attendancePolicy: {
        workingHoursPerDay: 8,
        weekends: ['Saturday', 'Sunday'],
      },
    },
  });

  const [tempDepartment, setTempDepartment] = useState('');
  const [tempDesignation, setTempDesignation] = useState({ name: '', level: 1 });
  const [tempUser, setTempUser] = useState({ email: '', fullName: '', role: 'employee' });

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/onboarding-wizard/progress`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const progress = response.data.data;
        setCurrentStep(progress.currentStep);
        if (progress.stepData) {
          setWizardData((prev) => ({ ...prev, ...progress.stepData }));
        }
      }
    } catch (err) {
      console.error('Failed to load progress:', err);
    }
  };

  const saveStepData = async (stepNumber: number, data: any) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/onboarding-wizard/step/${stepNumber}`,
        data,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch (err: any) {
      throw new Error(err.response?.data?.error?.message || 'Failed to save step data');
    }
  };

  const handleNext = async () => {
    setError('');
    setLoading(true);

    try {
      // Validate and save current step
      if (currentStep === 2 && wizardData.departments.length === 0) {
        setError('Please add at least one department');
        setLoading(false);
        return;
      }

      if (currentStep === 3 && wizardData.designations.length === 0) {
        setError('Please add at least one designation');
        setLoading(false);
        return;
      }

      // Save current step data
      await saveStepData(currentStep, wizardData);

      // Move to next step
      setCurrentStep(currentStep + 1);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
    setError('');
  };

  const handleSkipStep = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/onboarding-wizard/skip-step/${currentStep}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setCurrentStep(currentStep + 1);
    } catch (err) {
      console.error('Failed to skip step:', err);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_BASE_URL}/onboarding-wizard/complete`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  const addDepartment = () => {
    if (tempDepartment.trim()) {
      setWizardData({
        ...wizardData,
        departments: [...wizardData.departments, { name: tempDepartment }],
      });
      setTempDepartment('');
    }
  };

  const removeDepartment = (index: number) => {
    setWizardData({
      ...wizardData,
      departments: wizardData.departments.filter((_, i) => i !== index),
    });
  };

  const addDesignation = () => {
    if (tempDesignation.name.trim()) {
      setWizardData({
        ...wizardData,
        designations: [...wizardData.designations, tempDesignation],
      });
      setTempDesignation({ name: '', level: 1 });
    }
  };

  const removeDesignation = (index: number) => {
    setWizardData({
      ...wizardData,
      designations: wizardData.designations.filter((_, i) => i !== index),
    });
  };

  const addUser = () => {
    if (tempUser.email.trim() && tempUser.fullName.trim()) {
      setWizardData({
        ...wizardData,
        users: [...wizardData.users, tempUser],
      });
      setTempUser({ email: '', fullName: '', role: 'employee' });
    }
  };

  const removeUser = (index: number) => {
    setWizardData({
      ...wizardData,
      users: wizardData.users.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img
                src="/brand/aura/aura-logo-exact-transparent.png"
                alt="Aura"
                className="h-12 w-auto"
              />
            </div>
            <div className="text-sm text-gray-600">
              Step {currentStep} of {steps.length}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                        isCompleted
                          ? 'bg-blue-600 border-blue-600'
                          : isActive
                          ? 'bg-white border-blue-600'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <Icon
                        className={`h-6 w-6 ${
                          isCompleted
                            ? 'text-white'
                            : isActive
                            ? 'text-blue-600'
                            : 'text-gray-400'
                        }`}
                      />
                    </div>
                    <div className="mt-2 text-center">
                      <div
                        className={`text-xs font-medium ${
                          isActive ? 'text-blue-600' : 'text-gray-500'
                        }`}
                      >
                        {step.title}
                      </div>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-2 ${
                        isCompleted ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Step 1: Welcome */}
          {currentStep === 1 && (
            <div className="text-center">
              <SparklesIcon className="h-20 w-20 text-blue-600 mx-auto mb-6" />
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Welcome to Aura!
              </h2>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Let's set up your organization in just a few steps. This wizard will help you
                configure departments, designations, invite team members, and set up your HR
                policies.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
                <h3 className="font-semibold text-blue-900 mb-2">What you'll set up:</h3>
                <ul className="text-left text-blue-800 space-y-2">
                  <li className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Organizational structure (departments)</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Job roles and designations</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Team member invitations</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Leave and attendance policies</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 2: Departments */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Set Up Departments
              </h2>
              <p className="text-gray-600 mb-8">
                Add the departments in your organization. You can always add more later.
              </p>

              <div className="space-y-4 mb-6">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={tempDepartment}
                    onChange={(e) => setTempDepartment(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addDepartment()}
                    placeholder="Department name (e.g., Engineering, Sales, HR)"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={addDepartment}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    Add
                  </button>
                </div>

                {wizardData.departments.length > 0 && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Added Departments ({wizardData.departments.length})
                    </h3>
                    <div className="space-y-2">
                      {wizardData.departments.map((dept, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-lg"
                        >
                          <span className="text-gray-900">{dept.name}</span>
                          <button
                            onClick={() => removeDepartment(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Designations */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Define Designations
              </h2>
              <p className="text-gray-600 mb-8">
                Add job roles and their hierarchy levels in your organization.
              </p>

              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={tempDesignation.name}
                    onChange={(e) =>
                      setTempDesignation({ ...tempDesignation, name: e.target.value })
                    }
                    placeholder="Designation name (e.g., Software Engineer)"
                    className="md:col-span-2 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <select
                    value={tempDesignation.level}
                    onChange={(e) =>
                      setTempDesignation({
                        ...tempDesignation,
                        level: parseInt(e.target.value),
                      })
                    }
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={1}>Level 1 (Entry)</option>
                    <option value={2}>Level 2 (Junior)</option>
                    <option value={3}>Level 3 (Mid)</option>
                    <option value={4}>Level 4 (Senior)</option>
                    <option value={5}>Level 5 (Lead)</option>
                  </select>
                </div>
                <button
                  onClick={addDesignation}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Add Designation
                </button>

                {wizardData.designations.length > 0 && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Added Designations ({wizardData.designations.length})
                    </h3>
                    <div className="space-y-2">
                      {wizardData.designations.map((desig, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-lg"
                        >
                          <div>
                            <span className="text-gray-900 font-medium">{desig.name}</span>
                            <span className="text-sm text-gray-500 ml-2">
                              Level {desig.level}
                            </span>
                          </div>
                          <button
                            onClick={() => removeDesignation(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Users */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Invite Team Members
              </h2>
              <p className="text-gray-600 mb-8">
                Invite your team members to join your Aura workspace. You can skip this and
                add them later.
              </p>

              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="email"
                    value={tempUser.email}
                    onChange={(e) =>
                      setTempUser({ ...tempUser, email: e.target.value })
                    }
                    placeholder="Email address"
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    value={tempUser.fullName}
                    onChange={(e) =>
                      setTempUser({ ...tempUser, fullName: e.target.value })
                    }
                    placeholder="Full name"
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <select
                    value={tempUser.role}
                    onChange={(e) =>
                      setTempUser({ ...tempUser, role: e.target.value })
                    }
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="hr">HR</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <button
                  onClick={addUser}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Add User
                </button>

                {wizardData.users.length > 0 && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Added Users ({wizardData.users.length})
                    </h3>
                    <div className="space-y-2">
                      {wizardData.users.map((user, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-lg"
                        >
                          <div>
                            <div className="text-gray-900 font-medium">
                              {user.fullName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email} • {user.role}
                            </div>
                          </div>
                          <button
                            onClick={() => removeUser(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleSkipStep}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Skip this step
              </button>
            </div>
          )}

          {/* Step 5: Business Rules */}
          {currentStep === 5 && (
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Configure Policies
              </h2>
              <p className="text-gray-600 mb-8">
                Set up your leave and attendance policies. Default policies are already
                configured, but you can customize them later.
              </p>

              <div className="space-y-6">
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Leave Policies</h3>
                  <div className="space-y-3">
                    {wizardData.businessRules.leavePolicies.map((policy, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg"
                      >
                        <div>
                          <div className="font-medium text-gray-900">{policy.name}</div>
                          <div className="text-sm text-gray-500">
                            {policy.daysAllowed} days per year
                          </div>
                        </div>
                        <CheckCircleIcon className="h-5 w-5 text-green-600" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Attendance Policy
                  </h3>
                  <div className="bg-gray-50 px-4 py-3 rounded-lg">
                    <div className="text-gray-900">
                      Working Hours: {wizardData.businessRules.attendancePolicy.workingHoursPerDay}{' '}
                      hours/day
                    </div>
                    <div className="text-sm text-gray-500">
                      Weekends:{' '}
                      {wizardData.businessRules.attendancePolicy.weekends.join(', ')}
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    You can customize these policies later from the Settings page.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Completion */}
          {currentStep === 6 && (
            <div className="text-center">
              <CheckCircleIcon className="h-20 w-20 text-green-600 mx-auto mb-6" />
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                You're All Set!
              </h2>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Your Aura workspace is ready. Click finish to start managing your team
                and illuminate their journey.
              </p>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 max-w-2xl mx-auto text-left">
                <h3 className="font-semibold text-gray-900 mb-4">What's been set up:</h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900">
                        {wizardData.departments.length} Departments
                      </div>
                      <div className="text-sm text-gray-600">
                        {wizardData.departments.map((d) => d.name).join(', ')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900">
                        {wizardData.designations.length} Designations
                      </div>
                      <div className="text-sm text-gray-600">
                        {wizardData.designations.map((d) => d.name).join(', ')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900">
                        {wizardData.users.length} Team Members Invited
                      </div>
                      {wizardData.users.length > 0 && (
                        <div className="text-sm text-gray-600">
                          Invitation emails will be sent
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900">Policies Configured</div>
                      <div className="text-sm text-gray-600">
                        Leave and attendance policies are ready
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex gap-4">
            {currentStep > 1 && currentStep < 6 && (
              <button
                onClick={handleBack}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back
              </button>
            )}

            {currentStep < 6 && (
              <button
                onClick={handleNext}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group"
              >
                {loading ? (
                  'Saving...'
                ) : (
                  <>
                    Next
                    <ArrowRightIcon className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            )}

            {currentStep === 6 && (
              <button
                onClick={handleComplete}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Finishing Setup...' : 'Finish Setup'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
