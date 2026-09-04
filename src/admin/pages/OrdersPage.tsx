import { useEffect, useState } from 'react'
import { AdminLayout, Table, SearchInput, Badge, StatCard, StatGrid } from '../components/AdminLayout'
import { AdminOrderDetails, type AdminOrderDetail } from '../components/AdminOrderDetails'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'
const labels: Record<string, string> = { pending: 'Pending', confirmed: 'Confirmed', in_production: 'In Production', ready: 'Ready', delivered: 'Delivered', cancelled: 'Cancelled', refunded: 'Refunded' }
const colors: Record<string, string> = { pending: '#F59E0B', confirmed: '#1D4ED8', in_production: '#8B5CF6', ready: '#10B981', delivered: '#047857', cancelled: '#EF4444', refunded: '#DC2626' }
const statuses = Object.keys(labels)
const columns = [
  { key: 'orderNumber', label: 'Order Number', width: 190 }, { key: 'customerName', label: 'Customer' },
  { key: 'itemsCount', label: 'Items', width: 70 }, { key: 'totalDisplay', label: 'Total', width: 120 },
  { key: 'paymentDisplay', label: 'Payment', width: 150 }, { key: 'statusDisplay', label: 'Status', width: 130 },
  { key: 'dateDisplay', label: 'Date', width: 110 }, { key: 'actions', label: '', width: 75 },
]

export function OrdersPage() {
  const [orders, setOrders] = useState<AdminOrderDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [selectedId, setSelectedId] = useState('')
  const load = async () => {
    setLoading(true)
    try {
      const suffix = status === 'all' ? '' : `&status=${status}`
      const result = await api.get<{ orders: AdminOrderDetail[] }>(`/orders?limit=100${suffix}`)
      setOrders(result.orders ?? [])
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [status])
  const filtered = orders.filter(order => `${order.orderNumber} ${order.contactName ?? ''} ${order.customer?.email ?? ''}`.toLowerCase().includes(query.toLowerCase()))
  const rows = filtered.map(order => ({
    orderNumber: order.orderNumber,
    customerName: order.contactName ?? order.customer?.fullName ?? order.customer?.email ?? '—',
    itemsCount: order.items.length,
    totalDisplay: `AED ${Number(order.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    paymentDisplay: <span style={{ textTransform: 'capitalize', color: order.paymentStatus === 'paid' ? '#047857' : '#D97706' }}>{order.paymentStatus.replaceAll('_', ' ')} · {order.paymentMethod?.replaceAll('_', ' ')}</span>,
    statusDisplay: <Badge label={labels[order.status] ?? order.status} color={colors[order.status] ?? '#64748B'} />,
    dateDisplay: order.createdAt.slice(0, 10),
    actions: <button onClick={() => setSelectedId(order.id)} style={{ fontSize: 12, padding: '5px 10px', border: '1px solid #CBD5E1', borderRadius: 6, background: '#fff', cursor: 'pointer' }}>View</button>,
  }))
  const revenue = orders.filter(order => !['cancelled', 'refunded'].includes(order.status)).reduce((sum, order) => sum + Number(order.total), 0)
  return <AdminLayout title="Orders" actions={<SearchInput value={query} onChange={setQuery} placeholder="Search order number or customer…" />}>
    <StatGrid><StatCard label="Total Orders" value={String(orders.length)} sub="Current filter" /><StatCard label="Order Value" value={`AED ${revenue.toLocaleString()}`} sub="Excl. cancelled/refunded" color="#10B981" /><StatCard label="Unpaid" value={String(orders.filter(order => order.paymentStatus === 'unpaid').length)} sub="Needs collection" color="#F59E0B" /><StatCard label="In Production" value={String(orders.filter(order => order.status === 'in_production').length)} sub="Active jobs" color="#8B5CF6" /></StatGrid>
    <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>{['all', ...statuses].map(value => <button key={value} onClick={() => setStatus(value)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontFamily: FONT, cursor: 'pointer', border: '1px solid #E2E8F0', background: status === value ? DARK : '#fff', color: status === value ? '#fff' : '#64748B' }}>{value === 'all' ? 'All' : labels[value]}</button>)}</div>
    {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>Loading orders…</div> : <Table columns={columns} rows={rows} />}
    {selectedId && <><div onClick={() => setSelectedId('')} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', zIndex: 999 }} /><div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 680, maxWidth: '100%', background: '#fff', overflowY: 'auto', zIndex: 1000, boxShadow: '-8px 0 30px rgba(0,0,0,.15)' }}><button onClick={() => setSelectedId('')} style={{ position: 'absolute', top: 14, right: 14, zIndex: 1, border: 0, background: 'none', fontSize: 22, cursor: 'pointer' }}>×</button><AdminOrderDetails orderId={selectedId} onUpdated={load} /></div></>}
  </AdminLayout>
}
