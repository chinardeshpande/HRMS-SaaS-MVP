import { FormEvent, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import api from '../services/api';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post<{ message: string }>('/auth/reset-password', {
        token,
        password,
      });
      setMessage(response.data?.message || 'Password reset successful. You can now sign in.');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Unable to reset password');
    } finally {
      setLoading(false);
    }
  };

  const renderPasswordInput = (
    id: string,
    label: string,
    value: string,
    onChange: (value: string) => void,
    visible: boolean,
    setVisible: (value: boolean) => void
  ) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <LockClosedIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          id={id}
          name={id}
          type={visible ? 'text' : 'password'}
          autoComplete="new-password"
          required
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="input pl-10 pr-10 block w-full"
          placeholder="Enter new password"
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
        >
          {visible ? (
            <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          ) : (
            <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <img
            src="/brand/aura/aura-logo-exact-transparent.png"
            alt="Aura - People operations. Humanly intelligent."
            className="mx-auto h-16 w-auto"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create new password</h1>
            <p className="text-gray-500">Choose a secure password for your Aura account.</p>
          </div>

          {message && (
            <div className="mb-6 rounded-lg border border-success-200 bg-success-50 p-4">
              <p className="text-sm text-success-800">{message}</p>
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-lg border border-danger-200 bg-danger-50 p-4">
              <p className="text-sm text-danger-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {renderPasswordInput(
              'password',
              'New Password',
              password,
              setPassword,
              showPassword,
              setShowPassword
            )}

            {renderPasswordInput(
              'confirmPassword',
              'Confirm Password',
              confirmPassword,
              setConfirmPassword,
              showConfirmPassword,
              setShowConfirmPassword
            )}

            <button type="submit" disabled={loading || !!message} className="btn btn-primary w-full btn-lg">
              {loading ? 'Updating...' : 'Reset password'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm font-medium text-primary-600 hover:text-primary-500">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
