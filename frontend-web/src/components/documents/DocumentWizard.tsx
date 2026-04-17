import { useState, useEffect, Fragment } from 'react';
import { XMarkIcon, MagnifyingGlassIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Combobox, Transition } from '@headlessui/react';
import api from '../../services/api';

interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  variables: string[];
}

interface Employee {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeCode: string;
  department?: { name: string };
  designation?: { name: string };
}

interface DocumentWizardProps {
  template: DocumentTemplate;
  onClose: () => void;
  onGenerate: (data: any) => void;
}

export const DocumentWizard = ({ template, onClose, onGenerate }: DocumentWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  const totalSteps = 3;

  // Initialize form data with empty values
  useEffect(() => {
    const initialData: Record<string, string> = {};
    template.variables.forEach((variable) => {
      initialData[variable] = '';
    });
    setFormData(initialData);
  }, [template]);

  // Load employees from API
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await api.get('/employees?status=active&limit=100');
        const employeeData = Array.isArray(response.data) ? response.data : (response.data.data || []);
        setEmployees(employeeData);
      } catch (error) {
        console.error('Error fetching employees:', error);
        setEmployees([]);
      }
    };

    fetchEmployees();
  }, []);

  const filteredEmployees =
    query === ''
      ? employees
      : employees.filter((employee) =>
          `${employee.firstName} ${employee.lastName} ${employee.email} ${employee.employeeCode}`
            .toLowerCase()
            .includes(query.toLowerCase())
        );

  const handleEmployeeSelect = (employee: Employee | null) => {
    setSelectedEmployee(employee);

    if (!employee) return;

    // Smart auto-fill based on actual template field names
    const updatedData = { ...formData };

    // Common field mappings
    const fieldMappings: Record<string, string> = {
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      employeeCode: employee.employeeCode,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      candidateName: `${employee.firstName} ${employee.lastName}`,
      departmentName: employee.department?.name || '',
      department: employee.department?.name || '',
      designation: employee.designation?.name || '',
      position: employee.designation?.name || '',
      positionOffered: employee.designation?.name || '',
    };

    // Auto-fill fields that exist in the template
    Object.keys(fieldMappings).forEach((field) => {
      if (template.variables.includes(field)) {
        updatedData[field] = fieldMappings[field];
      }
    });

    // Auto-fill current date for date fields if they're empty
    template.variables.forEach((field) => {
      if (isDateField(field) && !updatedData[field]) {
        updatedData[field] = new Date().toISOString().split('T')[0];
      }
    });

    setFormData(updatedData);
  };

  const isDateField = (fieldName: string): boolean => {
    const lowerField = fieldName.toLowerCase();
    return lowerField.includes('date') || lowerField.includes('dob');
  };

  const isNumberField = (fieldName: string): boolean => {
    const lowerField = fieldName.toLowerCase();
    return (
      lowerField.includes('salary') ||
      lowerField.includes('ctc') ||
      lowerField.includes('amount') ||
      lowerField.includes('compensation')
    );
  };

  const isTextAreaField = (fieldName: string): boolean => {
    const lowerField = fieldName.toLowerCase();
    return (
      lowerField.includes('reason') ||
      lowerField.includes('responsibilities') ||
      lowerField.includes('description') ||
      lowerField.includes('duties') ||
      lowerField.includes('remarks')
    );
  };

  const getFieldLabel = (fieldName: string): string => {
    // Convert camelCase or snake_case to Title Case
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .trim()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleInputChange = (variable: string, value: string) => {
    setFormData((prev) => ({ ...prev, [variable]: value }));
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      await onGenerate({
        templateId: template.id,
        employeeId: selectedEmployee?.employeeId,
        variables: formData,
        format: 'PDF',
      });
      onClose();
    } catch (error) {
      console.error('Error generating document:', error);
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = () => {
    if (currentStep === 1) return selectedEmployee !== null;
    if (currentStep === 2) {
      return template.variables.every((variable) => formData[variable]?.trim() !== '');
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep < totalSteps && isStepValid()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{template.name}</h2>
            <p className="mt-1 text-sm text-gray-600">{template.description}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {[
              { number: 1, title: 'Select Employee' },
              { number: 2, title: 'Fill Details' },
              { number: 3, title: 'Review & Generate' },
            ].map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex items-center justify-center h-10 w-10 rounded-full border-2 font-semibold transition-all ${
                      currentStep > step.number
                        ? 'bg-green-500 border-green-500 text-white'
                        : currentStep === step.number
                        ? 'bg-primary-600 border-primary-600 text-white'
                        : 'bg-white border-gray-300 text-gray-400'
                    }`}
                  >
                    {currentStep > step.number ? (
                      <CheckIcon className="h-5 w-5" />
                    ) : (
                      <span className="text-sm">{step.number}</span>
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium transition-colors ${
                      currentStep >= step.number ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {index < 2 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 transition-colors ${
                      currentStep > step.number ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Select Employee */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search and Select Employee
                </label>

                <Combobox value={selectedEmployee} onChange={handleEmployeeSelect}>
                  <div className="relative">
                    <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white border border-gray-300 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500">
                      <MagnifyingGlassIcon
                        className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
                        aria-hidden="true"
                      />
                      <Combobox.Input
                        className="w-full border-none py-3 pl-10 pr-10 text-sm leading-5 text-gray-900 focus:ring-0 focus:outline-none"
                        displayValue={(employee: Employee) =>
                          employee ? `${employee.firstName} ${employee.lastName} (${employee.employeeCode})` : ''
                        }
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search by name, email, or employee code..."
                      />
                      {selectedEmployee && (
                        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <CheckIcon className="h-5 w-5 text-green-600" aria-hidden="true" />
                        </Combobox.Button>
                      )}
                    </div>
                    <Transition
                      as={Fragment}
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                      afterLeave={() => setQuery('')}
                    >
                      <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                        {filteredEmployees.length === 0 && query !== '' ? (
                          <div className="relative cursor-default select-none px-4 py-2 text-gray-700">
                            No employees found.
                          </div>
                        ) : (
                          filteredEmployees.map((employee) => (
                            <Combobox.Option
                              key={employee.employeeId}
                              className={({ active }) =>
                                `relative cursor-pointer select-none py-3 px-4 ${
                                  active ? 'bg-primary-600 text-white' : 'text-gray-900'
                                }`
                              }
                              value={employee}
                            >
                              {({ selected, active }) => (
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="font-medium">
                                      {employee.firstName} {employee.lastName}
                                    </div>
                                    <div className={`text-sm ${active ? 'text-white' : 'text-gray-600'}`}>
                                      {employee.email}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span
                                        className={`text-xs px-2 py-0.5 rounded ${
                                          active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'
                                        }`}
                                      >
                                        {employee.employeeCode}
                                      </span>
                                      {employee.department && (
                                        <span
                                          className={`text-xs px-2 py-0.5 rounded ${
                                            active ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'
                                          }`}
                                        >
                                          {employee.department.name}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {selected && (
                                    <CheckIcon
                                      className={`h-5 w-5 ${active ? 'text-white' : 'text-primary-600'}`}
                                    />
                                  )}
                                </div>
                              )}
                            </Combobox.Option>
                          ))
                        )}
                      </Combobox.Options>
                    </Transition>
                  </div>
                </Combobox>
              </div>

              {selectedEmployee && (
                <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-green-900 mb-3">Selected Employee</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-green-700 font-medium">Name:</span>
                      <span className="ml-2 text-green-900">
                        {selectedEmployee.firstName} {selectedEmployee.lastName}
                      </span>
                    </div>
                    <div>
                      <span className="text-green-700 font-medium">Email:</span>
                      <span className="ml-2 text-green-900">{selectedEmployee.email}</span>
                    </div>
                    <div>
                      <span className="text-green-700 font-medium">Code:</span>
                      <span className="ml-2 text-green-900">{selectedEmployee.employeeCode}</span>
                    </div>
                    {selectedEmployee.department && (
                      <div>
                        <span className="text-green-700 font-medium">Department:</span>
                        <span className="ml-2 text-green-900">{selectedEmployee.department.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Fill Details */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  Review and fill in the required fields. Some fields have been pre-filled based on the selected employee.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {template.variables.map((variable) => (
                  <div
                    key={variable}
                    className={isTextAreaField(variable) ? 'col-span-full' : 'col-span-1'}
                  >
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {getFieldLabel(variable)}
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    {isDateField(variable) ? (
                      <input
                        type="date"
                        value={formData[variable] || ''}
                        onChange={(e) => handleInputChange(variable, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    ) : isNumberField(variable) ? (
                      <input
                        type="number"
                        placeholder={`Enter ${getFieldLabel(variable).toLowerCase()}`}
                        value={formData[variable] || ''}
                        onChange={(e) => handleInputChange(variable, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    ) : isTextAreaField(variable) ? (
                      <textarea
                        rows={4}
                        placeholder={`Enter ${getFieldLabel(variable).toLowerCase()}`}
                        value={formData[variable] || ''}
                        onChange={(e) => handleInputChange(variable, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    ) : (
                      <input
                        type="text"
                        placeholder={`Enter ${getFieldLabel(variable).toLowerCase()}`}
                        value={formData[variable] || ''}
                        onChange={(e) => handleInputChange(variable, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Review & Generate */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-green-900 mb-2">Ready to Generate</h3>
                <p className="text-sm text-green-700">
                  Review the information below and click "Generate Document" to create your {template.name}.
                </p>
              </div>

              {/* Employee Info */}
              {selectedEmployee && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3 pb-2 border-b border-gray-200">
                    Employee Information
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Name:</span>
                      <span className="ml-2 text-gray-900 font-medium">
                        {selectedEmployee.firstName} {selectedEmployee.lastName}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Email:</span>
                      <span className="ml-2 text-gray-900">{selectedEmployee.email}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Employee Code:</span>
                      <span className="ml-2 text-gray-900">{selectedEmployee.employeeCode}</span>
                    </div>
                    {selectedEmployee.department && (
                      <div>
                        <span className="text-gray-500">Department:</span>
                        <span className="ml-2 text-gray-900">{selectedEmployee.department.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Document Data */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3 pb-2 border-b border-gray-200">
                  Document Data
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {Object.entries(formData).map(([key, value]) => (
                    <div key={key} className="flex flex-col">
                      <span className="text-gray-500 text-xs mb-1">{getFieldLabel(key)}</span>
                      <span className="text-gray-900 font-medium break-words">{value || '-'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={currentStep === 1 ? onClose : handleBack}
            className="btn-secondary"
          >
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </button>

          {currentStep < totalSteps ? (
            <button
              onClick={handleNext}
              disabled={!isStepValid()}
              className="btn-primary"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={loading || !isStepValid()}
              className="btn-primary"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Generating...
                </span>
              ) : (
                'Generate Document'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
