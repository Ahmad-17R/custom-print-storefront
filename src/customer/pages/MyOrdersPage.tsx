import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { fetchCustomerOrders, type CustomerOrder } from '../../lib/api'

const ACTIVE = new Set(['pending', 'confirmed', 'in_production', 'ready'])
const statusColor: Record<string, string> = { pending: '#D97706', confirmed: '#1D4ED8', in_production: '#7C3AED', ready: '#059669', delivered: '#047857', cancelled: '#DC2626', refunded: '#DC2626' }

export function MyOrdersPage() {
  const { session } = useAuth()
  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!session?.access_token) { setLoading(false); return }
    fetchCustomerOrders(session.access_token).then(setOrders).catch(err => setError(err instanceof Error ? err.message : 'Could not load orders')).finally(() => setLoading(false))
  }, [session])
  if (!session) return <div className="storefront-order-flow" style={{ minHeight: '65vh', display: 'grid', placeItems: 'center' }}><Link to="/login" state={{ from: '/orders' }}>Sign in to view your orders</Link></div>
  const filtered = orders.filter(order => filter === 'all' || filter === 'active' && ACTIVE.has(order.status) || order.status === filter)
  return <div className="storefront-order-flow" style={{ minHeight: '100vh', background: '#F8FAFC', padding: '36px 20px', fontFamily: 'system-ui' }}><div style={{ maxWidth: 780, margin: '0 auto' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h1 style={{ fontSize: 27 }}>My Orders</h1><Link to="/catalog">+ New order</Link></div><div style={{ display: 'flex', gap: 7, marginBottom: 20 }}>{['all', 'active', 'delivered', 'cancelled'].map(value => <button key={value} onClick={() => setFilter(value)} style={{ padding: '7px 13px', borderRadius: 20, border: '1px solid #E2E8F0', background: filter === value ? '#1D4ED8' : '#fff', color: filter === value ? '#fff' : '#475569', textTransform: 'capitalize' }}>{value}</button>)}</div>{loading && <div>Loading orders…</div>}{error && <div style={{ color: '#B91C1C' }}>{error}</div>}{!loading && !filtered.length && <div style={{ padding: 50, textAlign: 'center', color: '#64748B' }}>No orders found.</div>}<div style={{ display: 'grid', gap: 11 }}>{filtered.map(order => <div key={order.id} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 11, padding: 17, display: 'flex', justifyContent: 'space-between', gap: 16 }}><div><div style={{ display: 'flex', gap: 9, alignItems: 'center' }}><strong>{order.orderNumber}</strong><span style={{ color: statusColor[order.status] ?? '#64748B', fontSize: 11, fontWeight: 800, textTransform: 'capitalize' }}>{order.status.replace('_', ' ')}</span></div><div style={{ fontSize: 12, color: '#64748B', marginTop: 5 }}>{new Date(order.createdAt).toLocaleDateString()} · {order.items.map(item => item.productName).join(', ')}</div><div style={{ fontSize: 12, color: order.paymentStatus === 'paid' ? '#047857' : '#D97706', marginTop: 4 }}>Payment: {order.paymentStatus.replace('_', ' ')}</div></div><div style={{ textAlign: 'right' }}><strong>AED {Number(order.total).toFixed(2)}</strong><br /><Link to={`/orders/${order.id}`} style={{ display: 'inline-block', marginTop: 8, fontSize: 12 }}>View details</Link></div></div>)}</div></div></div>
}
