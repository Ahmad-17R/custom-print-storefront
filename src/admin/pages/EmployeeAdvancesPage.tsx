import { useEffect, useState } from 'react'
import { AdminLayout, Table, Btn, SearchInput, Badge, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

interface Employee { id: string; employeeNo: string; name: string }
interface Advance {
  id: string; amount: string; reason: string | null; status: string
  approvedBy: string | null; paidAt: string | null; createdAt: string
  employee: Employee
}

const STATUS_LABEL: Record<string, string> = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected', paid: 'Paid', recovered: 'Recovered' }
const STATUS_COLOR: Record<string, string> = { pending: '#F59E0B', approved: '#1D4ED8', rejected: '#EF4444', paid: '#10B981', recovered: '#8B5CF6' }
const STATUSES = ['pending', 'approved', 'rejected', 'paid', 'recovered']

const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box' as const, outline: 'none' }
const lbl = (t: string) => <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 4, fontFamily: FONT }}>{t}</div>

function NewAdvanceModal({ employees, onClose, onSaved }: { employees: Employee[]; onClose: () => void; onSaved: () => void }) {
  const [employeeId, setEmp] = useState('')
  const [amount, setAmount]  = useState('')
  const [reason, setReason]  = useState('')
  const [saving, setSaving]  = useState(false)
  const [err, setErr]        = useState('')

  const submit = async () => {
    if (!employeeId)         { setErr('Select an employee'); return }
    if (!Number(amount) > 0) { setErr('Enter a valid amount'); return }
    setSaving(true)
    try {
      await api.post('/advances', { employeeId, amount: Number(amount), reason: reason.trim() || null })
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
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20, color: DARK }}>New Advance Request</div>
        {err && <div style={{ background: '#FEF2F2', color: '#B91C1C', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{err}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          <label>
            <div>{lbl('Employee *')}</div>
            <select style={inp} value={employeeId} onChange={e => setEmp(e.target.value)}>
              <option value="">— select —</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.employeeNo})</option>)}
            </select>
          </label>
          <label><div>{lbl('Amount (AED) *')}</div><input type="number" min={1} step="0.01" style={inp} value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" /></label>
          <label><div>{lbl('Reason')}</div><textarea style={{ ...inp, resize: 'vertical', minHeight: 60 }} value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for advance…" /></label>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', fontFamily: FONT, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: DARK, color: '#fff', fontFamily: FONT, fontSize: 13, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving…' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function EmployeeAdvancesPage() {
  const [data, setData]           = useState<Advance[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading]     = useState(true)
  const [q, setQ]                 = useState('')
  const [statusFilter, setFilter] = useState('all')
  const [showNew, setShowNew]     = useState(false)
  const [acting, setActing]       = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ pageSize: '200' })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const [adv, emps] = await Promise.all([
        api.get<{ data: Advance[] }>(`/advances?${params}`),
        api.get<{ data: Employee[] }>('/employees?pageSize=200&isActive=true'),
      ])
      setData(adv.data)
      setEmployees(emps.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [statusFilter])

  const act = async (id: string, action: string) => {
    setActing(id)
    try { await api.post(`/advances/${id}/${action}`, {}); await load() }
    finally { setActing(null) }
  }

  const fmt = (v: any) => `AED ${Number(v).toFixed(2)}`

  const filtered = data.filter(r =>
    r.employee.name.toLowerCase().includes(q.toLowerCase()) ||
    r.employee.employeeNo.toLowerCase().includes(q.toLowerCase())
  )

  const COLS = [
    { key: 'empNo',   label: 'Emp #',    width: 90  },
    { key: 'name',    label: 'Employee', width: 170 },
    { key: 'amount',  label: 'Amount',   width: 120 },
    { key: 'reason',  label: 'Reason',   width: 200 },
    { key: 'status',  label: 'Status',   width: 110 },
    { key: 'date',    label: 'Date',     width: 105 },
    { key: 'actions', label: '',         width: 200 },
  ]

  const rows = filtered.map(r => ({
    empNo:  r.employee.employeeNo,
    name:   r.employee.name,
    amount: fmt(r.amount),
    reason: r.reason ?? '—',
    status: <Badge label={STATUS_LABEL[r.status] ?? r.status} color={STATUS_COLOR[r.status] ?? '#64748B'} />,
    date:   r.createdAt.slice(0, 10),
    actions: (
      <div style={{ display: 'flex', gap: 4 }}>
        {r.status === 'pending' && <>
          <button disabled={!!acting} onClick={() => act(r.id, 'approve')} style={{ padding: '3px 8px', fontSize: 11, borderRadius: 5, border: 'none', background: '#10B981', color: '#fff', cursor: 'pointer', fontFamily: FONT }}>Approve</button>
          <button disabled={!!acting} onClick={() => act(r.id, 'reject')}  style={{ padding: '3px 8px', fontSize: 11, borderRadius: 5, border: 'none', background: '#EF4444', color: '#fff', cursor: 'pointer', fontFamily: FONT }}>Reject</button>
        </>}
        {r.status === 'approved' && (
          <button disabled={!!acting} onClick={() => act(r.id, 'pay')} style={{ padding: '3px 8px', fontSize: 11, borderRadius: 5, border: 'none', background: '#1D4ED8', color: '#fff', cursor: 'pointer', fontFamily: FONT }}>Mark Paid</button>
        )}
      </div>
    ),
  }))

  const pending  = data.filter(r => r.status === 'pending').length
  const approved = data.filter(r => r.status === 'approved').length
  const totalOwed = data.filter(r => r.status === 'approved').reduce((s, r) => s + Number(r.amount), 0)

  return (
    <AdminLayout
      title="Employee Advances"
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <SearchInput value={q} onChange={setQ} placeholder="Search employee…" />
          <Btn label="+ New Advance" onClick={() => setShowNew(true)} />
        </div>
      }
    >
      <StatGrid>
        <StatCard label="Pending"  value={String(pending)}              sub="Awaiting approval"   color="#F59E0B" />
        <StatCard label="Approved" value={String(approved)}             sub="Approved, not paid"  color="#1D4ED8" />
        <StatCard label="Owed"     value={`AED ${totalOwed.toFixed(2)}`} sub="Approved advances"  color="#EF4444" />
        <StatCard label="Total"    value={String(data.length)}           sub="All requests" />
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
        <>
          <div style={{ fontSize: 13, color: '#64748B', marginBottom: 12, fontFamily: FONT }}>{filtered.length} advances</div>
          <Table columns={COLS} rows={rows} />
        </>
      )}

      {showNew && <NewAdvanceModal employees={employees} onClose={() => setShowNew(false)} onSaved={load} />}
    </AdminLayout>
  )
}
