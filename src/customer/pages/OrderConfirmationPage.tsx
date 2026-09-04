import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { fetchCustomerOrder, type CustomerOrder } from '../../lib/api'

export function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>()
  const { session } = useAuth()
  const [order, setOrder] = useState<CustomerOrder | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!id || !session?.access_token) return
    fetchCustomerOrder(id, session.access_token).then(setOrder).catch(err => setError(err instanceof Error ? err.message : 'Order not found'))
  }, [id, session])

  if (!session) return <div className="storefront-order-flow" style={{ padding: 60, textAlign: 'center' }}><Link to="/login" state={{ from: `/orders/${id}/confirmation` }}>Sign in to view this order</Link></div>
  if (error) return <div className="storefront-order-flow" style={{ padding: 60, textAlign: 'center', color: '#B91C1C' }}>{error}</div>
  if (!order) return <div className="storefront-order-flow" style={{ padding: 60, textAlign: 'center', color: '#64748B' }}>Loading order…</div>

  const paymentMessage = order.paymentMethod === 'bank_transfer'
    ? 'Your order is waiting for bank transfer confirmation.'
    : 'Your order is confirmed. Payment is due on delivery.'
  return <div className="storefront-order-flow" style={{ background: '#F8FAFC', minHeight: '100vh', padding: '48px 16px', fontFamily: 'system-ui' }}><div style={{ maxWidth: 620, margin: '0 auto' }}>
    <div style={{ textAlign: 'center', marginBottom: 24 }}><div style={{ width: 72, height: 72, borderRadius: '50%', background: '#DCFCE7', color: '#16A34A', display: 'grid', placeItems: 'center', fontSize: 32, margin: '0 auto 16px' }}>✓</div><h1 style={{ margin: '0 0 7px', fontSize: 28 }}>Order received</h1><p style={{ margin: 0, color: '#64748B' }}>{paymentMessage}</p><div style={{ display: 'inline-block', marginTop: 15, padding: '9px 15px', borderRadius: 8, background: '#EFF6FF', color: '#1D4ED8', fontWeight: 800 }}>{order.orderNumber}</div></div>
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 13, padding: 22, marginBottom: 14 }}><h2 style={{ fontSize: 15, margin: '0 0 12px' }}>Items</h2>{order.items.map(item => <div key={item.id} style={{ padding: '11px 0', borderBottom: '1px solid #F1F5F9' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><strong>{item.productName} × {item.quantity}</strong><strong>AED {Number(item.total).toFixed(2)}</strong></div>{item.fieldValues.map(field => <div key={field.id} style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>{field.fieldLabel}: {field.displayValue}</div>)}{item.attachments.map(file => <div key={file.id} style={{ fontSize: 12, color: '#047857', marginTop: 3 }}>📎 {file.originalName}</div>)}</div>)}<div style={{ marginTop: 14, display: 'grid', gap: 6, fontSize: 13 }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Net amount</span><span>AED {Number(order.subtotal).toFixed(2)}</span></div><div style={{ display: 'flex', justifyContent: 'space-between' }}><span>VAT included</span><span>AED {Number(order.vatAmount).toFixed(2)}</span></div><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 800, borderTop: '1px solid #E2E8F0', paddingTop: 9 }}><span>Total</span><span>AED {Number(order.total).toFixed(2)}</span></div></div></div>
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}><Link to={`/orders/${order.id}`} style={{ padding: '11px 18px', border: '1px solid #CBD5E1', borderRadius: 9, textDecoration: 'none', color: '#334155', fontWeight: 700 }}>View order details</Link><Link to="/catalog" style={{ padding: '11px 18px', background: '#1D4ED8', borderRadius: 9, textDecoration: 'none', color: '#fff', fontWeight: 700 }}>Continue shopping</Link></div>
  </div></div>
}
