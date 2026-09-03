import { useEffect, useState } from 'react'
import { AdminLayout, Table, SearchInput, Badge, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

type DNStatus = 'draft' | 'dispatched' | 'delivered' | 'cancelled'
interface DeliveryNote {
  id: string; status: DNStatus; deliveryDate: string | null; deliveredBy: string | null; notes: string | null; createdAt: string
  salesOrder: { orderNumber: string; customer: { fullName: string | null; email: string } }
  warehouse: { id: string; name: string }
  _count: { items: number }
}

const STATUS_LABEL: Record<DNStatus, string> = { draft: 'Draft', dispatched: 'Dispatched', delivered: 'Delivered', cancelled: 'Cancelled' }
const STATUS_COLOR: Record<DNStatus, string> = { draft: '#64748B', dispatched: '#F59E0B', delivered: '#10B981', cancelled: '#EF4444' }
const STATUSES: DNStatus[] = ['draft', 'dispatched', 'delivered', 'cancelled']
const COLS = [
  { key: 'id', label: 'DN #', width: 110 }, { key: 'soNumber', label: 'SO #', width: 130 },
  { key: 'customer', label: 'Customer' }, { key: 'warehouse', label: 'Warehouse', width: 150 },
  { key: 'items', label: 'Lines', width: 70 }, { key: 'status', label: 'Status', width: 120 },
  { key: 'deliveryDate', label: 'Delivery Date', width: 120 },
]

export function DeliveryNotesPage() {
  const [data, setData] = useState<DeliveryNote[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [statusFilter, setFilter] = useState<DNStatus | 'all'>('all')

  const load = async () => { setLoading(true); try { const r = await api.get<{ data: DeliveryNote[] }>('/delivery-notes?pageSize=200'); setData(r.data) } finally { setLoading(false) } }
  useEffect(() => { load() }, [])

  const filtered = data.filter(r => (statusFilter === 'all' || r.status === statusFilter) && (r.salesOrder.orderNumber.toLowerCase().includes(q.toLowerCase()) || (r.salesOrder.customer.fullName ?? '').toLowerCase().includes(q.toLowerCase())))
  const rows = filtered.map(r => ({
    id: r.id.slice(0, 8).toUpperCase(), soNumber: r.salesOrder.orderNumber,
    customer: r.salesOrder.customer.fullName ?? r.salesOrder.customer.email,
    warehouse: r.warehouse.name, items: r._count.items,
    status: <Badge label={STATUS_LABEL[r.status] ?? r.status} color={STATUS_COLOR[r.status] ?? '#64748B'} />,
    deliveryDate: r.deliveryDate ? r.deliveryDate.slice(0, 10) : '—',
  }))

  return (
    <AdminLayout title="Delivery Notes" actions={<SearchInput value={q} onChange={setQ} placeholder="Search SO #, customer…" />}>
      <StatGrid>
        <StatCard label="Total" value={String(data.length)} sub="All notes" />
        <StatCard label="Dispatched" value={String(data.filter(r => r.status === 'dispatched').length)} sub="In transit" color="#F59E0B" />
        <StatCard label="Delivered" value={String(data.filter(r => r.status === 'delivered').length)} sub="Completed" color="#10B981" />
        <StatCard label="Cancelled" value={String(data.filter(r => r.status === 'cancelled').length)} sub="Cancelled" color="#EF4444" />
      </StatGrid>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['all', ...STATUSES] as const).map(s => <button key={s} onClick={() => setFilter(s)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontFamily: FONT, fontWeight: 500, cursor: 'pointer', border: '1px solid #E2E8F0', background: statusFilter === s ? DARK : '#fff', color: statusFilter === s ? '#fff' : '#64748B' }}>{s === 'all' ? 'All' : STATUS_LABEL[s]}</button>)}
      </div>
      {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
        : data.length === 0 ? <div style={{ padding: 60, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>No delivery notes yet. They are created from confirmed sales orders.</div>
        : <><div style={{ fontSize: 13, color: '#64748B', marginBottom: 12, fontFamily: FONT }}>{filtered.length} delivery notes</div><Table columns={COLS} rows={rows} /></>}
    </AdminLayout>
  )
}
