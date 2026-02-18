import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ModernLayout } from '../components/layout/ModernLayout';
import { ArrowLeftIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

interface Designation {
  designationId: string;
  title: string;
  level: number;
}

export default function ModernPromote() {
  const navigate = useNavigate();
  const location = useLocation();
  const employee = location.state?.employee;

  const [designations, setDesignations] = useState<Designation[]>([
    { designationId: '1', title: 'Junior Software Engineer', level: 1 },
    { designationId: '2', title: 'Software Engineer', level: 2 },
    { designationId: '3', title: 'Senior Software Engineer', level: 3 },
    { designationId: '4', title: 'Lead Software Engineer', level: 4 },
    { designationId: '5', title: 'Engineering Manager', level: 5 },
  ]);

  const [formData, setFormData] = useState({
    newDesignationId: '',
    newSalary: employee?.salary || 0,
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
    if (!employee) navigate('/employees');
  }, [employee, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: name === 'newSalary' ? parseFloat(value) : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showNotification('Employee promoted successfully!', 'success');
      setTimeout(() => navigate(`/employees/${employee.employeeId}`), 1500);
    } catch (err: any) {
      showNotification('Failed to promote employee', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  const calculateIncrease = () => {
    if (!employee?.salary || !formData.newSalary) return 0;
    return (((formData.newSalary - employee.salary) / employee.salary) * 100).toFixed(1);
  };

  if (!employee) return null;

  const selectedDesignation = designations.find((d) => d.designationId === formData.newDesignationId);
  const increase = calculateIncrease();

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
          <h1 className="text-2xl font-bold text-gray-900">Promote Employee</h1>
          <p className="text-sm text-gray-600 mt-1">{employee.firstName} {employee.lastName} • {employee.designation?.title}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Comparison */}
          <div className="card overflow-hidden border-2 border-primary-200">
            <div className="bg-gradient-to-br from-blue-500 via-primary-600 to-indigo-600 p-5">
              <div className="grid grid-cols-3 gap-3 items-center">
                <div className="text-center">
                  <p className="text-xs text-white/80 mb-2 font-bold">CURRENT POSITION</p>
                  <div className="bg-white/95 backdrop-blur rounded-lg p-3 shadow-xl">
                    <div className="w-10 h-10 rounded-full bg-gray-100 mx-auto mb-2 flex items-center justify-center">
                      <span className="text-xl">👤</span>
                    </div>
                    <p className="text-base font-bold text-gray-900">{employee.designation?.title || 'N/A'}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{employee.department?.name}</p>
                    <p className="text-lg font-bold text-gray-700 mt-2">${employee.salary?.toLocaleString() || '0'}</p>
                  </div>
                </div>

                <div className="flex justify-center">
                  <div className="w-12 h-12 rounded-full bg-white shadow-xl flex items-center justify-center animate-pulse">
                    <ArrowTrendingUpIcon className="h-6 w-6 text-primary-600" />
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-xs text-white/80 mb-2 font-bold">NEW POSITION</p>
                  <div className="bg-white backdrop-blur rounded-lg p-3 shadow-xl border-2 border-yellow-400">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 mx-auto mb-2 flex items-center justify-center">
                      <span className="text-xl">⭐</span>
                    </div>
                    <p className="text-base font-bold text-primary-900">{selectedDesignation?.title || 'Select below'}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{employee.department?.name}</p>
                    <p className="text-lg font-bold text-success-600 mt-2">${formData.newSalary?.toLocaleString() || '0'}</p>
                    {increase && parseFloat(increase) > 0 && (
                      <div className="mt-1 inline-block px-2 py-0.5 bg-success-100 text-success-700 rounded-full text-xs font-bold">
                        +{increase}% ↑
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="card">
            <div className="card-body p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">Promotion Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">New Designation *</label>
                  <select name="newDesignationId" value={formData.newDesignationId} onChange={handleChange} required className="input input-sm">
                    <option value="">Select Position</option>
                    {designations.map((d) => (
                      <option key={d.designationId} value={d.designationId}>{d.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">New Salary *</label>
                  <input type="number" name="newSalary" value={formData.newSalary} onChange={handleChange} required min={employee.salary} step="1000" className="input input-sm" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Effective Date *</label>
                  <input type="date" name="effectiveDate" value={formData.effectiveDate} onChange={handleChange} required className="input input-sm" />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Notes</label>
                  <textarea name="notes" value={formData.notes} onChange={handleChange} rows={2} placeholder="Justification for promotion..." className="input input-sm" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button type="button" onClick={() => navigate(`/employees/${employee.employeeId}`)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading || !formData.newDesignationId} className="btn btn-primary">
              {loading ? 'Processing...' : 'Confirm Promotion'}
            </button>
          </div>
        </form>
      </div>
    </ModernLayout>
  );
}
