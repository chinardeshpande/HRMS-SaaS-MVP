import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  CloudArrowUpIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  EyeIcon,
  PencilSquareIcon,
  PlusIcon,
  PrinterIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import compensationService, {
  BulkPayslipImportResult,
  CompensationProfile,
  Payslip,
  PayslipAttachment,
  PayslipPayload,
  SalaryComponent,
  SalaryComponentType,
  SalaryStructure,
  SalaryStructurePayload,
} from '../../services/compensationService';
import DocumentViewerModal from '../common/DocumentViewerModal';

interface CompensationTabProps {
  employee: {
    employeeId: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    email: string;
    departmentName?: string;
    positionTitle?: string;
    designation?: { title?: string; name?: string };
  };
  canManage: boolean;
}

const componentPalette: Record<SalaryComponentType, string> = {
  earning: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  deduction: 'bg-rose-50 text-rose-700 border-rose-100',
  employer_contribution: 'bg-indigo-50 text-indigo-700 border-indigo-100',
};

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const defaultComponents: SalaryComponent[] = [
  { componentName: 'Basic Salary', componentType: 'earning', monthlyAmount: 0, taxable: true, statutory: false },
  { componentName: 'HRA', componentType: 'earning', monthlyAmount: 0, taxable: true, statutory: false },
  { componentName: 'Special Allowance', componentType: 'earning', monthlyAmount: 0, taxable: true, statutory: false },
  { componentName: 'PF Employee Contribution', componentType: 'deduction', monthlyAmount: 0, taxable: false, statutory: true },
  { componentName: 'Professional Tax', componentType: 'deduction', monthlyAmount: 0, taxable: false, statutory: true },
  { componentName: 'TDS', componentType: 'deduction', monthlyAmount: 0, taxable: false, statutory: true },
];

const formatMoney = (value?: number | string | null, currency = 'INR') => {
  const amount = Number(value || 0);
  return `${currency} ${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

const formatDate = (value?: string | null) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const toNumber = (value: string) => Number(value || 0);

const buildPayslipComponents = (payload: PayslipPayload) => [
  { componentName: 'Gross Earnings', componentType: 'earning' as SalaryComponentType, amount: payload.grossEarnings, displayOrder: 1 },
  { componentName: 'Total Deductions', componentType: 'deduction' as SalaryComponentType, amount: payload.totalDeductions, displayOrder: 2 },
];

const csvKnownColumns = new Set([
  'month',
  'year',
  'paymentdate',
  'grossearnings',
  'gross',
  'totalearnings',
  'totaldeductions',
  'deductions',
  'netpay',
  'netamount',
  'net',
  'paiddays',
  'lopdays',
  'status',
  'employeevisible',
  'remarks',
  'internalnotes',
]);

const normalizeHeader = (value: string) => value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

const parseCsvText = (text: string) => {
  const rows: string[][] = [];
  let current = '';
  let row: string[] = [];
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(current.trim());
      current = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(current.trim());
      if (row.some((cell) => cell)) rows.push(row);
      row = [];
      current = '';
    } else {
      current += char;
    }
  }

  row.push(current.trim());
  if (row.some((cell) => cell)) rows.push(row);
  return rows;
};

const inferComponentType = (header: string): SalaryComponentType => {
  const normalized = normalizeHeader(header);
  return /deduction|tds|tax|pf|esi|pt|lop|recovery/.test(normalized) ? 'deduction' : 'earning';
};

const bulkImportTemplateHeaders = [
  'month',
  'year',
  'paymentDate',
  'paidDays',
  'lopDays',
  'grossEarnings',
  'totalDeductions',
  'netPay',
  'employeeVisible',
  'remarks',
  'Basic Salary',
  'HRA',
  'Special Allowance',
  'PF Employee Contribution',
  'Professional Tax',
  'TDS',
];

export default function CompensationTab({ employee, canManage }: CompensationTabProps) {
  const [profile, setProfile] = useState<CompensationProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'ledger' | 'payslips' | 'transactions'>('ledger');
  const [showStructureModal, setShowStructureModal] = useState(false);
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [editingStructure, setEditingStructure] = useState<SalaryStructure | null>(null);
  const [editingPayslip, setEditingPayslip] = useState<Payslip | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showBulkImportGuide, setShowBulkImportGuide] = useState(false);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkResult, setBulkResult] = useState<BulkPayslipImportResult | null>(null);
  const [viewingPayslipAttachment, setViewingPayslipAttachment] = useState<{
    payslip: Payslip;
    attachment: PayslipAttachment;
  } | null>(null);
  const bulkInputRef = useRef<HTMLInputElement | null>(null);

  const [structureForm, setStructureForm] = useState({
    effectiveFrom: new Date().toISOString().slice(0, 10),
    annualCtc: '',
    monthlyGross: '',
    monthlyNetEstimate: '',
    employeeVisible: true,
    remarks: '',
    components: defaultComponents,
  });

  const [payslipForm, setPayslipForm] = useState({
    month: String(new Date().getMonth() + 1),
    year: String(new Date().getFullYear()),
    grossEarnings: '',
    totalDeductions: '',
    netPay: '',
    paidDays: '30',
    lopDays: '0',
    paymentDate: '',
    employeeVisible: true,
    remarks: '',
  });

  const [generateForm, setGenerateForm] = useState({
    month: String(new Date().getMonth() + 1),
    year: String(new Date().getFullYear()),
    paidDays: '30',
    lopDays: '0',
    paymentDate: new Date().toISOString().slice(0, 10),
    employeeVisible: true,
    remarks: '',
  });

  const currency = profile?.summary.currency || 'INR';

  useEffect(() => {
    loadCompensation();
  }, [employee.employeeId]);

  const loadCompensation = async () => {
    try {
      setLoading(true);
      setError(null);
      setProfile(await compensationService.getEmployeeCompensation(employee.employeeId));
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to load compensation data');
    } finally {
      setLoading(false);
    }
  };

  const groupedComponents = useMemo(() => {
    const components = profile?.activeStructure?.components || [];
    return {
      earning: components.filter((component) => component.componentType === 'earning'),
      deduction: components.filter((component) => component.componentType === 'deduction'),
      employer_contribution: components.filter((component) => component.componentType === 'employer_contribution'),
    };
  }, [profile]);

  const salaryHeadColumns = useMemo(() => {
    const names = new Set<string>();
    (profile?.payslips || []).forEach((payslip) => {
      (payslip.components || []).forEach((component) => {
        if (component.componentName?.trim()) names.add(component.componentName.trim());
      });
    });
    return Array.from(names).slice(0, 6);
  }, [profile]);

  const handleComponentChange = (
    index: number,
    field: keyof SalaryComponent,
    value: string | boolean
  ) => {
    setStructureForm((prev) => {
      const next = [...prev.components];
      next[index] = {
        ...next[index],
        [field]: field === 'monthlyAmount' ? toNumber(String(value)) : value,
      };
      return { ...prev, components: next };
    });
  };

  const addComponent = (componentType: SalaryComponentType) => {
    setStructureForm((prev) => ({
      ...prev,
      components: [
        ...prev.components,
        {
          componentName: '',
          componentType,
          monthlyAmount: 0,
          taxable: componentType === 'earning',
          statutory: false,
        },
      ],
    }));
  };

  const openNewStructureModal = () => {
    setEditingStructure(null);
    setStructureForm({
      effectiveFrom: new Date().toISOString().slice(0, 10),
      annualCtc: '',
      monthlyGross: '',
      monthlyNetEstimate: '',
      employeeVisible: true,
      remarks: '',
      components: defaultComponents,
    });
    setShowStructureModal(true);
  };

  const openEditStructureModal = (structure: SalaryStructure) => {
    setEditingStructure(structure);
    setStructureForm({
      effectiveFrom: String(structure.effectiveFrom).slice(0, 10),
      annualCtc: String(structure.annualCtc || ''),
      monthlyGross: String(structure.monthlyGross || ''),
      monthlyNetEstimate: String(structure.monthlyNetEstimate || ''),
      employeeVisible: structure.employeeVisible,
      remarks: structure.remarks || '',
      components: structure.components?.length ? structure.components : defaultComponents,
    });
    setShowStructureModal(true);
  };

  const openNewPayslipModal = () => {
    setEditingPayslip(null);
    setSelectedFile(null);
    setPayslipForm({
      month: String(new Date().getMonth() + 1),
      year: String(new Date().getFullYear()),
      grossEarnings: '',
      totalDeductions: '',
      netPay: '',
      paidDays: '30',
      lopDays: '0',
      paymentDate: '',
      employeeVisible: true,
      remarks: '',
    });
    setShowPayslipModal(true);
  };

  const openMonthlyGenerationModal = () => {
    setGenerateForm({
      month: String(new Date().getMonth() + 1),
      year: String(new Date().getFullYear()),
      paidDays: '30',
      lopDays: '0',
      paymentDate: new Date().toISOString().slice(0, 10),
      employeeVisible: true,
      remarks: '',
    });
    setShowGenerateModal(true);
  };

  const openEditPayslipModal = (payslip: Payslip) => {
    setEditingPayslip(payslip);
    setSelectedFile(null);
    setPayslipForm({
      month: String(payslip.month || ''),
      year: String(payslip.year || ''),
      grossEarnings: String(payslip.grossEarnings || ''),
      totalDeductions: String(payslip.totalDeductions || ''),
      netPay: String(payslip.netPay || ''),
      paidDays: String(payslip.paidDays || '0'),
      lopDays: String(payslip.lopDays || '0'),
      paymentDate: payslip.paymentDate ? String(payslip.paymentDate).slice(0, 10) : '',
      employeeVisible: payslip.employeeVisible,
      remarks: payslip.remarks || '',
    });
    setShowPayslipModal(true);
  };

  const saveStructure = async () => {
    const payload: SalaryStructurePayload = {
      effectiveFrom: structureForm.effectiveFrom,
      annualCtc: toNumber(structureForm.annualCtc),
      monthlyGross: toNumber(structureForm.monthlyGross),
      monthlyNetEstimate: toNumber(structureForm.monthlyNetEstimate),
      currency,
      status: 'active',
      approvalStatus: 'approved',
      employeeVisible: structureForm.employeeVisible,
      remarks: structureForm.remarks || undefined,
      components: structureForm.components
        .filter((component) => component.componentName.trim())
        .map((component, index) => ({
          ...component,
          annualAmount: Number(component.monthlyAmount || 0) * 12,
          displayOrder: index + 1,
        })),
    };

    setSaving(true);
    try {
      if (editingStructure) {
        await compensationService.updateSalaryStructure(editingStructure.structureId, payload);
      } else {
        await compensationService.createSalaryStructure(employee.employeeId, payload);
      }
      setShowStructureModal(false);
      setEditingStructure(null);
      await loadCompensation();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || err.message || 'Failed to save salary structure');
    } finally {
      setSaving(false);
    }
  };

  const savePayslip = async () => {
    const payload: PayslipPayload = {
      salaryStructureId: profile?.activeStructure?.structureId || null,
      month: toNumber(payslipForm.month),
      year: toNumber(payslipForm.year),
      grossEarnings: toNumber(payslipForm.grossEarnings),
      totalDeductions: toNumber(payslipForm.totalDeductions),
      netPay: toNumber(payslipForm.netPay),
      paidDays: toNumber(payslipForm.paidDays),
      lopDays: toNumber(payslipForm.lopDays),
      paymentDate: payslipForm.paymentDate || null,
      status: selectedFile ? 'uploaded' : 'draft',
      employeeVisible: payslipForm.employeeVisible,
      remarks: payslipForm.remarks || undefined,
    };
    payload.components = buildPayslipComponents(payload);

    setSaving(true);
    try {
      const payslip = editingPayslip
        ? await compensationService.updatePayslip(editingPayslip.payslipId, payload)
        : await compensationService.createPayslip(employee.employeeId, payload);
      if (selectedFile) {
        await compensationService.uploadPayslipAttachment(payslip.payslipId, selectedFile);
      }
      setShowPayslipModal(false);
      setEditingPayslip(null);
      setSelectedFile(null);
      await loadCompensation();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || err.message || 'Failed to save payslip');
    } finally {
      setSaving(false);
    }
  };

  const generateMonthlyTransaction = async () => {
    setSaving(true);
    try {
      await compensationService.generateMonthlyPayslip(employee.employeeId, {
        month: toNumber(generateForm.month),
        year: toNumber(generateForm.year),
        paidDays: toNumber(generateForm.paidDays),
        lopDays: toNumber(generateForm.lopDays),
        paymentDate: generateForm.paymentDate || null,
        status: 'final',
        employeeVisible: generateForm.employeeVisible,
        remarks: generateForm.remarks || undefined,
      });
      setShowGenerateModal(false);
      await loadCompensation();
      setActiveSection('transactions');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || err.message || 'Failed to generate monthly salary transaction');
    } finally {
      setSaving(false);
    }
  };

  const downloadBulkImportTemplate = () => {
    const sampleRows = [
      [
        'May',
        '2026',
        '2026-05-31',
        '31',
        '0',
        '60000',
        '9000',
        '51000',
        'true',
        'Opening migration record',
        '30000',
        '15000',
        '15000',
        '1800',
        '200',
        '7000',
      ],
      [
        'June',
        '2026',
        '2026-06-30',
        '30',
        '0',
        '60000',
        '9000',
        '51000',
        'true',
        'Monthly salary record',
        '30000',
        '15000',
        '15000',
        '1800',
        '200',
        '7000',
      ],
    ];

    const csv = [bulkImportTemplateHeaders, ...sampleRows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${employee.employeeCode || 'employee'}-salary-transaction-import-template.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importSalaryTransactions = async (file: File) => {
    setBulkImporting(true);
    setBulkResult(null);
    try {
      const rows = parseCsvText(await file.text());
      if (rows.length < 2) throw new Error('CSV must include a header row and at least one data row.');

      const headers = rows[0];
      const importedRows = rows.slice(1).map((cells) => {
        const row: Record<string, any> = {};
        const components: Array<{ componentName: string; componentType: SalaryComponentType; amount: number; displayOrder: number }> = [];

        headers.forEach((header, index) => {
          const value = cells[index] || '';
          const key = normalizeHeader(header);
          if (!key || value === '') return;

          if (csvKnownColumns.has(key)) {
            const fieldMap: Record<string, string> = {
              paymentdate: 'paymentDate',
              grossearnings: 'grossEarnings',
              gross: 'grossEarnings',
              totalearnings: 'grossEarnings',
              totaldeductions: 'totalDeductions',
              deductions: 'totalDeductions',
              netpay: 'netPay',
              netamount: 'netPay',
              net: 'netPay',
              paiddays: 'paidDays',
              lopdays: 'lopDays',
              employeevisible: 'employeeVisible',
              internalnotes: 'internalNotes',
            };
            row[fieldMap[key] || key] = value;
          } else {
            components.push({
              componentName: header.trim(),
              componentType: inferComponentType(header),
              amount: Number(value || 0),
              displayOrder: components.length + 1,
            });
          }
        });

        if (components.length) row.components = components;
        return row;
      });

      const result = await compensationService.bulkImportPayslips(employee.employeeId, importedRows, 'upsert');
      setBulkResult(result);
      setShowBulkImportGuide(false);
      await loadCompensation();
      setActiveSection('transactions');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || err.message || 'Failed to import salary transactions');
    } finally {
      setBulkImporting(false);
      if (bulkInputRef.current) bulkInputRef.current.value = '';
    }
  };

  const openPayslip = (payslip: Payslip) => setSelectedPayslip(payslip);

  const archiveStructure = async (structure: SalaryStructure) => {
    if (!window.confirm('Archive this salary structure? It will remain in history but will no longer be active.')) return;
    await compensationService.archiveSalaryStructure(structure.structureId);
    await loadCompensation();
  };

  const deletePayslip = async (payslip: Payslip) => {
    if (!window.confirm(`Delete payslip for ${monthNames[payslip.month - 1]} ${payslip.year}? This cannot be undone.`)) return;
    await compensationService.deletePayslip(payslip.payslipId);
    setSelectedPayslip(null);
    await loadCompensation();
  };

  const printPayslip = () => {
    window.print();
  };

  const downloadAttachment = async (payslip: Payslip) => {
    const attachment = payslip.attachments?.find((item) => item.isPrimary) || payslip.attachments?.[0];
    if (!attachment) {
      alert('No payslip file has been uploaded yet.');
      return;
    }
    await compensationService.downloadAttachment(attachment);
  };

  const viewAttachment = (payslip: Payslip, attachment?: PayslipAttachment) => {
    const target = attachment || payslip.attachments?.find((item) => item.isPrimary) || payslip.attachments?.[0];
    if (!target) {
      alert('No payslip file has been uploaded yet.');
      return;
    }
    setViewingPayslipAttachment({ payslip, attachment: target });
  };

  const sharePayslip = async (payslip: Payslip, channel: 'email' | 'whatsapp' | 'hr_connect') => {
    const label = channel === 'hr_connect' ? 'HR Connect' : channel;
    await compensationService.logPayslipShare(
      payslip.payslipId,
      employee.employeeId,
      channel,
      channel === 'email' ? employee.email : undefined,
      `Share requested from compensation tab through ${label}`
    );
    await loadCompensation();
    alert(`Share action logged for ${label}. Secure delivery integration can be connected next.`);
  };

  if (loading) {
    return <div className="p-4 bg-primary-50 border border-primary-100 rounded-lg text-sm font-semibold text-primary-700">Loading compensation record...</div>;
  }

  if (error) {
    return <div className="p-4 bg-red-50 border border-red-100 rounded-lg text-sm font-semibold text-red-700">{error}</div>;
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Current CTC', value: formatMoney(profile?.summary.currentCtc, currency), icon: BanknotesIcon },
          { label: 'Monthly Gross', value: formatMoney(profile?.summary.monthlyGross, currency), icon: CalendarDaysIcon },
          { label: 'Monthly Net', value: formatMoney(profile?.summary.monthlyNetEstimate, currency), icon: BanknotesIcon },
          { label: 'Last Payslip', value: profile?.summary.lastPayslip || 'Pending', icon: DocumentTextIcon },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{item.label}</p>
              <item.icon className="h-5 w-5 text-primary-600" />
            </div>
            <p className="mt-2 text-lg font-bold text-gray-900">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-1 shadow-sm inline-flex gap-1">
        <button
          onClick={() => setActiveSection('ledger')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
            activeSection === 'ledger'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          Compensation Ledger
        </button>
        <button
          onClick={() => setActiveSection('payslips')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
            activeSection === 'payslips'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          Payslip Library
        </button>
        <button
          onClick={() => setActiveSection('transactions')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
            activeSection === 'transactions'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          Salary Transaction History
        </button>
      </div>

      {activeSection === 'ledger' && (
        <div className="space-y-5">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Compensation Ledger</h3>
            <p className="text-sm text-gray-500">Salary structure and compensation history. This is not payroll processing.</p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <section className="xl:col-span-2 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-primary-700">Current salary structure</p>
              <h4 className="text-xl font-bold text-gray-900 mt-1">{profile?.activeStructure?.structureName || 'No active structure recorded'}</h4>
              <p className="text-sm text-gray-500 mt-1">Effective from {formatDate(profile?.activeStructure?.effectiveFrom)}</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
              {profile?.activeStructure?.status || 'pending'}
            </span>
          </div>
          {canManage && profile?.activeStructure && (
            <div className="flex flex-wrap gap-2 mt-4">
              <button onClick={() => openEditStructureModal(profile.activeStructure!)} className="px-3 py-1.5 rounded-lg bg-primary-50 border border-primary-100 text-xs font-bold text-primary-700 hover:bg-primary-100 inline-flex items-center">
                <PencilSquareIcon className="h-3.5 w-3.5 mr-1" />
                Edit structure
              </button>
              <button onClick={() => archiveStructure(profile.activeStructure!)} className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-100 inline-flex items-center">
                <TrashIcon className="h-3.5 w-3.5 mr-1" />
                Archive
              </button>
            </div>
          )}

          {profile?.activeStructure ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
              {(['earning', 'deduction', 'employer_contribution'] as SalaryComponentType[]).map((type) => (
                <div key={type} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">
                    {type === 'employer_contribution' ? 'Employer Contributions' : type === 'earning' ? 'Earnings' : 'Deductions'}
                  </p>
                  <div className="space-y-2">
                    {groupedComponents[type].length ? groupedComponents[type].map((component) => (
                      <div key={component.componentId || component.componentName} className={`rounded-lg border px-3 py-2 ${componentPalette[type]}`}>
                        <div className="flex justify-between gap-3">
                          <span className="text-xs font-semibold">{component.componentName}</span>
                          <span className="text-xs font-bold">{formatMoney(component.monthlyAmount, currency)}</span>
                        </div>
                      </div>
                    )) : <p className="text-xs text-gray-400">No components recorded</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed border-gray-300 p-8 text-center">
              <BanknotesIcon className="h-10 w-10 mx-auto text-gray-300" />
              <p className="mt-3 text-sm font-semibold text-gray-600">Add a salary structure to start compensation tracking.</p>
            </div>
          )}
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-primary-700">Timeline</p>
          <div className="mt-4 space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {profile?.timeline.length ? profile.timeline.map((event) => (
              <div key={`${event.type}-${event.id}`} className="relative pl-6 pb-4 border-l border-primary-100 last:pb-0">
                <div className="absolute -left-2 top-1 h-4 w-4 rounded-full bg-primary-600 border-2 border-white shadow" />
                <p className="text-xs font-bold text-gray-500">{formatDate(event.date)}</p>
                <p className="text-sm font-bold text-gray-900">{event.title}</p>
                <p className="text-xs text-gray-600 mt-1">{event.description}</p>
              </div>
            )) : <p className="text-sm text-gray-500">No compensation events yet.</p>}
          </div>
            </section>
          </div>
        </div>
      )}

      {activeSection === 'payslips' && (
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-primary-700">Payslip library</p>
            <h4 className="text-lg font-bold text-gray-900">Monthly salary records and uploaded files</h4>
          </div>
          {canManage && (
            <button onClick={openNewPayslipModal} className="px-4 py-2 bg-primary-600 text-white rounded-lg font-semibold text-sm hover:bg-primary-700 inline-flex items-center">
              <PlusIcon className="h-4 w-4 mr-1.5" />
              Add Payslip
            </button>
          )}
        </div>

        {profile?.payslips.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {profile.payslips.map((payslip) => (
              <article key={payslip.payslipId} className="rounded-xl border border-gray-200 bg-gray-50 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-gray-500">{monthNames[payslip.month - 1]} {payslip.year}</p>
                    <h5 className="text-lg font-bold text-gray-900">{formatMoney(payslip.netPay, currency)}</h5>
                  </div>
                  <span className="px-2 py-1 rounded-full text-[11px] font-bold bg-white text-primary-700 border border-primary-100">
                    {payslip.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                  <span className="text-gray-500">Gross</span>
                  <span className="font-semibold text-right">{formatMoney(payslip.grossEarnings, currency)}</span>
                  <span className="text-gray-500">Deductions</span>
                  <span className="font-semibold text-right">{formatMoney(payslip.totalDeductions, currency)}</span>
                  <span className="text-gray-500">File</span>
                  <span className="font-semibold text-right">{payslip.attachments?.length ? 'Uploaded' : 'Pending'}</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <button onClick={() => openPayslip(payslip)} className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-100 inline-flex items-center">
                    <EyeIcon className="h-3.5 w-3.5 mr-1" />
                    View
                  </button>
                  {payslip.attachments?.length ? (
                    <button onClick={() => viewAttachment(payslip)} className="px-3 py-1.5 rounded-lg bg-primary-50 border border-primary-100 text-xs font-bold text-primary-700 hover:bg-primary-100 inline-flex items-center">
                      <DocumentTextIcon className="h-3.5 w-3.5 mr-1" />
                      Preview File
                    </button>
                  ) : null}
                  <button onClick={() => downloadAttachment(payslip)} className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-100 inline-flex items-center">
                    <ArrowDownTrayIcon className="h-3.5 w-3.5 mr-1" />
                    Download
                  </button>
                  {canManage && (
                    <>
                      <button onClick={() => openEditPayslipModal(payslip)} className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-100 inline-flex items-center">
                        <PencilSquareIcon className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </button>
                      <button onClick={() => sharePayslip(payslip, 'hr_connect')} className="px-3 py-1.5 rounded-lg bg-primary-50 border border-primary-100 text-xs font-bold text-primary-700 hover:bg-primary-100 inline-flex items-center">
                        <ChatBubbleLeftRightIcon className="h-3.5 w-3.5 mr-1" />
                        Share
                      </button>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
            <DocumentTextIcon className="h-10 w-10 mx-auto text-gray-300" />
            <p className="mt-3 text-sm font-semibold text-gray-600">No payslips have been recorded yet.</p>
          </div>
        )}
        </section>
      )}

      {activeSection === 'transactions' && (
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 p-5 border-b border-gray-100">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-primary-700">Salary transaction history</p>
              <h4 className="text-lg font-bold text-gray-900">Historical salary disbursement records</h4>
              <p className="text-sm text-gray-500 mt-1">Monthly salary view with net amount and available digital salary heads.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-50 text-gray-700 border border-gray-200">
                {profile?.payslips.length || 0} records
              </span>
              {canManage && (
                <>
                  <button onClick={openNewPayslipModal} className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-100 inline-flex items-center">
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Transaction
                  </button>
                  <button onClick={openMonthlyGenerationModal} className="px-3 py-2 rounded-lg bg-primary-50 border border-primary-100 text-xs font-bold text-primary-700 hover:bg-primary-100 inline-flex items-center">
                    <ArrowPathIcon className="h-4 w-4 mr-1" />
                    Generate Monthly
                  </button>
                  <button onClick={() => setShowBulkImportGuide(true)} disabled={bulkImporting} className="px-3 py-2 rounded-lg bg-primary-600 text-white text-xs font-bold hover:bg-primary-700 disabled:opacity-60 inline-flex items-center">
                    <CloudArrowUpIcon className="h-4 w-4 mr-1" />
                    {bulkImporting ? 'Importing...' : 'Bulk Import'}
                  </button>
                  <input
                    ref={bulkInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) importSalaryTransactions(file);
                    }}
                  />
                </>
              )}
            </div>
          </div>

          {bulkResult && (
            <div className="mx-5 mt-4 rounded-lg border border-primary-100 bg-primary-50 p-3 text-sm text-primary-900">
              <span className="font-bold">Bulk import:</span> {bulkResult.created} created, {bulkResult.updated} updated, {bulkResult.failed} failed.
              {bulkResult.errors.length > 0 && (
                <span className="ml-2 text-rose-700">
                  First issue: row {bulkResult.errors[0].row} - {bulkResult.errors[0].message}
                </span>
              )}
            </div>
          )}

          {profile?.payslips.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-gray-500">Date of Salary</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-gray-500">Period</th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-gray-500">Gross</th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-gray-500">Deductions</th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-gray-500">Net Amount</th>
                    {salaryHeadColumns.map((head) => (
                      <th key={head} className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-gray-500 whitespace-nowrap">
                        {head}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-gray-500">Status</th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {profile.payslips.map((payslip) => {
                    const componentMap = new Map(
                      (payslip.components || []).map((component) => [component.componentName, Number(component.amount || 0)])
                    );
                    return (
                      <tr key={payslip.payslipId} className="hover:bg-primary-50/30 transition-colors">
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap">
                          {payslip.paymentDate ? formatDate(payslip.paymentDate) : formatDate(`${payslip.year}-${String(payslip.month).padStart(2, '0')}-01`)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          {monthNames[payslip.month - 1]} {payslip.year}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-right text-gray-800 whitespace-nowrap">{formatMoney(payslip.grossEarnings, currency)}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-right text-rose-700 whitespace-nowrap">{formatMoney(payslip.totalDeductions, currency)}</td>
                        <td className="px-4 py-3 text-sm font-bold text-right text-emerald-700 whitespace-nowrap">{formatMoney(payslip.netPay, currency)}</td>
                        {salaryHeadColumns.map((head) => (
                          <td key={`${payslip.payslipId}-${head}`} className="px-4 py-3 text-sm font-semibold text-right text-gray-700 whitespace-nowrap">
                            {componentMap.has(head) ? formatMoney(componentMap.get(head), currency) : '-'}
                          </td>
                        ))}
                        <td className="px-4 py-3 text-sm whitespace-nowrap">
                          <span className="px-2 py-1 rounded-full text-[11px] font-bold bg-primary-50 text-primary-700 border border-primary-100">
                            {payslip.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right whitespace-nowrap">
                          <div className="inline-flex gap-1">
                            <button onClick={() => openPayslip(payslip)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800" title="View transaction">
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            {canManage && (
                              <>
                                <button onClick={() => openEditPayslipModal(payslip)} className="p-1.5 rounded-lg text-primary-600 hover:bg-primary-50" title="Edit transaction">
                                  <PencilSquareIcon className="h-4 w-4" />
                                </button>
                                <button onClick={() => deletePayslip(payslip)} className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50" title="Delete transaction">
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <BanknotesIcon className="h-10 w-10 mx-auto text-gray-300" />
              <p className="mt-3 text-sm font-semibold text-gray-600">No salary disbursement records have been saved yet.</p>
            </div>
          )}
        </section>
      )}

      {showStructureModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-6">
            <ModalHeader title={editingStructure ? 'Edit Salary Structure' : 'Add Salary Structure'} onClose={() => setShowStructureModal(false)} />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <TextInput label="Effective From" type="date" value={structureForm.effectiveFrom} onChange={(value) => setStructureForm({ ...structureForm, effectiveFrom: value })} />
              <TextInput label="Annual CTC" type="number" value={structureForm.annualCtc} onChange={(value) => setStructureForm({ ...structureForm, annualCtc: value })} />
              <TextInput label="Monthly Gross" type="number" value={structureForm.monthlyGross} onChange={(value) => setStructureForm({ ...structureForm, monthlyGross: value })} />
              <TextInput label="Monthly Net Estimate" type="number" value={structureForm.monthlyNetEstimate} onChange={(value) => setStructureForm({ ...structureForm, monthlyNetEstimate: value })} />
            </div>
            <div className="mt-5">
              <div className="flex justify-between items-center mb-3">
                <p className="text-sm font-bold text-gray-900">Salary Components</p>
                <div className="flex gap-2">
                  <button onClick={() => addComponent('earning')} className="text-xs font-bold text-emerald-700">+ Earning</button>
                  <button onClick={() => addComponent('deduction')} className="text-xs font-bold text-rose-700">+ Deduction</button>
                  <button onClick={() => addComponent('employer_contribution')} className="text-xs font-bold text-indigo-700">+ Employer</button>
                </div>
              </div>
              <div className="space-y-2">
                {structureForm.components.map((component, index) => (
                  <div key={`${component.componentName}-${index}`} className="grid grid-cols-12 gap-2 items-center rounded-lg border border-gray-100 bg-gray-50 p-2">
                    <input className="col-span-4 px-3 py-2 text-sm border rounded-lg" value={component.componentName} placeholder="Component" onChange={(e) => handleComponentChange(index, 'componentName', e.target.value)} />
                    <select className="col-span-3 px-3 py-2 text-sm border rounded-lg" value={component.componentType} onChange={(e) => handleComponentChange(index, 'componentType', e.target.value as SalaryComponentType)}>
                      <option value="earning">Earning</option>
                      <option value="deduction">Deduction</option>
                      <option value="employer_contribution">Employer Contribution</option>
                    </select>
                    <input className="col-span-3 px-3 py-2 text-sm border rounded-lg" type="number" value={component.monthlyAmount} onChange={(e) => handleComponentChange(index, 'monthlyAmount', e.target.value)} />
                    <label className="col-span-2 flex items-center gap-2 text-xs font-semibold text-gray-600">
                      <input type="checkbox" checked={Boolean(component.statutory)} onChange={(e) => handleComponentChange(index, 'statutory', e.target.checked)} />
                      Statutory
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <input type="checkbox" checked={structureForm.employeeVisible} onChange={(e) => setStructureForm({ ...structureForm, employeeVisible: e.target.checked })} />
                Visible to employee
              </label>
            </div>
            <ModalActions saving={saving} primaryLabel={editingStructure ? 'Update Structure' : 'Save Structure'} onCancel={() => setShowStructureModal(false)} onPrimary={saveStructure} />
          </div>
        </div>
      )}

      {showPayslipModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6">
            <ModalHeader title={editingPayslip ? 'Edit Payslip' : 'Add Payslip'} onClose={() => setShowPayslipModal(false)} />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <TextInput label="Month" type="number" value={payslipForm.month} onChange={(value) => setPayslipForm({ ...payslipForm, month: value })} />
              <TextInput label="Year" type="number" value={payslipForm.year} onChange={(value) => setPayslipForm({ ...payslipForm, year: value })} />
              <TextInput label="Gross Earnings" type="number" value={payslipForm.grossEarnings} onChange={(value) => setPayslipForm({ ...payslipForm, grossEarnings: value })} />
              <TextInput label="Total Deductions" type="number" value={payslipForm.totalDeductions} onChange={(value) => setPayslipForm({ ...payslipForm, totalDeductions: value })} />
              <TextInput label="Net Pay" type="number" value={payslipForm.netPay} onChange={(value) => setPayslipForm({ ...payslipForm, netPay: value })} />
              <TextInput label="Paid Days" type="number" value={payslipForm.paidDays} onChange={(value) => setPayslipForm({ ...payslipForm, paidDays: value })} />
              <TextInput label="LOP Days" type="number" value={payslipForm.lopDays} onChange={(value) => setPayslipForm({ ...payslipForm, lopDays: value })} />
              <TextInput label="Payment Date" type="date" value={payslipForm.paymentDate} onChange={(value) => setPayslipForm({ ...payslipForm, paymentDate: value })} />
            </div>
            <div className="mt-4">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">{editingPayslip ? 'Upload replacement/additional PDF/Image' : 'Uploaded PDF/Image'}</label>
              <input type="file" accept="application/pdf,image/*" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="w-full text-sm border border-gray-300 rounded-lg p-2" />
            </div>
            <div className="mt-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <input type="checkbox" checked={payslipForm.employeeVisible} onChange={(e) => setPayslipForm({ ...payslipForm, employeeVisible: e.target.checked })} />
                Visible to employee
              </label>
            </div>
            <ModalActions saving={saving} primaryLabel={editingPayslip ? 'Update Payslip' : 'Save Payslip'} onCancel={() => setShowPayslipModal(false)} onPrimary={savePayslip} />
          </div>
        </div>
      )}

      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6">
            <ModalHeader title="Generate Monthly Salary Transaction" onClose={() => setShowGenerateModal(false)} />
            <div className="rounded-xl border border-primary-100 bg-primary-50 p-4 mb-5">
              <p className="text-sm font-bold text-primary-900">Uses the active salary structure</p>
              <p className="text-xs text-primary-800 mt-1">
                The system copies current earning and deduction heads into a monthly salary transaction. Existing months are protected from accidental duplicate generation.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <TextInput label="Month" type="number" value={generateForm.month} onChange={(value) => setGenerateForm({ ...generateForm, month: value })} />
              <TextInput label="Year" type="number" value={generateForm.year} onChange={(value) => setGenerateForm({ ...generateForm, year: value })} />
              <TextInput label="Paid Days" type="number" value={generateForm.paidDays} onChange={(value) => setGenerateForm({ ...generateForm, paidDays: value })} />
              <TextInput label="LOP Days" type="number" value={generateForm.lopDays} onChange={(value) => setGenerateForm({ ...generateForm, lopDays: value })} />
              <TextInput label="Payment Date" type="date" value={generateForm.paymentDate} onChange={(value) => setGenerateForm({ ...generateForm, paymentDate: value })} />
            </div>
            <div className="mt-4">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Remarks</label>
              <textarea
                value={generateForm.remarks}
                onChange={(event) => setGenerateForm({ ...generateForm, remarks: event.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={3}
                placeholder="Optional context for this monthly generation"
              />
            </div>
            <div className="mt-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <input type="checkbox" checked={generateForm.employeeVisible} onChange={(e) => setGenerateForm({ ...generateForm, employeeVisible: e.target.checked })} />
                Visible to employee
              </label>
            </div>
            <ModalActions saving={saving} primaryLabel="Generate Transaction" onCancel={() => setShowGenerateModal(false)} onPrimary={generateMonthlyTransaction} />
          </div>
        </div>
      )}

      {showBulkImportGuide && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6">
            <ModalHeader title="Bulk Import Salary Transactions" onClose={() => setShowBulkImportGuide(false)} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="rounded-xl border border-primary-100 bg-primary-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-primary-700">Step 1</p>
                <h4 className="mt-1 text-sm font-bold text-gray-900">Download prescribed template</h4>
                <p className="mt-2 text-xs text-gray-600">
                  Use this CSV only for the selected employee. One row equals one monthly salary transaction.
                </p>
                <button
                  type="button"
                  onClick={downloadBulkImportTemplate}
                  className="mt-4 px-3 py-2 rounded-lg bg-white border border-primary-200 text-xs font-bold text-primary-700 hover:bg-primary-100 inline-flex items-center"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                  Download Template
                </button>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-primary-700">Step 2</p>
                <h4 className="mt-1 text-sm font-bold text-gray-900">Fill salary rows carefully</h4>
                <div className="mt-2 space-y-1 text-xs text-gray-600">
                  <p>Required: month, year, grossEarnings, totalDeductions, netPay.</p>
                  <p>Rule: netPay must equal grossEarnings minus totalDeductions.</p>
                  <p>Any extra column becomes a salary head in the digital payslip split.</p>
                </div>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Step 3</p>
                <h4 className="mt-1 text-sm font-bold text-gray-900">Upload and review result</h4>
                <p className="mt-2 text-xs text-gray-600">
                  Import runs in upsert mode. Existing month/year records are updated; new months are created.
                </p>
                <button
                  type="button"
                  onClick={() => bulkInputRef.current?.click()}
                  disabled={bulkImporting}
                  className="mt-4 px-3 py-2 rounded-lg bg-primary-600 text-white text-xs font-bold hover:bg-primary-700 disabled:opacity-60 inline-flex items-center"
                >
                  <CloudArrowUpIcon className="h-4 w-4 mr-1" />
                  {bulkImporting ? 'Importing...' : 'Choose CSV File'}
                </button>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Template columns</p>
              </div>
              <div className="p-4">
                <div className="flex flex-wrap gap-2">
                  {bulkImportTemplateHeaders.map((header) => (
                    <span key={header} className="px-2.5 py-1 rounded-full bg-white border border-gray-200 text-xs font-semibold text-gray-700">
                      {header}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50 p-4">
              <p className="text-xs font-bold text-amber-800">Implementation and migration note</p>
              <p className="mt-1 text-xs text-amber-800">
                This import is meant for onboarding historical salary disbursements during implementation. For normal monthly operations, use Generate Monthly after the active salary structure is verified.
              </p>
            </div>
          </div>
        </div>
      )}

      {selectedPayslip && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6">
            <ModalHeader title={`Payslip - ${monthNames[selectedPayslip.month - 1]} ${selectedPayslip.year}`} onClose={() => setSelectedPayslip(null)} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-primary-700 mb-3">Employee</p>
                <p className="text-lg font-bold text-gray-900">{employee.firstName} {employee.lastName}</p>
                <p className="text-sm text-gray-500">{employee.employeeCode}</p>
                <p className="text-sm text-gray-500">{employee.designation?.title || employee.designation?.name || employee.positionTitle || 'N/A'}</p>
              </div>
              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-primary-700 mb-3">Digital salary summary</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-gray-500">Gross Pay</span><span className="font-bold text-right">{formatMoney(selectedPayslip.grossEarnings, currency)}</span>
                  <span className="text-gray-500">Deductions</span><span className="font-bold text-right">{formatMoney(selectedPayslip.totalDeductions, currency)}</span>
                  <span className="text-gray-500">Net Pay</span><span className="font-bold text-right">{formatMoney(selectedPayslip.netPay, currency)}</span>
                  <span className="text-gray-500">Paid Days</span><span className="font-bold text-right">{selectedPayslip.paidDays}</span>
                </div>
              </div>
            </div>
            <div className="mt-5 rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-primary-700 mb-3">Pay components</p>
              {selectedPayslip.components?.length ? (
                <div className="divide-y divide-gray-100">
                  {selectedPayslip.components
                    .slice()
                    .sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0))
                    .map((component) => (
                      <div key={component.componentId || component.componentName} className="flex items-center justify-between py-2 text-sm">
                        <span className="font-semibold text-gray-700">{component.componentName}</span>
                        <span className={`font-bold ${component.componentType === 'deduction' ? 'text-rose-700' : 'text-emerald-700'}`}>
                          {formatMoney(component.amount, currency)}
                        </span>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No digital component split saved.</p>
              )}
            </div>
            <div className="mt-5 rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-primary-700 mb-3">Uploaded file</p>
              {selectedPayslip.attachments?.length ? (
                selectedPayslip.attachments.map((attachment) => (
                  <div key={attachment.attachmentId} className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 p-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <DocumentTextIcon className="h-6 w-6 text-primary-600" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{attachment.fileName}</p>
                        <p className="text-xs text-gray-500">Version {attachment.version} • {formatDate(attachment.uploadedOn)}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button onClick={() => viewAttachment(selectedPayslip, attachment)} className="px-3 py-1.5 rounded-lg bg-primary-50 border border-primary-100 text-xs font-bold text-primary-700">View</button>
                      <button onClick={() => downloadAttachment(selectedPayslip)} className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-bold text-gray-700">Download</button>
                    </div>
                  </div>
                ))
              ) : <p className="text-sm text-gray-500">No physical payslip file uploaded.</p>}
            </div>
            <div className="flex flex-wrap justify-end gap-3 mt-6">
              <button onClick={printPayslip} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold text-sm inline-flex items-center">
                <PrinterIcon className="h-4 w-4 mr-1.5" />
                Print
              </button>
              {canManage && (
                <>
                  <button onClick={() => sharePayslip(selectedPayslip, 'email')} className="px-4 py-2 rounded-lg bg-primary-50 text-primary-700 font-semibold text-sm inline-flex items-center">
                    <EnvelopeIcon className="h-4 w-4 mr-1.5" />
                    Email
                  </button>
                  <button onClick={() => sharePayslip(selectedPayslip, 'whatsapp')} className="px-4 py-2 rounded-lg bg-emerald-50 text-emerald-700 font-semibold text-sm inline-flex items-center">
                    <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1.5" />
                    WhatsApp
                  </button>
                  <button onClick={() => sharePayslip(selectedPayslip, 'hr_connect')} className="px-4 py-2 rounded-lg bg-primary-600 text-white font-semibold text-sm inline-flex items-center">
                    <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1.5" />
                    HR Connect
                  </button>
                  <button onClick={() => deletePayslip(selectedPayslip)} className="px-4 py-2 rounded-lg bg-red-50 text-red-700 font-semibold text-sm inline-flex items-center">
                    <TrashIcon className="h-4 w-4 mr-1.5" />
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <DocumentViewerModal
        document={
          viewingPayslipAttachment
            ? {
                title: `${monthNames[viewingPayslipAttachment.payslip.month - 1]} ${viewingPayslipAttachment.payslip.year} Payslip`,
                fileName: viewingPayslipAttachment.attachment.fileName,
                fileType: viewingPayslipAttachment.attachment.fileType,
                fileSize: viewingPayslipAttachment.attachment.fileSize,
                uploadedAt: viewingPayslipAttachment.attachment.uploadedOn,
                category: 'Payslip',
                status: viewingPayslipAttachment.payslip.status,
                metadata: [
                  { label: 'Net pay', value: formatMoney(viewingPayslipAttachment.payslip.netPay, currency) },
                  { label: 'Gross earnings', value: formatMoney(viewingPayslipAttachment.payslip.grossEarnings, currency) },
                  { label: 'Deductions', value: formatMoney(viewingPayslipAttachment.payslip.totalDeductions, currency) },
                  { label: 'Version', value: viewingPayslipAttachment.attachment.version },
                ],
              }
            : null
        }
        loadBlob={viewingPayslipAttachment ? () => compensationService.getAttachmentBlob(viewingPayslipAttachment.attachment.attachmentId) : null}
        onClose={() => setViewingPayslipAttachment(null)}
        onDownload={viewingPayslipAttachment ? () => compensationService.downloadAttachment(viewingPayslipAttachment.attachment) : undefined}
      />
    </div>
  );
}

const TextInput = ({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) => (
  <div>
    <label className="text-xs font-semibold text-gray-500 mb-1 block">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
    />
  </div>
);

const ModalHeader = ({ title, onClose }: { title: string; onClose: () => void }) => (
  <div className="flex items-start justify-between gap-4 mb-5">
    <div>
      <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      <p className="text-xs text-gray-500 mt-1">Compensation tracking only. This does not process payroll or statutory filings.</p>
    </div>
    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
      <XMarkIcon className="h-5 w-5" />
    </button>
  </div>
);

const ModalActions = ({
  saving,
  primaryLabel,
  onCancel,
  onPrimary,
}: {
  saving: boolean;
  primaryLabel: string;
  onCancel: () => void;
  onPrimary: () => void;
}) => (
  <div className="flex justify-end gap-3 mt-6">
    <button onClick={onCancel} disabled={saving} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-semibold text-sm disabled:opacity-50">
      Cancel
    </button>
    <button onClick={onPrimary} disabled={saving} className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 font-semibold text-sm disabled:opacity-50">
      {saving ? 'Saving...' : primaryLabel}
    </button>
  </div>
);
