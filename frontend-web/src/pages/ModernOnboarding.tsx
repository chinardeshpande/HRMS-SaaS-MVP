import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ModernLayout } from '../components/layout/ModernLayout';
import { UserPlusIcon, CloudArrowUpIcon, CheckCircleIcon, XCircleIcon, ArrowLeftIcon, ArrowRightIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';

interface NewEmployee {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  maritalStatus: string;
  nationality: string;
  address: string;

  // Emergency Contact
  emergencyContact: string;
  emergencyPhone: string;

  // Professional Information
  positionTitle: string;
  jobTitle: string;
  departmentName: string;
  reportsToEmployeeName: string;
  employmentType: string;
  workLocation: string;
  dateOfJoining: string;
  salary: string;
  currency: string;
  yearsOfExperience: string;
}

const initialEmployeeData: NewEmployee = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  gender: '',
  maritalStatus: '',
  nationality: '',
  address: '',
  emergencyContact: '',
  emergencyPhone: '',
  positionTitle: '',
  jobTitle: '',
  departmentName: '',
  reportsToEmployeeName: '',
  employmentType: 'full-time',
  workLocation: '',
  dateOfJoining: '',
  salary: '',
  currency: '$',
  yearsOfExperience: '',
};

const wizardSteps = [
  { name: 'Personal Information', emoji: '👤', color: 'blue' },
  { name: 'Emergency Contact', emoji: '🆘', color: 'red' },
  { name: 'Professional Details', emoji: '💼', color: 'purple' },
  { name: 'Review & Submit', emoji: '✅', color: 'green' },
];

export default function ModernOnboarding() {
  const navigate = useNavigate();

  // Wizard state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [employeeData, setEmployeeData] = useState<NewEmployee>(initialEmployeeData);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Notification
  const [notification, setNotification] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  });

  // Statistics
  const [stats] = useState({
    total: 12,
    completed: 8,
    inProgress: 3,
    pending: 1,
  });

  // ============= Wizard Functions =============

  const handleWizardOpen = () => {
    setWizardOpen(true);
    setActiveStep(0);
    setEmployeeData(initialEmployeeData);
    setValidationErrors({});
  };

  const handleWizardClose = () => {
    setWizardOpen(false);
    setActiveStep(0);
    setEmployeeData(initialEmployeeData);
    setValidationErrors({});
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleInputChange = (field: keyof NewEmployee, value: string) => {
    setEmployeeData((prev) => ({ ...prev, [field]: value }));
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    switch (step) {
      case 0: // Personal Information
        if (!employeeData.firstName) errors.firstName = 'First name is required';
        if (!employeeData.lastName) errors.lastName = 'Last name is required';
        if (!employeeData.email) errors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(employeeData.email)) errors.email = 'Invalid email format';
        if (!employeeData.phone) errors.phone = 'Phone is required';
        if (!employeeData.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';
        if (!employeeData.gender) errors.gender = 'Gender is required';
        break;

      case 1: // Emergency Contact
        if (!employeeData.emergencyContact) errors.emergencyContact = 'Emergency contact name is required';
        if (!employeeData.emergencyPhone) errors.emergencyPhone = 'Emergency contact phone is required';
        break;

      case 2: // Professional Details
        if (!employeeData.positionTitle) errors.positionTitle = 'Position is required';
        if (!employeeData.jobTitle) errors.jobTitle = 'Job title is required';
        if (!employeeData.departmentName) errors.departmentName = 'Department is required';
        if (!employeeData.dateOfJoining) errors.dateOfJoining = 'Joining date is required';
        if (!employeeData.salary) errors.salary = 'Salary is required';
        break;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitEmployee = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showNotification('Employee onboarded successfully!', 'success');
      setTimeout(() => {
        handleWizardClose();
        navigate('/employees');
      }, 1500);
    } catch (err: any) {
      showNotification('Failed to onboard employee', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleDownloadTemplate = () => {
    const headers = [
      'firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'gender',
      'maritalStatus', 'nationality', 'address', 'emergencyContact', 'emergencyPhone',
      'positionTitle', 'jobTitle', 'departmentName', 'reportsToEmployeeName',
      'employmentType', 'workLocation', 'dateOfJoining', 'salary', 'currency', 'yearsOfExperience'
    ];

    const sampleData = [
      'John', 'Doe', 'john.doe@company.com', '+1-555-0101', '1990-01-15', 'male',
      'single', 'American', '123 Main St', 'Jane Doe', '+1-555-0199',
      'Software Engineer', 'Backend Developer', 'Engineering', 'Tech Lead',
      'full-time', 'San Francisco HQ', '2025-02-01', '120000', '$', '5'
    ];

    const csv = headers.join(',') + '\n' + sampleData.join(',');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employee_template.csv';
    a.click();
  };

  // ============= Render Step Content =============

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">First Name *</label>
                <input
                  type="text"
                  value={employeeData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className={`input input-sm ${validationErrors.firstName ? 'border-danger-600' : ''}`}
                />
                {validationErrors.firstName && (
                  <p className="text-xs text-danger-600 mt-1">{validationErrors.firstName}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  value={employeeData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className={`input input-sm ${validationErrors.lastName ? 'border-danger-600' : ''}`}
                />
                {validationErrors.lastName && (
                  <p className="text-xs text-danger-600 mt-1">{validationErrors.lastName}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={employeeData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`input input-sm ${validationErrors.email ? 'border-danger-600' : ''}`}
                />
                {validationErrors.email && (
                  <p className="text-xs text-danger-600 mt-1">{validationErrors.email}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Phone *</label>
                <input
                  type="tel"
                  value={employeeData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={`input input-sm ${validationErrors.phone ? 'border-danger-600' : ''}`}
                />
                {validationErrors.phone && (
                  <p className="text-xs text-danger-600 mt-1">{validationErrors.phone}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Date of Birth *</label>
                <input
                  type="date"
                  value={employeeData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className={`input input-sm ${validationErrors.dateOfBirth ? 'border-danger-600' : ''}`}
                />
                {validationErrors.dateOfBirth && (
                  <p className="text-xs text-danger-600 mt-1">{validationErrors.dateOfBirth}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Gender *</label>
                <select
                  value={employeeData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className={`input input-sm ${validationErrors.gender ? 'border-danger-600' : ''}`}
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
                {validationErrors.gender && (
                  <p className="text-xs text-danger-600 mt-1">{validationErrors.gender}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Marital Status</label>
                <select
                  value={employeeData.maritalStatus}
                  onChange={(e) => handleInputChange('maritalStatus', e.target.value)}
                  className="input input-sm"
                >
                  <option value="">Select</option>
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="divorced">Divorced</option>
                  <option value="widowed">Widowed</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nationality</label>
                <input
                  type="text"
                  value={employeeData.nationality}
                  onChange={(e) => handleInputChange('nationality', e.target.value)}
                  className="input input-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Address</label>
              <textarea
                value={employeeData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                rows={2}
                className="input input-sm"
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-3">
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-800">
                <span className="font-semibold">⚠️ Important:</span> Please provide an emergency contact who can be reached in case of emergencies.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Emergency Contact Name *</label>
                <input
                  type="text"
                  value={employeeData.emergencyContact}
                  onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                  placeholder="e.g., Spouse, Parent, Sibling"
                  className={`input input-sm ${validationErrors.emergencyContact ? 'border-danger-600' : ''}`}
                />
                {validationErrors.emergencyContact && (
                  <p className="text-xs text-danger-600 mt-1">{validationErrors.emergencyContact}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Emergency Contact Phone *</label>
                <input
                  type="tel"
                  value={employeeData.emergencyPhone}
                  onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                  className={`input input-sm ${validationErrors.emergencyPhone ? 'border-danger-600' : ''}`}
                />
                {validationErrors.emergencyPhone && (
                  <p className="text-xs text-danger-600 mt-1">{validationErrors.emergencyPhone}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Position Title *</label>
                <input
                  type="text"
                  value={employeeData.positionTitle}
                  onChange={(e) => handleInputChange('positionTitle', e.target.value)}
                  className={`input input-sm ${validationErrors.positionTitle ? 'border-danger-600' : ''}`}
                />
                {validationErrors.positionTitle && (
                  <p className="text-xs text-danger-600 mt-1">{validationErrors.positionTitle}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Job Title *</label>
                <input
                  type="text"
                  value={employeeData.jobTitle}
                  onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                  className={`input input-sm ${validationErrors.jobTitle ? 'border-danger-600' : ''}`}
                />
                {validationErrors.jobTitle && (
                  <p className="text-xs text-danger-600 mt-1">{validationErrors.jobTitle}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Department *</label>
                <input
                  type="text"
                  value={employeeData.departmentName}
                  onChange={(e) => handleInputChange('departmentName', e.target.value)}
                  className={`input input-sm ${validationErrors.departmentName ? 'border-danger-600' : ''}`}
                />
                {validationErrors.departmentName && (
                  <p className="text-xs text-danger-600 mt-1">{validationErrors.departmentName}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Reports To</label>
                <input
                  type="text"
                  value={employeeData.reportsToEmployeeName}
                  onChange={(e) => handleInputChange('reportsToEmployeeName', e.target.value)}
                  placeholder="Manager's name"
                  className="input input-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Employment Type *</label>
                <select
                  value={employeeData.employmentType}
                  onChange={(e) => handleInputChange('employmentType', e.target.value)}
                  className="input input-sm"
                >
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="intern">Intern</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Work Location</label>
                <input
                  type="text"
                  value={employeeData.workLocation}
                  onChange={(e) => handleInputChange('workLocation', e.target.value)}
                  className="input input-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Date of Joining *</label>
                <input
                  type="date"
                  value={employeeData.dateOfJoining}
                  onChange={(e) => handleInputChange('dateOfJoining', e.target.value)}
                  className={`input input-sm ${validationErrors.dateOfJoining ? 'border-danger-600' : ''}`}
                />
                {validationErrors.dateOfJoining && (
                  <p className="text-xs text-danger-600 mt-1">{validationErrors.dateOfJoining}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Currency</label>
                <select
                  value={employeeData.currency}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  className="input input-sm"
                >
                  <option value="$">$ (USD)</option>
                  <option value="€">€ (EUR)</option>
                  <option value="£">£ (GBP)</option>
                  <option value="₹">₹ (INR)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Annual Salary *</label>
                <input
                  type="number"
                  value={employeeData.salary}
                  onChange={(e) => handleInputChange('salary', e.target.value)}
                  className={`input input-sm ${validationErrors.salary ? 'border-danger-600' : ''}`}
                />
                {validationErrors.salary && (
                  <p className="text-xs text-danger-600 mt-1">{validationErrors.salary}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Years of Experience</label>
              <input
                type="number"
                value={employeeData.yearsOfExperience}
                onChange={(e) => handleInputChange('yearsOfExperience', e.target.value)}
                className="input input-sm"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-3">
            <div className="bg-success-50 border-2 border-success-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-success-800">
                <span className="font-semibold">✅ Ready to Submit:</span> Please review all information before submitting. You can go back to edit any section.
              </p>
            </div>

            {/* Personal Information */}
            <div className="card border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
              <div className="card-body p-4">
                <h3 className="text-sm font-bold text-blue-900 mb-3 flex items-center">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs mr-2">👤</span>
                  Personal Information
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-gray-600 font-semibold">Name</p>
                    <p className="text-gray-900">{employeeData.firstName} {employeeData.lastName}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-semibold">Email</p>
                    <p className="text-gray-900">{employeeData.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-semibold">Phone</p>
                    <p className="text-gray-900">{employeeData.phone}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-semibold">Date of Birth</p>
                    <p className="text-gray-900">{employeeData.dateOfBirth}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-semibold">Gender</p>
                    <p className="text-gray-900 capitalize">{employeeData.gender}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-semibold">Nationality</p>
                    <p className="text-gray-900">{employeeData.nationality || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="card border-2 border-red-200 bg-gradient-to-br from-red-50 to-pink-50">
              <div className="card-body p-4">
                <h3 className="text-sm font-bold text-red-900 mb-3 flex items-center">
                  <span className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs mr-2">🆘</span>
                  Emergency Contact
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-gray-600 font-semibold">Contact Name</p>
                    <p className="text-gray-900">{employeeData.emergencyContact}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-semibold">Contact Phone</p>
                    <p className="text-gray-900">{employeeData.emergencyPhone}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Details */}
            <div className="card border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
              <div className="card-body p-4">
                <h3 className="text-sm font-bold text-purple-900 mb-3 flex items-center">
                  <span className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs mr-2">💼</span>
                  Professional Details
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-gray-600 font-semibold">Position</p>
                    <p className="text-gray-900">{employeeData.positionTitle}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-semibold">Job Title</p>
                    <p className="text-gray-900">{employeeData.jobTitle}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-semibold">Department</p>
                    <p className="text-gray-900">{employeeData.departmentName}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-semibold">Reports To</p>
                    <p className="text-gray-900">{employeeData.reportsToEmployeeName || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-semibold">Employment Type</p>
                    <p className="text-gray-900 capitalize">{employeeData.employmentType}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-semibold">Work Location</p>
                    <p className="text-gray-900">{employeeData.workLocation || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-semibold">Joining Date</p>
                    <p className="text-gray-900">{employeeData.dateOfJoining}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-semibold">Annual Salary</p>
                    <p className="text-gray-900">{employeeData.currency}{Number(employeeData.salary).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <ModernLayout>
      {notification.show && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className={`rounded-lg px-4 py-3 shadow-xl ${notification.type === 'success' ? 'bg-success-600' : 'bg-danger-600'}`}>
            <p className="text-sm font-medium text-white">{notification.message}</p>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Employee Onboarding</h1>
          <p className="text-sm text-gray-600 mt-1">Streamline your employee onboarding process</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="card border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
            <div className="card-body p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-blue-700">TOTAL</p>
                  <p className="text-2xl font-bold text-primary-600">{stats.total}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-xl">👥</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
            <div className="card-body p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-green-700">COMPLETED</p>
                  <p className="text-2xl font-bold text-success-600">{stats.completed}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-success-100 flex items-center justify-center">
                  <span className="text-xl">✅</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50">
            <div className="card-body p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-orange-700">IN PROGRESS</p>
                  <p className="text-2xl font-bold text-warning-600">{stats.inProgress}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-warning-100 flex items-center justify-center">
                  <span className="text-xl">⏳</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
            <div className="card-body p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-purple-700">PENDING</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.pending}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-xl">📋</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={handleWizardOpen}
            className="relative overflow-hidden group"
          >
            <div className="card border-2 border-blue-300 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all">
              <div className="card-body p-5">
                <div className="flex items-center justify-between text-white">
                  <div className="text-left">
                    <p className="text-xs font-bold mb-1 opacity-90">START NEW</p>
                    <p className="text-lg font-bold">Add Single Employee</p>
                    <p className="text-xs mt-1 opacity-75">4-step guided wizard</p>
                  </div>
                  <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center group-hover:scale-110 transition-transform">
                    <UserPlusIcon className="h-8 w-8" />
                  </div>
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={() => alert('Bulk upload feature coming soon!')}
            className="relative overflow-hidden group"
          >
            <div className="card border-2 border-purple-300 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 transition-all">
              <div className="card-body p-5">
                <div className="flex items-center justify-between text-white">
                  <div className="text-left">
                    <p className="text-xs font-bold mb-1 opacity-90">MASS UPLOAD</p>
                    <p className="text-lg font-bold">Bulk Upload CSV</p>
                    <p className="text-xs mt-1 opacity-75">Multiple employees at once</p>
                  </div>
                  <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center group-hover:scale-110 transition-transform">
                    <CloudArrowUpIcon className="h-8 w-8" />
                  </div>
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card border-2 border-blue-200">
            <div className="card-body p-5">
              <div className="flex items-center mb-3">
                <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm mr-2">👤</span>
                <h3 className="text-sm font-bold text-gray-900">Wizard-Based Onboarding</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Our intuitive 4-step wizard guides you through the entire employee onboarding process:
              </p>
              <ul className="space-y-1 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Personal Information Collection</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Emergency Contact Details</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Professional Information & Compensation</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Review & Submit</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="card border-2 border-purple-200">
            <div className="card-body p-5">
              <div className="flex items-center mb-3">
                <span className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm mr-2">📤</span>
                <h3 className="text-sm font-bold text-gray-900">Bulk Upload Feature</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Upload multiple employees at once using CSV format:
              </p>
              <ul className="space-y-1 text-sm text-gray-700 mb-3">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Download CSV Template</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Fill in Employee Data</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Upload and Validate</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Review and Confirm</span>
                </li>
              </ul>
              <button
                onClick={handleDownloadTemplate}
                className="btn btn-sm btn-secondary"
              >
                <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                Download Template
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Wizard Modal */}
      {wizardOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b-2 border-gray-200 p-5 z-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Add New Employee</h2>
                <button onClick={handleWizardClose} className="text-gray-400 hover:text-gray-600">
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Progress Steps */}
              <div className="flex items-center justify-between">
                {wizardSteps.map((step, index) => (
                  <div key={index} className="flex-1">
                    <div className="flex items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                          index <= activeStep
                            ? `bg-${step.color}-600 text-white`
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {index < activeStep ? '✓' : step.emoji}
                      </div>
                      {index < wizardSteps.length - 1 && (
                        <div
                          className={`flex-1 h-1 mx-2 transition-all ${
                            index < activeStep ? `bg-${step.color}-600` : 'bg-gray-200'
                          }`}
                        />
                      )}
                    </div>
                    <p className="text-xs font-semibold text-gray-600 mt-1 text-center">{step.name}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">{wizardSteps[activeStep].name}</h3>
              {renderStepContent(activeStep)}
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t-2 border-gray-200 p-5 flex items-center justify-between">
              <button onClick={handleWizardClose} className="btn btn-secondary">
                Cancel
              </button>

              <div className="flex items-center space-x-2">
                {activeStep > 0 && (
                  <button onClick={handleBack} className="btn btn-secondary">
                    <ArrowLeftIcon className="h-4 w-4 mr-1" />
                    Back
                  </button>
                )}

                {activeStep < wizardSteps.length - 1 ? (
                  <button onClick={handleNext} className="btn btn-primary">
                    Next
                    <ArrowRightIcon className="h-4 w-4 ml-1" />
                  </button>
                ) : (
                  <button onClick={handleSubmitEmployee} disabled={loading} className="btn btn-primary">
                    {loading ? (
                      <>
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Submit Employee
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </ModernLayout>
  );
}
