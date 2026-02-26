import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  XMarkIcon,
  CheckIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import departmentService, { Department } from '../../services/departmentService';
import designationService, { Designation } from '../../services/designationService';
import onboardingService from '../../services/onboardingService';

interface AddEmployeeWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddEmployeeWizard({ isOpen, onClose, onSuccess }: AddEmployeeWizardProps) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inline create designation
  const [showAddDesignation, setShowAddDesignation] = useState(false);
  const [newDesignationName, setNewDesignationName] = useState('');
  const [newDesignationLevel, setNewDesignationLevel] = useState<number>(6);
  const [creatingDesignation, setCreatingDesignation] = useState(false);

  const [formData, setFormData] = useState({
    // Step 1: Basic Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',

    // Step 2: Job Information
    departmentId: '',
    designationId: '',
    offeredSalary: '',
    expectedJoinDate: '',
    employmentType: 'full-time',
    workLocation: '',

    // Step 3: Additional Information
    address: '',
    city: '',
    state: '',
    pincode: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
  });

  useEffect(() => {
    if (isOpen) {
      fetchDepartments();
      fetchDesignations();
    }
  }, [isOpen]);

  const fetchDepartments = async () => {
    try {
      const data = await departmentService.getAll();
      setDepartments(data);
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  const fetchDesignations = async () => {
    try {
      const data = await designationService.getAll();
      setDesignations(data);
    } catch (err) {
      console.error('Error fetching designations:', err);
    }
  };

  const handleCreateDesignation = async () => {
    if (!newDesignationName.trim()) {
      setError('Designation name is required');
      return;
    }

    setCreatingDesignation(true);
    setError(null);

    try {
      const newDesignation = await designationService.create({
        name: newDesignationName.trim(),
        level: newDesignationLevel,
      });

      // Refresh designations list
      await fetchDesignations();

      // Auto-select the newly created designation
      setFormData(prev => ({ ...prev, designationId: newDesignation.designationId }));

      // Close modal and reset
      setShowAddDesignation(false);
      setNewDesignationName('');
      setNewDesignationLevel(6);
    } catch (err: any) {
      console.error('Error creating designation:', err);
      setError(err.response?.data?.message || 'Failed to create designation');
    } finally {
      setCreatingDesignation(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateStep = (step: number): boolean => {
    setError(null);

    switch (step) {
      case 1:
        if (!formData.firstName.trim()) {
          setError('First name is required');
          return false;
        }
        if (!formData.lastName.trim()) {
          setError('Last name is required');
          return false;
        }
        if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
          setError('Valid email is required');
          return false;
        }
        if (!formData.phone.trim()) {
          setError('Phone number is required');
          return false;
        }
        return true;

      case 2:
        if (!formData.departmentId) {
          setError('Department is required');
          return false;
        }
        if (!formData.designationId) {
          setError('Designation is required');
          return false;
        }
        if (!formData.offeredSalary || parseFloat(formData.offeredSalary) <= 0) {
          setError('Valid salary is required');
          return false;
        }
        if (!formData.expectedJoinDate) {
          setError('Expected join date is required');
          return false;
        }
        return true;

      case 3:
        // Optional validation for additional info
        return true;

      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setError(null);
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setLoading(true);
    setError(null);

    try {
      // Create candidate record which will start onboarding workflow
      const candidateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth || undefined,
        gender: formData.gender || undefined,
        departmentId: formData.departmentId,
        designationId: formData.designationId,
        offeredSalary: parseFloat(formData.offeredSalary),
        expectedJoinDate: formData.expectedJoinDate,
        employmentType: formData.employmentType,
        workLocation: formData.workLocation || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        pincode: formData.pincode || undefined,
        emergencyContactName: formData.emergencyContactName || undefined,
        emergencyContactPhone: formData.emergencyContactPhone || undefined,
        emergencyContactRelation: formData.emergencyContactRelation || undefined,
      };

      const response = await onboardingService.createCandidate(candidateData);

      onSuccess();
      onClose();

      // Navigate to the candidate's onboarding page
      if (response.data?.candidateId) {
        navigate(`/onboarding/candidates/${response.data.candidateId}`);
      }
    } catch (err: any) {
      console.error('Error creating employee:', err);
      setError(err.response?.data?.message || 'Failed to create employee. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      gender: '',
      departmentId: '',
      designationId: '',
      offeredSalary: '',
      expectedJoinDate: '',
      employmentType: 'full-time',
      workLocation: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelation: '',
    });
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const steps = [
    { number: 1, name: 'Basic Information' },
    { number: 2, name: 'Job Details' },
    { number: 3, name: 'Additional Info' },
    { number: 4, name: 'Review' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" onClick={handleClose} />

        {/* Modal */}
        <div className="relative w-full max-w-4xl transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all">
          {/* Header */}
          <div className="border-b border-gray-200 bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Add New Employee</h2>
              <button onClick={handleClose} className="text-white hover:text-gray-200 transition-colors">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div className="flex items-center">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                        currentStep >= step.number
                          ? 'border-primary-600 bg-primary-600 text-white'
                          : 'border-gray-300 bg-white text-gray-400'
                      }`}
                    >
                      {currentStep > step.number ? (
                        <CheckIcon className="h-5 w-5" />
                      ) : (
                        <span className="text-sm font-semibold">{step.number}</span>
                      )}
                    </div>
                    <div className="ml-3">
                      <p
                        className={`text-sm font-medium ${
                          currentStep >= step.number ? 'text-primary-600' : 'text-gray-500'
                        }`}
                      >
                        {step.name}
                      </p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="mx-4 h-0.5 w-16 bg-gray-300">
                      <div
                        className={`h-full transition-all ${
                          currentStep > step.number ? 'w-full bg-primary-600' : 'w-0'
                        }`}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mx-6 mt-4 rounded-lg bg-danger-50 border border-danger-200 p-4">
              <p className="text-sm text-danger-800">{error}</p>
            </div>
          )}

          {/* Form Content */}
          <div className="px-6 py-6">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name <span className="text-danger-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="input"
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name <span className="text-danger-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="input"
                      placeholder="Enter last name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-danger-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="input"
                      placeholder="employee@company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone <span className="text-danger-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="input"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="input"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Job Information */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department <span className="text-danger-500">*</span>
                    </label>
                    <select
                      name="departmentId"
                      value={formData.departmentId}
                      onChange={handleInputChange}
                      className="input"
                    >
                      <option value="">Select department</option>
                      {departments.map(dept => (
                        <option key={dept.departmentId} value={dept.departmentId}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Designation <span className="text-danger-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <select
                        name="designationId"
                        value={formData.designationId}
                        onChange={handleInputChange}
                        className="input flex-1"
                      >
                        <option value="">Select designation</option>
                        {designations.map(des => (
                          <option key={des.designationId} value={des.designationId}>
                            {des.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowAddDesignation(true)}
                        className="btn btn-secondary whitespace-nowrap"
                        title="Add new designation"
                      >
                        <PlusIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Annual Salary <span className="text-danger-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="offeredSalary"
                      value={formData.offeredSalary}
                      onChange={handleInputChange}
                      className="input"
                      placeholder="50000"
                      min="0"
                      step="1000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expected Join Date <span className="text-danger-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="expectedJoinDate"
                      value={formData.expectedJoinDate}
                      onChange={handleInputChange}
                      className="input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Employment Type</label>
                    <select
                      name="employmentType"
                      value={formData.employmentType}
                      onChange={handleInputChange}
                      className="input"
                    >
                      <option value="full-time">Full Time</option>
                      <option value="part-time">Part Time</option>
                      <option value="contract">Contract</option>
                      <option value="intern">Intern</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Work Location</label>
                    <input
                      type="text"
                      name="workLocation"
                      value={formData.workLocation}
                      onChange={handleInputChange}
                      className="input"
                      placeholder="Office location or Remote"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Additional Information */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={2}
                    className="input"
                    placeholder="Street address"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="input"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="input"
                      placeholder="State"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">PIN Code</label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      className="input"
                      placeholder="000000"
                    />
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact</h3>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Contact Name</label>
                      <input
                        type="text"
                        name="emergencyContactName"
                        value={formData.emergencyContactName}
                        onChange={handleInputChange}
                        className="input"
                        placeholder="Full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone</label>
                      <input
                        type="tel"
                        name="emergencyContactPhone"
                        value={formData.emergencyContactPhone}
                        onChange={handleInputChange}
                        className="input"
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Relation</label>
                      <input
                        type="text"
                        name="emergencyContactRelation"
                        value={formData.emergencyContactRelation}
                        onChange={handleInputChange}
                        className="input"
                        placeholder="e.g., Spouse, Parent"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="rounded-lg bg-primary-50 border border-primary-200 p-4">
                  <p className="text-sm text-primary-800">
                    Please review the information below. Once submitted, the employee will be added to the system and
                    automatically enrolled in the onboarding workflow.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Basic Information</h3>
                    <dl className="grid grid-cols-2 gap-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Name</dt>
                        <dd className="text-sm text-gray-900">{formData.firstName} {formData.lastName}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Email</dt>
                        <dd className="text-sm text-gray-900">{formData.email}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Phone</dt>
                        <dd className="text-sm text-gray-900">{formData.phone}</dd>
                      </div>
                      {formData.dateOfBirth && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
                          <dd className="text-sm text-gray-900">{formData.dateOfBirth}</dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Job Details</h3>
                    <dl className="grid grid-cols-2 gap-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Department</dt>
                        <dd className="text-sm text-gray-900">
                          {departments.find(d => d.departmentId === formData.departmentId)?.name || '-'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Designation</dt>
                        <dd className="text-sm text-gray-900">
                          {designations.find(d => d.designationId === formData.designationId)?.name || '-'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Annual Salary</dt>
                        <dd className="text-sm text-gray-900">${parseFloat(formData.offeredSalary).toLocaleString()}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Expected Join Date</dt>
                        <dd className="text-sm text-gray-900">{formData.expectedJoinDate}</dd>
                      </div>
                    </dl>
                  </div>

                  {(formData.address || formData.emergencyContactName) && (
                    <div className="border-t border-gray-200 pt-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Additional Information</h3>
                      <dl className="grid grid-cols-2 gap-4">
                        {formData.address && (
                          <div className="col-span-2">
                            <dt className="text-sm font-medium text-gray-500">Address</dt>
                            <dd className="text-sm text-gray-900">
                              {formData.address}
                              {formData.city && `, ${formData.city}`}
                              {formData.state && `, ${formData.state}`}
                              {formData.pincode && ` - ${formData.pincode}`}
                            </dd>
                          </div>
                        )}
                        {formData.emergencyContactName && (
                          <>
                            <div>
                              <dt className="text-sm font-medium text-gray-500">Emergency Contact</dt>
                              <dd className="text-sm text-gray-900">
                                {formData.emergencyContactName}
                                {formData.emergencyContactRelation && ` (${formData.emergencyContactRelation})`}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-sm font-medium text-gray-500">Emergency Phone</dt>
                              <dd className="text-sm text-gray-900">{formData.emergencyContactPhone}</dd>
                            </div>
                          </>
                        )}
                      </dl>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={handleClose}
                className="btn btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>

              <div className="flex items-center gap-3">
                {currentStep > 1 && (
                  <button
                    onClick={handlePrevious}
                    className="btn btn-secondary"
                    disabled={loading}
                  >
                    <ArrowLeftIcon className="h-5 w-5 mr-2" />
                    Previous
                  </button>
                )}

                {currentStep < 4 ? (
                  <button
                    onClick={handleNext}
                    className="btn btn-primary"
                  >
                    Next
                    <ArrowRightIcon className="h-5 w-5 ml-2" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <CheckIcon className="h-5 w-5 mr-2" />
                        Create Employee
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inline Add Designation Modal */}
      {showAddDesignation && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-900 bg-opacity-75" onClick={() => setShowAddDesignation(false)} />

            <div className="relative w-full max-w-md transform overflow-hidden rounded-xl bg-white shadow-2xl">
              <div className="border-b border-gray-200 bg-primary-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">Add New Designation</h3>
                  <button onClick={() => setShowAddDesignation(false)} className="text-white hover:text-gray-200">
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Designation Name <span className="text-danger-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newDesignationName}
                    onChange={(e) => setNewDesignationName(e.target.value)}
                    className="input"
                    placeholder="e.g., Senior Software Engineer"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Level (Optional)
                  </label>
                  <select
                    value={newDesignationLevel}
                    onChange={(e) => setNewDesignationLevel(parseInt(e.target.value))}
                    className="input"
                  >
                    <option value={1}>Level 1 - Executive (CEO, COO, CTO)</option>
                    <option value={2}>Level 2 - VP/Director</option>
                    <option value={3}>Level 3 - Senior Management</option>
                    <option value={4}>Level 4 - Management</option>
                    <option value={5}>Level 5 - Senior Individual Contributor</option>
                    <option value={6}>Level 6 - Mid-Level (Default)</option>
                    <option value={7}>Level 7 - Junior</option>
                    <option value={8}>Level 8 - Entry/Intern/Trainee</option>
                    <option value={9}>Level 9 - Support/Administrative</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setShowAddDesignation(false)}
                    className="btn btn-secondary"
                    disabled={creatingDesignation}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateDesignation}
                    className="btn btn-primary"
                    disabled={creatingDesignation || !newDesignationName.trim()}
                  >
                    {creatingDesignation ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Add Designation
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
