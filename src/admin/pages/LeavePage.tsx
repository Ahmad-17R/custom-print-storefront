import { useEffect, useState } from 'react'
import { AdminLayout, Table, Btn, SearchInput, Badge, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

interface Employee { id: string; employeeNo: string; name: string }
interface Leave {
  id: string; leaveType: string; startDate: string; endDate: string; days: number
  status: string; reason: string | null; approvedBy: string | null; createdAt: string
  employee: Employee
}

const LEAVE_TYPES = ['annual', 'sick', 'maternity', 'paternity', 'unpaid', 'other']
const LEAVE_LABEL: Record<string, string> = { annual: 'Annual', sick: 'Sick', maternity: 'Maternity', paternity: 'Paternity', unpaid: 'Unpaid', other: 'Other' }
const STATUS_LABEL: Record<string, string> = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected', cancelled: 'Cancelled' }
const STATUS_COLOR: Record<string, string> = { pending: '#F59E0B', approved: '#10B981', rejected: '#EF4444', cancelled: '#64748B' }
const STATUSES = ['pending', 'approved', 'rejected', 'cancelled']

const inp: React.CSSProperties = {
  width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0',
  borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box' as const, outline: 'none',
}
const lbl = (t: string) => <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 4, fontFamily: FONT }}>{t}</div>

interface ModalProps { employees: Employee[]; onClose: () => void; onSaved: () => void }

function NewLeaveModal({ employees, onClose, onSaved }: ModalProps) {
  const [employeeId, setEmp]  = useState('')
  const [leaveType, setType]  = useState('annual')
  const [startDate, setStart] = useState('')
  const [endDate, setEnd]     = useState('')
  const [reason, setReason]   = useState('')
  const [saving, setSaving]   = useState(false)
  const [err, setErr]         = useState('')

  const calcDays = () => {
    if (!startDate || !endDate) return 0
    return Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1
  }

  const submit = async () => {
    if (!employeeId) { setErr('Select an employee'); return }
    if (!startDate || !endDate) { setErr('Start and end date required'); return }
    setSaving(true)
    try {
      await api.post('/leave', { employeeId, leaveType, startDate, endDate, reason: reason.trim() || null })
      onSaved(); onClose()
    } catch (e: any) {
      setErr(e?.response?.data?.error || e?.message || 'Failed to save')
    } finally { setSaving(false) }
  }

  const ov: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }
  const box: React.CSSProperties = { background: '#fff', borderRadius: 16, width: 460, padding: 28, fontFamily: FONT }

  return (
    <div style={ov} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={box}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20, color: DARK }}>New Leave Request</div>
        {err && <div style={{ background: '#FEF2F2', color: '#B91C1C', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{err}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 12 }}>
          <label>
            <div>{lbl('Employee *')}</div>
            <select style={inp} value={employeeId} onChange={e => setEmp(e.target.value)}>
              <option value="">— select —</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.employeeNo})</option>)}
            </select>
          </label>
          <label>
            <div>{lbl('Leave Type')}</div>
            <select style={inp} value={leaveType} onChange={e => setType(e.target.value)}>
              {LEAVE_TYPES.map(t => <option key={t} value={t}>{LEAVE_LABEL[t]}</option>)}
            </select>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label><div>{lbl('From *')}</div><input type="date" style={inp} value={startDate} onChange={e => setStart(e.target.value)} /></label>
            <label><div>{lbl('To *')}</div><input type="date" style={inp} value={endDate} onChange={e => setEnd(e.target.value)} /></label>
          </div>
          {startDate && endDate && <div style={{ fontSize: 13, color: '#64748B' }}>Duration: <strong>{calcDays()} day(s)</strong></div>}
          <label><div>{lbl('Reason')}</div><textarea style={{ ...inp, resize: 'vertical', minHeight: 70 }} value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for leave…" /></label>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', fontFamily: FONT, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: DARK, color: '#fff', fontFamily: FONT, fontSize: 13, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Submitting…' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function LeavePage() {
  const [data, setData]           = useState<Leave[]>([])
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
      const [leaves, emps] = await Promise.all([
        api.get<{ data: Leave[] }>(`/leave?${params}`),
        api.get<{ data: Employee[] }>('/employees?pageSize=200&isActive=true'),
      ])
      setData(leaves.data)
      setEmployees(emps.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [statusFilter])

  const action = async (id: string, act: 'approve' | 'reject' | 'cancel') => {
    setActing(id)
    try {
      await api.post(`/leave/${id}/${act}`, {})
      await load()
    } finally { setActing(null) }
  }

  const filtered = data.filter(r =>
    r.employee.name.toLowerCase().includes(q.toLowerCase()) ||
    r.employee.employeeNo.toLowerCase().includes(q.toLowerCase())
  )

  const COLS = [
    { key: 'empNo',    label: 'Emp #',    width: 90  },
    { key: 'name',     label: 'Employee', width: 170 },
    { key: 'type',     label: 'Type',     width: 110 },
    { key: 'from',     label: 'From',     width: 105 },
    { key: 'to',       label: 'To',       width: 105 },
    { key: 'days',     label: 'Days',     width: 65  },
    { key: 'status',   label: 'Status',   width: 110 },
    { key: 'actions',  label: '',         width: 180 },
  ]

  const rows = filtered.map(r => ({
    empNo:  r.employee.employeeNo,
    name:   r.employee.name,
    type:   LEAVE_LABEL[r.leaveType] ?? r.leaveType,
    from:   r.startDate.slice(0, 10),
    to:     r.endDate.slice(0, 10),
    days:   r.days,
    status: <Badge label={STATUS_LABEL[r.status] ?? r.status} color={STATUS_COLOR[r.status] ?? '#64748B'} />,
    actions: (
      <div style={{ display: 'flex', gap: 4 }}>
        {r.status === 'pending' && <>
          <button disabled={!!acting} onClick={() => action(r.id, 'approve')} style={{ padding: '3px 8px', fontSize: 11, borderRadius: 5, border: 'none', background: '#10B981', color: '#fff', cursor: 'pointer', fontFamily: FONT }}>Approve</button>
          <button disabled={!!acting} onClick={() => action(r.id, 'reject')}  style={{ padding: '3px 8px', fontSize: 11, borderRadius: 5, border: 'none', background: '#EF4444', color: '#fff', cursor: 'pointer', fontFamily: FONT }}>Reject</button>
        </>}
        {r.status === 'approved' && (
          <button disabled={!!acting} onClick={() => action(r.id, 'cancel')} style={{ padding: '3px 8px', fontSize: 11, borderRadius: 5, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', fontFamily: FONT }}>Cancel</button>
        )}
      </div>
    ),
  }))

  const pending  = data.filter(r => r.status === 'pending').length
  const approved = data.filter(r => r.status === 'approved').length
  const totalDays = data.filter(r => r.status === 'approved').reduce((s, r) => s + r.days, 0)

  return (
    <AdminLayout
      title="Leave Requests"
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <SearchInput value={q} onChange={setQ} placeholder="Search employee…" />
          <Btn label="+ New Request" onClick={() => setShowNew(true)} />
        </div>
      }
    >
      <StatGrid>
        <StatCard label="Pending"       value={String(pending)}  sub="Awaiting decision" color="#F59E0B" />
        <StatCard label="Approved"      value={String(approved)} sub="This view"          color="#10B981" />
        <StatCard label="Approved Days" value={String(totalDays)} sub="Total leave days"  color="#1D4ED8" />
        <StatCard label="Total"         value={String(data.length)} sub="All requests" />
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
          <div style={{ fontSize: 13, color: '#64748B', marginBottom: 12, fontFamily: FONT }}>{filtered.length} requests</div>
          <Table columns={COLS} rows={rows} />
        </>
      )}

      {showNew && <NewLeaveModal employees={employees} onClose={() => setShowNew(false)} onSaved={load} />}
    </AdminLayout>
  )
}
