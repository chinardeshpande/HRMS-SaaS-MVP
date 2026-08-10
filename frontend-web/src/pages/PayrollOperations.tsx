import { FormEvent, useEffect, useState } from 'react';
import { ModernLayout } from '../components/layout/ModernLayout';
import { useAuth } from '../context/AuthContext';
import payrollOperationsService, { PayrollCycle, PayrollCycleDetail, PayrollCycleStatus, PayrollTaxStatement } from '../services/payrollOperationsService';

const monthName = (month: number) => new Intl.DateTimeFormat('en-IN', { month: 'long' }).format(new Date(2026, month - 1, 1));
const money = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value));
const label = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const nextStatus: Partial<Record<PayrollCycleStatus, PayrollCycleStatus>> = {
  draft: 'under_review', approved_for_partner: 'partner_processing', partner_processing: 'bank_approval_pending',
  bank_approval_pending: 'paid', paid: 'payslips_published', payslips_published: 'closed',
};

export default function PayrollOperations() {
  const { user } = useAuth();
  const isOwner = user?.role === 'system_admin';
  const [cycles, setCycles] = useState<PayrollCycle[]>([]);
  const [selected, setSelected] = useState<PayrollCycleDetail | null>(null);
  const [statements, setStatements] = useState<PayrollTaxStatement[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), partnerName: '', employeeCount: 0, grossTotal: 0, deductionTotal: 0, netTotal: 0 });
  const [statement, setStatement] = useState({ employeeId: '', financialYear: '2026-27', statementType: 'form16', status: 'pending' });

  const load = async (selectedId?: string) => {
    const [cycleRows, statementRows] = await Promise.all([payrollOperationsService.listCycles(), payrollOperationsService.listTaxStatements()]);
    setCycles(cycleRows); setStatements(statementRows);
    const id = selectedId || selected?.cycle.payrollCycleId || cycleRows[0]?.payrollCycleId;
    setSelected(id ? await payrollOperationsService.getCycle(id) : null);
  };

  useEffect(() => { load().catch((err) => setError(err.response?.data?.error?.message || 'Unable to load payroll operations')); }, []);

  const run = async (work: () => Promise<unknown>, success: string) => {
    setError(''); setMessage('');
    try { await work(); setMessage(success); await load(); }
    catch (err: any) { setError(err.response?.data?.error?.message || err.message || 'Action failed'); }
  };

  const create = (event: FormEvent) => { event.preventDefault(); run(() => payrollOperationsService.createCycle(form), 'Monthly cycle created'); };
  const transition = async (status: PayrollCycleStatus) => {
    if (!selected) return;
    const payload: Record<string, unknown> = {};
    if (status === 'partner_processing') payload.partnerReference = window.prompt('Partner execution reference') || '';
    if (status === 'paid') payload.bankReference = window.prompt('Bank approval reference') || '';
    if (status === 'payslips_published') payload.payslipSummary = { published: selected.cycle.employeeCount, pending: 0 };
    await run(() => payrollOperationsService.transition(selected.cycle.payrollCycleId, status, payload), `Cycle moved to ${label(status)}`);
  };

  const saveStatement = (event: FormEvent) => {
    event.preventDefault();
    run(() => payrollOperationsService.saveTaxStatement(statement as Partial<PayrollTaxStatement>), 'Annual statement tracker updated');
  };

  return <ModernLayout>
    <main className="mx-auto max-w-7xl space-y-6" aria-labelledby="payroll-title">
      <header className="rounded-2xl bg-gradient-to-r from-slate-950 via-indigo-950 to-violet-900 p-6 text-white shadow-lg">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">External partner operations</p>
        <h1 id="payroll-title" className="mt-2 text-3xl font-bold">Monthly payroll control room</h1>
        <p className="mt-2 max-w-3xl text-sm text-indigo-100">Review inputs, capture approvals and partner references, confirm bank release, and track payslips. AuraHR does not calculate payroll, tax, PF, ESI or TDS.</p>
      </header>

      {(message || error) && <div role="status" aria-live="polite" className={`rounded-lg border p-3 text-sm font-semibold ${error ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{error || message}</div>}

      <section className="grid gap-6 xl:grid-cols-[1.2fr_2fr]">
        <form onSubmit={create} className="card p-5" aria-labelledby="create-cycle-title">
          <h2 id="create-cycle-title" className="text-lg font-bold text-gray-900">Open a monthly cycle</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="text-sm font-medium text-gray-700">Month<input aria-label="Payroll month" type="number" min="1" max="12" required className="input mt-1" value={form.month} onChange={(e) => setForm({ ...form, month: Number(e.target.value) })}/></label>
            <label className="text-sm font-medium text-gray-700">Year<input aria-label="Payroll year" type="number" min="2020" required className="input mt-1" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}/></label>
            <label className="col-span-2 text-sm font-medium text-gray-700">Payroll partner<input required className="input mt-1" value={form.partnerName} onChange={(e) => setForm({ ...form, partnerName: e.target.value })}/></label>
            {(['employeeCount', 'grossTotal', 'deductionTotal', 'netTotal'] as const).map((field) => <label key={field} className="text-sm font-medium text-gray-700">{label(field)}<input type="number" min="0" className="input mt-1" value={form[field]} onChange={(e) => setForm({ ...form, [field]: Number(e.target.value) })}/></label>)}
          </div>
          <button className="btn btn-primary mt-4 w-full" type="submit">Create draft cycle</button>
        </form>

        <div className="card overflow-hidden">
          <div className="border-b border-gray-200 p-5"><h2 className="text-lg font-bold text-gray-900">Cycle register</h2></div>
          <div className="overflow-x-auto"><table className="min-w-full text-sm"><caption className="sr-only">Monthly payroll operation cycles</caption><thead className="bg-gray-50 text-left text-xs uppercase text-gray-500"><tr><th className="p-3">Period</th><th className="p-3">Version</th><th className="p-3">Status</th><th className="p-3 text-right">Partner net</th><th className="p-3">Action</th></tr></thead><tbody>{cycles.map((cycle) => <tr key={cycle.payrollCycleId} className="border-t border-gray-100"><td className="p-3 font-semibold">{monthName(cycle.month)} {cycle.year}</td><td className="p-3">v{cycle.version}</td><td className="p-3"><span className="rounded-full bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700">{label(cycle.status)}</span></td><td className="p-3 text-right">{money(cycle.netTotal)}</td><td className="p-3"><button className="text-sm font-semibold text-primary-700 underline" onClick={() => load(cycle.payrollCycleId)}>Review</button></td></tr>)}</tbody></table></div>
        </div>
      </section>

      {selected && <section className="grid gap-6 lg:grid-cols-3" aria-labelledby="selected-cycle-title">
        <div className="card p-5 lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 id="selected-cycle-title" className="text-xl font-bold text-gray-900">{monthName(selected.cycle.month)} {selected.cycle.year} · v{selected.cycle.version}</h2><p className="text-sm text-gray-500">{selected.cycle.partnerName} · {selected.cycle.employeeCount} employees</p></div><span className="rounded-full bg-violet-100 px-3 py-1 text-sm font-bold text-violet-800">{label(selected.cycle.status)}</span></div>
          <dl className="mt-5 grid grid-cols-3 gap-3">{[['Gross', selected.cycle.grossTotal], ['Deductions', selected.cycle.deductionTotal], ['Net', selected.cycle.netTotal]].map(([name, value]) => <div key={String(name)} className="rounded-xl bg-gray-50 p-3"><dt className="text-xs uppercase text-gray-500">{name}</dt><dd className="mt-1 font-bold text-gray-900">{money(Number(value))}</dd></div>)}</dl>
          <div className="mt-5 flex flex-wrap gap-2">
            {selected.cycle.status === 'under_review' && <><button className="btn btn-secondary" onClick={() => run(() => payrollOperationsService.transition(selected.cycle.payrollCycleId, 'changes_requested'), 'Changes requested')}>Request changes</button>{isOwner && <button className="btn btn-primary" onClick={() => transition('approved_for_partner')}>Owner approval</button>}<button className="btn btn-secondary" onClick={() => run(() => payrollOperationsService.revise(selected.cycle.payrollCycleId, 'Reviewed revision'), 'Revision created')}>Create revision</button></>}
            {nextStatus[selected.cycle.status] && (!['paid', 'closed'].includes(nextStatus[selected.cycle.status]!) || isOwner) && <button className="btn btn-primary" onClick={() => transition(nextStatus[selected.cycle.status]!)}>Move to {label(nextStatus[selected.cycle.status]!)}</button>}
          </div>
          {selected.comparison && <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4"><h3 className="font-bold text-blue-950">Previous-month comparison</h3><div className="mt-2 grid grid-cols-2 gap-2 text-sm">{['employeeCount', 'grossTotal', 'deductionTotal', 'netTotal'].map((key) => { const item = selected.comparison?.[key] as { amount: number; percent: number | null }; return <p key={key}><span className="text-blue-700">{label(key)}:</span> <strong>{item.amount >= 0 ? '+' : ''}{key === 'employeeCount' ? item.amount : money(item.amount)}</strong> {item.percent === null ? '' : `(${item.percent}%)`}</p>; })}</div></div>}
        </div>
        <div className="card p-5"><h2 className="text-lg font-bold text-gray-900">Audit timeline</h2><ol className="mt-4 space-y-4">{selected.timeline.map((event) => <li key={event.payrollCycleEventId} className="border-l-2 border-violet-300 pl-3"><p className="text-sm font-semibold text-gray-900">{label(event.action)}</p><p className="text-xs text-gray-500">{event.toStatus ? `To ${label(event.toStatus)} · ` : ''}{new Date(event.createdAt).toLocaleString('en-IN')}</p>{event.note && <p className="mt-1 text-xs text-gray-600">{event.note}</p>}</li>)}</ol></div>
      </section>}

      <section className="card p-5" aria-labelledby="tax-title"><h2 id="tax-title" className="text-lg font-bold text-gray-900">Annual tax and form statement tracker</h2><p className="mt-1 text-sm text-gray-500">Track delivery status and partner references only; no tax computation is performed.</p>
        <form onSubmit={saveStatement} className="mt-4 grid gap-3 md:grid-cols-5"><label className="text-sm">Employee ID<input required className="input mt-1" value={statement.employeeId} onChange={(e) => setStatement({ ...statement, employeeId: e.target.value })}/></label><label className="text-sm">Financial year<input required className="input mt-1" value={statement.financialYear} onChange={(e) => setStatement({ ...statement, financialYear: e.target.value })}/></label><label className="text-sm">Statement<select className="input mt-1" value={statement.statementType} onChange={(e) => setStatement({ ...statement, statementType: e.target.value })}><option value="form16">Form 16</option><option value="tax_statement">Tax statement</option><option value="investment_declaration">Investment declaration</option></select></label><label className="text-sm">Status<select className="input mt-1" value={statement.status} onChange={(e) => setStatement({ ...statement, status: e.target.value })}><option value="pending">Pending</option><option value="received">Received</option><option value="verified">Verified</option><option value="shared">Shared</option></select></label><button className="btn btn-primary self-end" type="submit">Save tracker</button></form>
        <div className="mt-4 overflow-x-auto"><table className="min-w-full text-sm"><caption className="sr-only">Annual payroll form tracking</caption><thead className="bg-gray-50 text-left"><tr><th className="p-3">Employee</th><th className="p-3">Year</th><th className="p-3">Statement</th><th className="p-3">Status</th></tr></thead><tbody>{statements.map((item) => <tr key={item.payrollTaxStatementId} className="border-t"><td className="p-3 font-mono text-xs">{item.employeeId}</td><td className="p-3">{item.financialYear}</td><td className="p-3">{label(item.statementType)}</td><td className="p-3">{label(item.status)}</td></tr>)}</tbody></table></div>
      </section>
    </main>
  </ModernLayout>;
}
