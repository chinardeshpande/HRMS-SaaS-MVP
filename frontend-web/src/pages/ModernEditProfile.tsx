import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ModernLayout } from '../components/layout/ModernLayout';
import accountService from '../services/accountService';
import { User } from '../types';
import {
  CameraIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  LockClosedIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

interface ProfileForm {
  fullName: string;
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const toDateInput = (value?: string): string => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const persistUser = (user: User) => {
  localStorage.setItem('user', JSON.stringify(user));
  window.dispatchEvent(new CustomEvent('aurorahr:user-updated', { detail: user }));
};

const PROFILE_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const PROFILE_PHOTO_MAX_SIZE = 2 * 1024 * 1024;

export default function ModernEditProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    fullName: '',
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
  });
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
  const assetBaseUrl = apiBaseUrl.replace('/api/v1', '');
  const photoUrl = useMemo(() => {
    if (!user?.profilePhotoUrl) return '';
    return user.profilePhotoUrl.startsWith('http')
      ? user.profilePhotoUrl
      : `${assetBaseUrl}${user.profilePhotoUrl}`;
  }, [assetBaseUrl, user?.profilePhotoUrl]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const currentUser = await accountService.getMe();
        setUser(currentUser);
        setProfileForm({
          fullName: currentUser.fullName || '',
          firstName: currentUser.employee?.firstName || '',
          lastName: currentUser.employee?.lastName || '',
          phone: currentUser.employee?.phone || '',
          dateOfBirth: toDateInput(currentUser.employee?.dateOfBirth),
          gender: currentUser.employee?.gender || '',
          address: currentUser.employee?.address || '',
        });
      } catch (error: any) {
        setNotice({ type: 'error', message: error.message || 'Unable to load profile' });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const updateProfileField = (name: keyof ProfileForm, value: string) => {
    setProfileForm((current) => ({ ...current, [name]: value }));
  };

  const updatePasswordField = (name: keyof PasswordForm, value: string) => {
    setPasswordForm((current) => ({ ...current, [name]: value }));
  };

  const handleProfileSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setNotice(null);
    setSavingProfile(true);

    try {
      const updatedUser = await accountService.updateProfile(profileForm);
      setUser(updatedUser);
      persistUser(updatedUser);
      setNotice({ type: 'success', message: 'Profile updated successfully.' });
    } catch (error: any) {
      setNotice({ type: 'error', message: error.message || 'Unable to update profile' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setNotice(null);

    if (passwordForm.newPassword.length < 8) {
      setNotice({ type: 'error', message: 'New password must be at least 8 characters long.' });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setNotice({ type: 'error', message: 'New password and confirmation do not match.' });
      return;
    }

    setSavingPassword(true);
    try {
      await accountService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setNotice({ type: 'success', message: 'Password changed successfully.' });
    } catch (error: any) {
      setNotice({ type: 'error', message: error.message || 'Unable to change password' });
    } finally {
      setSavingPassword(false);
    }
  };

  const handlePhotoChange = async (file?: File) => {
    if (!file) return;
    setNotice(null);

    if (!PROFILE_PHOTO_TYPES.includes(file.type)) {
      setNotice({ type: 'error', message: 'Please upload a JPG, PNG, or WebP profile photo.' });
      return;
    }

    if (file.size > PROFILE_PHOTO_MAX_SIZE) {
      setNotice({ type: 'error', message: 'Profile photo must be 2 MB or smaller.' });
      return;
    }

    setUploadingPhoto(true);

    try {
      const updatedUser = await accountService.uploadProfilePhoto(file);
      setUser(updatedUser);
      persistUser(updatedUser);
      setNotice({ type: 'success', message: 'Profile photo updated successfully.' });
    } catch (error: any) {
      setNotice({ type: 'error', message: error.message || 'Unable to upload profile photo' });
    } finally {
      setUploadingPhoto(false);
    }
  };

  return (
    <ModernLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My profile</h1>
          <p className="mt-1 text-sm text-gray-600">Manage your account, personal details, and sign-in security.</p>
        </div>

        {notice && (
          <div
            className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${
              notice.type === 'success'
                ? 'border-success-200 bg-success-50 text-success-800'
                : 'border-danger-200 bg-danger-50 text-danger-800'
            }`}
          >
            {notice.type === 'success' ? (
              <CheckCircleIcon className="mt-0.5 h-5 w-5 flex-shrink-0" />
            ) : (
              <ExclamationCircleIcon className="mt-0.5 h-5 w-5 flex-shrink-0" />
            )}
            <p className="text-sm font-medium">{notice.message}</p>
          </div>
        )}

        {loading ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-sm text-gray-600">
            Loading profile...
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <section className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-primary-100">
                  {photoUrl ? (
                    <img src={photoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <UserCircleIcon className="h-20 w-20 text-primary-600" />
                  )}
                </div>
                <h2 className="mt-4 text-lg font-semibold text-gray-900">{user?.fullName || 'User'}</h2>
                <p className="mt-1 text-sm text-gray-500">{user?.email}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-gray-400">{String(user?.role || '').replace('_', ' ')}</p>

                <label className="btn btn-secondary mt-5 inline-flex cursor-pointer items-center">
                  <CameraIcon className="mr-2 h-4 w-4" />
                  {uploadingPhoto ? 'Uploading...' : 'Upload photo'}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    disabled={uploadingPhoto}
                    onChange={(event) => {
                      handlePhotoChange(event.target.files?.[0]);
                      event.target.value = '';
                    }}
                  />
                </label>
                <p className="mt-3 text-xs text-gray-500">JPG, PNG, or WebP up to 2 MB.</p>
              </div>
            </section>

            <div className="space-y-6">
              <form onSubmit={handleProfileSubmit} className="rounded-lg border border-gray-200 bg-white p-5">
                <div className="mb-5 flex items-center gap-2 border-b border-gray-200 pb-3">
                  <UserCircleIcon className="h-5 w-5 text-primary-600" />
                  <h2 className="text-base font-semibold text-gray-900">Personal details</h2>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Display name</label>
                    <input
                      className="input"
                      value={profileForm.fullName}
                      onChange={(event) => updateProfileField('fullName', event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
                    <input
                      className="input"
                      value={profileForm.phone}
                      onChange={(event) => updateProfileField('phone', event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">First name</label>
                    <input
                      className="input"
                      value={profileForm.firstName}
                      onChange={(event) => updateProfileField('firstName', event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Last name</label>
                    <input
                      className="input"
                      value={profileForm.lastName}
                      onChange={(event) => updateProfileField('lastName', event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Date of birth</label>
                    <input
                      type="date"
                      className="input"
                      value={profileForm.dateOfBirth}
                      onChange={(event) => updateProfileField('dateOfBirth', event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Gender</label>
                    <select
                      className="input"
                      value={profileForm.gender}
                      onChange={(event) => updateProfileField('gender', event.target.value)}
                    >
                      <option value="">Prefer not to say</option>
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-gray-700">Address</label>
                    <textarea
                      rows={3}
                      className="input"
                      value={profileForm.address}
                      onChange={(event) => updateProfileField('address', event.target.value)}
                    />
                  </div>
                </div>

                <div className="mt-5 flex justify-end">
                  <button type="submit" className="btn btn-primary" disabled={savingProfile}>
                    {savingProfile ? 'Saving...' : 'Save profile'}
                  </button>
                </div>
              </form>

              <form onSubmit={handlePasswordSubmit} className="rounded-lg border border-gray-200 bg-white p-5">
                <div className="mb-5 flex items-center gap-2 border-b border-gray-200 pb-3">
                  <LockClosedIcon className="h-5 w-5 text-primary-600" />
                  <h2 className="text-base font-semibold text-gray-900">Password</h2>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Current password</label>
                    <input
                      type="password"
                      className="input"
                      autoComplete="current-password"
                      value={passwordForm.currentPassword}
                      onChange={(event) => updatePasswordField('currentPassword', event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">New password</label>
                    <input
                      type="password"
                      className="input"
                      autoComplete="new-password"
                      value={passwordForm.newPassword}
                      onChange={(event) => updatePasswordField('newPassword', event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Confirm password</label>
                    <input
                      type="password"
                      className="input"
                      autoComplete="new-password"
                      value={passwordForm.confirmPassword}
                      onChange={(event) => updatePasswordField('confirmPassword', event.target.value)}
                    />
                  </div>
                </div>

                <div className="mt-5 flex justify-end">
                  <button type="submit" className="btn btn-primary" disabled={savingPassword}>
                    {savingPassword ? 'Changing...' : 'Change password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ModernLayout>
  );
}
