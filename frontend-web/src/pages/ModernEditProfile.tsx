import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ModernLayout } from '../components/layout/ModernLayout';
import employeeService from '../services/employeeService';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function ModernEditProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const employee = location.state?.employee;

  const [formData, setFormData] = useState({
    firstName: employee?.firstName || '',
    lastName: employee?.lastName || '',
    email: employee?.email || '',
    phone: employee?.phone || '',
    dateOfBirth: employee?.dateOfBirth || '',
    gender: employee?.gender || '',
    maritalStatus: employee?.maritalStatus || '',
    nationality: employee?.nationality || '',
    address: employee?.address || '',
    emergencyContact: employee?.emergencyContact || '',
    emergencyPhone: employee?.emergencyPhone || '',
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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await employeeService.update(employee.employeeId, formData);
      showNotification('Profile updated successfully!', 'success');
      setTimeout(() => navigate(`/employees/${employee.employeeId}`), 1500);
    } catch (err: any) {
      showNotification('Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  if (!employee) return null;

  return (
    <ModernLayout>
      {notification.show && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className={`rounded-lg px-4 py-3 shadow-xl ${notification.type === 'success' ? 'bg-success-600' : 'bg-danger-600'}`}>
            <p className="text-sm font-medium text-white">{notification.message}</p>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate(`/employees/${employee.employeeId}`)} className="btn btn-secondary mb-4">
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back
        </button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
            <p className="text-sm text-gray-600 mt-1">{employee.firstName} {employee.lastName} • {employee.employeeCode}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="card border-2 border-purple-200">
            <div className="card-body p-5">
              <h3 className="text-xs font-bold text-gray-900 mb-3 pb-2 border-b-2 border-purple-200 flex items-center">
                <span className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs mr-2">👤</span>
                Personal Information
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">First Name *</label>
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required className="input input-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Last Name *</label>
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required className="input input-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Date of Birth</label>
                  <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="input input-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} className="input input-sm">
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Marital Status</label>
                  <select name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} className="input input-sm">
                    <option value="">Select</option>
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="divorced">Divorced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Nationality</label>
                  <input type="text" name="nationality" value={formData.nationality} onChange={handleChange} className="input input-sm" />
                </div>
              </div>
            </div>
          </div>

          <div className="card border-2 border-blue-200">
            <div className="card-body p-5">
              <h3 className="text-xs font-bold text-gray-900 mb-3 pb-2 border-b-2 border-blue-200 flex items-center">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs mr-2">📧</span>
                Contact Details
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required className="input input-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Phone</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="input input-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Address</label>
                  <textarea name="address" value={formData.address} onChange={handleChange} rows={2} className="input input-sm" />
                </div>
              </div>
            </div>
          </div>

          <div className="card border-2 border-red-200">
            <div className="card-body p-5">
              <h3 className="text-xs font-bold text-gray-900 mb-3 pb-2 border-b-2 border-red-200 flex items-center">
                <span className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs mr-2">🆘</span>
                Emergency Contact
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Contact Name</label>
                  <input type="text" name="emergencyContact" value={formData.emergencyContact} onChange={handleChange} className="input input-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Contact Phone</label>
                  <input type="tel" name="emergencyPhone" value={formData.emergencyPhone} onChange={handleChange} className="input input-sm" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button type="button" onClick={() => navigate(`/employees/${employee.employeeId}`)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </ModernLayout>
  );
}
