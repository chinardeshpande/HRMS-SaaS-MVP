import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  ArrowPathIcon, ArrowRightIcon, ArrowUpTrayIcon, BanknotesIcon, ChatBubbleLeftRightIcon,
  CheckBadgeIcon, ClockIcon, DocumentChartBarIcon, DocumentTextIcon, ShieldCheckIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { ModernLayout } from '../components/layout/ModernLayout';
import { useAuth } from '../context/AuthContext';
import payrollOperationsService, { PayrollCycle, PayrollCycleDetail, PayrollCycleStatus, PayrollTaxStatement } from '../services/payrollOperationsService';

type Tab = 'command' | 'inputs' | 'approvals' | 'compliance' | 'reports' | 'collaboration';
const tabs: Array<{ id: Tab; name: string; icon: typeof BanknotesIcon }> = [
  { id: 'command', name: 'Command centre', icon: BanknotesIcon },
  { id: 'inputs', name: 'Inputs & files', icon: ArrowUpTrayIcon },
  { id: 'approvals', name: 'Approvals', icon: CheckBadgeIcon },
  { id: 'compliance', name: 'Tax & compliance', icon: ShieldCheckIcon },
  { id: 'reports', name: 'Reports', icon: DocumentChartBarIcon },
  { id: 'collaboration', name: 'Partner channel', icon: ChatBubbleLeftRightIcon },
];
const monthName = (month: number) => new Intl.DateTimeFormat('en-IN', { month: 'long' }).format(new Date(2026, month - 1, 1));
const money = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value || 0));
const label = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const statusTone: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700', under_review: 'bg-amber-100 text-amber-800', changes_requested: 'bg-rose-100 text-rose-800',
  approved_for_partner: 'bg-blue-100 text-blue-800', partner_processing: 'bg-violet-100 text-violet-800', bank_approval_pending: 'bg-cyan-100 text-cyan-800',
  paid: 'bg-emerald-100 text-emerald-800', payslips_published: 'bg-teal-100 text-teal-800', closed: 'bg-slate-800 text-white',
};

export default function PayrollOperations() {
  const { user } = useAuth();
  const role = String(user?.role || '').toLowerCase();
  const isPartner = role === 'payroll_partner';
  const isOwner = role === 'system_admin' || role === 'hr_admin';
  const [tab, setTab] = useState<Tab>('command');
  const [cycles, setCycles] = useState<PayrollCycle[]>([]);
  const [selected, setSelected] = useState<PayrollCycleDetail | null>(null);
  const [statements, setStatements] = useState<PayrollTaxStatement[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);
  const [reference, setReference] = useState('');
  const [transitionNote, setTransitionNote] = useState('');
  const [channelNote, setChannelNote] = useState('');
  const [channelCategory, setChannelCategory] = useState('general');
  const [inputFile, setInputFile] = useState<File | null>(null);
  const [form, setForm] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), partnerName: '', employeeCount: 0, grossTotal: 0, deductionTotal: 0, netTotal: 0 });
  const [statement, setStatement] = useState({ employeeId: '', financialYear: '2026-27', statementType: 'form16', status: 'pending', partnerReference: '' });

  const load = async (selectedId?: string) => {
    const [cycleRows, statementRows] = await Promise.all([payrollOperationsService.listCycles(), payrollOperationsService.listTaxStatements()]);
    setCycles(cycleRows); setStatements(statementRows);
    const id = selectedId || selected?.cycle.payrollCycleId || cycleRows[0]?.payrollCycleId;
    setSelected(id ? await payrollOperationsService.getCycle(id) : null);
  };
  useEffect(() => { load().catch((err) => setError(err.response?.data?.error?.message || 'Unable to load payroll operations')); }, []);

  const run = async (work: () => Promise<unknown>, success: string) => {
    setError(''); setMessage(''); setWorking(true);
    try { await work(); setMessage(success); await load(); }
    catch (err: any) { setError(err.response?.data?.error?.message || err.message || 'Action failed'); }
    finally { setWorking(false); }
  };
  const transition = (status: PayrollCycleStatus) => {
    if (!selected) return;
    const payload: Record<string, unknown> = { note: transitionNote };
    if (status === 'partner_processing') payload.partnerReference = reference;
    if (status === 'paid') payload.bankReference = reference;
    if (status === 'payslips_published') payload.payslipSummary = { published: selected.cycle.employeeCount, pending: 0 };
    return run(() => payrollOperationsService.transition(selected.cycle.payrollCycleId, status, payload), `Cycle moved to ${label(status)}`);
  };
  const selectCycle = async (id: string, destination: Tab = 'command') => { setSelected(await payrollOperationsService.getCycle(id)); setTab(destination); };
  const collaboration = selected?.timeline.filter((event) => event.action === 'collaboration_note') || [];
  const artifacts = selected?.timeline.filter((event) => event.action === 'artifact_uploaded') || [];
  const pendingStatements = statements.filter((item) => item.status === 'pending' || item.status === 'received').length;
  const actionCount = cycles.filter((cycle) => isPartner ? ['approved_for_partner', 'partner_processing'].includes(cycle.status) : ['draft', 'under_review', 'bank_approval_pending', 'paid'].includes(cycle.status)).length + pendingStatements;
  const current = selected?.cycle;
  const stageNumber = current ? ['draft', 'under_review', 'approved_for_partner', 'partner_processing', 'bank_approval_pending', 'paid', 'payslips_published', 'closed'].indexOf(current.status) + 1 : 0;
  const downloadableReport = useMemo(() => current ? [
    ['Period', `${monthName(current.month)} ${current.year}`], ['Status', label(current.status)], ['Employees', current.employeeCount],
    ['Gross', current.grossTotal], ['Deductions', current.deductionTotal], ['Net', current.netTotal], ['Partner', current.partnerName],
  ] : [], [current]);
  const exportSummary = () => {
    const csv = downloadableReport.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    link.download = `payroll-${current?.year}-${current?.month}-summary.csv`; link.click(); URL.revokeObjectURL(link.href);
  };

  const RoleHero = () => <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#111a3a] via-[#35206e] to-[#7252e8] px-6 py-6 text-white shadow-xl sm:px-8">
    <div className="relative z-10 max-w-3xl">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-teal-300">{isPartner ? 'Payroll partner delivery workspace' : 'Payroll command centre'}</p>
      <h1 id="payroll-title" className="mt-2 text-3xl font-black sm:text-4xl">{isPartner ? 'Deliver an accurate, evidenced payroll.' : 'What needs payroll attention now?'}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-indigo-100">{isPartner
        ? 'Receive approved inputs, record processing references, return bank-ready output, and resolve questions with HR in one controlled workspace.'
        : 'See every monthly handoff, decision, statutory evidence item, and partner conversation—then act without losing the audit trail.'}</p>
      <div className="mt-5 flex flex-wrap gap-2"><button onClick={() => setTab('approvals')} className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-violet-800">Review {actionCount} actions</button><button onClick={() => setTab('collaboration')} className="rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-bold">Open partner channel</button></div>
    </div>
    <img src={isPartner ? '/images/assistant/peeks/manu-thoughtful.png' : '/images/assistant/peeks/manu-review.png'} alt="Manu, AuraHR payroll guide" className="pointer-events-none absolute -bottom-10 right-3 hidden h-64 object-contain opacity-95 md:block" />
    <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-300/20 blur-2xl" />
  </section>;

  return <ModernLayout><main className="mx-auto max-w-7xl space-y-5" aria-labelledby="payroll-title">
    <RoleHero />
    {(message || error) && <div role="status" aria-live="polite" className={`rounded-xl border p-3 text-sm font-semibold ${error ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{error || message}</div>}
    <nav aria-label="Payroll workspace" className="flex gap-2 overflow-x-auto rounded-2xl border border-violet-100 bg-white p-2 shadow-sm">{tabs.map((item) => <button key={item.id} onClick={() => setTab(item.id)} className={`flex min-w-max items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${tab === item.id ? 'bg-gradient-to-r from-violet-600 to-blue-500 text-white shadow' : 'text-slate-600 hover:bg-violet-50'}`}><item.icon className="h-5 w-5" />{item.name}</button>)}</nav>

    {tab === 'command' && <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Needs attention', actionCount, 'Your actionable payroll queue', ClockIcon, 'from-rose-500 to-orange-400', 'approvals'],
          ['Active cycles', cycles.filter((c) => c.status !== 'closed').length, 'Current monthly operations', ArrowPathIcon, 'from-violet-600 to-indigo-500', 'command'],
          ['Partner messages', collaboration.length, 'Audited shared decisions', ChatBubbleLeftRightIcon, 'from-cyan-500 to-blue-500', 'collaboration'],
          ['Compliance gaps', pendingStatements, 'Statements awaiting closure', ShieldCheckIcon, 'from-emerald-500 to-teal-500', 'compliance'],
        ].map(([name, value, caption, Icon, tone, destination]) => <button key={String(name)} onClick={() => setTab(destination as Tab)} className="group rounded-2xl border border-slate-100 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"><div className={`inline-flex rounded-xl bg-gradient-to-br ${tone} p-3 text-white`}><Icon className="h-6 w-6" /></div><p className="mt-4 text-3xl font-black text-slate-950">{value}</p><p className="font-bold text-slate-900">{name}</p><p className="mt-1 text-xs text-slate-500">{caption}</p></button>)}
      </section>
      <section className="grid gap-5 lg:grid-cols-[1.55fr_1fr]">
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"><div className="flex items-center justify-between border-b p-5"><div><h2 className="text-xl font-black text-slate-950">Monthly cycle desk</h2><p className="text-sm text-slate-500">Latest cycle first · select any row for its full story</p></div>{!isPartner && <button onClick={() => setTab('inputs')} className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white">Open new cycle</button>}</div>
          <div className="divide-y">{cycles.length ? cycles.map((cycle) => <button key={cycle.payrollCycleId} onClick={() => selectCycle(cycle.payrollCycleId)} className="grid w-full grid-cols-[1fr_auto] items-center gap-3 p-4 text-left hover:bg-violet-50 sm:grid-cols-[1.2fr_1fr_1fr_auto]"><div><p className="font-black text-slate-900">{monthName(cycle.month)} {cycle.year} <span className="text-xs text-slate-400">v{cycle.version}</span></p><p className="text-xs text-slate-500">{cycle.employeeCount} employees · {cycle.partnerName}</p></div><span className={`hidden w-fit rounded-full px-2.5 py-1 text-xs font-bold sm:block ${statusTone[cycle.status]}`}>{label(cycle.status)}</span><p className="hidden text-right font-black text-slate-900 sm:block">{money(cycle.netTotal)}</p><ArrowRightIcon className="h-5 w-5 text-violet-600" /></button>) : <div className="p-10 text-center text-slate-500">{isPartner ? 'No payroll cycle has been assigned yet.' : 'Create the first monthly payroll cycle from Inputs & files.'}</div>}</div>
        </div>
        <div className="rounded-2xl bg-gradient-to-b from-violet-50 to-white p-5 shadow-sm ring-1 ring-violet-100"><p className="text-xs font-bold uppercase tracking-widest text-violet-600">Manu’s focus</p><h2 className="mt-2 text-xl font-black text-slate-950">{isPartner ? 'Return evidence, not loose email.' : 'Keep the month moving.'}</h2><div className="mt-4 space-y-3">{[
          isPartner ? 'Acknowledge every approved handoff.' : 'Approve only the reviewed version.',
          isPartner ? 'Record processing and statutory references.' : 'Resolve partner questions in the shared channel.',
          isPartner ? 'Submit a bank-ready result for HR approval.' : 'Confirm bank release before publishing payslips.',
        ].map((text, index) => <div key={text} className="flex gap-3 rounded-xl bg-white p-3 shadow-sm"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-black text-violet-700">{index + 1}</span><p className="text-sm font-semibold text-slate-700">{text}</p></div>)}</div></div>
      </section>
    </div>}

    {tab === 'inputs' && <section className="grid gap-5 lg:grid-cols-[1fr_1.25fr]">
      {!isPartner ? <form onSubmit={(event) => { event.preventDefault(); run(() => payrollOperationsService.createCycle(form), 'Monthly cycle created'); }} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"><h2 className="text-xl font-black">Open a monthly cycle</h2><p className="mt-1 text-sm text-slate-500">Create the controlled envelope for this month’s exchange.</p><div className="mt-4 grid grid-cols-2 gap-3"><label className="text-sm font-bold">Month<input type="number" min="1" max="12" required className="input mt-1" value={form.month} onChange={(e) => setForm({ ...form, month: Number(e.target.value) })}/></label><label className="text-sm font-bold">Year<input type="number" min="2020" required className="input mt-1" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}/></label><label className="col-span-2 text-sm font-bold">Payroll partner<input required className="input mt-1" value={form.partnerName} onChange={(e) => setForm({ ...form, partnerName: e.target.value })}/></label>{(['employeeCount', 'grossTotal', 'deductionTotal', 'netTotal'] as const).map((field) => <label key={field} className="text-sm font-bold">{label(field)}<input type="number" min="0" className="input mt-1" value={form[field]} onChange={(e) => setForm({ ...form, [field]: Number(e.target.value) })}/></label>)}</div><button disabled={working} className="btn btn-primary mt-4 w-full">Create draft cycle</button></form> : <div className="rounded-2xl bg-gradient-to-br from-cyan-50 to-violet-50 p-6 ring-1 ring-cyan-100"><ArrowUpTrayIcon className="h-10 w-10 text-cyan-600"/><h2 className="mt-4 text-xl font-black">Receive the approved input pack</h2><p className="mt-2 text-sm text-slate-600">Only HR-approved versions enter partner processing. Select an assigned cycle, review totals and acknowledge it in Approvals.</p></div>}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"><h2 className="text-xl font-black">Standard exchange file</h2><p className="mt-1 text-sm text-slate-500">AuraHR external payroll exchange · v1.0</p><label className="mt-4 flex cursor-pointer items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50 p-6 text-center"><ArrowUpTrayIcon className="h-8 w-8 text-violet-600"/><span><strong className="block text-slate-900">{inputFile ? inputFile.name : 'Choose a monthly exchange file'}</strong><span className="text-xs text-slate-500">CSV, XLSX, or PDF · stored in the cycle audit trail</span></span><input type="file" accept=".csv,.xlsx,.pdf" className="sr-only" onChange={(event) => setInputFile(event.target.files?.[0] || null)}/></label>{inputFile && current && <button disabled={working} onClick={() => run(() => payrollOperationsService.uploadArtifact(current.payrollCycleId, inputFile), 'Payroll artifact uploaded').then(() => setInputFile(null))} className="btn btn-primary mt-3 w-full">Upload to {monthName(current.month)} cycle</button>}{inputFile && !current && <div className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">Select or create a monthly cycle before uploading this artifact.</div>}<div className="mt-5 grid grid-cols-2 gap-2 text-xs">{['employeeCode', 'payPeriod', 'paidDays', 'lopDays', 'earningAdjustments', 'deductionAdjustments', 'partnerGross', 'partnerNet'].map((field, index) => <div key={field} className="rounded-lg bg-slate-50 p-2"><span className="font-mono text-slate-700">{field}</span>{index < 4 && <span className="ml-1 text-rose-500">*</span>}</div>)}</div>{artifacts.length > 0 && <div className="mt-4 border-t pt-3"><p className="text-xs font-bold uppercase text-slate-500">Cycle artifacts</p>{artifacts.map((artifact) => <button key={artifact.payrollCycleEventId} onClick={() => payrollOperationsService.downloadArtifact(current!.payrollCycleId, artifact.payrollCycleEventId, String(artifact.details?.fileName || 'payroll-artifact'))} className="mt-2 flex w-full items-center justify-between rounded-lg bg-slate-50 p-2 text-left text-sm font-semibold text-violet-700"><span>{String(artifact.details?.fileName || 'Payroll artifact')}</span><DocumentTextIcon className="h-5 w-5"/></button>)}</div>}</div>
    </section>}

    {tab === 'approvals' && <section className="space-y-5">{current ? <><div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"><div className="flex flex-wrap justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-violet-600">Selected monthly story</p><h2 className="text-2xl font-black">{monthName(current.month)} {current.year} · v{current.version}</h2><p className="text-sm text-slate-500">{current.partnerName} · {current.employeeCount} employees</p></div><span className={`h-fit rounded-full px-3 py-1.5 text-sm font-bold ${statusTone[current.status]}`}>{label(current.status)}</span></div><div className="mt-5 grid gap-2 sm:grid-cols-4">{['Inputs', 'HR approval', 'Partner processing', 'Bank & payslips'].map((name, index) => <div key={name} className={`rounded-xl p-3 ${stageNumber >= index * 2 + 1 ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500'}`}><p className="text-xs font-bold">0{index + 1}</p><p className="mt-1 text-sm font-bold">{name}</p></div>)}</div><dl className="mt-5 grid gap-3 sm:grid-cols-3">{[['Gross', current.grossTotal], ['Deductions', current.deductionTotal], ['Net payable', current.netTotal]].map(([name, value]) => <div key={String(name)} className="rounded-xl bg-slate-50 p-4"><dt className="text-xs uppercase text-slate-500">{name}</dt><dd className="mt-1 text-xl font-black">{money(Number(value))}</dd></div>)}</dl></div>
        <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]"><div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"><h3 className="font-black">Decision context</h3><label className="mt-3 block text-sm font-bold">Reference<input className="input mt-1" placeholder={isPartner ? 'Partner batch / return reference' : 'Bank approval reference'} value={reference} onChange={(e) => setReference(e.target.value)}/></label><label className="mt-3 block text-sm font-bold">Decision note<textarea className="input mt-1 min-h-24" value={transitionNote} onChange={(e) => setTransitionNote(e.target.value)} placeholder="What was checked, changed or confirmed?"/></label></div><div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"><h3 className="font-black">Available actions</h3><div className="mt-4 grid gap-3 sm:grid-cols-2">
          {!isPartner && current.status === 'draft' && <Action title="Submit for HR review" note="Freeze the draft for controlled review" onClick={() => transition('under_review')}/>}
          {!isPartner && current.status === 'under_review' && <><Action title="Request changes" note="Return with an auditable reason" onClick={() => transition('changes_requested')}/>{isOwner && <Action primary title="Approve for partner" note="Release the reviewed version" onClick={() => transition('approved_for_partner')}/>}<Action title="Create revision" note="Preserve history and open a new version" onClick={() => run(() => payrollOperationsService.revise(current.payrollCycleId, transitionNote || 'Reviewed revision'), 'Revision created')}/></>}
          {isPartner && current.status === 'approved_for_partner' && <Action primary title="Acknowledge & start" note="Confirm receipt and begin partner processing" onClick={() => transition('partner_processing')}/>}
          {isPartner && current.status === 'partner_processing' && <Action primary title="Submit bank-ready result" note="Return final totals for internal approval" onClick={() => transition('bank_approval_pending')}/>}
          {!isPartner && isOwner && current.status === 'bank_approval_pending' && <Action primary title="Confirm paid" note="Record bank approval and execution" onClick={() => transition('paid')}/>}
          {!isPartner && current.status === 'paid' && <Action primary title="Publish payslips" note="Confirm employee document release" onClick={() => transition('payslips_published')}/>}
          {!isPartner && isOwner && current.status === 'payslips_published' && <Action primary title="Close the month" note="Seal the complete monthly record" onClick={() => transition('closed')}/>}
          {!['draft','under_review','approved_for_partner','partner_processing','bank_approval_pending','paid','payslips_published'].includes(current.status) && <p className="text-sm text-slate-500">This version has no pending workflow action.</p>}
        </div></div></div></> : <Empty text="Select a payroll cycle from the command centre to review its approvals."/>}</section>}

    {tab === 'compliance' && <section className="space-y-5"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[['TDS & Form 16', statements.filter(s => s.statementType === 'form16').length, 'Annual employee evidence'], ['Provident Fund', 'Monthly', 'Challan and return references'], ['ESI', 'Monthly', 'Contribution evidence'], ['Tax declarations', statements.filter(s => s.statementType === 'investment_declaration').length, 'Employee statement tracker']].map(([name, value, note]) => <div key={String(name)} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"><ShieldCheckIcon className="h-7 w-7 text-emerald-600"/><p className="mt-3 text-2xl font-black">{value}</p><h2 className="font-black">{name}</h2><p className="mt-1 text-xs text-slate-500">{note}</p></div>)}</div><div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"><h2 className="text-xl font-black">Statement and statutory evidence tracker</h2><form onSubmit={(event: FormEvent) => { event.preventDefault(); run(() => payrollOperationsService.saveTaxStatement(statement as Partial<PayrollTaxStatement>), 'Compliance tracker updated'); }} className="mt-4 grid gap-3 md:grid-cols-5"><label className="text-sm font-bold">Employee ID<input required className="input mt-1" value={statement.employeeId} onChange={(e) => setStatement({ ...statement, employeeId: e.target.value })}/></label><label className="text-sm font-bold">Financial year<input className="input mt-1" value={statement.financialYear} onChange={(e) => setStatement({ ...statement, financialYear: e.target.value })}/></label><label className="text-sm font-bold">Evidence<select className="input mt-1" value={statement.statementType} onChange={(e) => setStatement({ ...statement, statementType: e.target.value })}><option value="form16">Form 16</option><option value="tax_statement">Tax statement</option><option value="investment_declaration">Investment declaration</option><option value="pf_return">PF return</option><option value="esi_return">ESI return</option></select></label><label className="text-sm font-bold">Status<select className="input mt-1" value={statement.status} onChange={(e) => setStatement({ ...statement, status: e.target.value })}><option value="pending">Pending</option><option value="received">Received</option><option value="verified">Verified</option><option value="shared">Shared</option></select></label><button className="btn btn-primary self-end">Save evidence</button></form><div className="mt-4 divide-y">{statements.map((item) => <div key={item.payrollTaxStatementId} className="grid gap-1 py-3 text-sm sm:grid-cols-4"><span className="font-mono text-xs">{item.employeeId}</span><span>{item.financialYear}</span><strong>{label(item.statementType)}</strong><span className="font-bold text-violet-700">{label(item.status)}</span></div>)}</div></div></section>}

    {tab === 'reports' && <section className="space-y-5">{current ? <><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[['Headcount', current.employeeCount], ['Gross outflow', money(current.grossTotal)], ['Deductions', money(current.deductionTotal)], ['Net bank outflow', money(current.netTotal)]].map(([name, value]) => <div key={String(name)} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"><p className="text-xs font-bold uppercase tracking-widest text-slate-500">{name}</p><p className="mt-2 text-2xl font-black text-slate-950">{value}</p></div>)}</div><div className="grid gap-5 lg:grid-cols-2"><div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"><div className="flex justify-between"><div><h2 className="text-xl font-black">Monthly payroll summary</h2><p className="text-sm text-slate-500">Logo-ready operational report</p></div><button onClick={exportSummary} className="btn btn-primary">Export CSV</button></div><dl className="mt-5 space-y-3">{downloadableReport.map(([name, value]) => <div key={String(name)} className="flex justify-between border-b pb-2 text-sm"><dt className="text-slate-500">{name}</dt><dd className="font-bold">{value}</dd></div>)}</dl></div><div className="rounded-2xl bg-gradient-to-br from-blue-50 to-violet-50 p-5 ring-1 ring-blue-100"><h2 className="text-xl font-black">Previous-month movement</h2>{selected?.comparison ? <div className="mt-4 space-y-3">{['employeeCount','grossTotal','deductionTotal','netTotal'].map((key) => { const item = selected.comparison?.[key] as {amount:number;percent:number|null}; return <div key={key} className="rounded-xl bg-white p-3"><p className="text-xs text-slate-500">{label(key)}</p><p className="font-black">{item.amount >= 0 ? '+' : ''}{key === 'employeeCount' ? item.amount : money(item.amount)} {item.percent === null ? '' : `· ${item.percent}%`}</p></div>; })}</div> : <p className="mt-5 text-sm text-slate-500">A prior completed month will unlock comparison signals.</p>}</div></div></> : <Empty text="Select a cycle to open its reports and prior-month comparison."/>}</section>}

    {tab === 'collaboration' && <section className="grid gap-5 lg:grid-cols-[1fr_1.5fr]">{current ? <><div className="rounded-2xl bg-gradient-to-br from-[#151d43] to-[#5b35aa] p-5 text-white"><ChatBubbleLeftRightIcon className="h-9 w-9 text-teal-300"/><h2 className="mt-4 text-2xl font-black">{monthName(current.month)} payroll channel</h2><p className="mt-2 text-sm text-indigo-100">A shared, cycle-specific conversation for HR and the payroll partner. Every note remains in the monthly audit record.</p><div className="mt-5 rounded-xl bg-white/10 p-4 text-sm"><p className="font-bold">Channel guardrails</p><p className="mt-1 text-indigo-100">Use references and decisions here. Do not paste passwords, full bank account numbers, or unmasked personal tax identifiers.</p></div></div><div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"><h2 className="text-xl font-black">Payroll partner channel</h2><div className="mt-4 max-h-80 space-y-3 overflow-y-auto">{collaboration.length ? collaboration.map((event) => <div key={event.payrollCycleEventId} className={`max-w-[88%] rounded-2xl p-3 ${event.actorUserId === user?.userId ? 'ml-auto bg-violet-600 text-white' : 'bg-slate-100 text-slate-800'}`}><p className="text-sm">{event.note}</p><p className="mt-1 text-[11px] opacity-70">{String(event.details?.category || 'general')} · {new Date(event.createdAt).toLocaleString('en-IN')}</p></div>) : <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No messages yet. Start with the handoff context or a precise question.</p>}</div><form onSubmit={(event) => { event.preventDefault(); if (!channelNote.trim()) return; run(() => payrollOperationsService.addNote(current.payrollCycleId, channelNote, channelCategory), 'Message added to the payroll record').then(() => setChannelNote('')); }} className="mt-4 border-t pt-4"><div className="flex gap-2"><select className="input max-w-40" value={channelCategory} onChange={(e) => setChannelCategory(e.target.value)}><option value="general">General</option><option value="input_query">Input query</option><option value="tax_pf">Tax / PF</option><option value="approval">Approval</option><option value="bank">Bank</option></select><input className="input" value={channelNote} onChange={(e) => setChannelNote(e.target.value)} placeholder="Write an auditable payroll message…"/><button disabled={working} className="rounded-xl bg-violet-600 px-4 font-bold text-white">Send</button></div></form></div></> : <div className="lg:col-span-2"><Empty text="Select a monthly cycle before opening its partner channel."/></div>}</section>}
  </main></ModernLayout>;
}

function Action({ title, note, onClick, primary = false }: { title: string; note: string; onClick: () => void; primary?: boolean }) {
  return <button onClick={onClick} className={`rounded-xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${primary ? 'border-violet-600 bg-violet-600 text-white' : 'border-slate-200 bg-white text-slate-900'}`}><p className="font-black">{title}</p><p className={`mt-1 text-xs ${primary ? 'text-violet-100' : 'text-slate-500'}`}>{note}</p></button>;
}
function Empty({ text }: { text: string }) { return <div className="rounded-2xl border border-dashed border-violet-200 bg-violet-50 p-10 text-center"><DocumentTextIcon className="mx-auto h-10 w-10 text-violet-400"/><p className="mt-3 font-semibold text-slate-600">{text}</p></div>; }
