import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ModernLayout } from '../components/layout/ModernLayout';
import {
  BriefcaseIcon,
  BuildingOfficeIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import departmentService, { Department } from '../services/departmentService';
import designationService, { Designation } from '../services/designationService';

type MasterTab = 'departments' | 'designations';
type ModalMode = 'create' | 'edit';

interface DepartmentForm {
  name: string;
  parentDeptId: string;
}

interface DesignationForm {
  name: string;
  level: string;
}

const emptyDepartmentForm: DepartmentForm = { name: '', parentDeptId: '' };
const emptyDesignationForm: DesignationForm = { name: '', level: '' };

const tabs: Array<{ id: MasterTab; label: string; icon: typeof BuildingOfficeIcon }> = [
  { id: 'departments', label: 'Departments', icon: BuildingOfficeIcon },
  { id: 'designations', label: 'Designations', icon: BriefcaseIcon },
];

function MasterDataShell({ children, embedded }: { children: ReactNode; embedded: boolean }) {
  return embedded ? <>{children}</> : <ModernLayout>{children}</ModernLayout>;
}

export default function ModernMasterData({ embedded = false }: { embedded?: boolean }) {
  const [activeTab, setActiveTab] = useState<MasterTab>('departments');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [departmentModalOpen, setDepartmentModalOpen] = useState(false);
  const [designationModalOpen, setDesignationModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [editingDesignation, setEditingDesignation] = useState<Designation | null>(null);
  const [departmentForm, setDepartmentForm] = useState<DepartmentForm>(emptyDepartmentForm);
  const [designationForm, setDesignationForm] = useState<DesignationForm>(emptyDesignationForm);

  const loadMasters = async () => {
    try {
      setLoading(true);
      setError(null);
      const [departmentData, designationData] = await Promise.all([
        departmentService.getAll(),
        designationService.getAll(),
      ]);
      setDepartments(departmentData);
      setDesignations(designationData);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to load master data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMasters();
  }, []);

  const departmentById = useMemo(
    () => new Map(departments.map((department) => [department.departmentId, department])),
    [departments]
  );

  const departmentStats = [
    { label: 'Total', value: departments.length, tone: 'text-primary-700 bg-primary-50' },
    { label: 'Top-level', value: departments.filter((item) => !item.parentDeptId).length, tone: 'text-indigo-700 bg-indigo-50' },
    { label: 'Sub-units', value: departments.filter((item) => item.parentDeptId).length, tone: 'text-emerald-700 bg-emerald-50' },
  ];

  const designationStats = [
    { label: 'Total', value: designations.length, tone: 'text-primary-700 bg-primary-50' },
    { label: 'Levels', value: new Set(designations.map((item) => item.level).filter(Boolean)).size, tone: 'text-indigo-700 bg-indigo-50' },
    { label: 'Unleveled', value: designations.filter((item) => !item.level).length, tone: 'text-amber-700 bg-amber-50' },
  ];

  const activeStats = activeTab === 'departments' ? departmentStats : designationStats;
  const activeDescription =
    activeTab === 'departments'
      ? 'Organization units used by employee records, org charts, approvals, reports, and imports.'
      : 'Role titles and hierarchy levels used by employee records, approvals, and analytics.';

  const openCreateModal = () => {
    setError(null);
    setModalMode('create');
    if (activeTab === 'departments') {
      setEditingDepartment(null);
      setDepartmentForm(emptyDepartmentForm);
      setDepartmentModalOpen(true);
      return;
    }
    setEditingDesignation(null);
    setDesignationForm(emptyDesignationForm);
    setDesignationModalOpen(true);
  };

  const openDepartmentEdit = (department: Department) => {
    setError(null);
    setModalMode('edit');
    setEditingDepartment(department);
    setDepartmentForm({
      name: department.name,
      parentDeptId: department.parentDeptId || '',
    });
    setDepartmentModalOpen(true);
  };

  const openDesignationEdit = (designation: Designation) => {
    setError(null);
    setModalMode('edit');
    setEditingDesignation(designation);
    setDesignationForm({
      name: designation.name,
      level: designation.level === undefined || designation.level === null ? '' : String(designation.level),
    });
    setDesignationModalOpen(true);
  };

  const closeModals = () => {
    setDepartmentModalOpen(false);
    setDesignationModalOpen(false);
    setEditingDepartment(null);
    setEditingDesignation(null);
    setDepartmentForm(emptyDepartmentForm);
    setDesignationForm(emptyDesignationForm);
  };

  const saveDepartment = async () => {
    const name = departmentForm.name.trim();
    if (!name) {
      setError('Department name is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const payload = { name, parentDeptId: departmentForm.parentDeptId || undefined };
      if (editingDepartment) {
        await departmentService.update(editingDepartment.departmentId, payload);
      } else {
        await departmentService.create(payload);
      }
      closeModals();
      await loadMasters();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to save department');
    } finally {
      setSaving(false);
    }
  };

  const saveDesignation = async () => {
    const name = designationForm.name.trim();
    const level = designationForm.level === '' ? undefined : Number(designationForm.level);
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
      if (editingDesignation) {
        await designationService.update(editingDesignation.designationId, payload);
      } else {
        await designationService.create(payload);
      }
      closeModals();
      await loadMasters();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to save designation');
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
      await loadMasters();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to delete department');
    }
  };

  const deleteDesignation = async (designation: Designation) => {
    if (!window.confirm(`Delete designation "${designation.name}"? This cannot be undone.`)) return;

    try {
      setError(null);
      await designationService.delete(designation.designationId);
      await loadMasters();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to delete designation');
    }
  };

  return (
    <MasterDataShell embedded={embedded}>
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Masters</h1>
            <p className="mt-1 max-w-3xl text-sm text-gray-600">
              Controlled reference data for employee migration, lifecycle workflows, reports, and approvals.
            </p>
          </div>
          <button onClick={openCreateModal} className="btn btn-primary">
            <PlusIcon className="mr-2 h-4 w-4" />
            Add {activeTab === 'departments' ? 'department' : 'designation'}
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="card p-2">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {activeStats.map((stat) => (
            <div key={stat.label} className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{stat.label}</span>
                <span className={`rounded-full px-2.5 py-1 text-lg font-bold ${stat.tone}`}>{stat.value}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">
              {activeTab === 'departments' ? 'Department Master' : 'Designation Master'}
            </h2>
            <p className="mt-1 text-sm text-gray-500">{activeDescription}</p>
          </div>

          <div className="overflow-x-auto">
            {activeTab === 'departments' ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-7/12 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Department</th>
                    <th className="w-3/12 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Parent</th>
                    <th className="w-2/12 px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={3} className="px-5 py-8 text-center text-sm text-gray-500">Loading departments...</td>
                    </tr>
                  ) : departments.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-5 py-8 text-center text-sm text-gray-500">No departments configured.</td>
                    </tr>
                  ) : (
                    departments.map((department) => (
                      <tr
                        key={department.departmentId}
                        onClick={() => openDepartmentEdit(department)}
                        className="cursor-pointer hover:bg-gray-50"
                      >
                        <td className="px-5 py-3 text-sm font-semibold text-gray-900">{department.name}</td>
                        <td className="px-5 py-3 text-sm text-gray-600">
                          {department.parentDeptId ? departmentById.get(department.parentDeptId)?.name || 'Parent not found' : 'Top-level'}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              openDepartmentEdit(department);
                            }}
                            className="rounded-lg border border-primary-200 p-2 text-primary-700 hover:bg-primary-50"
                            title="Edit department"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              deleteDepartment(department);
                            }}
                            className="ml-2 rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                            title="Delete department"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-7/12 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Designation</th>
                    <th className="w-3/12 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Level</th>
                    <th className="w-2/12 px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={3} className="px-5 py-8 text-center text-sm text-gray-500">Loading designations...</td>
                    </tr>
                  ) : designations.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-5 py-8 text-center text-sm text-gray-500">No designations configured.</td>
                    </tr>
                  ) : (
                    designations.map((designation) => (
                      <tr
                        key={designation.designationId}
                        onClick={() => openDesignationEdit(designation)}
                        className="cursor-pointer hover:bg-gray-50"
                      >
                        <td className="px-5 py-3 text-sm font-semibold text-gray-900">{designation.name}</td>
                        <td className="px-5 py-3 text-sm text-gray-600">{designation.level ? `Level ${designation.level}` : 'Not set'}</td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              openDesignationEdit(designation);
                            }}
                            className="rounded-lg border border-primary-200 p-2 text-primary-700 hover:bg-primary-50"
                            title="Edit designation"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              deleteDesignation(designation);
                            }}
                            className="ml-2 rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                            title="Delete designation"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {departmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {modalMode === 'edit' ? 'Edit Department' : 'Add Department'}
              </h2>
              <button onClick={closeModals} className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 px-6 py-5">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Department name</span>
                <input
                  value={departmentForm.name}
                  onChange={(event) => setDepartmentForm({ ...departmentForm, name: event.target.value })}
                  className="input mt-1"
                  placeholder="Example: Human Resources"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Parent department</span>
                <select
                  value={departmentForm.parentDeptId}
                  onChange={(event) => setDepartmentForm({ ...departmentForm, parentDeptId: event.target.value })}
                  className="input mt-1"
                >
                  <option value="">None - top-level department</option>
                  {departments
                    .filter((department) => department.departmentId !== editingDepartment?.departmentId)
                    .map((department) => (
                      <option key={department.departmentId} value={department.departmentId}>
                        {department.name}
                      </option>
                    ))}
                </select>
              </label>
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button onClick={closeModals} className="btn btn-secondary">Cancel</button>
              <button onClick={saveDepartment} disabled={saving} className="btn btn-primary">
                {saving ? 'Saving...' : modalMode === 'edit' ? 'Update Department' : 'Create Department'}
              </button>
            </div>
          </div>
        </div>
      )}

      {designationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {modalMode === 'edit' ? 'Edit Designation' : 'Add Designation'}
              </h2>
              <button onClick={closeModals} className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 px-6 py-5">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Designation name</span>
                <input
                  value={designationForm.name}
                  onChange={(event) => setDesignationForm({ ...designationForm, name: event.target.value })}
                  className="input mt-1"
                  placeholder="Example: Senior Software Engineer"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Hierarchy level</span>
                <input
                  value={designationForm.level}
                  onChange={(event) => setDesignationForm({ ...designationForm, level: event.target.value })}
                  className="input mt-1"
                  type="number"
                  min="1"
                  placeholder="Example: 3"
                />
                <p className="mt-1 text-xs text-gray-500">Use lower numbers for junior roles and higher numbers for senior roles.</p>
              </label>
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button onClick={closeModals} className="btn btn-secondary">Cancel</button>
              <button onClick={saveDesignation} disabled={saving} className="btn btn-primary">
                {saving ? 'Saving...' : modalMode === 'edit' ? 'Update Designation' : 'Create Designation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </MasterDataShell>
  );
}
