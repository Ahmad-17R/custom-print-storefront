import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import type { AdminOrderDetail } from '../components/AdminOrderDetails'

const money = (v: string | number) => `AED ${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

interface Company { name: string; registrationNo?: string | null }

// Print-optimised tax invoice / credit note. Use the browser's Print dialog to
// save as PDF (no server-side PDF dependency).
export function InvoiceDocumentPage() {
  const { orderId } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const wantCredit = params.get('type') === 'credit_note'
  const [order, setOrder] = useState<AdminOrderDetail | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orderId) return
    Promise.all([
      api.get<AdminOrderDetail>(`/orders/${orderId}`),
      api.get<{ data: Company[] }>('/companies?pageSize=1').then(r => r.data?.[0] ?? null).catch(() => null),
    ]).then(([o, c]) => { setOrder(o); setCompany(c) }).finally(() => setLoading(false))
  }, [orderId])

  if (loading) return <div style={{ padding: 40, fontFamily: 'system-ui', color: '#64748B' }}>Loading…</div>
  if (!order) return <div style={{ padding: 40, fontFamily: 'system-ui' }}>Order not found.</div>

  const invoices = order.invoices ?? []
  const doc = wantCredit ? invoices.find(i => i.type === 'credit_note') : invoices.find(i => i.type === 'invoice')
  const isCredit = doc?.type === 'credit_note'
  const title = isCredit ? 'CREDIT NOTE' : 'TAX INVOICE'
  const accent = isCredit ? '#DC2626' : '#0F172A'

  return (
    <div style={{ background: '#F1F5F9', minHeight: '100vh', fontFamily: 'system-ui' }}>
      <style>{`@media print { .no-print { display: none !important; } .invoice-sheet { box-shadow: none !important; margin: 0 !important; } body { background: #fff !important; } }`}</style>

      {/* Toolbar (hidden when printing) */}
      <div className="no-print" style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '14px 20px', background: '#fff', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => navigate(-1)} style={{ border: '1px solid #CBD5E1', background: '#fff', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13 }}>← Back</button>
        <div style={{ fontWeight: 700, color: '#0F172A' }}>{title} · {doc?.invoiceNumber ?? '—'}</div>
        <button onClick={() => window.print()} style={{ marginLeft: 'auto', border: 'none', background: '#1D4ED8', color: '#fff', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Print / Save as PDF</button>
      </div>

      {!doc ? (
        <div style={{ padding: 40, color: '#64748B' }}>No {isCredit ? 'credit note' : 'invoice'} has been issued for this order yet.</div>
      ) : (
        <div className="invoice-sheet" style={{ maxWidth: 780, margin: '24px auto', background: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', borderRadius: 6, padding: 48, color: '#0F172A' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `3px solid ${accent}`, paddingBottom: 20, marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{company?.name ?? 'Inkora Print'}</div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>United Arab Emirates</div>
              {company?.registrationNo && <div style={{ fontSize: 12, color: '#64748B' }}>TRN: {company.registrationNo}</div>}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: accent, letterSpacing: 1 }}>{title}</div>
              <div style={{ fontSize: 13, fontWeight: 700, marginTop: 6 }}>{doc.invoiceNumber}</div>
              <div style={{ fontSize: 12, color: '#64748B' }}>Date: {new Date(doc.issueDate).toLocaleDateString()}</div>
              <div style={{ fontSize: 12, color: '#64748B' }}>Order: {order.orderNumber}</div>
            </div>
          </div>

          {/* Bill to */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, fontSize: 13 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 4 }}>Bill To</div>
              <div style={{ fontWeight: 600 }}>{order.contactName ?? order.customer?.fullName ?? '—'}</div>
              <div style={{ color: '#64748B' }}>{order.contactEmail ?? order.customer?.email ?? ''}</div>
              <div style={{ color: '#64748B' }}>{order.contactPhone ?? order.customer?.phone ?? ''}</div>
              <div style={{ color: '#64748B', marginTop: 4 }}>{order.deliveryLine1}{order.deliveryLine2 ? `, ${order.deliveryLine2}` : ''}<br />{order.deliveryCity}, {order.deliveryEmirate}, {order.deliveryCountry ?? 'UAE'}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 4 }}>Payment</div>
              <div style={{ textTransform: 'capitalize' }}>{order.paymentMethod?.replaceAll('_', ' ') ?? '—'}</div>
              <div style={{ fontWeight: 700, textTransform: 'capitalize', color: order.paymentStatus === 'paid' ? '#059669' : '#D97706' }}>{order.paymentStatus.replaceAll('_', ' ')}</div>
            </div>
          </div>

          {/* Line items */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F8FAFC', textAlign: 'left' }}>
                <th style={{ padding: '10px 12px', fontSize: 11, color: '#64748B', textTransform: 'uppercase' }}>Description</th>
                <th style={{ padding: '10px 12px', fontSize: 11, color: '#64748B', textTransform: 'uppercase', textAlign: 'center', width: 60 }}>Qty</th>
                <th style={{ padding: '10px 12px', fontSize: 11, color: '#64748B', textTransform: 'uppercase', textAlign: 'right', width: 110 }}>Unit</th>
                <th style={{ padding: '10px 12px', fontSize: 11, color: '#64748B', textTransform: 'uppercase', textAlign: 'right', width: 120 }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid #F1F5F9', verticalAlign: 'top' }}>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ fontWeight: 600 }}>{item.productName}</div>
                    {item.fieldValues?.filter(f => f.displayValue).map(f => (
                      <div key={f.id} style={{ fontSize: 11, color: '#64748B' }}>{f.fieldLabel}: {f.displayValue}</div>
                    ))}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>{money(item.unitPrice)}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>{money(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
            <div style={{ width: 260, fontSize: 13 }}>
              <Row label="Net amount" value={money(order.subtotal)} />
              <Row label="VAT (5%)" value={money(order.vatAmount)} />
              <Row label="Delivery" value={money(order.deliveryFee)} />
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: `2px solid ${accent}`, marginTop: 4 }}>
                <strong style={{ fontSize: 15 }}>{isCredit ? 'Credit Total' : 'Total'}</strong>
                <strong style={{ fontSize: 15, color: accent }}>{isCredit ? '−' : ''}{money(doc.total)}</strong>
              </div>
            </div>
          </div>

          {isCredit && doc.notes && <div style={{ marginTop: 20, fontSize: 12, color: '#64748B' }}>Reason: {doc.notes}</div>}
          <div style={{ marginTop: 40, paddingTop: 16, borderTop: '1px solid #E2E8F0', fontSize: 11, color: '#94A3B8', textAlign: 'center' }}>
            This is a computer-generated {isCredit ? 'credit note' : 'tax invoice'} and is valid without a signature. · Prices are VAT-inclusive per UAE law.
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#475569' }}><span>{label}</span><span>{value}</span></div>
}
