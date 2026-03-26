import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ModernLayout } from '../components/layout/ModernLayout';
import employeeService, { Employee, EmployeeFilters, EmployeeStats } from '../services/employeeService';
import departmentService, { Department } from '../services/departmentService';
import AddEmployeeWizard from '../components/onboarding/AddEmployeeWizard';
import BulkEmployeeUpload from '../components/onboarding/BulkEmployeeUpload';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  UsersIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  XMarkIcon,
  UserPlusIcon,
  DocumentArrowUpIcon,
} from '@heroicons/react/24/outline';

export default function ModernEmployees() {
  const navigate = useNavigate();

  // State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [stats, setStats] = useState<EmployeeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Notification
  const [notification, setNotification] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  });

  // Modals
  const [showAddOptionsModal, setShowAddOptionsModal] = useState(false);
  const [showAddWizard, setShowAddWizard] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
    fetchStats();
  }, []);

  // Apply filters when they change
  useEffect(() => {
    const filters: EmployeeFilters = {
      search: searchTerm || undefined,
      departmentId: selectedDepartment || undefined,
      status: selectedStatus as any || undefined,
    };
    fetchEmployees(filters);
  }, [searchTerm, selectedDepartment, selectedStatus]);

  const fetchEmployees = async (filters?: EmployeeFilters) => {
    try {
      setLoading(true);
      const data = await employeeService.getAll(filters);
      setEmployees(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching employees:', err);
      setError('Failed to load employees');
      showNotification('Failed to load employees', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const data = await departmentService.getAll();
      setDepartments(data);
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await employeeService.getStats();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to mark this employee as exited?')) {
      return;
    }

    try {
      await employeeService.delete(id);
      showNotification('Employee marked as exited successfully', 'success');
      fetchEmployees();
      fetchStats();
    } catch (err: any) {
      showNotification('Failed to delete employee', 'error');
    }
  };

  const handleExportCSV = () => {
    if (employees.length === 0) {
      showNotification('No employees to export', 'error');
      return;
    }

    const headers = ['Employee Code', 'First Name', 'Last Name', 'Email', 'Department', 'Designation', 'Status', 'Date of Joining'];
    const rows = employees.map(emp => [
      emp.employeeCode || '-',
      emp.firstName || '-',
      emp.lastName || '-',
      emp.email || '-',
      emp.department?.name || '-',
      emp.designation?.title || '-',
      emp.status || '-',
      emp.dateOfJoining || '-',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `employees_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    showNotification('Employee data exported successfully', 'success');
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 5000);
  };

  const handleAddEmployeeSuccess = () => {
    showNotification('Employee created successfully and added to onboarding workflow', 'success');
    fetchEmployees();
    fetchStats();
  };

  const handleBulkUploadSuccess = (results: any) => {
    showNotification(
      `Bulk upload completed: ${results.successCount} employees added successfully`,
      results.successCount > 0 ? 'success' : 'error'
    );
    fetchEmployees();
    fetchStats();
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'badge-success',
      inactive: 'badge-warning',
      exited: 'badge-danger',
    };
    return badges[status as keyof typeof badges] || 'badge-gray';
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const handleStatCardClick = (status: string) => {
    if (status === 'all') {
      setSelectedStatus('');
    } else {
      setSelectedStatus(status);
    }
  };

  const statCards = [
    {
      title: 'Total Employees',
      value: stats?.total || 0,
      icon: UsersIcon,
      iconColor: 'text-primary-600',
      iconBg: 'bg-primary-100',
      change: '+12% vs last month',
      status: 'all',
    },
    {
      title: 'Active',
      value: stats?.active || 0,
      icon: CheckCircleIcon,
      iconColor: 'text-success-600',
      iconBg: 'bg-success-100',
      change: `${Math.round(((stats?.active || 0) / (stats?.total || 1)) * 100)}% of total`,
      status: 'active',
    },
    {
      title: 'Inactive',
      value: stats?.inactive || 0,
      icon: ArrowPathIcon,
      iconColor: 'text-warning-600',
      iconBg: 'bg-warning-100',
      change: 'Temporary status',
      status: 'inactive',
    },
    {
      title: 'Exited',
      value: stats?.exited || 0,
      icon: XCircleIcon,
      iconColor: 'text-danger-600',
      iconBg: 'bg-danger-100',
      change: 'All time',
      status: 'exited',
    },
  ];

  return (
    <ModernLayout>
      {/* Notification */}
      {notification.show && (
        <div className="fixed top-20 right-4 z-50 animate-slide-in">
          <div
            className={`rounded-lg p-4 shadow-lg ${
              notification.type === 'success' ? 'bg-success-50 border border-success-200' : 'bg-danger-50 border border-danger-200'
            }`}
          >
            <div className="flex items-center">
              <p className={`text-sm font-medium ${notification.type === 'success' ? 'text-success-800' : 'text-danger-800'}`}>
                {notification.message}
              </p>
              <button
                onClick={() => setNotification({ ...notification, show: false })}
                className="ml-4"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
        <p className="mt-2 text-gray-600">Manage your workforce and track employee information</p>
      </div>

      {/* Stats Grid - matching dashboard style */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((stat, index) => (
          <div
            key={index}
            onClick={() => handleStatCardClick(stat.status)}
            className={`stat-card cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
              (stat.status === 'all' && !selectedStatus) || selectedStatus === stat.status
                ? 'ring-2 ring-primary-500 shadow-lg'
                : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="stat-label">{stat.title}</p>
                <p className="stat-value">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-2">{stat.change}</p>
              </div>
              <div className={`${stat.iconBg} rounded-xl p-3`}>
                <stat.icon className={`h-8 w-8 ${stat.iconColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or employee code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-secondary"
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filters
            {(selectedDepartment || selectedStatus) && (
              <span className="ml-2 badge badge-primary">
                {[selectedDepartment, selectedStatus].filter(Boolean).length}
              </span>
            )}
          </button>
          <button onClick={handleExportCSV} className="btn btn-secondary">
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            Export
          </button>
          <button onClick={() => setShowAddOptionsModal(true)} className="btn btn-primary">
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Employee
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="card mb-6">
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="input"
                >
                  <option value="">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept.departmentId} value={dept.departmentId}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="input"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="exited">Exited</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Employee List - Card based like dashboard */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">All Employees ({employees.length})</h2>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-primary-600"></div>
              <p className="mt-2 text-sm text-gray-500">Loading employees...</p>
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-12">
              <UsersIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No employees found</p>
              <button onClick={() => setShowAddOptionsModal(true)} className="btn btn-primary mt-4">
                <PlusIcon className="h-5 w-5 mr-2" />
                Add First Employee
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {employees.map((employee) => (
                <div
                  key={employee.employeeId}
                  className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/employees/${employee.employeeId}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                          <span className="text-base font-semibold text-white">
                            {getInitials(employee.firstName, employee.lastName)}
                          </span>
                        </div>
                      </div>

                      {/* Employee Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-semibold text-gray-900">
                            {employee.firstName} {employee.lastName}
                          </p>
                          <span className="badge badge-gray text-xs">{employee.employeeCode}</span>
                          <span className={`badge ${getStatusBadge(employee.status)} text-xs`}>
                            {employee.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <p className="text-sm text-gray-600">{employee.email}</p>
                          <span className="text-gray-300">•</span>
                          <p className="text-sm text-gray-600">{employee.department?.name || 'No Department'}</p>
                          <span className="text-gray-300">•</span>
                          <p className="text-sm text-gray-600">{employee.designation?.title || 'No Designation'}</p>
                        </div>
                      </div>

                      {/* View Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/employees/${employee.employeeId}`);
                        }}
                        className="btn btn-sm btn-secondary"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Options Modal */}
      {showAddOptionsModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" onClick={() => setShowAddOptionsModal(false)} />

            <div className="relative w-full max-w-md transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all">
              <div className="border-b border-gray-200 bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Add Employee</h2>
                  <button onClick={() => setShowAddOptionsModal(false)} className="text-white hover:text-gray-200">
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-3">
                <button
                  onClick={() => {
                    setShowAddOptionsModal(false);
                    setShowAddWizard(true);
                  }}
                  className="w-full flex items-center p-4 rounded-lg border-2 border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-all group"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-200">
                    <UserPlusIcon className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="ml-4 text-left">
                    <h3 className="text-sm font-semibold text-gray-900">Add Single Employee</h3>
                    <p className="text-xs text-gray-500 mt-1">Use wizard to add one employee at a time</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowAddOptionsModal(false);
                    setShowBulkUpload(true);
                  }}
                  className="w-full flex items-center p-4 rounded-lg border-2 border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-all group"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center group-hover:bg-success-200">
                    <DocumentArrowUpIcon className="h-6 w-6 text-success-600" />
                  </div>
                  <div className="ml-4 text-left">
                    <h3 className="text-sm font-semibold text-gray-900">Bulk Upload (CSV)</h3>
                    <p className="text-xs text-gray-500 mt-1">Upload multiple employees using CSV file</p>
                  </div>
                </button>
              </div>

              <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                <button onClick={() => setShowAddOptionsModal(false)} className="btn btn-secondary w-full">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Wizard */}
      <AddEmployeeWizard
        isOpen={showAddWizard}
        onClose={() => setShowAddWizard(false)}
        onSuccess={handleAddEmployeeSuccess}
      />

      {/* Bulk Upload Modal */}
      <BulkEmployeeUpload
        isOpen={showBulkUpload}
        onClose={() => setShowBulkUpload(false)}
        onSuccess={handleBulkUploadSuccess}
      />
    </ModernLayout>
  );
}
