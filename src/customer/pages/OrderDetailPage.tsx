import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { cancelCustomerOrder, downloadCustomerAttachment, fetchCustomerOrder, type CustomerOrder } from '../../lib/api'

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { session } = useAuth()
  const [order, setOrder] = useState<CustomerOrder | null>(null)
  const [error, setError] = useState('')
  const load = () => {
    if (!id || !session?.access_token) return
    fetchCustomerOrder(id, session.access_token).then(setOrder).catch(err => setError(err instanceof Error ? err.message : 'Order not found'))
  }
  useEffect(load, [id, session])
  if (!session) return <div className="storefront-order-flow" style={{ padding: 60, textAlign: 'center' }}><Link to="/login" state={{ from: `/orders/${id}` }}>Sign in to view this order</Link></div>
  if (error) return <div className="storefront-order-flow" style={{ padding: 60, textAlign: 'center', color: '#B91C1C' }}>{error}</div>
  if (!order) return <div className="storefront-order-flow" style={{ padding: 60, textAlign: 'center' }}>Loading order…</div>
  const cancellable = ['pending', 'confirmed'].includes(order.status)
  const cancel = async () => {
    if (!session.access_token || !window.confirm('Cancel this order?')) return
    await cancelCustomerOrder(order.id, session.access_token, 'Cancelled by customer')
    load()
  }
  return <div className="storefront-order-flow" style={{ minHeight: '100vh', background: '#F8FAFC', padding: '34px 20px', fontFamily: 'system-ui' }}><div style={{ maxWidth: 820, margin: '0 auto' }}><Link to="/orders">← My Orders</Link><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', margin: '18px 0' }}><div><h1 style={{ margin: 0, fontSize: 24 }}>{order.orderNumber}</h1><div style={{ color: '#64748B', marginTop: 5 }}>{new Date(order.createdAt).toLocaleString()}</div></div><div style={{ textAlign: 'right', textTransform: 'capitalize' }}><strong>{order.status.replace('_', ' ')}</strong><div style={{ color: order.paymentStatus === 'paid' ? '#047857' : '#D97706', fontSize: 12 }}>Payment: {order.paymentStatus.replace('_', ' ')}</div></div></div>
    <section style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, marginBottom: 13 }}><h2 style={{ fontSize: 16, marginTop: 0 }}>Delivery</h2><div>{order.contactName} · {order.contactPhone}<br />{order.deliveryLine1}{order.deliveryLine2 && `, ${order.deliveryLine2}`}<br />{order.deliveryCity}, {order.deliveryEmirate}, {order.deliveryCountry}</div>{order.deliveryNotes && <p style={{ color: '#64748B' }}>Notes: {order.deliveryNotes}</p>}</section>
    <section style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, marginBottom: 13 }}><h2 style={{ fontSize: 16, marginTop: 0 }}>Items</h2>{order.items.map(item => <div key={item.id} style={{ padding: '12px 0', borderBottom: '1px solid #F1F5F9' }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>{item.productName} × {item.quantity}</strong><strong>AED {Number(item.total).toFixed(2)}</strong></div>{item.fieldValues.map(field => <div key={field.id} style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>{field.fieldLabel}: {field.displayValue}</div>)}{item.attachments.map(file => <button key={file.id} onClick={() => downloadCustomerAttachment(order.id, file.id, session.access_token, file.originalName)} style={{ display: 'block', marginTop: 6, border: 0, background: 'none', padding: 0, color: '#1D4ED8', cursor: 'pointer' }}>📎 Download {file.originalName}</button>)}</div>)}<div style={{ marginTop: 14, display: 'grid', gap: 5 }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Net</span><span>AED {Number(order.subtotal).toFixed(2)}</span></div><div style={{ display: 'flex', justifyContent: 'space-between' }}><span>VAT included</span><span>AED {Number(order.vatAmount).toFixed(2)}</span></div><div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 18 }}><span>Total</span><span>AED {Number(order.total).toFixed(2)}</span></div></div></section>
    <section style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20 }}><h2 style={{ fontSize: 16, marginTop: 0 }}>Order timeline</h2>{order.timeline.map(event => <div key={event.id} style={{ padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}><strong style={{ textTransform: 'capitalize' }}>{event.status.replace('_', ' ')}</strong><span style={{ color: '#64748B', fontSize: 12, marginLeft: 9 }}>{new Date(event.createdAt).toLocaleString()}</span>{event.note && <div style={{ color: '#64748B', fontSize: 13 }}>{event.note}</div>}</div>)}</section>
    {cancellable && <button onClick={cancel} style={{ marginTop: 15, border: '1px solid #FCA5A5', color: '#DC2626', background: '#fff', borderRadius: 8, padding: '9px 14px', cursor: 'pointer' }}>Cancel order</button>}
  </div></div>
}
