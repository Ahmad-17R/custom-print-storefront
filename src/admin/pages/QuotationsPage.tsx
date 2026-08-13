import { useState } from 'react'
import { AdminLayout, Table, Btn, SearchInput, Badge, StatCard, StatGrid } from '../components/AdminLayout'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

type QStatus = 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired'

interface Quotation {
  id: string; customer: string; brand: string; items: number
  subtotal: number; vat: number; total: number
  status: QStatus; validUntil: string; createdAt: string
}

const statusColor: Record<QStatus, string> = {
  Draft:    '#64748B',
  Sent:     '#1D4ED8',
  Accepted: '#10B981',
  Rejected: '#EF4444',
  Expired:  '#F59E0B',
}

const SEED: Quotation[] = [
  { id: 'QUO-0012', customer: 'Al Noor Trading LLC',  brand: 'MyPrintingWorld', items: 3, subtotal: 2000, vat: 100, total: 2100, status: 'Sent',     validUntil: '2026-08-25', createdAt: '2026-08-10' },
  { id: 'QUO-0011', customer: 'Falcon Real Estate',   brand: 'SwiftPrint',      items: 2, subtotal: 800,  vat: 40,  total: 840,  status: 'Accepted', validUntil: '2026-08-20', createdAt: '2026-08-08' },
  { id: 'QUO-0010', customer: 'Gulf Ventures',        brand: 'MyPrintingWorld', items: 5, subtotal: 3500, vat: 175, total: 3675, status: 'Draft',    validUntil: '2026-08-30', createdAt: '2026-08-07' },
  { id: 'QUO-0009', customer: 'Horizon Consulting',   brand: 'GiftCraft UAE',   items: 1, subtotal: 950,  vat: 47,  total: 997,  status: 'Rejected', validUntil: '2026-08-15', createdAt: '2026-08-05' },
  { id: 'QUO-0008', customer: 'Dubai Flavours',       brand: 'PackEdge',        items: 4, subtotal: 5200, vat: 260, total: 5460, status: 'Expired',  validUntil: '2026-08-01', createdAt: '2026-07-28' },
  { id: 'QUO-0007', customer: 'Apex Events',          brand: 'SignCo',          items: 6, subtotal: 8400, vat: 420, total: 8820, status: 'Accepted', validUntil: '2026-08-18', createdAt: '2026-08-03' },
  { id: 'QUO-0006', customer: 'TechHub DXB',          brand: 'MyPrintingWorld', items: 2, subtotal: 1200, vat: 60,  total: 1260, status: 'Sent',     validUntil: '2026-08-28', createdAt: '2026-08-09' },
]

const STATUSES: QStatus[] = ['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired']

const COLS = [
  { key: 'id',         label: 'Quotation ID', width: 120 },
  { key: 'customer',   label: 'Customer' },
  { key: 'brand',      label: 'Brand',        width: 160 },
  { key: 'items',      label: 'Items',        width: 70 },
  { key: 'subtotal',   label: 'Subtotal',     width: 110 },
  { key: 'vat',        label: 'VAT 5%',       width: 90 },
  { key: 'total',      label: 'Total',        width: 110 },
  { key: 'status',     label: 'Status',       width: 110 },
  { key: 'validUntil', label: 'Valid Until',  width: 110 },
  { key: 'actions',    label: '',             width: 120 },
]

function Modal({ q, onClose, onSave }: { q: Partial<Quotation> | null; onClose: () => void; onSave: (q: Partial<Quotation>) => void }) {
  const [form, setForm] = useState<Partial<Quotation>>(q ?? {
    customer: '', brand: 'MyPrintingWorld', items: 1,
    subtotal: 0, vat: 0, total: 0, status: 'Draft',
    validUntil: '', createdAt: new Date().toISOString().slice(0, 10),
  })
  if (!q) return null
  const f = <K extends keyof Quotation>(k: K, v: Quotation[K]) => setForm(p => ({ ...p, [k]: v }))
  const recalc = (sub: number) => { const vat = Math.round(sub * 0.05); f('subtotal', sub); f('vat', vat); f('total', sub + vat) }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 500, fontFamily: FONT, maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: DARK }}>{form.id ? 'Edit Quotation' : 'New Quotation'}</h2>

        <label style={{ display: 'block', marginBottom: 14 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Customer *</span>
          <input value={form.customer ?? ''} onChange={e => f('customer', e.target.value)}
            style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }} />
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <label>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Brand</span>
            <select value={form.brand ?? ''} onChange={e => f('brand', e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, outline: 'none' }}>
              {['MyPrintingWorld','SwiftPrint','GiftCraft UAE','PackEdge','SignCo'].map(b => <option key={b}>{b}</option>)}
            </select>
          </label>
          <label>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Status</span>
            <select value={form.status ?? 'Draft'} onChange={e => f('status', e.target.value as QStatus)}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, outline: 'none' }}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <label>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Subtotal (AED)</span>
            <input type="number" value={form.subtotal ?? 0} onChange={e => recalc(Number(e.target.value))}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }} />
          </label>
          <label>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Valid Until</span>
            <input type="date" value={form.validUntil ?? ''} onChange={e => f('validUntil', e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }} />
          </label>
        </div>

        <div style={{ background: '#F8FAFC', borderRadius: 8, padding: '12px 14px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
          <span>VAT 5%: <strong>AED {form.vat ?? 0}</strong></span>
          <span>Total: <strong style={{ color: '#1D4ED8' }}>AED {form.total ?? 0}</strong></span>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn label="Cancel" variant="secondary" onClick={onClose} />
          <Btn label="Save Quotation" onClick={() => { onSave(form); onClose() }} />
        </div>
      </div>
    </div>
  )
}

export function QuotationsPage() {
  const [data, setData]   = useState<Quotation[]>(SEED)
  const [q, setQ]         = useState('')
  const [status, setStatus] = useState<QStatus | 'All'>('All')
  const [modal, setModal] = useState<Partial<Quotation> | null>(null)

  const filtered = data.filter(r =>
    (status === 'All' || r.status === status) &&
    (r.id.toLowerCase().includes(q.toLowerCase()) || r.customer.toLowerCase().includes(q.toLowerCase()))
  )

  const save = (form: Partial<Quotation>) => {
    if (form.id) setData(d => d.map(r => r.id === form.id ? { ...r, ...form } as Quotation : r))
    else setData(d => [{ id: `QUO-${String(d.length + 1).padStart(4,'0')}`, ...form } as Quotation, ...d])
  }

  const totalVal = data.reduce((s, r) => s + r.total, 0)
  const accepted = data.filter(r => r.status === 'Accepted').length
  const pending  = data.filter(r => r.status === 'Sent').length

  const rows = filtered.map(r => ({
    ...r,
    subtotal: `AED ${r.subtotal.toLocaleString()}`,
    vat:      `AED ${r.vat}`,
    total:    <strong>AED {r.total.toLocaleString()}</strong>,
    status:   <Badge label={r.status} color={statusColor[r.status]} />,
    actions: (
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => setModal(r)} style={{ fontSize: 12, padding: '4px 10px', border: '1px solid #E2E8F0', borderRadius: 6, background: '#fff', cursor: 'pointer', fontFamily: FONT }}>Edit</button>
        <button style={{ fontSize: 12, padding: '4px 10px', border: '1px solid #E2E8F0', borderRadius: 6, background: '#fff', cursor: 'pointer', fontFamily: FONT }}>PDF</button>
      </div>
    ),
  }))

  return (
    <AdminLayout
      title="Quotations"
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <SearchInput value={q} onChange={setQ} placeholder="Search quotations…" />
          <Btn label="+ New Quotation" onClick={() => setModal({})} />
        </div>
      }>
      <StatGrid>
        <StatCard label="Total Quoted"  value={`AED ${totalVal.toLocaleString()}`} sub="All quotations" color="#1D4ED8" />
        <StatCard label="Accepted"      value={String(accepted)} sub="Converted to orders" color="#10B981" />
        <StatCard label="Awaiting Reply" value={String(pending)} sub="Sent, no response"   color="#F59E0B" />
        <StatCard label="Total Quotes"  value={String(data.length)} sub="All time" />
      </StatGrid>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['All', ...STATUSES] as const).map(s => (
          <button key={s} onClick={() => setStatus(s)}
            style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontFamily: FONT, fontWeight: 500, cursor: 'pointer', border: '1px solid #E2E8F0', background: status === s ? DARK : '#fff', color: status === s ? '#fff' : '#64748B' }}>
            {s}
          </button>
        ))}
      </div>
      <div style={{ fontSize: 13, color: '#64748B', marginBottom: 12 }}>{filtered.length} quotations</div>
      <Table columns={COLS} rows={rows} />
      {modal !== null && <Modal q={modal} onClose={() => setModal(null)} onSave={save} />}
    </AdminLayout>
  )
}
