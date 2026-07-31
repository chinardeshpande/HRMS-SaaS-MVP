import { useState, useEffect } from 'react';
import settingsService, { OrganizationSettings } from '../../services/settingsService';
import {
  BuildingOfficeIcon,
  PhotoIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  InformationCircleIcon,
  PhoneIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

type OrganizationSubTab = 'company' | 'contact' | 'regional' | 'security';

export default function OrganizationTab() {
  const [settings, setSettings] = useState<OrganizationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<OrganizationSettings>>({});
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<OrganizationSubTab>('company');

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

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData(settings || {});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await settingsService.updateOrganizationSettings(formData);
      await loadSettings();
      setIsEditing(false);
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

  const handleBrandingChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      branding: {
        ...(prev.branding || {}),
        [field]: value,
      },
    }));
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
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

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

  const subTabs = [
    {
      id: 'company' as OrganizationSubTab,
      name: 'Company Info',
      icon: BuildingOfficeIcon,
      description: 'Basic company details',
    },
    {
      id: 'contact' as OrganizationSubTab,
      name: 'Contact Details',
      icon: PhoneIcon,
      description: 'Contact information',
    },
    {
      id: 'regional' as OrganizationSubTab,
      name: 'Regional Settings',
      icon: GlobeAltIcon,
      description: 'Timezone, currency & formats',
    },
    {
      id: 'security' as OrganizationSubTab,
      name: 'Security',
      icon: ShieldCheckIcon,
      description: 'Security policies',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Edit Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Organization Settings</h2>
          <p className="text-sm text-gray-500 mt-1">
            {isEditing ? 'Make changes to your organization details' : 'View your organization information'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="btn btn-primary flex items-center space-x-2"
            >
              <PencilIcon className="h-4 w-4" />
              <span>Edit</span>
            </button>
          ) : (
            <>
              <button
                onClick={handleCancel}
                className="btn btn-secondary flex items-center space-x-2"
              >
                <XMarkIcon className="h-4 w-4" />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="btn btn-primary flex items-center space-x-2"
              >
                <CheckIcon className="h-4 w-4" />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50">
          <nav className="flex overflow-x-auto">
            {subTabs.map((subTab) => {
              const Icon = subTab.icon;
              return (
                <button
                  key={subTab.id}
                  onClick={() => setActiveSubTab(subTab.id)}
                  className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeSubTab === subTab.id
                      ? 'border-purple-600 text-purple-600 bg-white'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <div className="text-left">
                    <div>{subTab.name}</div>
                    <div className="text-xs text-gray-400 font-normal hidden lg:block">
                      {subTab.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sub-Tab Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Company Information */}
          {activeSubTab === 'company' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name *
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.companyName || ''}
                      onChange={(e) => handleChange('companyName', e.target.value)}
                      required
                      className="input w-full"
                      placeholder="Acme Corporation"
                    />
                  ) : (
                    <div className="text-base text-gray-900 font-medium bg-gray-50 px-4 py-2.5 rounded-lg border border-gray-200">
                      {formData.companyName || '—'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.industry || ''}
                      onChange={(e) => handleChange('industry', e.target.value)}
                      className="input w-full"
                      placeholder="Technology"
                    />
                  ) : (
                    <div className="text-base text-gray-900 bg-gray-50 px-4 py-2.5 rounded-lg border border-gray-200">
                      {formData.industry || '—'}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Description
                </label>
                {isEditing ? (
                  <textarea
                    value={formData.companyDescription || ''}
                    onChange={(e) => handleChange('companyDescription', e.target.value)}
                    rows={4}
                    className="input w-full"
                    placeholder="Brief description of your company..."
                  />
                ) : (
                  <div className="text-base text-gray-900 bg-gray-50 px-4 py-3 rounded-lg border border-gray-200 min-h-[100px]">
                    {formData.companyDescription || '—'}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Registration Number
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.registrationNumber || ''}
                      onChange={(e) => handleChange('registrationNumber', e.target.value)}
                      className="input w-full"
                      placeholder="REG-123456"
                    />
                  ) : (
                    <div className="text-base text-gray-900 bg-gray-50 px-4 py-2.5 rounded-lg border border-gray-200">
                      {formData.registrationNumber || '—'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tax ID</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.taxId || ''}
                      onChange={(e) => handleChange('taxId', e.target.value)}
                      className="input w-full"
                      placeholder="TAX-789012"
                    />
                  ) : (
                    <div className="text-base text-gray-900 bg-gray-50 px-4 py-2.5 rounded-lg border border-gray-200">
                      {formData.taxId || '—'}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
                <div className="flex items-start space-x-4">
                  {formData.logo ? (
                    <img
                      src={formData.logo}
                      alt="Logo"
                      className="h-20 w-20 rounded-lg object-contain border border-gray-300 bg-white p-2 shadow-sm"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-300">
                      <PhotoIcon className="h-10 w-10 text-gray-400" />
                    </div>
                  )}
                  {isEditing && (
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label htmlFor="logo-upload" className="btn btn-secondary cursor-pointer inline-block">
                        {uploadingLogo ? 'Uploading...' : 'Upload New Logo'}
                      </label>
                      {formData.logo && (
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, logo: '' }))}
                          className="ml-3 text-sm text-red-600 hover:text-red-800"
                        >
                          Remove Logo
                        </button>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Max file size: 2MB. Accepted formats: JPG, PNG, GIF
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Primary Brand Color</label>
                  {isEditing ? (
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={formData.branding?.primaryColor || '#2563eb'}
                        onChange={(e) => handleBrandingChange('primaryColor', e.target.value)}
                        className="h-10 w-12 rounded border border-gray-300 bg-white"
                      />
                      <input
                        type="text"
                        value={formData.branding?.primaryColor || ''}
                        onChange={(e) => handleBrandingChange('primaryColor', e.target.value)}
                        className="input w-full"
                        placeholder="#2563eb"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5">
                      <span
                        className="h-5 w-5 rounded-full border border-gray-300"
                        style={{ backgroundColor: formData.branding?.primaryColor || '#2563eb' }}
                      />
                      <span className="text-base text-gray-900">{formData.branding?.primaryColor || 'Default Aura navy'}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Accent Brand Color</label>
                  {isEditing ? (
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={formData.branding?.accentColor || '#0ea5e9'}
                        onChange={(e) => handleBrandingChange('accentColor', e.target.value)}
                        className="h-10 w-12 rounded border border-gray-300 bg-white"
                      />
                      <input
                        type="text"
                        value={formData.branding?.accentColor || ''}
                        onChange={(e) => handleBrandingChange('accentColor', e.target.value)}
                        className="input w-full"
                        placeholder="#0ea5e9"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5">
                      <span
                        className="h-5 w-5 rounded-full border border-gray-300"
                        style={{ backgroundColor: formData.branding?.accentColor || '#0ea5e9' }}
                      />
                      <span className="text-base text-gray-900">{formData.branding?.accentColor || 'Default accent'}</span>
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-primary-100 bg-primary-50 px-4 py-3">
                  <p className="text-sm font-semibold text-primary-900">Workspace identity</p>
                  <p className="mt-1 text-xs text-primary-700">
                    Logo and colors are used in tenant workspace surfaces. Aura remains the platform brand.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Contact Information */}
          {activeSubTab === 'contact' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className="input w-full"
                      placeholder="contact@company.com"
                    />
                  ) : (
                    <div className="text-base text-gray-900 bg-gray-50 px-4 py-2.5 rounded-lg border border-gray-200">
                      {formData.email || '—'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className="input w-full"
                      placeholder="+1 (555) 123-4567"
                    />
                  ) : (
                    <div className="text-base text-gray-900 bg-gray-50 px-4 py-2.5 rounded-lg border border-gray-200">
                      {formData.phone || '—'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                  {isEditing ? (
                    <input
                      type="url"
                      value={formData.website || ''}
                      onChange={(e) => handleChange('website', e.target.value)}
                      className="input w-full"
                      placeholder="https://company.com"
                    />
                  ) : (
                    <div className="text-base text-gray-900 bg-gray-50 px-4 py-2.5 rounded-lg border border-gray-200">
                      {formData.website ? (
                        <a
                          href={formData.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:text-purple-700"
                        >
                          {formData.website}
                        </a>
                      ) : (
                        '—'
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                {isEditing ? (
                  <textarea
                    value={formData.address || ''}
                    onChange={(e) => handleChange('address', e.target.value)}
                    rows={2}
                    className="input w-full"
                    placeholder="123 Main Street, Suite 100"
                  />
                ) : (
                  <div className="text-base text-gray-900 bg-gray-50 px-4 py-2.5 rounded-lg border border-gray-200">
                    {formData.address || '—'}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.city || ''}
                      onChange={(e) => handleChange('city', e.target.value)}
                      className="input w-full"
                      placeholder="San Francisco"
                    />
                  ) : (
                    <div className="text-base text-gray-900 bg-gray-50 px-4 py-2.5 rounded-lg border border-gray-200">
                      {formData.city || '—'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State/Province
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.state || ''}
                      onChange={(e) => handleChange('state', e.target.value)}
                      className="input w-full"
                      placeholder="California"
                    />
                  ) : (
                    <div className="text-base text-gray-900 bg-gray-50 px-4 py-2.5 rounded-lg border border-gray-200">
                      {formData.state || '—'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.postalCode || ''}
                      onChange={(e) => handleChange('postalCode', e.target.value)}
                      className="input w-full"
                      placeholder="94102"
                    />
                  ) : (
                    <div className="text-base text-gray-900 bg-gray-50 px-4 py-2.5 rounded-lg border border-gray-200">
                      {formData.postalCode || '—'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.country || ''}
                      onChange={(e) => handleChange('country', e.target.value)}
                      className="input w-full"
                      placeholder="United States"
                    />
                  ) : (
                    <div className="text-base text-gray-900 bg-gray-50 px-4 py-2.5 rounded-lg border border-gray-200">
                      {formData.country || '—'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Regional Settings */}
          {activeSubTab === 'regional' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                  {isEditing ? (
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
                  ) : (
                    <div className="text-base text-gray-900 bg-gray-50 px-4 py-2.5 rounded-lg border border-gray-200">
                      {formData.timezone || 'UTC'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                  {isEditing ? (
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
                  ) : (
                    <div className="text-base text-gray-900 bg-gray-50 px-4 py-2.5 rounded-lg border border-gray-200">
                      {formData.currency || 'USD'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                  {isEditing ? (
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
                  ) : (
                    <div className="text-base text-gray-900 bg-gray-50 px-4 py-2.5 rounded-lg border border-gray-200">
                      {formData.defaultLanguage === 'en'
                        ? 'English'
                        : formData.defaultLanguage === 'es'
                        ? 'Spanish'
                        : formData.defaultLanguage === 'fr'
                        ? 'French'
                        : formData.defaultLanguage === 'de'
                        ? 'German'
                        : 'English'}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
                  {isEditing ? (
                    <select
                      value={formData.dateFormat || 'MM/DD/YYYY'}
                      onChange={(e) => handleChange('dateFormat', e.target.value)}
                      className="input w-full"
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  ) : (
                    <div className="text-base text-gray-900 bg-gray-50 px-4 py-2.5 rounded-lg border border-gray-200">
                      {formData.dateFormat || 'MM/DD/YYYY'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time Format</label>
                  {isEditing ? (
                    <select
                      value={formData.timeFormat || '12h'}
                      onChange={(e) => handleChange('timeFormat', e.target.value)}
                      className="input w-full"
                    >
                      <option value="12h">12-hour (AM/PM)</option>
                      <option value="24h">24-hour</option>
                    </select>
                  ) : (
                    <div className="text-base text-gray-900 bg-gray-50 px-4 py-2.5 rounded-lg border border-gray-200">
                      {formData.timeFormat === '12h' ? '12-hour (AM/PM)' : '24-hour'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeSubTab === 'security' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-500">Require 2FA for all users</p>
                </div>
                {isEditing ? (
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.twoFactorAuthRequired || false}
                      onChange={(e) => handleChange('twoFactorAuthRequired', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                ) : (
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      formData.twoFactorAuthRequired
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {formData.twoFactorAuthRequired ? 'Enabled' : 'Disabled'}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password Expiry (days)
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={formData.passwordExpiryDays || 30}
                      onChange={(e) => handleChange('passwordExpiryDays', parseInt(e.target.value))}
                      min="0"
                      className="input w-full"
                    />
                  ) : (
                    <div className="text-base text-gray-900 bg-gray-50 px-4 py-2.5 rounded-lg border border-gray-200">
                      {formData.passwordExpiryDays || 30} days
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Login Attempts
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={formData.maxLoginAttempts || 5}
                      onChange={(e) => handleChange('maxLoginAttempts', parseInt(e.target.value))}
                      min="1"
                      className="input w-full"
                    />
                  ) : (
                    <div className="text-base text-gray-900 bg-gray-50 px-4 py-2.5 rounded-lg border border-gray-200">
                      {formData.maxLoginAttempts || 5} attempts
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Timeout (minutes)
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={formData.sessionTimeoutMinutes || 30}
                      onChange={(e) => handleChange('sessionTimeoutMinutes', parseInt(e.target.value))}
                      min="5"
                      className="input w-full"
                    />
                  ) : (
                    <div className="text-base text-gray-900 bg-gray-50 px-4 py-2.5 rounded-lg border border-gray-200">
                      {formData.sessionTimeoutMinutes || 30} minutes
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Info message when in display mode */}
      {!isEditing && (
        <div className="flex items-start space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <InformationCircleIcon className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            Click the <strong>Edit</strong> button above to make changes to your organization settings.
          </div>
        </div>
      )}
    </div>
  );
}
