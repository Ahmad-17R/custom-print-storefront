import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminLayout, Table, Btn, SearchInput, Badge, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'
import { addDays, today } from '../lib/date'
import { applyVat, useCustomerPricing, useVatConfig, vatLabel } from '../lib/tax'
import { printDocument } from '../lib/printDoc'
import { DEFAULT_ISSUER } from '../lib/invoicePrint'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

type QuotationStatus = 'requested' | 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
interface Product { id: string; name: string; basePrice?: string | number | null }
interface CustOpt { id: string; name: string; phone: string | null; company?: string | null }
interface QuoteItem { id?: string; productId: string; productName?: string | null; description: string | null; quantity: number; unitPrice: string | number; total?: string | number }
interface Quotation {
  id: string; quoteNumber: string | null; status: QuotationStatus; validUntil: string | null
  subtotal: string; vatAmount: string; total: string; notes: string | null; requestNote?: string | null; createdAt: string; createdBy: string | null
  customer: { id: string; fullName: string | null; email: string } | null
  walkInCustomer: { id: string; name: string; phone: string | null; company: string | null; email?: string | null; trn?: string | null } | null
  walkInSale: { id: string; saleNumber: string; status: string } | null
  items?: QuoteItem[]
  _count?: { items: number }
}

const STATUS_LABEL: Record<QuotationStatus, string> = { requested: 'Requested online', draft: 'Draft', sent: 'Sent', accepted: 'Accepted', rejected: 'Rejected', expired: 'Expired' }
const STATUS_COLOR: Record<QuotationStatus, string> = { requested: '#7C3AED', draft: '#64748B', sent: '#1D4ED8', accepted: '#10B981', rejected: '#EF4444', expired: '#F59E0B' }
const COLS = [
  { key: 'id', label: 'Quote #', width: 130 }, { key: 'customer', label: 'Customer' },
  { key: 'items', label: 'Lines', width: 60 }, { key: 'total', label: 'Total', width: 120 },
  { key: 'status', label: 'Status', width: 110 }, { key: 'validUntil', label: 'Valid Until', width: 105 },
  { key: 'order', label: 'Order', width: 120 }, { key: 'actions', label: '', width: 220 },
]

const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }
const lbl = (t: string) => <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>{t}</span>
const money = (n: number | string) => Number(n).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const qNo = (q: Quotation) => q.quoteNumber ?? q.id.slice(0, 8).toUpperCase()
const custName = (q: Quotation) => q.walkInCustomer?.name ?? q.customer?.fullName ?? q.customer?.email ?? '—'

// ── Create / edit ─────────────────────────────────────────────────────────────
function QuoteModal({ products, customers, editing, onClose, onSaved }: {
  products: Product[]; customers: CustOpt[]; editing: Quotation | null; onClose: () => void; onSaved: () => void
}) {
  const [mode, setMode]       = useState<'existing' | 'new'>('existing')
  const [custId, setCustId]   = useState(editing?.walkInCustomer?.id ?? '')
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [validUntil, setValid] = useState(editing?.validUntil?.slice(0, 10) ?? addDays(15))
  const [notes, setNotes]     = useState(editing?.notes ?? '')
  const [lines, setLines]     = useState(editing?.items?.map(i => ({ productId: i.productId, quantity: String(i.quantity), unitPrice: String(Number(i.unitPrice)), description: i.description ?? '' }))
    ?? [{ productId: products[0]?.id ?? '', quantity: '1', unitPrice: products[0]?.basePrice ? String(Number(products[0].basePrice)) : '', description: '' }])
  const [err, setErr] = useState('')
  const [saving, setSaving] = useState(false)

  const vatCfg  = useVatConfig()
  // Existing customer → their customer-type rates; new customer → catalogue prices
  const pricing = useCustomerPricing(editing ? editing.walkInCustomer?.id : (mode === 'existing' ? custId || null : null))
  useEffect(() => {
    if (!pricing || editing) return
    setLines(p => p.map(l => l.productId && pricing.prices[l.productId] ? { ...l, unitPrice: String(pricing.prices[l.productId].price) } : l))
  }, [pricing])
  const setLine = (i: number, k: string, v: string) => setLines(p => p.map((l, idx) => {
    if (idx !== i) return l
    const next = { ...l, [k]: v }
    // Picking a product pre-fills its catalogue price (still editable for special rates)
    if (k === 'productId') {
      const rate = pricing?.prices[v]?.price ?? Number(products.find(p => p.id === v)?.basePrice ?? 0)
      if (rate) next.unitPrice = String(rate)
    }
    return next
  }))
  const linesTotal = lines.reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0), 0)
  const treatment = pricing?.vatTreatment ?? 'standard'
  const priced = applyVat(linesTotal, vatCfg, treatment)

  const save = async (send: boolean) => {
    const items = lines.filter(l => l.productId).map(l => ({ productId: l.productId, quantity: Number(l.quantity), unitPrice: Number(l.unitPrice), description: l.description || null }))
    if (!items.length) return setErr('Add at least one product')
    if (items.some(i => !(i.quantity > 0) || !(i.unitPrice > 0))) return setErr('Every line needs a quantity and a price')
    if (!editing && mode === 'existing' && !custId) return setErr('Choose the customer')
    if (!editing && mode === 'new' && !newName.trim()) return setErr('Enter the customer\'s name')
    setSaving(true); setErr('')
    try {
      let id = editing?.id
      if (editing) await api.patch(`/quotations/${editing.id}`, { validUntil: validUntil || null, notes, items })
      else id = (await api.post<Quotation>('/quotations', {
        ...(mode === 'existing' ? { walkInCustomerId: custId } : { newCustomer: { name: newName, phone: newPhone } }),
        validUntil: validUntil || null, notes, items,
      })).id
      if (send && id && editing?.status !== 'sent') await api.patch(`/quotations/${id}/status`, { status: 'sent' })
      onSaved(); onClose()
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Error') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', overflowY: 'auto' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 760, maxWidth: '100%', fontFamily: FONT }}>
        <h2 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: DARK }}>{editing ? `Edit ${qNo(editing)}` : 'New Quotation'}</h2>
        <p style={{ margin: '0 0 18px', fontSize: 13, color: '#64748B' }}>Prices are VAT-inclusive, like walk-in sales. Once the customer accepts, convert it into a walk-in order in one click.</p>

        {editing ? (
          <div style={{ fontSize: 13, marginBottom: 14 }}>Customer: <b>{custName(editing)}</b>{editing.customer && !editing.walkInCustomer && <span style={{ color: '#7C3AED' }}> (online account)</span>}
            {editing.requestNote && <div style={{ marginTop: 8, padding: '8px 12px', background: '#F5F3FF', borderRadius: 8, color: '#5B21B6' }}>Customer's request: “{editing.requestNote}”</div>}
            {editing.status === 'requested' && <div style={{ marginTop: 6, fontSize: 12, color: '#64748B' }}>Set a price on every line, save, then press “Sent” — the customer accepts or rejects it in their portal.</div>}
          </div>
        ) : (
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10, maxWidth: 360 }}>
              {(['existing', 'new'] as const).map(m => (
                <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: '6px', borderRadius: 8, fontSize: 12, fontFamily: FONT, cursor: 'pointer', border: '1px solid #E2E8F0', background: mode === m ? DARK : '#fff', color: mode === m ? '#fff' : '#64748B' }}>
                  {m === 'existing' ? 'Existing customer' : 'New customer'}
                </button>
              ))}
            </div>
            {mode === 'existing' ? (
              <select value={custId} onChange={e => setCustId(e.target.value)} style={inp}>
                <option value="">— select customer —</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}{c.phone ? ` · ${c.phone}` : ''}</option>)}
              </select>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <label>{lbl('Name *')}<input value={newName} onChange={e => setNewName(e.target.value)} style={inp} /></label>
                <label>{lbl('Phone')}<input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="+971 …" style={inp} /></label>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 14, marginBottom: 16 }}>
          <label>{lbl('Valid Until')}<input type="date" value={validUntil} min={today()} onChange={e => setValid(e.target.value)} style={inp} /></label>
          <label>{lbl('Notes / terms')}<input value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. 50% advance, delivery in 3 working days" style={inp} /></label>
        </div>

        <div style={{ background: '#F8FAFC', borderRadius: 8, padding: 12, border: '1px solid #E2E8F0', marginBottom: 12, overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.6fr 80px 110px 100px 28px', gap: 8, marginBottom: 8, minWidth: 640 }}>
            {['Product', 'Specification', 'Qty', 'Unit (AED)', 'Line total', ''].map(h => <span key={h} style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>{h}</span>)}
          </div>
          {lines.map((l, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.6fr 80px 110px 100px 28px', gap: 8, marginBottom: 6, alignItems: 'center', minWidth: 640 }}>
              <select value={l.productId} onChange={e => setLine(i, 'productId', e.target.value)} style={inp}>
                <option value="">— product —</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input value={l.description} onChange={e => setLine(i, 'description', e.target.value)} placeholder="size, paper, finish…" style={inp} />
              <input type="number" min={1} value={l.quantity} onChange={e => setLine(i, 'quantity', e.target.value)} style={inp} />
              <input type="number" min={0} step="0.01" value={l.unitPrice} onChange={e => setLine(i, 'unitPrice', e.target.value)} style={inp} />
              <span style={{ fontSize: 13, fontWeight: 600, textAlign: 'right' }}>{money((Number(l.quantity) || 0) * (Number(l.unitPrice) || 0))}</span>
              <button onClick={() => setLines(p => p.filter((_, idx) => idx !== i))} style={{ border: 'none', background: 'transparent', color: '#EF4444', fontSize: 18, cursor: 'pointer', padding: 0 }}>×</button>
            </div>
          ))}
          <button onClick={() => setLines(p => [...p, { productId: '', quantity: '1', unitPrice: '', description: '' }])} style={{ marginTop: 4, background: 'none', border: '1px dashed #CBD5E1', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 12, color: '#64748B', fontFamily: FONT }}>+ Add Line</button>
        </div>
        <div style={{ textAlign: 'right', fontSize: 12, color: '#64748B' }}>Net AED {money(priced.net)} · {vatLabel(vatCfg, treatment)} AED {money(priced.vat)}</div>
        {pricing?.group && <div style={{ textAlign: 'right', fontSize: 11, color: '#047857' }}>{pricing.group.name} rates applied{pricing.group.discountPercent > 0 ? ` (${pricing.group.discountPercent}% off)` : ''}</div>}
        <div style={{ textAlign: 'right', fontSize: 15, fontWeight: 700, color: DARK, marginBottom: 14 }}>Total: AED {money(priced.total)}</div>

        {err && <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 12 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn label="Cancel" variant="secondary" onClick={onClose} />
          <Btn label={saving ? 'Saving…' : 'Save Draft'} variant="secondary" onClick={() => save(false)} />
          <Btn label={saving ? 'Saving…' : editing?.status === 'sent' ? 'Save' : 'Save & Mark Sent'} onClick={() => save(true)} />
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function QuotationsPage() {
  const navigate = useNavigate()
  const [data, setData]           = useState<Quotation[]>([])
  const [products, setProducts]   = useState<Product[]>([])
  const [customers, setCustomers] = useState<CustOpt[]>([])
  const [loading, setLoading]     = useState(true)
  const [q, setQ]                 = useState('')
  const [statusFilter, setFilter] = useState<QuotationStatus | 'all'>('all')
  const [modal, setModal]         = useState<{ editing: Quotation | null } | null>(null)
  const [busy, setBusy]           = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [res, p, c] = await Promise.all([
        api.get<{ data: Quotation[] }>('/quotations?pageSize=500'),
        api.get<{ data: Product[] }>('/products?pageSize=500&isActive=true'),
        api.get<{ data: CustOpt[] }>('/walk-in-customers?pageSize=200'),
      ])
      setData(res.data); setProducts(p.data); setCustomers(c.data)
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const full = (id: string) => api.get<Quotation>(`/quotations/${id}`)

  const setStatus = async (row: Quotation, status: QuotationStatus, label: string) => {
    let validUntil: string | undefined
    if (row.status === 'expired' && status === 'draft') {
      const v = window.prompt('New "valid until" date (YYYY-MM-DD):', addDays(15))
      if (!v) return
      validUntil = v
    } else if (!window.confirm(`${label} ${qNo(row)}?`)) return
    setBusy(row.id)
    try { await api.patch(`/quotations/${row.id}/status`, { status, validUntil }); load() }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Error') }
    finally { setBusy(null) }
  }

  const convert = async (row: Quotation) => {
    if (!window.confirm(`Customer accepted ${qNo(row)}?\nThis creates a walk-in order for ${custName(row)} with the quoted items and prices (AED ${money(row.total)}).`)) return
    setBusy(row.id)
    try {
      const r = await api.post<{ sale: { saleNumber: string } }>(`/quotations/${row.id}/convert`, {})
      await load()
      if (window.confirm(`Order ${r.sale.saleNumber} created. Open Walk-in Sales?`)) navigate('/admin/walk-in-sales')
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Error') }
    finally { setBusy(null) }
  }

  const remove = async (row: Quotation) => {
    if (!window.confirm(`Delete draft ${qNo(row)}?`)) return
    try { await api.delete(`/quotations/${row.id}`); load() } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Error') }
  }

  const print = async (row: Quotation) => {
    const win = window.open('', '_blank', 'width=900,height=1000')
    try {
      const [qq, st] = await Promise.all([full(row.id), api.get<{ company: { name: string } | null; settings: Record<string, string> }>('/settings')])
      const total = Number(qq.total), vat = Number(qq.vatAmount), sub = Number(qq.subtotal)
      printDocument({
        heading: 'QUOTATION', number: qNo(qq),
        meta: qq.createdBy ? [['Prepared by', qq.createdBy]] : [],
        date: qq.createdAt.slice(0, 10),
        dueDate: qq.validUntil ? qq.validUntil.slice(0, 10) : null,
        customerId: qq.walkInCustomer?.id ? qq.walkInCustomer.id.slice(0, 8).toUpperCase() : null,
        issuer: { name: st.settings.invoiceIssuerName?.trim() || DEFAULT_ISSUER, trn: st.settings.vatNumber, address: st.settings.address, extra: [st.settings.phone, st.settings.supportEmail].filter(Boolean).join(' · ') || null },
        party: { label: 'Quotation for', name: custName(qq), phone: qq.walkInCustomer?.phone, email: qq.walkInCustomer?.email ?? qq.customer?.email, trn: qq.walkInCustomer?.trn },
        lines: (qq.items ?? []).map(i => ({ description: i.description ? `${i.productName ?? ''} — ${i.description}` : (i.productName ?? 'Item'), quantity: i.quantity, unitPrice: Number(i.unitPrice), total: Number(i.total ?? 0) })),
        subtotal: sub, vat, total, vatRateLabel: sub > 0 ? `${Math.round((vat / sub) * 100)}%` : undefined,
        notes: qq.notes,
        footer: `Quotation valid${qq.validUntil ? ` until ${qq.validUntil.slice(0, 10)}` : ''}. This is not a tax invoice.`,
        stamp: qq.status === 'expired' ? 'EXPIRED' : qq.status === 'rejected' ? 'REJECTED' : null,
      }, win)
    } catch (e: unknown) { win?.close(); alert(e instanceof Error ? e.message : 'Error') }
  }

  const filtered = data.filter(r =>
    (statusFilter === 'all' || r.status === statusFilter) &&
    (custName(r).toLowerCase().includes(q.toLowerCase()) || qNo(r).toLowerCase().includes(q.toLowerCase()) ||
     (r.walkInCustomer?.phone ?? '').includes(q))
  )

  const b: React.CSSProperties = { fontSize: 11, padding: '3px 8px', borderRadius: 5, cursor: 'pointer', fontFamily: FONT, border: '1px solid #E2E8F0', background: '#fff' }
  const rows = filtered.map(r => ({
    id:         <span style={{ fontFamily: 'ui-monospace, monospace', whiteSpace: 'nowrap', fontWeight: 600, fontSize: 12 }}>{qNo(r)}</span>,
    customer:   <div><div style={{ fontWeight: 600 }}>{custName(r)}{r.customer && !r.walkInCustomer && <span style={{ fontSize: 10, color: '#7C3AED', marginLeft: 6 }}>ONLINE</span>}</div>{r.walkInCustomer?.phone && <div style={{ fontSize: 11, color: '#64748B' }}>{r.walkInCustomer.phone}</div>}</div>,
    items:      r._count?.items ?? 0,
    total:      <strong>AED {money(r.total)}</strong>,
    status:     <Badge label={STATUS_LABEL[r.status] ?? r.status} color={STATUS_COLOR[r.status] ?? '#64748B'} />,
    validUntil: r.validUntil ? r.validUntil.slice(0, 10) : '—',
    order:      r.walkInSale ? <span style={{ fontSize: 12, color: '#10B981', fontWeight: 600 }}>{r.walkInSale.saleNumber}</span> : <span style={{ color: '#CBD5E1' }}>—</span>,
    actions: (
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        <button onClick={() => print(r)} style={b}>Print</button>
        {['requested', 'draft', 'sent'].includes(r.status) && <button onClick={async () => setModal({ editing: await full(r.id) })} style={b}>{r.status === 'requested' ? 'Price it' : 'Edit'}</button>}
        {['requested', 'draft'].includes(r.status) && <button disabled={busy === r.id} onClick={() => setStatus(r, 'sent', 'Mark as sent')} style={{ ...b, color: '#1D4ED8', borderColor: '#BFDBFE' }}>Sent</button>}
        {['draft', 'sent', 'accepted'].includes(r.status) && (r.walkInCustomer || r.customer) && !r.walkInSale && Number(r.total) > 0 && <button disabled={busy === r.id} onClick={() => convert(r)} style={{ ...b, color: '#fff', background: '#10B981', borderColor: '#10B981' }}>Accept → Order</button>}
        {['requested', 'draft', 'sent'].includes(r.status) && <button disabled={busy === r.id} onClick={() => setStatus(r, 'rejected', 'Mark as rejected')} style={{ ...b, color: '#EF4444', borderColor: '#FECACA' }}>Rejected</button>}
        {['expired', 'rejected'].includes(r.status) && <button disabled={busy === r.id} onClick={() => setStatus(r, 'draft', 'Re-open')} style={b}>Re-open</button>}
        {r.status === 'draft' && <button onClick={() => remove(r)} style={{ ...b, color: '#94A3B8' }}>Delete</button>}
      </div>
    ),
  }))

  const statuses: QuotationStatus[] = ['requested', 'draft', 'sent', 'accepted', 'rejected', 'expired']
  const open = data.filter(r => ['requested', 'draft', 'sent'].includes(r.status))
  const won  = data.filter(r => r.status === 'accepted')

  return (
    <AdminLayout title="Quotations" actions={<div style={{ display: 'flex', gap: 8 }}><SearchInput value={q} onChange={setQ} placeholder="Search customer, quote #…" /><Btn label="+ New Quotation" onClick={() => setModal({ editing: null })} /></div>}>
      <StatGrid>
        <StatCard label="Open Value"   value={`AED ${money(open.reduce((s, r) => s + Number(r.total), 0))}`} sub={`${open.length} draft / sent`} color="#1D4ED8" />
        <StatCard label="Sent"         value={String(data.filter(r => r.status === 'sent').length)}     sub="Awaiting response" color="#8B5CF6" />
        <StatCard label="Accepted"     value={String(won.length)} sub={`AED ${money(won.reduce((s, r) => s + Number(r.total), 0))} won`} color="#10B981" />
        <StatCard label="Lost / Expired" value={String(data.filter(r => ['rejected', 'expired'].includes(r.status)).length)} sub="Rejected or lapsed" color="#EF4444" />
      </StatGrid>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['all', ...statuses] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontFamily: FONT, fontWeight: 500, cursor: 'pointer', border: '1px solid #E2E8F0', background: statusFilter === s ? DARK : '#fff', color: statusFilter === s ? '#fff' : '#64748B' }}>
            {s === 'all' ? 'All' : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT, fontSize: 14 }}>Loading…</div>
      ) : data.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#94A3B8', fontFamily: FONT, fontSize: 14 }}>No quotations yet.<div style={{ marginTop: 16 }}><Btn label="+ New Quotation" onClick={() => setModal({ editing: null })} /></div></div>
      ) : (
        <>
          <div style={{ fontSize: 13, color: '#64748B', marginBottom: 12, fontFamily: FONT }}>{filtered.length} quotations</div>
          <Table columns={COLS} rows={rows} />
        </>
      )}
      {modal && <QuoteModal products={products} customers={customers} editing={modal.editing} onClose={() => setModal(null)} onSaved={load} />}
    </AdminLayout>
  )
}
