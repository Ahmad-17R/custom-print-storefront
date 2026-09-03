import { useEffect, useState } from 'react'
import { AdminLayout, Table, SearchInput, Badge, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

type SessionStatus = 'open' | 'closed' | 'suspended'
interface Session {
  id: string; status: SessionStatus; openedAt: string; closedAt: string | null; openingCash: string; closingCash: string | null
  register: { id: string; name: string }
  _count: { orders: number }
}

const STATUS_LABEL: Record<SessionStatus, string> = { open: 'Open', closed: 'Closed', suspended: 'Suspended' }
const STATUS_COLOR: Record<SessionStatus, string> = { open: '#10B981', closed: '#64748B', suspended: '#F59E0B' }
const COLS = [
  { key: 'id', label: 'Session #', width: 110 }, { key: 'register', label: 'Register', width: 160 },
  { key: 'orders', label: 'Orders', width: 80 }, { key: 'openingCash', label: 'Opening', width: 110 },
  { key: 'closingCash', label: 'Closing', width: 110 }, { key: 'status', label: 'Status', width: 110 },
  { key: 'openedAt', label: 'Opened', width: 110 },
]

export function PosSessionsPage() {
  const [data, setData] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [statusFilter, setFilter] = useState<SessionStatus | 'all'>('all')

  const load = async () => { setLoading(true); try { const r = await api.get<{ data: Session[] }>('/pos/sessions?pageSize=200'); setData(r.data) } finally { setLoading(false) } }
  useEffect(() => { load() }, [])

  const filtered = data.filter(r => (statusFilter === 'all' || r.status === statusFilter) && r.register.name.toLowerCase().includes(q.toLowerCase()))
  const rows = filtered.map(r => ({
    id: r.id.slice(0, 8).toUpperCase(), register: r.register.name, orders: r._count.orders,
    openingCash: `AED ${Number(r.openingCash).toLocaleString()}`,
    closingCash: r.closingCash ? `AED ${Number(r.closingCash).toLocaleString()}` : '—',
    status: <Badge label={STATUS_LABEL[r.status]} color={STATUS_COLOR[r.status]} />,
    openedAt: r.openedAt.slice(0, 10),
  }))

  return (
    <AdminLayout title="POS Sessions" actions={<SearchInput value={q} onChange={setQ} placeholder="Search register…" />}>
      <StatGrid>
        <StatCard label="Total Sessions" value={String(data.length)} sub="All sessions" />
        <StatCard label="Open" value={String(data.filter(r => r.status === 'open').length)} sub="Currently open" color="#10B981" />
        <StatCard label="Closed" value={String(data.filter(r => r.status === 'closed').length)} sub="Closed" color="#64748B" />
        <StatCard label="Total Orders" value={String(data.reduce((s, r) => s + r._count.orders, 0))} sub="Across all sessions" color="#1D4ED8" />
      </StatGrid>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['all', 'open', 'closed', 'suspended'] as const).map(s => <button key={s} onClick={() => setFilter(s as SessionStatus | 'all')} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontFamily: FONT, fontWeight: 500, cursor: 'pointer', border: '1px solid #E2E8F0', background: statusFilter === s ? DARK : '#fff', color: statusFilter === s ? '#fff' : '#64748B' }}>{s === 'all' ? 'All' : STATUS_LABEL[s as SessionStatus]}</button>)}
      </div>
      {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
        : data.length === 0 ? <div style={{ padding: 60, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>No POS sessions yet.</div>
        : <><div style={{ fontSize: 13, color: '#64748B', marginBottom: 12, fontFamily: FONT }}>{filtered.length} sessions</div><Table columns={COLS} rows={rows} /></>}
    </AdminLayout>
  )
}
