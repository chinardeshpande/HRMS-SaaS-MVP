import { useEffect, useMemo, useState } from 'react';
import { ModernLayout } from '../components/layout/ModernLayout';
import { useAuth } from '../context/AuthContext';
import { employeeDocumentService, EmployeeDocument, EmployeeDocumentRequest } from '../services/employeeDocumentService';
import { compensationService, Payslip } from '../services/compensationService';
import { ArrowDownTrayIcon, DocumentTextIcon, PlusIcon } from '@heroicons/react/24/outline';

const documentTypeOptions = [
  ['employment_letter', 'Employment / appointment letter'],
  ['experience_letter', 'Experience letter'],
  ['relieving_letter', 'Relieving letter'],
  ['form16', 'Form 16'],
  ['payslip', 'Payslip'],
  ['other', 'Other HR document'],
] as const;

export default function MyHRDocuments() {
  const { user } = useAuth();
  const employeeId = user?.employeeId;
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [requests, setRequests] = useState<EmployeeDocumentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRequest, setShowRequest] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ documentType: 'employment_letter', purpose: 'employment' as 'employment' | 'exit', details: '' });

  const load = async () => {
    if (!employeeId) return setLoading(false);
    setLoading(true);
    setError('');
    try {
      const [employeeDocuments, compensation, documentRequests] = await Promise.all([
        employeeDocumentService.list(employeeId, { status: 'active' }),
        compensationService.getEmployeeCompensation(employeeId),
        employeeDocumentService.getMyRequests(),
      ]);
      setDocuments(employeeDocuments);
      setPayslips(compensation.payslips || []);
      setRequests(documentRequests);
    } catch (cause: any) {
      setError(cause.response?.data?.error?.message || cause.message || 'Unable to load your HR documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [employeeId]);

  const form16Documents = useMemo(() => documents.filter((document) => document.category === 'form16'), [documents]);
  const otherDocuments = useMemo(() => documents.filter((document) => document.category !== 'form16' && document.category !== 'payslip'), [documents]);

  const submitRequest = async () => {
    setSaving(true);
    setError('');
    try {
      await employeeDocumentService.requestDocument(form);
      setShowRequest(false);
      setForm({ documentType: 'employment_letter', purpose: 'employment', details: '' });
      setRequests(await employeeDocumentService.getMyRequests());
    } catch (cause: any) {
      setError(cause.response?.data?.error?.message || cause.message || 'Unable to submit document request');
    } finally {
      setSaving(false);
    }
  };

  const downloadPayslip = async (payslip: Payslip) => {
    const attachment = payslip.attachments?.find((item) => item.isPrimary) || payslip.attachments?.[0];
    if (!attachment) return setError('This payslip record does not yet have a downloadable file. Request it from HR below.');
    await compensationService.downloadAttachment(attachment);
  };

  return (
    <ModernLayout>
      <div className="space-y-6">
        <section className="ui-experiment-hero p-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-600">Employee self-service</p>
              <h1 className="mt-2 text-3xl font-extrabold text-gray-950">My HR documents</h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-600">Payslips, Form 16, employment letters and exit documents—available from one protected workspace.</p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowRequest(true)} disabled={!employeeId}>
              <PlusIcon className="mr-2 h-5 w-5" /> Request a document
            </button>
          </div>
        </section>

        {!employeeId && <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">This account is not linked to an employee profile. Ask an administrator to complete the user–employee link.</div>}
        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
        {loading ? <div className="p-12 text-center text-gray-500">Loading your document workspace…</div> : employeeId && <>
          <DocumentSection title="Payslips" empty="No employee-visible payslips are available yet.">
            {payslips.map((payslip) => <DocumentCard key={payslip.payslipId} title={`Payslip — ${String(payslip.month).padStart(2, '0')}/${payslip.year}`} subtitle={payslip.attachments?.length ? 'File available' : 'Record available · file pending'} onDownload={() => downloadPayslip(payslip)} />)}
          </DocumentSection>
          <DocumentSection title="Form 16" empty="No Form 16 has been published yet.">
            {form16Documents.map((document) => <DocumentCard key={document.documentId} title={document.title} subtitle={document.issueDate || document.createdAt} onDownload={() => employeeDocumentService.download(document)} />)}
          </DocumentSection>
          <DocumentSection title="Employment and exit documents" empty="No employment or exit documents are available yet.">
            {otherDocuments.map((document) => <DocumentCard key={document.documentId} title={document.title} subtitle={`${document.category.replace(/_/g, ' ')} · ${document.verificationStatus}`} onDownload={() => employeeDocumentService.download(document)} />)}
          </DocumentSection>

          <section className="card">
            <div className="card-header"><h2 className="text-lg font-semibold">My document requests</h2></div>
            <div className="card-body space-y-3">
              {requests.length === 0 ? <p className="text-sm text-gray-500">No requests raised yet.</p> : requests.map((request) => (
                <div key={request.requestId} className="flex flex-col justify-between gap-2 rounded-lg border border-gray-200 p-4 sm:flex-row sm:items-center">
                  <div><p className="font-semibold text-gray-900">{request.documentType.replace(/_/g, ' ')}</p><p className="text-xs text-gray-500">{request.purpose} · {new Date(request.createdAt).toLocaleDateString('en-IN')}</p>{request.responseNotes && <p className="mt-1 text-sm text-gray-600">HR: {request.responseNotes}</p>}</div>
                  <span className="badge badge-gray capitalize">{request.status.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
          </section>
        </>}
      </div>

      {showRequest && <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 p-4">
        <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
          <div className="border-b p-5"><h2 className="text-xl font-bold">Request an HR document</h2><p className="mt-1 text-sm text-gray-500">Use Employment for current-service needs or Exit for separation documents.</p></div>
          <div className="space-y-4 p-5">
            <label className="block text-sm font-medium">Document type<select className="input mt-2" value={form.documentType} onChange={(event) => setForm({ ...form, documentType: event.target.value })}>{documentTypeOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="block text-sm font-medium">Purpose<select className="input mt-2" value={form.purpose} onChange={(event) => setForm({ ...form, purpose: event.target.value as 'employment' | 'exit' })}><option value="employment">During employment</option><option value="exit">Exit / separation</option></select></label>
            <label className="block text-sm font-medium">Details<textarea className="input mt-2" rows={3} value={form.details} onChange={(event) => setForm({ ...form, details: event.target.value })} placeholder="Period, financial year, reason or deadline" /></label>
          </div>
          <div className="flex justify-end gap-3 border-t bg-gray-50 p-4"><button className="btn btn-secondary" onClick={() => setShowRequest(false)}>Cancel</button><button className="btn btn-primary" disabled={saving} onClick={submitRequest}>{saving ? 'Submitting…' : 'Submit request'}</button></div>
        </div>
      </div>}
    </ModernLayout>
  );
}

function DocumentSection({ title, empty, children }: { title: string; empty: string; children: React.ReactNode }) {
  const entries = Array.isArray(children) ? children : [children];
  return <section className="card"><div className="card-header"><h2 className="text-lg font-semibold">{title}</h2></div><div className="card-body grid gap-3 md:grid-cols-2 xl:grid-cols-3">{entries.length === 0 ? <p className="text-sm text-gray-500">{empty}</p> : children}</div></section>;
}

function DocumentCard({ title, subtitle, onDownload }: { title: string; subtitle: string; onDownload: () => void }) {
  return <div className="flex items-center gap-3 rounded-xl border border-gray-200 p-4"><div className="rounded-lg bg-primary-50 p-3"><DocumentTextIcon className="h-6 w-6 text-primary-600" /></div><div className="min-w-0 flex-1"><p className="truncate font-semibold text-gray-900">{title}</p><p className="truncate text-xs capitalize text-gray-500">{subtitle}</p></div><button className="rounded-lg p-2 text-gray-500 hover:bg-gray-100" title="Download" onClick={onDownload}><ArrowDownTrayIcon className="h-5 w-5" /></button></div>;
}
