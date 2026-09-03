import { useEffect, useState } from 'react'
import { AdminLayout, Table, SearchInput, Badge, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

type ReqStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'cancelled'
interface Requisition {
  id: string; status: ReqStatus; note: string | null; neededBy: string | null; createdAt: string
  _count: { items: number; rfqs: number }
}

const STATUS_LABEL: Record<ReqStatus, string> = { draft: 'Draft', submitted: 'Submitted', approved: 'Approved', rejected: 'Rejected', cancelled: 'Cancelled' }
const STATUS_COLOR: Record<ReqStatus, string> = { draft: '#64748B', submitted: '#1D4ED8', approved: '#10B981', rejected: '#EF4444', cancelled: '#94A3B8' }
const STATUSES: ReqStatus[] = ['draft', 'submitted', 'approved', 'rejected', 'cancelled']
const COLS = [
  { key: 'id', label: 'PR #', width: 110 }, { key: 'items', label: 'Lines', width: 70 },
  { key: 'rfqs', label: 'RFQs', width: 70 }, { key: 'status', label: 'Status', width: 120 },
  { key: 'note', label: 'Note' }, { key: 'neededBy', label: 'Needed By', width: 110 },
  { key: 'created', label: 'Created', width: 110 },
]

export function RequisitionsPage() {
  const [data, setData] = useState<Requisition[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [statusFilter, setFilter] = useState<ReqStatus | 'all'>('all')

  const load = async () => { setLoading(true); try { const r = await api.get<{ data: Requisition[] }>('/purchase-requisitions?pageSize=200'); setData(r.data) } finally { setLoading(false) } }
  useEffect(() => { load() }, [])

  const filtered = data.filter(r => (statusFilter === 'all' || r.status === statusFilter) && (r.note ?? '').toLowerCase().includes(q.toLowerCase()))
  const rows = filtered.map(r => ({
    id: r.id.slice(0, 8).toUpperCase(), items: r._count.items, rfqs: r._count.rfqs,
    status: <Badge label={STATUS_LABEL[r.status]} color={STATUS_COLOR[r.status]} />,
    note: r.note ?? <span style={{ color: '#94A3B8', fontSize: 12 }}>—</span>,
    neededBy: r.neededBy ? r.neededBy.slice(0, 10) : '—', created: r.createdAt.slice(0, 10),
  }))

  return (
    <AdminLayout title="Purchase Requisitions" actions={<SearchInput value={q} onChange={setQ} placeholder="Search notes…" />}>
      <StatGrid>
        <StatCard label="Total" value={String(data.length)} sub="All PRs" />
        <StatCard label="Pending Approval" value={String(data.filter(r => r.status === 'submitted').length)} sub="Awaiting review" color="#1D4ED8" />
        <StatCard label="Approved" value={String(data.filter(r => r.status === 'approved').length)} sub="Approved" color="#10B981" />
        <StatCard label="Rejected" value={String(data.filter(r => r.status === 'rejected').length)} sub="Rejected" color="#EF4444" />
      </StatGrid>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['all', ...STATUSES] as const).map(s => <button key={s} onClick={() => setFilter(s)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontFamily: FONT, fontWeight: 500, cursor: 'pointer', border: '1px solid #E2E8F0', background: statusFilter === s ? DARK : '#fff', color: statusFilter === s ? '#fff' : '#64748B' }}>{s === 'all' ? 'All' : STATUS_LABEL[s]}</button>)}
      </div>
      {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
        : data.length === 0 ? <div style={{ padding: 60, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>No purchase requisitions yet.</div>
        : <><div style={{ fontSize: 13, color: '#64748B', marginBottom: 12, fontFamily: FONT }}>{filtered.length} requisitions</div><Table columns={COLS} rows={rows} /></>}
    </AdminLayout>
  )
}
