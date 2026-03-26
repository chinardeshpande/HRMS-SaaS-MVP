import { useState, useEffect } from 'react';
import settingsService, { OrganizationSettings } from '../../services/settingsService';
import { BuildingOfficeIcon, PhotoIcon } from '@heroicons/react/24/outline';

export default function OrganizationTab() {
  const [settings, setSettings] = useState<OrganizationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<OrganizationSettings>>({});
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await settingsService.getOrganizationSettings();
      setSettings(data);
      setFormData(data);
    } catch (error) {
      console.error('Error loading organization settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await settingsService.updateOrganizationSettings(formData);
      await loadSettings();
      alert('Settings updated successfully!');
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof OrganizationSettings, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB');
      return;
    }

    setUploadingLogo(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const tokens = localStorage.getItem('tokens');
      if (!tokens) throw new Error('No authentication token');

      const { token } = JSON.parse(tokens);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

      const response = await fetch(`${apiUrl}/documents/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataUpload,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      const logoUrl = result.data.fileUrl;

      // Update form data with logo URL
      setFormData((prev) => ({ ...prev, logo: logoUrl }));
      alert('Logo uploaded successfully!');
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-purple-600"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Company Information */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center space-x-2">
            <BuildingOfficeIcon className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Company Information</h3>
          </div>
        </div>
        <div className="card-body space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
              <input
                type="text"
                value={formData.companyName || ''}
                onChange={(e) => handleChange('companyName', e.target.value)}
                required
                className="input w-full"
                placeholder="Acme Corporation"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
              <input
                type="text"
                value={formData.industry || ''}
                onChange={(e) => handleChange('industry', e.target.value)}
                className="input w-full"
                placeholder="Technology"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Description</label>
            <textarea
              value={formData.companyDescription || ''}
              onChange={(e) => handleChange('companyDescription', e.target.value)}
              rows={3}
              className="input w-full"
              placeholder="Brief description of your company..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
              <input
                type="text"
                value={formData.registrationNumber || ''}
                onChange={(e) => handleChange('registrationNumber', e.target.value)}
                className="input w-full"
                placeholder="REG-123456"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID</label>
              <input
                type="text"
                value={formData.taxId || ''}
                onChange={(e) => handleChange('taxId', e.target.value)}
                className="input w-full"
                placeholder="TAX-789012"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Logo</label>
            <div className="flex items-center space-x-4">
              {formData.logo ? (
                <img src={formData.logo} alt="Logo" className="h-16 w-16 rounded-lg object-cover border" />
              ) : (
                <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center border">
                  <PhotoIcon className="h-8 w-8 text-gray-400" />
                </div>
              )}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload"
                />
                <label htmlFor="logo-upload" className="btn btn-secondary cursor-pointer">
                  {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                </label>
                {formData.logo && (
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, logo: '' }))}
                    className="ml-2 text-sm text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Max file size: 2MB. Accepted formats: JPG, PNG, GIF</p>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
        </div>
        <div className="card-body space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                className="input w-full"
                placeholder="contact@company.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="input w-full"
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input
                type="url"
                value={formData.website || ''}
                onChange={(e) => handleChange('website', e.target.value)}
                className="input w-full"
                placeholder="https://company.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              value={formData.address || ''}
              onChange={(e) => handleChange('address', e.target.value)}
              rows={2}
              className="input w-full"
              placeholder="123 Main Street, Suite 100"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={formData.city || ''}
                onChange={(e) => handleChange('city', e.target.value)}
                className="input w-full"
                placeholder="San Francisco"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
              <input
                type="text"
                value={formData.state || ''}
                onChange={(e) => handleChange('state', e.target.value)}
                className="input w-full"
                placeholder="California"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
              <input
                type="text"
                value={formData.postalCode || ''}
                onChange={(e) => handleChange('postalCode', e.target.value)}
                className="input w-full"
                placeholder="94102"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input
                type="text"
                value={formData.country || ''}
                onChange={(e) => handleChange('country', e.target.value)}
                className="input w-full"
                placeholder="United States"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Regional Settings */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">Regional & Format Settings</h3>
        </div>
        <div className="card-body space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
              <select
                value={formData.timezone || 'UTC'}
                onChange={(e) => handleChange('timezone', e.target.value)}
                className="input w-full"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="Asia/Kolkata">India (IST)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select
                value={formData.currency || 'USD'}
                onChange={(e) => handleChange('currency', e.target.value)}
                className="input w-full"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="INR">INR - Indian Rupee</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
              <select
                value={formData.defaultLanguage || 'en'}
                onChange={(e) => handleChange('defaultLanguage', e.target.value)}
                className="input w-full"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Format</label>
              <select
                value={formData.dateFormat || 'MM/DD/YYYY'}
                onChange={(e) => handleChange('dateFormat', e.target.value)}
                className="input w-full"
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time Format</label>
              <select
                value={formData.timeFormat || '12h'}
                onChange={(e) => handleChange('timeFormat', e.target.value)}
                className="input w-full"
              >
                <option value="12h">12-hour (AM/PM)</option>
                <option value="24h">24-hour</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">Security Settings</h3>
        </div>
        <div className="card-body space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Two-Factor Authentication</p>
              <p className="text-sm text-gray-500">Require 2FA for all users</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.twoFactorAuthRequired || false}
                onChange={(e) => handleChange('twoFactorAuthRequired', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password Expiry (days)</label>
              <input
                type="number"
                value={formData.passwordExpiryDays || 30}
                onChange={(e) => handleChange('passwordExpiryDays', parseInt(e.target.value))}
                min="0"
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Login Attempts</label>
              <input
                type="number"
                value={formData.maxLoginAttempts || 5}
                onChange={(e) => handleChange('maxLoginAttempts', parseInt(e.target.value))}
                min="1"
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session Timeout (minutes)</label>
              <input
                type="number"
                value={formData.sessionTimeoutMinutes || 30}
                onChange={(e) => handleChange('sessionTimeoutMinutes', parseInt(e.target.value))}
                min="5"
                className="input w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end space-x-3">
        <button type="button" onClick={loadSettings} className="btn btn-secondary">
          Reset
        </button>
        <button type="submit" disabled={saving} className="btn btn-primary">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
