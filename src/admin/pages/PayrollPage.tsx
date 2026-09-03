import { useEffect, useState } from 'react'
import { AdminLayout, Table, Btn, SearchInput, Badge, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

interface Country { id: string; name: string }
interface Payslip {
  id: string; basicSalary: string; allowances: string; deductions: string; netPay: string
  status: string; note: string | null; paidAt: string | null
  employee: { id: string; employeeNo: string; name: string; jobTitle: string | null }
}

const SLIP_STATUS_LABEL: Record<string, string> = { pending: 'Pending', approved: 'Approved', paid: 'Paid', on_hold: 'On Hold' }
const SLIP_STATUS_COLOR: Record<string, string> = { pending: '#F59E0B', approved: '#1D4ED8', paid: '#10B981', on_hold: '#EF4444' }
interface PayrollRun {
  id: string; periodStart: string; periodEnd: string; status: string; processedAt: string | null; createdAt: string
  country: Country; _count: { payslips: number }; onHoldCount?: number
  payslips?: Payslip[]
}

const STATUS_LABEL: Record<string, string> = { draft: 'Draft', processing: 'Processing', approved: 'Approved', paid: 'Paid', cancelled: 'Cancelled' }
const STATUS_COLOR: Record<string, string> = { draft: '#64748B', processing: '#F59E0B', approved: '#1D4ED8', paid: '#10B981', cancelled: '#EF4444' }
const STATUS_NEXT: Record<string, string>  = { processing: 'approved', approved: 'paid' }

const fmt = (v: any) => `AED ${Number(v).toFixed(2)}`
const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box' as const, outline: 'none' }
const lbl = (t: string) => <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 4, fontFamily: FONT }}>{t}</div>

function NewRunModal({ countries, onClose, onSaved }: { countries: Country[]; onClose: () => void; onSaved: () => void }) {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const lastDay  = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
  const [countryId, setCountry]   = useState(countries[0]?.id ?? '')
  const [periodStart, setStart]   = useState(firstDay)
  const [periodEnd, setEnd]       = useState(lastDay)
  const [saving, setSaving]       = useState(false)
  const [err, setErr]             = useState('')

  const submit = async () => {
    if (!countryId) { setErr('Select a country'); return }
    setSaving(true)
    try {
      await api.post('/payroll-runs', { countryId, periodStart, periodEnd })
      onSaved(); onClose()
    } catch (e: any) {
      setErr(e?.response?.data?.error || e?.message || 'Failed')
    } finally { setSaving(false) }
  }

  const ov: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }
  const box: React.CSSProperties = { background: '#fff', borderRadius: 16, width: 420, padding: 28, fontFamily: FONT }

  return (
    <div style={ov} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={box}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20, color: DARK }}>Create Payroll Run</div>
        {err && <div style={{ background: '#FEF2F2', color: '#B91C1C', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{err}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          <label>
            <div>{lbl('Country *')}</div>
            <select style={inp} value={countryId} onChange={e => setCountry(e.target.value)}>
              {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label><div>{lbl('Period Start')}</div><input type="date" style={inp} value={periodStart} onChange={e => setStart(e.target.value)} /></label>
            <label><div>{lbl('Period End')}</div><input type="date" style={inp} value={periodEnd} onChange={e => setEnd(e.target.value)} /></label>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', fontFamily: FONT, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: DARK, color: '#fff', fontFamily: FONT, fontSize: 13, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Creating…' : 'Create Run'}
          </button>
        </div>
      </div>
    </div>
  )
}

function RunDrawer({ run, onClose, onUpdate }: { run: PayrollRun; onClose: () => void; onUpdate: (r: PayrollRun) => void }) {
  const [detail, setDetail]     = useState<PayrollRun | null>(null)
  const [loading, setLoading]   = useState(true)
  const [acting, setActing]     = useState(false)
  const [slipActing, setSlipAct] = useState<string | null>(null)

  const reload = async () => {
    const full = await api.get<PayrollRun>(`/payroll-runs/${run.id}`)
    setDetail(full)
    return full
  }

  useEffect(() => {
    reload().finally(() => setLoading(false))
  }, [run.id])

  const generate = async () => {
    setActing(true)
    try { const r = await api.post<PayrollRun>(`/payroll-runs/${run.id}/generate`, {}); setDetail(r); onUpdate(r) }
    finally { setActing(false) }
  }

  const advanceRun = async () => {
    const next = STATUS_NEXT[detail?.status ?? '']
    if (!next) return
    setActing(true)
    try {
      const r = await api.patch<PayrollRun>(`/payroll-runs/${run.id}/status`, { status: next })
      const full = await reload(); onUpdate(r)
    } finally { setActing(false) }
  }

  const updateSlip = async (slipId: string, status: string) => {
    setSlipAct(slipId)
    try {
      await api.patch(`/payroll-runs/${run.id}/payslips/${slipId}`, { status })
      await reload()
    } finally { setSlipAct(null) }
  }

  const slips = detail?.payslips ?? []
  const approvedSlips = slips.filter(p => p.status === 'approved')
  const totalNet = slips.reduce((s, p) => s + Number(p.netPay), 0)
  const approvedNet = approvedSlips.reduce((s, p) => s + Number(p.netPay), 0)

  const SLIP_COLS = [
    { key: 'empNo',      label: 'Emp #',      width: 90  },
    { key: 'name',       label: 'Employee',   width: 160 },
    { key: 'basic',      label: 'Basic',      width: 110 },
    { key: 'deductions', label: 'Deductions', width: 110 },
    { key: 'netPay',     label: 'Net Pay',    width: 110 },
    { key: 'slipStatus', label: 'Status',     width: 100 },
    { key: 'actions',    label: '',           width: 200 },
  ]

  const SLIP_ACTIONS: Record<string, { label: string; next: string; color: string }[]> = {
    pending:  [{ label: 'Approve', next: 'approved', color: '#10B981' }, { label: 'Hold', next: 'on_hold', color: '#EF4444' }],
    approved: [{ label: 'Mark Paid', next: 'paid', color: '#10B981' }, { label: 'Hold', next: 'on_hold', color: '#EF4444' }],
    on_hold:  [{ label: 'Resume', next: 'pending', color: '#F59E0B' }],
    paid:     [],
  }

  const slipRows = slips.map(p => ({
    empNo:      p.employee.employeeNo,
    name:       p.employee.name,
    basic:      fmt(p.basicSalary),
    deductions: fmt(p.deductions),
    netPay:     <span style={{ fontWeight: 700, color: '#10B981' }}>{fmt(p.netPay)}</span>,
    slipStatus: <Badge label={SLIP_STATUS_LABEL[p.status] ?? p.status} color={SLIP_STATUS_COLOR[p.status] ?? '#64748B'} />,
    actions: (
      <div style={{ display: 'flex', gap: 4 }}>
        {(SLIP_ACTIONS[p.status] ?? []).map(a => (
          <button key={a.next} disabled={slipActing === p.id} onClick={() => updateSlip(p.id, a.next)}
            style={{ padding: '3px 8px', fontSize: 11, borderRadius: 5, border: 'none', background: a.color, color: '#fff', cursor: 'pointer', fontFamily: FONT, opacity: slipActing === p.id ? 0.6 : 1 }}>
            {a.label}
          </button>
        ))}
      </div>
    ),
  }))

  const dr: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }
  const panel: React.CSSProperties = { background: '#fff', width: 900, maxWidth: '95vw', height: '100%', overflowY: 'auto', padding: 32, fontFamily: FONT }

  return (
    <div style={dr} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={panel}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: DARK }}>Payroll Run</div>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
              {run.periodStart.slice(0, 10)} → {run.periodEnd.slice(0, 10)} · {run.country.name}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <Badge label={STATUS_LABEL[detail?.status ?? run.status]} color={STATUS_COLOR[detail?.status ?? run.status]} />
            {detail?.status === 'draft' && (
              <button disabled={acting} onClick={generate} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: '#1D4ED8', color: '#fff', fontFamily: FONT, fontSize: 13, cursor: 'pointer', opacity: acting ? 0.6 : 1 }}>
                {acting ? 'Generating…' : 'Generate Payslips'}
              </button>
            )}
            {STATUS_NEXT[detail?.status ?? ''] && (
              <button disabled={acting} onClick={advanceRun} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: detail?.status === 'processing' ? '#1D4ED8' : '#10B981', color: '#fff', fontFamily: FONT, fontSize: 13, cursor: 'pointer', opacity: acting ? 0.6 : 1 }}>
                {acting ? 'Updating…' : `→ ${STATUS_LABEL[STATUS_NEXT[detail?.status ?? ''] ?? '']}`}
              </button>
            )}
            <button onClick={onClose} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', fontFamily: FONT, fontSize: 13, cursor: 'pointer' }}>Close</button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>Loading…</div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
              {[
                { label: 'Total Employees', value: String(slips.length) },
                { label: 'Approved',        value: String(approvedSlips.length), color: '#10B981' },
                { label: 'On Hold',         value: String(slips.filter(p => p.status === 'on_hold').length), color: '#EF4444' },
                { label: 'Approved Net Pay', value: fmt(approvedNet), color: '#1D4ED8' },
              ].map(s => (
                <div key={s.label} style={{ background: '#F8FAFC', borderRadius: 12, padding: '12px 16px' }}>
                  <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: s.color ?? DARK }}>{s.value}</div>
                </div>
              ))}
            </div>

            {slips.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>
                No payslips yet. Click "Generate Payslips" to create them for all active employees with salaries.
              </div>
            ) : (
              <>
                <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 10, fontFamily: FONT }}>
                  Approve or hold individual payslips before advancing the run status. On-hold payslips are excluded from payment.
                </div>
                <Table columns={SLIP_COLS} rows={slipRows} />
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export function PayrollPage() {
  const [data, setData]         = useState<PayrollRun[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [loading, setLoading]   = useState(true)
  const [statusFilter, setFilter] = useState('all')
  const [showNew, setShowNew]   = useState(false)
  const [selected, setSelected] = useState<PayrollRun | null>(null)
  const [stats, setStats]       = useState({ paidThisMonth: 0, paidThisYear: 0 })

  const load = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ pageSize: '100' })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const [runs, ctrs, s] = await Promise.all([
        api.get<{ data: PayrollRun[] }>(`/payroll-runs?${params}`),
        api.get<{ data: Country[] }>('/countries?pageSize=200'),
        api.get<{ paidThisMonth: number; paidThisYear: number }>('/payroll-runs/stats'),
      ])
      setData(runs.data)
      setCountries(ctrs.data)
      setStats(s)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [statusFilter])

  const COLS = [
    { key: 'period',    label: 'Period',      width: 200 },
    { key: 'country',   label: 'Country',     width: 130 },
    { key: 'employees', label: 'Employees',   width: 100 },
    { key: 'onHold',    label: 'On Hold',     width: 90  },
    { key: 'status',    label: 'Status',      width: 120 },
    { key: 'processed', label: 'Processed',   width: 110 },
    { key: 'created',   label: 'Created',     width: 110 },
  ]

  const filtered = data.filter(r => statusFilter === 'all' || r.status === statusFilter)

  const rows = filtered.map(r => ({
    __id:      r.id,
    period:    `${r.periodStart.slice(0, 10)} → ${r.periodEnd.slice(0, 10)}`,
    country:   r.country.name,
    employees: r._count.payslips,
    onHold:    r.onHoldCount
      ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#FEF2F2', color: '#B91C1C', borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>&#9888; {r.onHoldCount}</span>
      : <span style={{ color: '#94A3B8', fontSize: 12 }}>—</span>,
    status:    <Badge label={STATUS_LABEL[r.status] ?? r.status} color={STATUS_COLOR[r.status] ?? '#64748B'} />,
    processed: r.processedAt ? r.processedAt.slice(0, 10) : '—',
    created:   r.createdAt.slice(0, 10),
  }))

  const STATUSES = ['draft', 'processing', 'approved', 'paid', 'cancelled']

  return (
    <AdminLayout
      title="Payroll"
      actions={<Btn label="+ New Payroll Run" onClick={() => setShowNew(true)} />}
    >
      <StatGrid>
        <StatCard label="Total Runs"       value={String(data.length)}                                         sub="All payroll runs" />
        <StatCard label="Processing"       value={String(data.filter(r => r.status === 'processing').length)}  sub="Pending approval"  color="#F59E0B" />
        <StatCard label="Paid This Month"  value={`AED ${stats.paidThisMonth.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} sub="Net salary disbursed" color="#10B981" />
        <StatCard label="Paid This Year"   value={`AED ${stats.paidThisYear.toLocaleString('en',  { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} sub="Year-to-date payroll"  color="#1D4ED8" />
      </StatGrid>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['all', ...STATUSES] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontFamily: FONT, fontWeight: 500, cursor: 'pointer', border: '1px solid #E2E8F0', background: statusFilter === s ? DARK : '#fff', color: statusFilter === s ? '#fff' : '#64748B' }}>
            {s === 'all' ? 'All' : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
      ) : (
        <Table columns={COLS} rows={rows} onRowClick={row => { const run = filtered.find(r => r.id === (row as any).__id); if (run) setSelected(run) }} />
      )}

      {showNew && <NewRunModal countries={countries} onClose={() => setShowNew(false)} onSaved={load} />}
      {selected && (
        <RunDrawer
          run={selected}
          onClose={() => setSelected(null)}
          onUpdate={updated => { setData(prev => prev.map(r => r.id === updated.id ? { ...r, ...updated } : r)) }}
        />
      )}
    </AdminLayout>
  )
}
