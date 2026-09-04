import { useEffect, useState } from 'react'
import { api, downloadAdminAttachment } from '../../lib/api'

export interface AdminOrderDetail {
  id: string; orderNumber: string; status: string; paymentStatus: string; paymentMethod: string | null
  paymentReference?: string | null; subtotal: string | number; vatAmount: string | number
  deliveryFee: string | number; total: string | number; notes?: string | null; createdAt: string
  contactName?: string | null; contactEmail?: string | null; contactPhone?: string | null
  deliveryLine1?: string | null; deliveryLine2?: string | null; deliveryCity?: string | null
  deliveryEmirate?: string | null; deliveryCountry?: string | null; deliveryNotes?: string | null
  handlingWarehouseId?: string | null
  customer?: { id?: string; fullName?: string | null; email?: string | null; phone?: string | null }
  items: Array<{
    id: string; productId: string; productName: string; quantity: number; unitPrice: string | number
    total: string | number; note?: string | null
    fieldValues?: Array<{ id: string; fieldLabel: string; displayValue: string; priceModifier: string | number }>
    attachments?: Array<{ id: string; kind: string; fieldLabel?: string | null; originalName: string; mimeType: string; size: number }>
  }>
  jobs: Array<{
    id: string; stepName: string; productName?: string | null; status: string; type: string
    note?: string | null; assignedToId?: string | null; assignedTo?: { name: string } | null
    supplierId?: string | null; supplier?: { name: string } | null; supplierCost?: number | null
    supplierStatus?: string | null; materials?: Array<{ id: string; name: string; materialId?: string | null; quantity: number; totalCost: number }>
  }>
  timeline?: Array<{ id: string; status: string; note?: string | null; createdAt: string }>
}

const section = { borderTop: '1px solid #E2E8F0', padding: '16px 20px' }
const money = (value: string | number) => `AED ${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export function AdminOrderInformation({ order }: { order: AdminOrderDetail }) {
  return <div style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontSize: 13, color: '#0F172A' }}>
    <div style={section}><h3 style={{ margin: '0 0 9px', fontSize: 13 }}>Customer & delivery</h3><div>{order.contactName ?? order.customer?.fullName ?? '—'} · {order.contactPhone ?? order.customer?.phone ?? '—'}</div><div style={{ color: '#64748B' }}>{order.contactEmail ?? order.customer?.email ?? '—'}</div><div style={{ marginTop: 6 }}>{order.deliveryLine1 ?? '—'}{order.deliveryLine2 ? `, ${order.deliveryLine2}` : ''}<br />{order.deliveryCity}, {order.deliveryEmirate}, {order.deliveryCountry ?? 'UAE'}</div>{order.deliveryNotes && <div style={{ marginTop: 6, color: '#64748B' }}>Delivery notes: {order.deliveryNotes}</div>}</div>
    <div style={section}><h3 style={{ margin: '0 0 9px', fontSize: 13 }}>Financials</h3><div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 5 }}><span>Net amount</span><span>{money(order.subtotal)}</span><span>VAT included</span><span>{money(order.vatAmount)}</span><span>Delivery</span><span>{money(order.deliveryFee)}</span><strong>Total</strong><strong>{money(order.total)}</strong><span>Payment method</span><span style={{ textTransform: 'capitalize' }}>{order.paymentMethod?.replaceAll('_', ' ') ?? '—'}</span><span>Payment status</span><strong style={{ textTransform: 'capitalize' }}>{order.paymentStatus.replaceAll('_', ' ')}</strong></div></div>
    <div style={section}><h3 style={{ margin: '0 0 9px', fontSize: 13 }}>Items & specifications</h3>{order.items.map(item => <div key={item.id} style={{ border: '1px solid #E2E8F0', borderRadius: 9, padding: 11, marginBottom: 8 }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>{item.productName} × {item.quantity}</strong><strong>{money(item.total)}</strong></div><div style={{ color: '#64748B', fontSize: 11 }}>{money(item.unitPrice)} each</div>{item.fieldValues?.map(field => <div key={field.id} style={{ marginTop: 5 }}><span style={{ color: '#64748B' }}>{field.fieldLabel}:</span> {field.displayValue}{Number(field.priceModifier) !== 0 && <span style={{ color: '#1D4ED8' }}> (+{money(field.priceModifier)})</span>}</div>)}{item.note && <div style={{ marginTop: 5, color: '#64748B' }}>Print notes: {item.note}</div>}{item.attachments?.map(file => <button key={file.id} onClick={() => downloadAdminAttachment(order.id, file.id, file.originalName)} style={{ display: 'block', marginTop: 6, padding: 0, border: 0, background: 'none', color: '#1D4ED8', cursor: 'pointer', fontFamily: 'inherit' }}>📎 Download {file.originalName} <span style={{ color: '#94A3B8' }}>({Math.ceil(file.size / 1024)} KB)</span></button>)}</div>)}</div>
    {order.notes && <div style={section}><h3 style={{ margin: '0 0 7px', fontSize: 13 }}>Order notes</h3><div style={{ color: '#64748B' }}>{order.notes}</div></div>}
    {order.timeline && <div style={section}><h3 style={{ margin: '0 0 7px', fontSize: 13 }}>Timeline</h3>{order.timeline.map(event => <div key={event.id} style={{ padding: '5px 0', borderBottom: '1px solid #F1F5F9' }}><strong style={{ textTransform: 'capitalize' }}>{event.status.replaceAll('_', ' ')}</strong><span style={{ color: '#94A3B8', marginLeft: 8, fontSize: 11 }}>{new Date(event.createdAt).toLocaleString()}</span>{event.note && <div style={{ color: '#64748B' }}>{event.note}</div>}</div>)}</div>}
  </div>
}

export function AdminOrderDetails({ orderId, onUpdated }: { orderId: string; onUpdated?: () => void }) {
  const [order, setOrder] = useState<AdminOrderDetail | null>(null)
  const [status, setStatus] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('')
  const [paymentReference, setPaymentReference] = useState('')
  const [loading, setLoading] = useState(true)
  const load = async () => { setLoading(true); const result = await api.get<AdminOrderDetail>(`/orders/${orderId}`); setOrder(result); setStatus(result.status); setPaymentStatus(result.paymentStatus); setPaymentReference(result.paymentReference ?? ''); setLoading(false) }
  useEffect(() => { load() }, [orderId])
  if (loading || !order) return <div style={{ padding: 30, color: '#64748B' }}>Loading order details…</div>
  const save = async () => { await api.patch(`/orders/${order.id}/status`, { status }); await load(); onUpdated?.() }
  const savePayment = async () => { await api.patch(`/orders/${order.id}/payment`, { paymentStatus, paymentReference }); await load(); onUpdated?.() }
  return <div><div style={{ padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div><h2 style={{ margin: 0, fontSize: 17 }}>{order.orderNumber}</h2><div style={{ color: '#64748B', fontSize: 12 }}>{new Date(order.createdAt).toLocaleString()}</div></div><div style={{ display: 'flex', gap: 6 }}><select value={status} onChange={event => setStatus(event.target.value)} style={{ border: '1px solid #CBD5E1', borderRadius: 7, padding: '6px 8px' }}>{['pending', 'confirmed', 'in_production', 'ready', 'delivered', 'cancelled', 'refunded'].map(value => <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>)}</select><button onClick={save} disabled={status === order.status} style={{ border: 0, borderRadius: 7, padding: '6px 11px', background: '#0F172A', color: '#fff' }}>Save</button></div></div><div style={{ padding: '0 20px 14px', display: 'flex', gap: 7, alignItems: 'center' }}><strong style={{ fontSize: 12 }}>Payment:</strong><select value={paymentStatus} onChange={event => setPaymentStatus(event.target.value)} style={{ border: '1px solid #CBD5E1', borderRadius: 7, padding: '6px 8px' }}>{['unpaid', 'paid', 'partially_refunded', 'refunded'].map(value => <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>)}</select><input value={paymentReference} onChange={event => setPaymentReference(event.target.value)} placeholder="Reference" style={{ border: '1px solid #CBD5E1', borderRadius: 7, padding: '6px 8px' }} /><button onClick={savePayment} style={{ border: 0, borderRadius: 7, padding: '6px 11px', background: '#1D4ED8', color: '#fff' }}>Update payment</button></div><AdminOrderInformation order={order} /></div>
}
