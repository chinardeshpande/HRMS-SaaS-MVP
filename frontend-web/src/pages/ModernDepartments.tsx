import { useEffect, useMemo, useState } from 'react';
import { ModernLayout } from '../components/layout/ModernLayout';
import {
  BuildingOfficeIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import departmentService, { Department } from '../services/departmentService';

interface DepartmentForm {
  name: string;
  parentDeptId: string;
}

const emptyForm: DepartmentForm = {
  name: '',
  parentDeptId: '',
};

export default function ModernDepartments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form, setForm] = useState<DepartmentForm>(emptyForm);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const departmentById = useMemo(
    () => new Map(departments.map((department) => [department.departmentId, department])),
    [departments]
  );

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await departmentService.getAll();
      setDepartments(data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to load departments');
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

  const openEditModal = (department: Department) => {
    setEditing(department);
    setForm({
      name: department.name,
      parentDeptId: department.parentDeptId || '',
    });
    setError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const saveDepartment = async () => {
    const name = form.name.trim();
    if (!name) {
      setError('Department name is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const payload = {
        name,
        parentDeptId: form.parentDeptId || undefined,
      };

      if (editing) {
        await departmentService.update(editing.departmentId, payload);
      } else {
        await departmentService.create(payload);
      }

      closeModal();
      await fetchDepartments();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to save department');
    } finally {
      setSaving(false);
    }
  };

  const deleteDepartment = async (department: Department) => {
    const hasChildren = departments.some((item) => item.parentDeptId === department.departmentId);
    if (hasChildren) {
      setError('Cannot delete department with sub-departments');
      return;
    }

    if (!window.confirm(`Delete department "${department.name}"? This cannot be undone.`)) return;

    try {
      setError(null);
      await departmentService.delete(department.departmentId);
      await fetchDepartments();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to delete department');
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
            <h1 className="text-3xl font-bold text-gray-900">Departments</h1>
            <p className="mt-2 text-gray-600">Maintain the organization units used by employees, reports, imports, and workflows.</p>
          </div>
          <button onClick={openCreateModal} className="btn btn-primary">
            <PlusIcon className="mr-2 h-5 w-5" />
            Add Department
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="stat-card">
            <BuildingOfficeIcon className="h-6 w-6 text-primary-600" />
            <p className="mt-3 text-sm text-gray-500">Total departments</p>
            <p className="text-2xl font-bold text-gray-900">{departments.length}</p>
          </div>
          <div className="stat-card">
            <BuildingOfficeIcon className="h-6 w-6 text-indigo-600" />
            <p className="mt-3 text-sm text-gray-500">Root departments</p>
            <p className="text-2xl font-bold text-gray-900">{departments.filter((item) => !item.parentDeptId).length}</p>
          </div>
          <div className="stat-card">
            <BuildingOfficeIcon className="h-6 w-6 text-emerald-600" />
            <p className="mt-3 text-sm text-gray-500">Sub-departments</p>
            <p className="text-2xl font-bold text-gray-900">{departments.filter((item) => item.parentDeptId).length}</p>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Department Directory</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Parent</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-10 text-center text-sm text-gray-500">Loading departments...</td>
                  </tr>
                ) : departments.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-10 text-center text-sm text-gray-500">No departments found. Add the first department before importing employees.</td>
                  </tr>
                ) : (
                  departments.map((department) => (
                    <tr key={department.departmentId} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{department.name}</div>
                        <div className="text-xs text-gray-500">{department.departmentId}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {department.parentDeptId ? departmentById.get(department.parentDeptId)?.name || 'Parent not found' : 'Root department'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => openEditModal(department)} className="btn btn-outline-primary mr-2">
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button onClick={() => deleteDepartment(department)} className="btn btn-danger">
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
              <h2 className="text-lg font-semibold text-gray-900">{editing ? 'Edit Department' : 'Add Department'}</h2>
              <button onClick={closeModal} className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 px-6 py-5">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Department name</span>
                <input
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  className="input mt-1"
                  placeholder="Example: Human Resources"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Parent department</span>
                <select
                  value={form.parentDeptId}
                  onChange={(event) => setForm({ ...form, parentDeptId: event.target.value })}
                  className="input mt-1"
                >
                  <option value="">None - root department</option>
                  {departments
                    .filter((department) => department.departmentId !== editing?.departmentId)
                    .map((department) => (
                      <option key={department.departmentId} value={department.departmentId}>
                        {department.name}
                      </option>
                    ))}
                </select>
              </label>
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button onClick={closeModal} className="btn btn-secondary">Cancel</button>
              <button onClick={saveDepartment} disabled={saving} className="btn btn-primary">
                {saving ? 'Saving...' : editing ? 'Update Department' : 'Create Department'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModernLayout>
  );
}
