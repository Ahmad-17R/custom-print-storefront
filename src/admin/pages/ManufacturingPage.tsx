import { useState } from 'react'
import { AdminLayout, Table, Btn, SearchInput, Badge, StatCard, StatGrid } from '../components/AdminLayout'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

type MOStatus = 'Draft' | 'Scheduled' | 'In Progress' | 'Done' | 'Cancelled'

interface ManufacturingOrder {
  id: string; product: string; qty: number; warehouse: string
  status: MOStatus; scheduledDate: string; completedDate?: string
}

const statusColor: Record<MOStatus, string> = {
  Draft:       '#64748B',
  Scheduled:   '#1D4ED8',
  'In Progress':'#F59E0B',
  Done:        '#10B981',
  Cancelled:   '#EF4444',
}

const SEED: ManufacturingOrder[] = [
  { id: 'MO-0012', product: 'Business Cards (Box 500)',    qty: 200, warehouse: 'Main Warehouse', status: 'Done',        scheduledDate: '2026-08-05', completedDate: '2026-08-05' },
  { id: 'MO-0013', product: 'Roll-Up Banners 85×200',     qty: 50,  warehouse: 'Main Warehouse', status: 'Done',        scheduledDate: '2026-08-07', completedDate: '2026-08-07' },
  { id: 'MO-0014', product: 'Custom T-Shirts (Bulk)',      qty: 300, warehouse: 'Al Quoz Store',  status: 'In Progress', scheduledDate: '2026-08-11' },
  { id: 'MO-0015', product: 'Branded Notebooks A5',       qty: 100, warehouse: 'Main Warehouse', status: 'Scheduled',   scheduledDate: '2026-08-14' },
  { id: 'MO-0016', product: 'Sticker Sheets (SRA3)',       qty: 500, warehouse: 'Main Warehouse', status: 'Scheduled',   scheduledDate: '2026-08-15' },
  { id: 'MO-0017', product: 'Acrylic Signs 60×90',        qty: 20,  warehouse: 'Al Quoz Store',  status: 'Draft',       scheduledDate: '2026-08-18' },
]

const STATUSES: MOStatus[] = ['Draft','Scheduled','In Progress','Done','Cancelled']
const COLS = [
  { key: 'id',            label: 'MO #',        width: 100 },
  { key: 'product',       label: 'Product' },
  { key: 'qty',           label: 'Qty',          width: 70  },
  { key: 'warehouse',     label: 'Warehouse',    width: 150 },
  { key: 'status',        label: 'Status',       width: 130 },
  { key: 'scheduledDate', label: 'Scheduled',    width: 110 },
  { key: 'completedDate', label: 'Completed',    width: 110 },
  { key: 'actions',       label: '',             width: 80  },
]

function Modal({ mo, onClose, onSave }: { mo: Partial<ManufacturingOrder> | null; onClose: () => void; onSave: (m: Partial<ManufacturingOrder>) => void }) {
  const [form, setForm] = useState<Partial<ManufacturingOrder>>(mo ?? { product: '', qty: 1, warehouse: 'Main Warehouse', status: 'Draft', scheduledDate: '' })
  if (!mo) return null
  const f = <K extends keyof ManufacturingOrder>(k: K, v: ManufacturingOrder[K]) => setForm(p => ({ ...p, [k]: v }))
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 460, fontFamily: FONT }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: DARK }}>{form.id ? 'Edit MO' : 'New Manufacturing Order'}</h2>
        <label style={{ display: 'block', marginBottom: 14 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Product *</span>
          <input value={form.product ?? ''} onChange={e => f('product', e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }} />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <label>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Quantity</span>
            <input type="number" value={form.qty ?? 1} onChange={e => f('qty', Number(e.target.value))} style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }} />
          </label>
          <label>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Status</span>
            <select value={form.status ?? 'Draft'} onChange={e => f('status', e.target.value as MOStatus)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, outline: 'none' }}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </label>
          <label>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Warehouse</span>
            <select value={form.warehouse ?? 'Main Warehouse'} onChange={e => f('warehouse', e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, outline: 'none' }}>
              {['Main Warehouse','Al Quoz Store','Sharjah Hub'].map(w => <option key={w}>{w}</option>)}
            </select>
          </label>
          <label>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Scheduled Date</span>
            <input type="date" value={form.scheduledDate ?? ''} onChange={e => f('scheduledDate', e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }} />
          </label>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <Btn label="Cancel" variant="secondary" onClick={onClose} />
          <Btn label="Save MO" onClick={() => { onSave(form); onClose() }} />
        </div>
      </div>
    </div>
  )
}

export function ManufacturingPage() {
  const [data, setData]   = useState<ManufacturingOrder[]>(SEED)
  const [q, setQ]         = useState('')
  const [status, setStatus] = useState<MOStatus | 'All'>('All')
  const [modal, setModal] = useState<Partial<ManufacturingOrder> | null>(null)

  const filtered = data.filter(m =>
    (status === 'All' || m.status === status) &&
    m.product.toLowerCase().includes(q.toLowerCase())
  )

  const save = (form: Partial<ManufacturingOrder>) => {
    const n = data.length + 1
    if (form.id) setData(d => d.map(m => m.id === form.id ? { ...m, ...form } as ManufacturingOrder : m))
    else setData(d => [...d, { id: `MO-${String(n + 11).padStart(4,'0')}`, ...form } as ManufacturingOrder])
  }

  const rows = filtered.map(m => ({
    ...m,
    completedDate: m.completedDate ?? '—',
    status: <Badge label={m.status} color={statusColor[m.status]} />,
    actions:<button onClick={() => setModal(m)} style={{ fontSize: 12, padding: '4px 10px', border: '1px solid #E2E8F0', borderRadius: 6, background: '#fff', cursor: 'pointer', fontFamily: FONT }}>Edit</button>,
  }))

  return (
    <AdminLayout title="Manufacturing"
      actions={<div style={{ display: 'flex', gap: 8 }}><SearchInput value={q} onChange={setQ} placeholder="Search orders…" /><Btn label="+ New MO" onClick={() => setModal({})} /></div>}>
      <StatGrid>
        <StatCard label="Total MOs"    value={String(data.length)}                                         sub="All orders" />
        <StatCard label="In Progress"  value={String(data.filter(m=>m.status==='In Progress').length)}     sub="Currently running"  color="#F59E0B" />
        <StatCard label="Scheduled"    value={String(data.filter(m=>m.status==='Scheduled').length)}       sub="Upcoming"           color="#1D4ED8" />
        <StatCard label="Completed"    value={String(data.filter(m=>m.status==='Done').length)}            sub="Finished"           color="#10B981" />
      </StatGrid>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['All',...STATUSES] as const).map(s => (
          <button key={s} onClick={() => setStatus(s)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontFamily: FONT, fontWeight: 500, cursor: 'pointer', border: '1px solid #E2E8F0', background: status===s ? DARK : '#fff', color: status===s ? '#fff' : '#64748B' }}>{s}</button>
        ))}
      </div>
      <div style={{ fontSize: 13, color: '#64748B', marginBottom: 12 }}>{filtered.length} manufacturing orders</div>
      <Table columns={COLS} rows={rows} />
      {modal !== null && <Modal mo={modal} onClose={() => setModal(null)} onSave={save} />}
    </AdminLayout>
  )
}
