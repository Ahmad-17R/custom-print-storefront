import { useEffect, useState } from 'react'
import { AdminLayout, Table, SearchInput, Badge, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"

interface PosOrder {
  id: string; total: string; paidAmount: string; change: string; status: string; createdAt: string
  session: { id: string; register: { name: string } }
  _count: { items: number }
}

const COLS = [
  { key: 'id', label: 'Order #', width: 110 }, { key: 'register', label: 'Register', width: 160 },
  { key: 'items', label: 'Items', width: 70 }, { key: 'total', label: 'Total', width: 110 },
  { key: 'paid', label: 'Paid', width: 110 }, { key: 'status', label: 'Status', width: 110 },
  { key: 'created', label: 'Date', width: 110 },
]

export function PosOrdersPage() {
  const [data, setData] = useState<PosOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  const load = async () => { setLoading(true); try { const r = await api.get<{ data: PosOrder[] }>('/pos/orders?pageSize=200'); setData(r.data) } finally { setLoading(false) } }
  useEffect(() => { load() }, [])

  const filtered = data.filter(r => r.session.register.name.toLowerCase().includes(q.toLowerCase()) || r.id.toLowerCase().includes(q.toLowerCase()))
  const totalRevenue = data.reduce((s, r) => s + Number(r.total), 0)
  const rows = filtered.map(r => ({
    id: r.id.slice(0, 8).toUpperCase(), register: r.session.register.name, items: r._count.items,
    total: <strong>AED {Number(r.total).toLocaleString()}</strong>,
    paid: `AED ${Number(r.paidAmount).toLocaleString()}`,
    status: <Badge label={r.status} color={r.status === 'completed' ? '#10B981' : '#EF4444'} />,
    created: r.createdAt.slice(0, 10),
  }))

  return (
    <AdminLayout title="POS Orders" actions={<SearchInput value={q} onChange={setQ} placeholder="Search register, order #…" />}>
      <StatGrid>
        <StatCard label="Total Orders" value={String(data.length)} sub="All POS orders" />
        <StatCard label="Revenue" value={`AED ${totalRevenue.toLocaleString()}`} sub="Total sales" color="#10B981" />
        <StatCard label="Avg Order" value={data.length ? `AED ${Math.round(totalRevenue / data.length).toLocaleString()}` : '—'} sub="Average value" color="#1D4ED8" />
        <StatCard label="Items Sold" value={String(data.reduce((s, r) => s + r._count.items, 0))} sub="Total items" color="#8B5CF6" />
      </StatGrid>
      {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
        : data.length === 0 ? <div style={{ padding: 60, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>No POS orders yet.</div>
        : <><div style={{ fontSize: 13, color: '#64748B', marginBottom: 12, fontFamily: FONT }}>{filtered.length} orders</div><Table columns={COLS} rows={rows} /></>}
    </AdminLayout>
  )
}
