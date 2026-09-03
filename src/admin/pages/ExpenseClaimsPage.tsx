import { useEffect, useState } from 'react'
import { AdminLayout, Table, SearchInput, Badge, StatCard, StatGrid, Btn } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'
const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }
const lbl = (t: string) => <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>{t}</div>

interface Employee { id: string; employeeNo: string; name: string }
interface ExpenseClaim {
  id: string; amount: string; category: string | null; description: string | null; status: string; createdAt: string
  employee: { id: string; employeeNo: string; name: string }
}

const STATUS_LABEL: Record<string, string> = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected', paid: 'Paid' }
const STATUS_COLOR: Record<string, string> = { pending: '#F59E0B', approved: '#1D4ED8', rejected: '#EF4444', paid: '#10B981' }
const CATEGORIES = ['Travel', 'Meals', 'Accommodation', 'Office Supplies', 'Utilities', 'Entertainment', 'Training', 'Medical', 'Other']

function Modal({ item, employees, onClose, onSaved }: { item: Partial<ExpenseClaim> | null; employees: Employee[]; onClose: () => void; onSaved: () => void }) {
  const [employeeId, setEmp]    = useState(item?.employee?.id ?? employees[0]?.id ?? '')
  const [amount, setAmount]     = useState(item?.amount ? String(Number(item.amount)) : '')
  const [category, setCategory] = useState(item?.category ?? '')
  const [description, setDesc]  = useState(item?.description ?? '')
  const [saving, setSaving]     = useState(false)
  const [err, setErr]           = useState('')

  const save = async () => {
    setSaving(true); setErr('')
    try {
      if (item?.id) await api.patch(`/expenses/${item.id}`, { amount: Number(amount), category: category || null, description: description || null })
      else          await api.post('/expenses', { employeeId, amount: Number(amount), category: category || null, description: description || null })
      onSaved(); onClose()
    } catch (e: any) { setErr(e?.message ?? 'Error') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 16, width: 460, padding: 28, fontFamily: FONT }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20, color: DARK }}>{item?.id ? 'Edit Expense Claim' : 'New Expense Claim'}</div>
        {err && <div style={{ background: '#FEF2F2', color: '#B91C1C', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{err}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          {!item?.id && <label>{lbl('Employee *')}<select style={inp} value={employeeId} onChange={e => setEmp(e.target.value)}>
            {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.employeeNo})</option>)}
          </select></label>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label>{lbl('Amount (AED) *')}<input type="number" min="0" step="0.01" style={inp} value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" /></label>
            <label>{lbl('Category')}<select style={inp} value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">— select —</option>{CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select></label>
          </div>
          <label>{lbl('Description')}<textarea style={{ ...inp, minHeight: 72, resize: 'vertical' }} value={description} onChange={e => setDesc(e.target.value)} placeholder="What was this expense for?" /></label>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn label="Cancel" variant="secondary" onClick={onClose} />
          <Btn label={saving ? 'Saving…' : 'Save'} onClick={save} />
        </div>
      </div>
    </div>
  )
}

const COLS = [
  { key: 'emp', label: 'Employee', width: 160 }, { key: 'category', label: 'Category', width: 120 },
  { key: 'description', label: 'Description' }, { key: 'amount', label: 'Amount', width: 120 },
  { key: 'status', label: 'Status', width: 110 }, { key: 'actions', label: '', width: 220 },
]

export function ExpenseClaimsPage() {
  const [data, setData]           = useState<ExpenseClaim[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading]     = useState(true)
  const [q, setQ]                 = useState('')
  const [statusFilter, setFilter] = useState('all')
  const [modal, setModal]         = useState<Partial<ExpenseClaim> | null>(null)
  const [acting, setActing]       = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [r, e] = await Promise.all([
        api.get<{ data: ExpenseClaim[] }>('/expenses?pageSize=200'),
        api.get<{ data: Employee[] }>('/employees?pageSize=500&isActive=true'),
      ])
      setData(r.data); setEmployees(e.data)
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const action = async (id: string, endpoint: string) => {
    setActing(id)
    try { await api.post(`/expenses/${id}/${endpoint}`, {}); load() }
    catch (e: any) { alert(e?.message ?? 'Error') }
    finally { setActing(null) }
  }

  const btnS: React.CSSProperties = { fontSize: 11, padding: '3px 8px', borderRadius: 5, border: 'none', cursor: 'pointer', fontFamily: FONT }
  const STATUSES = ['all', 'pending', 'approved', 'rejected', 'paid']
  const filtered = data.filter(r =>
    (statusFilter === 'all' || r.status === statusFilter) &&
    (r.employee.name.toLowerCase().includes(q.toLowerCase()) || (r.description ?? '').toLowerCase().includes(q.toLowerCase()) || (r.category ?? '').toLowerCase().includes(q.toLowerCase()))
  )

  const rows = filtered.map(r => ({
    emp: r.employee.name,
    category: r.category ?? <span style={{ color: '#94A3B8', fontSize: 12 }}>—</span>,
    description: r.description ?? <span style={{ color: '#94A3B8', fontSize: 12 }}>—</span>,
    amount: <strong>AED {Number(r.amount).toLocaleString()}</strong>,
    status: <Badge label={STATUS_LABEL[r.status] ?? r.status} color={STATUS_COLOR[r.status] ?? '#64748B'} />,
    actions: (
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {r.status === 'pending' && <>
          <button disabled={acting === r.id} onClick={() => action(r.id, 'approve')} style={{ ...btnS, background: '#10B981', color: '#fff', opacity: acting === r.id ? 0.6 : 1 }}>Approve</button>
          <button disabled={acting === r.id} onClick={() => action(r.id, 'reject')} style={{ ...btnS, background: '#EF4444', color: '#fff', opacity: acting === r.id ? 0.6 : 1 }}>Reject</button>
        </>}
        {r.status === 'approved' && (
          <button disabled={acting === r.id} onClick={() => action(r.id, 'pay')} style={{ ...btnS, background: '#1D4ED8', color: '#fff', opacity: acting === r.id ? 0.6 : 1 }}>Mark Paid</button>
        )}
        {['pending', 'rejected'].includes(r.status) && (
          <button onClick={() => setModal(r)} style={{ ...btnS, background: '#F1F5F9', color: DARK, border: '1px solid #E2E8F0' }}>Edit</button>
        )}
      </div>
    ),
  }))

  return (
    <AdminLayout title="Expense Claims" actions={<><SearchInput value={q} onChange={setQ} placeholder="Search employee, description…" /><Btn label="+ New Claim" onClick={() => setModal({})} /></>}>
      <StatGrid>
        <StatCard label="Total Claims" value={String(data.length)} sub="All expense claims" />
        <StatCard label="Pending" value={String(data.filter(r => r.status === 'pending').length)} sub="Awaiting approval" color="#F59E0B" />
        <StatCard label="Approved" value={`AED ${data.filter(r => r.status === 'approved').reduce((s, r) => s + Number(r.amount), 0).toLocaleString()}`} sub="Approved total" color="#1D4ED8" />
        <StatCard label="Paid" value={`AED ${data.filter(r => r.status === 'paid').reduce((s, r) => s + Number(r.amount), 0).toLocaleString()}`} sub="Paid total" color="#10B981" />
      </StatGrid>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {STATUSES.map(s => <button key={s} onClick={() => setFilter(s)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontFamily: FONT, fontWeight: 500, cursor: 'pointer', border: '1px solid #E2E8F0', background: statusFilter === s ? DARK : '#fff', color: statusFilter === s ? '#fff' : '#64748B' }}>{s === 'all' ? 'All' : STATUS_LABEL[s]}</button>)}
      </div>
      {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
        : <Table columns={COLS} rows={rows} />}
      {modal !== null && <Modal item={modal} employees={employees} onClose={() => setModal(null)} onSaved={load} />}
    </AdminLayout>
  )
}
