import { useEffect, useState } from 'react';
import { ModernLayout } from '../components/layout/ModernLayout';
import {
  BriefcaseIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import designationService, { Designation } from '../services/designationService';

interface DesignationForm {
  name: string;
  level: string;
}

const emptyForm: DesignationForm = {
  name: '',
  level: '',
};

export default function ModernDesignations() {
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Designation | null>(null);
  const [form, setForm] = useState<DesignationForm>(emptyForm);

  useEffect(() => {
    fetchDesignations();
  }, []);

  const fetchDesignations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await designationService.getAll();
      setDesignations(data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to load designations');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (designation: Designation) => {
    setEditing(designation);
    setForm({
      name: designation.name,
      level: designation.level === undefined || designation.level === null ? '' : String(designation.level),
    });
    setError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const saveDesignation = async () => {
    const name = form.name.trim();
    const level = form.level === '' ? undefined : Number(form.level);

    if (!name) {
      setError('Designation name is required');
      return;
    }

    if (level !== undefined && (!Number.isInteger(level) || level < 1)) {
      setError('Level must be a positive whole number');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const payload = { name, level };

      if (editing) {
        await designationService.update(editing.designationId, payload);
      } else {
        await designationService.create(payload);
      }

      closeModal();
      await fetchDesignations();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to save designation');
    } finally {
      setSaving(false);
    }
  };

  const deleteDesignation = async (designation: Designation) => {
    if (!window.confirm(`Delete designation "${designation.name}"? This cannot be undone.`)) return;

    try {
      setError(null);
      await designationService.delete(designation.designationId);
      await fetchDesignations();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to delete designation');
    }
  };

  return (
    <ModernLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
              Master Data
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Designations</h1>
            <p className="mt-2 text-gray-600">Maintain role titles and hierarchy levels used by employees, approvals, imports, and reporting.</p>
          </div>
          <button onClick={openCreateModal} className="btn btn-primary">
            <PlusIcon className="mr-2 h-5 w-5" />
            Add Designation
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="stat-card">
            <BriefcaseIcon className="h-6 w-6 text-primary-600" />
            <p className="mt-3 text-sm text-gray-500">Total designations</p>
            <p className="text-2xl font-bold text-gray-900">{designations.length}</p>
          </div>
          <div className="stat-card">
            <BriefcaseIcon className="h-6 w-6 text-indigo-600" />
            <p className="mt-3 text-sm text-gray-500">Levels configured</p>
            <p className="text-2xl font-bold text-gray-900">{new Set(designations.map((item) => item.level).filter(Boolean)).size}</p>
          </div>
          <div className="stat-card">
            <BriefcaseIcon className="h-6 w-6 text-emerald-600" />
            <p className="mt-3 text-sm text-gray-500">Without level</p>
            <p className="text-2xl font-bold text-gray-900">{designations.filter((item) => !item.level).length}</p>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Designation Directory</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Designation</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Level</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-10 text-center text-sm text-gray-500">Loading designations...</td>
                  </tr>
                ) : designations.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-10 text-center text-sm text-gray-500">No designations found. Add designations before importing employees.</td>
                  </tr>
                ) : (
                  designations.map((designation) => (
                    <tr key={designation.designationId} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{designation.name}</div>
                        <div className="text-xs text-gray-500">{designation.designationId}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {designation.level ? `Level ${designation.level}` : 'Not set'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => openEditModal(designation)} className="btn btn-outline-primary mr-2">
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button onClick={() => deleteDesignation(designation)} className="btn btn-danger">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">{editing ? 'Edit Designation' : 'Add Designation'}</h2>
              <button onClick={closeModal} className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 px-6 py-5">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Designation name</span>
                <input
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  className="input mt-1"
                  placeholder="Example: Senior Software Engineer"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Hierarchy level</span>
                <input
                  value={form.level}
                  onChange={(event) => setForm({ ...form, level: event.target.value })}
                  className="input mt-1"
                  type="number"
                  min="1"
                  placeholder="Example: 3"
                />
                <p className="mt-1 text-xs text-gray-500">Use lower numbers for junior roles and higher numbers for senior roles.</p>
              </label>
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button onClick={closeModal} className="btn btn-secondary">Cancel</button>
              <button onClick={saveDesignation} disabled={saving} className="btn btn-primary">
                {saving ? 'Saving...' : editing ? 'Update Designation' : 'Create Designation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModernLayout>
  );
}
