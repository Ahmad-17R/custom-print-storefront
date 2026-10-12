import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { api, catalogImageUrl } from '../../lib/api'
import type { AdminOrderDetail } from '../components/AdminOrderDetails'

const money = (v: string | number) => `AED ${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

interface SettingsResp { company?: { name?: string; registrationNo?: string | null }; settings?: Record<string, string> }

// Print-optimised tax invoice / credit note for online orders. Browser Print → Save as PDF.
export function InvoiceDocumentPage() {
  const { orderId } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const wantCredit = params.get('type') === 'credit_note'
  const [order, setOrder] = useState<AdminOrderDetail | null>(null)
  const [cfg, setCfg] = useState<SettingsResp | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orderId) return
    Promise.all([
      api.get<AdminOrderDetail>(`/orders/${orderId}`),
      api.get<SettingsResp>('/settings').catch(() => null),
    ]).then(([o, c]) => { setOrder(o); setCfg(c) }).finally(() => setLoading(false))
  }, [orderId])

  if (loading) return <div style={{ padding: 40, fontFamily: 'system-ui', color: '#64748B' }}>Loading…</div>
  if (!order) return <div style={{ padding: 40, fontFamily: 'system-ui' }}>Order not found.</div>

  const invoices = order.invoices ?? []
  const doc = wantCredit ? invoices.find(i => i.type === 'credit_note') : invoices.find(i => i.type === 'invoice')
  const isCredit = wantCredit && !!doc

  // Fall back to the order itself when no invoice record exists yet, so the button always prints.
  const docNumber = doc?.invoiceNumber ?? order.orderNumber.replace(/^MPW-?/, 'INV-')
  const issueDate = doc?.issueDate ?? order.createdAt
  const docTotal = Number(doc?.total ?? order.total)

  const title = isCredit ? 'CREDIT NOTE' : 'TAX INVOICE'
  const accent = isCredit ? '#DC2626' : '#0F172A'

  // Payment position
  const total = Number(order.total)
  const paid = order.paymentStatus === 'paid' ? total : Number(order.amountPaid ?? 0)
  const balance = Math.round((total - paid) * 100) / 100
  const payStatus = isCredit ? 'credited' : paid >= total && total > 0 ? 'paid' : paid > 0 ? 'partially_paid' : 'unpaid'
  const STATUS = {
    paid:           { label: 'PAID',           color: '#059669', bg: '#ECFDF5' },
    partially_paid: { label: 'PARTIALLY PAID',  color: '#B45309', bg: '#FFFBEB' },
    unpaid:         { label: 'PAYMENT DUE',      color: '#DC2626', bg: '#FEF2F2' },
    credited:       { label: 'CREDITED',         color: '#DC2626', bg: '#FEF2F2' },
  }[payStatus]

  const comp = cfg?.company
  const s = cfg?.settings ?? {}
  const companyName = comp?.name ?? 'MyPrintingWorld'
  const companyTrn = s.trn || comp?.registrationNo || ''
  const companyAddr = s.address || 'United Arab Emirates'
  const companyPhone = s.phone || ''
  const custTrn = order.customer?.trn || ''

  const payments = order.payments ?? []

  return (
    <div style={{ background: '#F1F5F9', minHeight: '100vh', fontFamily: 'system-ui' }}>
      <style>{`@media print { .no-print { display: none !important; } .invoice-sheet { box-shadow: none !important; margin: 0 !important; } body { background: #fff !important; } }`}</style>

      <div className="no-print" style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '14px 20px', background: '#fff', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => navigate(-1)} style={{ border: '1px solid #CBD5E1', background: '#fff', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13 }}>← Back</button>
        <div style={{ fontWeight: 700, color: '#0F172A' }}>{title} · {docNumber}</div>
        <button onClick={() => window.print()} style={{ marginLeft: 'auto', border: 'none', background: '#1D4ED8', color: '#fff', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Print / Save as PDF</button>
      </div>

      <div className="invoice-sheet" style={{ position: 'relative', maxWidth: 780, margin: '24px auto', background: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', borderRadius: 6, padding: 48, color: '#0F172A', overflow: 'hidden' }}>
        {/* Watermark stamp */}
        <div style={{ position: 'absolute', top: '42%', left: '50%', transform: 'translate(-50%,-50%) rotate(-18deg)', fontSize: 86, fontWeight: 800, letterSpacing: 4, color: STATUS.color, opacity: 0.08, pointerEvents: 'none', whiteSpace: 'nowrap' }}>{STATUS.label}</div>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `3px solid ${accent}`, paddingBottom: 20, marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{companyName}</div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 4, whiteSpace: 'pre-line' }}>{companyAddr}</div>
            {companyPhone && <div style={{ fontSize: 12, color: '#64748B' }}>{companyPhone}</div>}
            {companyTrn && <div style={{ fontSize: 12, color: '#0F172A', fontWeight: 600, marginTop: 2 }}>TRN: {companyTrn}</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: accent, letterSpacing: 1 }}>{title}</div>
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 6 }}>{docNumber}</div>
            <div style={{ fontSize: 12, color: '#64748B' }}>Date: {new Date(issueDate).toLocaleDateString()}</div>
            <div style={{ fontSize: 12, color: '#64748B' }}>Order: {order.orderNumber}</div>
            <div style={{ display: 'inline-block', marginTop: 8, padding: '4px 12px', borderRadius: 999, background: STATUS.bg, color: STATUS.color, fontSize: 11, fontWeight: 800, letterSpacing: 0.5 }}>{STATUS.label}</div>
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
            {custTrn && <div style={{ color: '#0F172A', fontWeight: 600, marginTop: 4 }}>TRN: {custTrn}</div>}
          </div>
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 4 }}>Payment Method</div>
              <div style={{ textTransform: 'capitalize' }}>{order.paymentMethod?.replaceAll('_', ' ') ?? '—'}</div>
            </div>
            {order.designFileUrl && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 4 }}>Artwork</div>
                <a href={catalogImageUrl(order.designFileUrl)} target="_blank" rel="noreferrer" style={{ display: 'inline-block', width: 64, height: 64, borderRadius: 6, border: '1px solid #E2E8F0', overflow: 'hidden', background: '#F8FAFC' }}>
                  {(order.designFileName ?? order.designFileUrl ?? '').toLowerCase().endsWith('.pdf')
                    ? <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#DC2626' }}>PDF</div>
                    : <img src={catalogImageUrl(order.designFileUrl)} alt="artwork" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </a>
              </div>
            )}
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

        {/* Totals + payment summary */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, marginTop: 20, flexWrap: 'wrap' }}>
          {/* Payment breakdown (left) — only meaningful on an invoice */}
          {!isCredit ? (
            <div style={{ flex: '1 1 260px', minWidth: 240 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 8 }}>Payment summary</div>
              <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
                {payments.length > 0 ? payments.map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 12px', fontSize: 12, borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ color: '#475569', textTransform: 'capitalize' }}>{new Date(p.paidAt).toLocaleDateString()} · {p.type} · {p.method.replaceAll('_', ' ')}</span>
                    <span style={{ fontWeight: 600 }}>{money(p.amount)}</span>
                  </div>
                )) : <div style={{ padding: '7px 12px', fontSize: 12, color: '#94A3B8' }}>No payments recorded yet.</div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', fontSize: 13, background: '#F8FAFC' }}>
                  <span style={{ color: '#475569' }}>Amount paid</span><span style={{ fontWeight: 700, color: '#059669' }}>{money(paid)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', fontSize: 13, background: balance > 0 ? STATUS.bg : '#ECFDF5' }}>
                  <span style={{ fontWeight: 700, color: balance > 0 ? STATUS.color : '#059669' }}>Balance due</span>
                  <span style={{ fontWeight: 800, color: balance > 0 ? STATUS.color : '#059669' }}>{money(Math.max(0, balance))}</span>
                </div>
              </div>
            </div>
          ) : <div />}

          {/* Totals (right) */}
          <div style={{ width: 260, fontSize: 13 }}>
            <Row label="Net amount" value={money(order.subtotal)} />
            <Row label="VAT (5%)" value={money(order.vatAmount)} />
            <Row label="Delivery" value={money(order.deliveryFee)} />
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: `2px solid ${accent}`, marginTop: 4 }}>
              <strong style={{ fontSize: 15 }}>{isCredit ? 'Credit Total' : 'Total'}</strong>
              <strong style={{ fontSize: 15, color: accent }}>{isCredit ? '−' : ''}{money(docTotal)}</strong>
            </div>
          </div>
        </div>

        {isCredit && doc?.notes && <div style={{ marginTop: 20, fontSize: 12, color: '#64748B' }}>Reason: {doc.notes}</div>}
        {!isCredit && balance > 0 && <div style={{ marginTop: 18, padding: '10px 14px', background: STATUS.bg, borderRadius: 8, fontSize: 12, color: STATUS.color, fontWeight: 600 }}>Balance of {money(balance)} is due. Please settle the remaining amount to complete this order.</div>}
        <div style={{ marginTop: 40, paddingTop: 16, borderTop: '1px solid #E2E8F0', fontSize: 11, color: '#94A3B8', textAlign: 'center' }}>
          This is a computer-generated {isCredit ? 'credit note' : 'tax invoice'} and is valid without a signature. · Prices are VAT-inclusive per UAE law.
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#475569' }}><span>{label}</span><span>{value}</span></div>
}
