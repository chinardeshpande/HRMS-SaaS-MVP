import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ModernLayout } from '../components/layout/ModernLayout';
import departmentService, { Department } from '../services/departmentService';
import { ArrowLeftIcon, ArrowsRightLeftIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';

export default function ModernTransfer() {
  const navigate = useNavigate();
  const location = useLocation();
  const employee = location.state?.employee;

  const [departments, setDepartments] = useState<Department[]>([]);
  const [formData, setFormData] = useState({
    newDepartmentId: '',
    newLocation: employee?.workLocation || '',
    effectiveDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  });

  useEffect(() => {
    if (!employee) {
      navigate('/employees');
      return;
    }
    fetchDepartments();
  }, [employee, navigate]);

  const fetchDepartments = async () => {
    try {
      const data = await departmentService.getAll();
      setDepartments(data);
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showNotification('Employee transferred successfully!', 'success');
      setTimeout(() => navigate(`/employees/${employee.employeeId}`), 1500);
    } catch (err: any) {
      showNotification('Failed to transfer employee', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  if (!employee) return null;

  const selectedDepartment = departments.find((d) => d.departmentId === formData.newDepartmentId);

  return (
    <ModernLayout>
      {notification.show && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className={`rounded-lg px-4 py-3 shadow-xl ${notification.type === 'success' ? 'bg-success-600' : 'bg-danger-600'}`}>
            <p className="text-sm font-medium text-white">{notification.message}</p>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate(`/employees/${employee.employeeId}`)} className="btn btn-secondary mb-4">
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Transfer Employee</h1>
          <p className="text-sm text-gray-600 mt-1">{employee.firstName} {employee.lastName} • {employee.department?.name}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Comparison */}
          <div className="card overflow-hidden border-2 border-purple-200">
            <div className="bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600 p-5">
              <div className="grid grid-cols-3 gap-3 items-center">
                <div className="text-center">
                  <p className="text-xs text-white/80 mb-2 font-bold">CURRENT DEPARTMENT</p>
                  <div className="bg-white/95 backdrop-blur rounded-lg p-3 shadow-xl">
                    <div className="w-10 h-10 rounded-full bg-gray-100 mx-auto mb-2 flex items-center justify-center">
                      <span className="text-xl">🏢</span>
                    </div>
                    <p className="text-base font-bold text-gray-900">{employee.department?.name || 'N/A'}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{employee.workLocation || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex justify-center">
                  <div className="w-12 h-12 rounded-full bg-white shadow-xl flex items-center justify-center animate-pulse">
                    <ArrowsRightLeftIcon className="h-6 w-6 text-purple-600" />
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-xs text-white/80 mb-2 font-bold">NEW DEPARTMENT</p>
                  <div className="bg-white backdrop-blur rounded-lg p-3 shadow-xl border-2 border-pink-400">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 mx-auto mb-2 flex items-center justify-center">
                      <span className="text-xl">🎯</span>
                    </div>
                    <p className="text-base font-bold text-purple-900">{selectedDepartment?.name || 'Select below'}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{formData.newLocation || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="card">
            <div className="card-body p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">Transfer Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">New Department *</label>
                  <select name="newDepartmentId" value={formData.newDepartmentId} onChange={handleChange} required className="input input-sm">
                    <option value="">Select Department</option>
                    {departments.filter((d) => d.departmentId !== employee.department?.departmentId).map((dept) => (
                      <option key={dept.departmentId} value={dept.departmentId}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">New Location</label>
                  <input type="text" name="newLocation" value={formData.newLocation} onChange={handleChange} placeholder="e.g., New York Office" className="input input-sm" />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Effective Date *</label>
                  <input type="date" name="effectiveDate" value={formData.effectiveDate} onChange={handleChange} required className="input input-sm" />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Reason / Notes</label>
                  <textarea name="notes" value={formData.notes} onChange={handleChange} rows={2} placeholder="Reason for transfer..." className="input input-sm" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button type="button" onClick={() => navigate(`/employees/${employee.employeeId}`)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading || !formData.newDepartmentId} className="btn btn-primary">
              {loading ? 'Processing...' : 'Confirm Transfer'}
            </button>
          </div>
        </form>
      </div>
    </ModernLayout>
  );
}
