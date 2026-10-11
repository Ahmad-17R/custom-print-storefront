import React, { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { Btn } from './AdminLayout'
import { printInvoiceById } from '../lib/invoicePrint'
import { allPhones } from './PhoneList'

const FONT  = "'Poppins', system-ui, sans-serif"
const DARK  = '#0F172A'
const GREEN = '#10B981'
const fmt = (n: number) => Number(n).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const STATUS_COLOR: Record<string, string> = {
  pending: '#94A3B8', confirmed: '#3B82F6', in_production: '#F59E0B', ready_for_pickup: '#8B5CF6', ready: '#8B5CF6',
  completed: '#10B981', delivered: '#10B981', cancelled: '#EF4444', shipped: '#06B6D4',
}

interface TimelineRow {
  kind: 'walk_in' | 'online'; id: string; number: string; status: string; date: string
  total: number; paid: number; balance: number
  items: { name: string; quantity: number; total: number }[]
  payments: { amount: number; type: string; method: string; date: string; note: string | null }[]
  invoice: { id: string; invoiceNumber: string; status: string } | null
}
interface DepositRow {
  id: string; depositNo: string; date: string; amount: number; method: string; note: string | null
  used: number; remaining: number; fromSale: string | null; appliedTo: { saleNumber: string; amount: number; date: string }[]
}
export interface CustomerHistoryData {
  customer: { type: 'walk_in' | 'online'; id: string; name: string; phone: string | null; phones: string[]; email: string | null; company: string | null; trn: string | null; since: string }
  linked: { walkInCustomerIds: string[]; onlineCustomerIds: string[] }
  summary: { orders: number; walkInOrders: number; onlineOrders: number; cancelled: number; totalSpend: number; totalPaid: number; outstanding: number; depositCredit: number; lastOrderAt: string | null }
  timeline: TimelineRow[]
  deposits: DepositRow[]
  quotations: { id: string; quoteNumber: string | null; status: string; total: number; validUntil: string | null; createdAt: string; walkInSale: { saleNumber: string } | null }[]
}

const pill = (label: string, color: string) => (
  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 999, background: color + '20', color, whiteSpace: 'nowrap' }}>{label}</span>
)

// Full history of one person: every walk-in + online order (matched by email / phone),
// what they paid, what's still due, deposits / credit and quotations.
export function CustomerHistoryPanel({ walkInCustomerId, onlineCustomerId, reloadKey = 0, onRecordDeposit }: {
  walkInCustomerId?: string; onlineCustomerId?: string; reloadKey?: number; onRecordDeposit?: () => void
}) {
  const [data, setData] = useState<CustomerHistoryData | null>(null)
  const [err, setErr]   = useState('')
  const [tab, setTab]   = useState<'orders' | 'deposits' | 'quotations'>('orders')
  const [open, setOpen] = useState<string | null>(null)

  useEffect(() => {
    setErr('')
    const url = walkInCustomerId ? `/walk-in-customers/${walkInCustomerId}/history` : `/customers/${onlineCustomerId}/history`
    api.get<CustomerHistoryData>(url).then(setData).catch(e => setErr(e.message))
  }, [walkInCustomerId, onlineCustomerId, reloadKey])

  if (err) return <div style={{ color: '#EF4444', fontSize: 13 }}>{err}</div>
  if (!data) return <div style={{ fontSize: 13, color: '#94A3B8' }}>Loading history…</div>
  const s = data.summary

  return (
    <div style={{ fontFamily: FONT }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
        {[
          { label: 'Orders', value: String(s.orders), sub: `${s.walkInOrders} walk-in · ${s.onlineOrders} online` },
          { label: 'Total spend', value: `AED ${fmt(s.totalSpend)}`, sub: s.cancelled ? `${s.cancelled} cancelled not counted` : 'excl. cancelled' },
          { label: 'Paid', value: `AED ${fmt(s.totalPaid)}`, sub: 'across live orders', color: GREEN },
          { label: 'Outstanding', value: `AED ${fmt(s.outstanding)}`, sub: 'balance due', color: s.outstanding > 0 ? '#EF4444' : DARK },
          { label: 'Deposit credit', value: `AED ${fmt(s.depositCredit)}`, sub: 'available to apply', color: s.depositCredit > 0 ? '#7C3AED' : DARK },
          { label: 'Last order', value: s.lastOrderAt ? s.lastOrderAt.slice(0, 10) : '—', sub: `customer since ${data.customer.since.slice(0, 10)}` },
        ].map(t => (
          <div key={t.label} style={{ background: '#F8FAFC', borderRadius: 8, padding: '9px 10px' }}>
            <div style={{ fontSize: 11, color: '#94A3B8' }}>{t.label}</div>
            <div style={{ fontWeight: 700, fontSize: 14, color: t.color ?? DARK }}>{t.value}</div>
            <div style={{ fontSize: 10, color: '#94A3B8' }}>{t.sub}</div>
          </div>
        ))}
      </div>
      {(data.linked.walkInCustomerIds.length + data.linked.onlineCustomerIds.length) > 1 && (
        <div style={{ fontSize: 11, color: '#64748B', background: '#EFF6FF', borderRadius: 6, padding: '6px 10px', marginBottom: 12 }}>
          Includes {data.linked.onlineCustomerIds.length} online account(s) and {data.linked.walkInCustomerIds.length} walk-in record(s) matched by email / phone.
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, marginBottom: 12, alignItems: 'center' }}>
        {(['orders', 'deposits', 'quotations'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontFamily: FONT, fontWeight: 500, cursor: 'pointer', border: '1px solid #E2E8F0', background: tab === t ? DARK : '#fff', color: tab === t ? '#fff' : '#64748B' }}>
            {t === 'orders' ? `Orders (${data.timeline.length})` : t === 'deposits' ? `Deposits (${data.deposits.length})` : `Quotations (${data.quotations.length})`}
          </button>
        ))}
        {onRecordDeposit && <div style={{ marginLeft: 'auto' }}><Btn label="+ Deposit" variant="secondary" onClick={onRecordDeposit} /></div>}
      </div>

      {tab === 'orders' && (data.timeline.length === 0
        ? <div style={{ fontSize: 13, color: '#94A3B8' }}>No orders yet</div>
        : data.timeline.map(o => (
          <div key={o.kind + o.id} style={{ border: '1px solid #F1F5F9', borderRadius: 8, marginBottom: 8, overflow: 'hidden' }}>
            <div onClick={() => setOpen(open === o.id ? null : o.id)} style={{ padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', gap: 8 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: DARK, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  {o.number} {pill(o.kind === 'online' ? 'Online' : 'Walk-in', o.kind === 'online' ? '#8B5CF6' : '#0EA5E9')}
                </div>
                <div style={{ fontSize: 12, color: '#64748B' }}>{o.date.slice(0, 10)} · {o.items.length} item{o.items.length !== 1 ? 's' : ''}{o.invoice ? ` · ${o.invoice.invoiceNumber}` : ''}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: DARK }}>AED {fmt(o.total)}</div>
                <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', marginTop: 2 }}>
                  {o.balance > 0 && pill(`Due ${fmt(o.balance)}`, '#EF4444')}
                  {pill(o.status.replace(/_/g, ' '), STATUS_COLOR[o.status] ?? '#94A3B8')}
                </div>
              </div>
            </div>
            {open === o.id && (
              <div style={{ background: '#F8FAFC', padding: '10px 12px', fontSize: 12, color: '#334155' }}>
                {o.items.map((i, idx) => <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}><span>{i.quantity} × {i.name}</span><span>AED {fmt(i.total)}</span></div>)}
                {o.payments.length > 0 && <div style={{ fontWeight: 600, marginTop: 8, marginBottom: 2 }}>Payments</div>}
                {o.payments.map((p, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                    <span>{p.date.slice(0, 10)} · {p.type} · {p.method.replace(/_/g, ' ')}{p.note ? ` · ${p.note}` : ''}</span><span style={{ color: GREEN }}>AED {fmt(p.amount)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, alignItems: 'center' }}>
                  <span>Paid <b style={{ color: GREEN }}>AED {fmt(o.paid)}</b> · Balance <b style={{ color: o.balance > 0 ? '#EF4444' : DARK }}>AED {fmt(o.balance)}</b></span>
                  {o.invoice && <button onClick={() => printInvoiceById(o.invoice!.id)} style={{ fontSize: 12, padding: '3px 10px', border: '1px solid #E2E8F0', borderRadius: 6, background: '#fff', cursor: 'pointer', fontFamily: FONT }}>Print {o.invoice.invoiceNumber}</button>}
                </div>
              </div>
            )}
          </div>
        )))}

      {tab === 'deposits' && (data.deposits.length === 0
        ? <div style={{ fontSize: 13, color: '#94A3B8' }}>No deposits</div>
        : data.deposits.map(d => (
          <div key={d.id} style={{ border: '1px solid #F1F5F9', borderRadius: 8, padding: '10px 12px', marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: DARK }}>{d.depositNo}</div>
                <div style={{ fontSize: 12, color: '#64748B' }}>{d.date.slice(0, 10)} · {d.method.replace(/_/g, ' ')}{d.fromSale ? ` · from cancelled ${d.fromSale}` : ''}</div>
                {d.note && <div style={{ fontSize: 12, color: '#64748B', fontStyle: 'italic' }}>{d.note}</div>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>AED {fmt(d.amount)}</div>
                {d.remaining > 0.004 ? pill(`AED ${fmt(d.remaining)} left`, '#7C3AED') : pill('fully used', '#94A3B8')}
              </div>
            </div>
            {d.appliedTo.map((a, i) => <div key={i} style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>→ AED {fmt(a.amount)} applied to {a.saleNumber} on {a.date.slice(0, 10)}</div>)}
          </div>
        )))}

      {tab === 'quotations' && (data.quotations.length === 0
        ? <div style={{ fontSize: 13, color: '#94A3B8' }}>No quotations</div>
        : data.quotations.map(q => (
          <div key={q.id} style={{ border: '1px solid #F1F5F9', borderRadius: 8, padding: '10px 12px', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: DARK }}>{q.quoteNumber ?? q.id.slice(0, 8).toUpperCase()}</div>
              <div style={{ fontSize: 12, color: '#64748B' }}>{q.createdAt.slice(0, 10)}{q.validUntil ? ` · valid until ${q.validUntil.slice(0, 10)}` : ''}{q.walkInSale ? ` · order ${q.walkInSale.saleNumber}` : ''}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>AED {fmt(q.total)}</div>
              {pill(q.status, q.status === 'accepted' ? GREEN : q.status === 'rejected' || q.status === 'expired' ? '#EF4444' : '#3B82F6')}
            </div>
          </div>
        )))}
    </div>
  )
}

// Side drawer wrapper (used from the "All Customers" page)
export function CustomerHistoryDrawer({ type, id, name, onClose }: { type: 'walk_in' | 'online'; id: string; name: string; onClose: () => void }) {
  const [info, setInfo] = useState<CustomerHistoryData['customer'] | null>(null)
  useEffect(() => {
    api.get<CustomerHistoryData>(type === 'walk_in' ? `/walk-in-customers/${id}/history` : `/customers/${id}/history`).then(d => setInfo(d.customer)).catch(() => {})
  }, [type, id])
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 900, display: 'flex' }} onClick={onClose}>
      <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)' }} />
      <div style={{ width: 520, maxWidth: '100vw', background: '#fff', overflowY: 'auto', padding: 24, fontFamily: FONT }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, color: DARK }}>{name}</div>
            <div style={{ fontSize: 12, color: '#64748B' }}>{type === 'online' ? 'Online account' : 'Walk-in customer'} · order history</div>
            {info && allPhones(info.phone, info.phones) && <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>📞 {allPhones(info.phone, info.phones)}</div>}
            {info?.email && <div style={{ fontSize: 13, color: '#64748B' }}>✉️ {info.email}</div>}
            {info?.trn && <div style={{ fontSize: 13, color: '#64748B' }}>TRN {info.trn}</div>}
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 22, cursor: 'pointer', color: '#94A3B8' }}>×</button>
        </div>
        <CustomerHistoryPanel walkInCustomerId={type === 'walk_in' ? id : undefined} onlineCustomerId={type === 'online' ? id : undefined} />
      </div>
    </div>
  )
}

// ── Record a deposit (customer pays now, order is decided later e.g. by phone) ──
interface CustOpt { id: string; name: string; phone: string | null }
export function RecordDepositModal({ customerId, customerName, onClose, onSaved }: {
  customerId?: string; customerName?: string; onClose: () => void; onSaved: () => void
}) {
  const [customers, setCustomers] = useState<CustOpt[]>([])
  const [mode, setMode]     = useState<'existing' | 'new'>('existing')
  const [custId, setCustId] = useState(customerId ?? '')
  const [newName, setNewName]   = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('cash')
  const [note, setNote]     = useState('')
  const [err, setErr]       = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!customerId) api.get<{ data: CustOpt[] }>('/walk-in-customers?pageSize=200').then(r => setCustomers(r.data)).catch(() => {})
  }, [customerId])

  const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }
  const lbl = (t: string) => <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>{t}</span>

  const save = async () => {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) return setErr('Enter the amount received')
    if (mode === 'existing' && !custId) return setErr('Choose the customer')
    if (mode === 'new' && !newName.trim()) return setErr('Enter the customer\'s name')
    setSaving(true); setErr('')
    try {
      await api.post('/customer-deposits', {
        ...(mode === 'existing' ? { customerId: custId } : { newCustomer: { name: newName, phone: newPhone } }),
        amount: amt, method, note,
      })
      onSaved(); onClose()
    } catch (e: any) { setErr(e.message ?? 'Error') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 26, width: 440, maxWidth: '100%', fontFamily: FONT }}>
        <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: DARK }}>Record Deposit</h3>
        <p style={{ margin: '0 0 16px', fontSize: 12, color: '#64748B' }}>Money taken before the order is finalised (e.g. the customer will confirm by phone). It is kept as customer credit and can be applied to any of their orders.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 14 }}>
          {customerId ? (
            <div style={{ fontSize: 13 }}>Customer: <b>{customerName}</b></div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['existing', 'new'] as const).map(m => (
                  <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: '6px', borderRadius: 8, fontSize: 12, fontFamily: FONT, cursor: 'pointer', border: '1px solid #E2E8F0', background: mode === m ? DARK : '#fff', color: mode === m ? '#fff' : '#64748B' }}>
                    {m === 'existing' ? 'Existing customer' : 'New customer'}
                  </button>
                ))}
              </div>
              {mode === 'existing' ? (
                <label>{lbl('Customer *')}
                  <select value={custId} onChange={e => setCustId(e.target.value)} style={inp}>
                    <option value="">— select customer —</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` · ${c.phone}` : ''}</option>)}
                  </select>
                </label>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <label>{lbl('Name *')}<input value={newName} onChange={e => setNewName(e.target.value)} style={inp} /></label>
                  <label>{lbl('Phone')}<input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="+971 …" style={inp} /></label>
                </div>
              )}
            </>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label>{lbl('Amount (AED) *')}<input type="number" min={0} step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="200.00" style={inp} /></label>
            <label>{lbl('Method')}
              <select value={method} onChange={e => setMethod(e.target.value)} style={inp}>
                <option value="cash">Cash</option><option value="card">Card</option><option value="bank_transfer">Bank Transfer</option>
              </select>
            </label>
          </div>
          <label>{lbl('Note')}<input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. 500 business cards, will call to confirm design" style={inp} /></label>
        </div>
        {err && <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 10 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn label="Cancel" variant="secondary" onClick={onClose} />
          <Btn label={saving ? 'Saving…' : 'Record Deposit'} onClick={save} />
        </div>
      </div>
    </div>
  )
}
