import { useEffect, useState } from 'react'
import { AdminLayout, Table, SearchInput, Badge, StatCard, StatGrid } from '../components/AdminLayout'
import { AdminOrderDetails, type AdminOrderDetail } from '../components/AdminOrderDetails'
import { api } from '../../lib/api'

const money = (v: string | number) => `AED ${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
const columns = [
  { key: 'orderNumber', label: 'Order #', width: 190 },
  { key: 'customer', label: 'Customer' },
  { key: 'items', label: 'Items', width: 70 },
  { key: 'total', label: 'Total', width: 120 },
  { key: 'payment', label: 'Payment', width: 120 },
  { key: 'delivered', label: 'Delivered', width: 120 },
  { key: 'actions', label: '', width: 80 },
]

// Completed online orders — delivered jobs, off the handling board.
export function OnlineOrderSummaryPage() {
  const [orders, setOrders] = useState<AdminOrderDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [selectedId, setSelectedId] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const r = await api.get<{ orders: AdminOrderDetail[] }>('/orders?status=delivered&limit=300')
      setOrders(r.orders ?? [])
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const filtered = orders.filter(o => `${o.orderNumber} ${o.contactName ?? ''} ${o.customer?.email ?? ''}`.toLowerCase().includes(q.toLowerCase()))
  const revenue = orders.reduce((s, o) => s + Number(o.total), 0)
  const rows = filtered.map(o => ({
    orderNumber: o.orderNumber,
    customer: o.contactName ?? o.customer?.fullName ?? o.customer?.email ?? '—',
    items: o.items.length,
    total: money(o.total),
    payment: <span style={{ textTransform: 'capitalize', color: o.paymentStatus === 'paid' ? '#047857' : '#D97706' }}>{o.paymentStatus.replaceAll('_', ' ')}</span>,
    delivered: <Badge label="Delivered" color="#047857" />,
    actions: <button onClick={() => setSelectedId(o.id)} style={{ fontSize: 12, padding: '5px 10px', border: '1px solid #CBD5E1', borderRadius: 6, background: '#fff', cursor: 'pointer' }}>View</button>,
  }))

  return <AdminLayout title="Order Summary (Online)" actions={<SearchInput value={q} onChange={setQ} placeholder="Search order or customer…" />}>
    <StatGrid>
      <StatCard label="Delivered Orders" value={String(orders.length)} sub="Completed online" color="#047857" />
      <StatCard label="Delivered Value" value={money(revenue)} sub="VAT-inclusive" color="#10B981" />
    </StatGrid>
    {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>Loading…</div>
      : orders.length === 0 ? <div style={{ padding: 50, textAlign: 'center', color: '#64748B', border: '2px dashed #E2E8F0', borderRadius: 12 }}>No delivered online orders yet. Orders appear here once their shipment is marked delivered.</div>
      : <Table columns={columns} rows={rows} />}
    {selectedId && <><div onClick={() => setSelectedId('')} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', zIndex: 999 }} /><div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 680, maxWidth: '100%', background: '#fff', overflowY: 'auto', zIndex: 1000, boxShadow: '-8px 0 30px rgba(0,0,0,.15)' }}><button onClick={() => setSelectedId('')} style={{ position: 'absolute', top: 14, right: 14, zIndex: 1, border: 0, background: 'none', fontSize: 22, cursor: 'pointer' }}>×</button><AdminOrderDetails orderId={selectedId} onUpdated={load} /></div></>}
  </AdminLayout>
}
