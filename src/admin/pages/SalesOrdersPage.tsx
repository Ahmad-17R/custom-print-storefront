import { useState } from 'react'
import { AdminLayout, Table, Btn, SearchInput, Badge, StatCard, StatGrid } from '../components/AdminLayout'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

type SOStatus = 'Draft' | 'Confirmed' | 'Partially Delivered' | 'Delivered' | 'Invoiced' | 'Cancelled'

interface SalesOrder {
  id: string; customer: string; quotationId?: string
  subtotal: number; vat: number; total: number
  status: SOStatus; createdAt: string
}

const statusColor: Record<SOStatus, string> = {
  'Draft':               '#64748B',
  'Confirmed':           '#1D4ED8',
  'Partially Delivered': '#8B5CF6',
  'Delivered':           '#10B981',
  'Invoiced':            '#10B981',
  'Cancelled':           '#EF4444',
}

const SEED: SalesOrder[] = [
  { id: 'SO-0021', customer: 'Al Noor Trading LLC', quotationId: 'QUO-0011', subtotal: 800,  vat: 40,  total: 840,  status: 'Invoiced',            createdAt: '2026-08-08' },
  { id: 'SO-0020', customer: 'Apex Events',         quotationId: 'QUO-0007', subtotal: 8400, vat: 420, total: 8820, status: 'Partially Delivered',  createdAt: '2026-08-03' },
  { id: 'SO-0019', customer: 'Gulf Ventures',                                subtotal: 1200, vat: 60,  total: 1260, status: 'Confirmed',            createdAt: '2026-08-06' },
  { id: 'SO-0018', customer: 'TechHub DXB',                                  subtotal: 4750, vat: 237, total: 4987, status: 'Delivered',            createdAt: '2026-08-01' },
  { id: 'SO-0017', customer: 'Pearl Hospitality',                            subtotal: 9000, vat: 450, total: 9450, status: 'Confirmed',            createdAt: '2026-07-30' },
  { id: 'SO-0016', customer: 'Desert Rose Café',                             subtotal: 550,  vat: 27,  total: 577,  status: 'Invoiced',            createdAt: '2026-07-28' },
  { id: 'SO-0015', customer: 'SkyLine Properties',                           subtotal: 245,  vat: 12,  total: 257,  status: 'Cancelled',           createdAt: '2026-07-25' },
]

const STATUSES: SOStatus[] = ['Draft','Confirmed','Partially Delivered','Delivered','Invoiced','Cancelled']

const COLS = [
  { key: 'id',          label: 'SO Number',   width: 110 },
  { key: 'customer',    label: 'Customer' },
  { key: 'quotationId', label: 'From Quote',  width: 120 },
  { key: 'subtotal',    label: 'Subtotal',    width: 110 },
  { key: 'vat',         label: 'VAT',         width: 80 },
  { key: 'total',       label: 'Total',       width: 110 },
  { key: 'status',      label: 'Status',      width: 170 },
  { key: 'createdAt',   label: 'Date',        width: 110 },
  { key: 'actions',     label: '',            width: 80 },
]

function Modal({ so, onClose, onSave }: { so: Partial<SalesOrder> | null; onClose: () => void; onSave: (s: Partial<SalesOrder>) => void }) {
  const [form, setForm] = useState<Partial<SalesOrder>>(so ?? { customer: '', subtotal: 0, vat: 0, total: 0, status: 'Draft', createdAt: new Date().toISOString().slice(0,10) })
  if (!so) return null
  const f = <K extends keyof SalesOrder>(k: K, v: SalesOrder[K]) => setForm(p => ({ ...p, [k]: v }))
  const recalc = (sub: number) => { const vat = Math.round(sub * 0.05); f('subtotal', sub); f('vat', vat); f('total', sub + vat) }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 480, fontFamily: FONT, maxWidth: "calc(100vw - 32px)", boxSizing: "border-box" as const, maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: DARK }}>{form.id ? 'Edit Sales Order' : 'New Sales Order'}</h2>
        <label style={{ display: 'block', marginBottom: 14 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Customer *</span>
          <input value={form.customer ?? ''} onChange={e => f('customer', e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }} />
        </label>
        <label style={{ display: 'block', marginBottom: 14 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>From Quotation (optional)</span>
          <input value={form.quotationId ?? ''} onChange={e => f('quotationId', e.target.value)} placeholder="QUO-0000" style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }} />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <label>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Subtotal (AED)</span>
            <input type="number" value={form.subtotal ?? 0} onChange={e => recalc(Number(e.target.value))} style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }} />
          </label>
          <label>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Status</span>
            <select value={form.status ?? 'Draft'} onChange={e => f('status', e.target.value as SOStatus)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, outline: 'none' }}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </label>
        </div>
        <div style={{ background: '#F8FAFC', borderRadius: 8, padding: '12px 14px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
          <span>VAT 5%: <strong>AED {form.vat ?? 0}</strong></span>
          <span>Total: <strong style={{ color: '#1D4ED8' }}>AED {form.total ?? 0}</strong></span>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn label="Cancel" variant="secondary" onClick={onClose} />
          <Btn label="Save" onClick={() => { onSave(form); onClose() }} />
        </div>
      </div>
    </div>
  )
}

export function SalesOrdersPage() {
  const [data, setData]     = useState<SalesOrder[]>(SEED)
  const [q, setQ]           = useState('')
  const [status, setStatus] = useState<SOStatus | 'All'>('All')
  const [modal, setModal]   = useState<Partial<SalesOrder> | null>(null)

  const filtered = data.filter(r =>
    (status === 'All' || r.status === status) &&
    (r.id.toLowerCase().includes(q.toLowerCase()) || r.customer.toLowerCase().includes(q.toLowerCase()))
  )
  const save = (form: Partial<SalesOrder>) => {
    if (form.id) setData(d => d.map(r => r.id === form.id ? { ...r, ...form } as SalesOrder : r))
    else setData(d => [{ id: `SO-${String(d.length + 21).padStart(4,'0')}`, ...form } as SalesOrder, ...d])
  }

  const rows = filtered.map(r => ({
    ...r,
    quotationId: r.quotationId ?? '—',
    subtotal: `AED ${r.subtotal.toLocaleString()}`,
    vat:      `AED ${r.vat}`,
    total:    <strong>AED {r.total.toLocaleString()}</strong>,
    status:   <Badge label={r.status} color={statusColor[r.status]} />,
    actions:  <button onClick={() => setModal(r)} style={{ fontSize: 12, padding: '4px 10px', border: '1px solid #E2E8F0', borderRadius: 6, background: '#fff', cursor: 'pointer', fontFamily: FONT }}>Edit</button>,
  }))

  return (
    <AdminLayout title="Sales Orders"
      actions={<div style={{ display: 'flex', gap: 8 }}><SearchInput value={q} onChange={setQ} placeholder="Search orders…" /><Btn label="+ New SO" onClick={() => setModal({})} /></div>}>
      <StatGrid>
        <StatCard label="Total Value"  value={`AED ${data.reduce((s,r)=>s+r.total,0).toLocaleString()}`} sub="All sales orders" color="#1D4ED8" />
        <StatCard label="Confirmed"    value={String(data.filter(r=>r.status==='Confirmed').length)}    sub="Awaiting delivery" color="#F59E0B" />
        <StatCard label="Delivered"    value={String(data.filter(r=>['Delivered','Invoiced'].includes(r.status)).length)} sub="Fulfilled" color="#10B981" />
        <StatCard label="Cancelled"    value={String(data.filter(r=>r.status==='Cancelled').length)}    sub="Lost revenue" color="#EF4444" />
      </StatGrid>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['All',...STATUSES] as const).map(s => (
          <button key={s} onClick={() => setStatus(s)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontFamily: FONT, fontWeight: 500, cursor: 'pointer', border: '1px solid #E2E8F0', background: status===s ? DARK : '#fff', color: status===s ? '#fff' : '#64748B' }}>{s}</button>
        ))}
      </div>
      <div style={{ fontSize: 13, color: '#64748B', marginBottom: 12 }}>{filtered.length} sales orders</div>
      <Table columns={COLS} rows={rows} />
      {modal !== null && <Modal so={modal} onClose={() => setModal(null)} onSave={save} />}
    </AdminLayout>
  )
}
