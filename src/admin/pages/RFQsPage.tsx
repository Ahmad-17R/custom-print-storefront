import React, { useEffect, useState } from 'react'
import { AdminLayout, Table, Btn, SearchInput, Badge, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

type RFQStatus = 'draft' | 'sent' | 'quoted' | 'closed' | 'cancelled'
interface Material { id: string; name: string; unit: string }
interface Supplier { id: string; name: string }
interface RFQItem { id: string; materialId: string; quantity: number; unitPrice: number | null; note: string | null; material: Material }
interface RFQ {
  id: string; status: RFQStatus; sentAt: string | null; expiresAt: string | null; note: string | null; createdAt: string
  supplier: Supplier
  items: RFQItem[]
  _count: { items: number }
}

const STATUS_LABEL: Record<RFQStatus, string> = { draft: 'Draft', sent: 'Sent', quoted: 'Quoted', closed: 'Closed', cancelled: 'Cancelled' }
const STATUS_COLOR: Record<RFQStatus, string> = { draft: '#64748B', sent: '#1D4ED8', quoted: '#10B981', closed: '#7C3AED', cancelled: '#EF4444' }
const STATUSES: RFQStatus[] = ['draft', 'sent', 'quoted', 'closed', 'cancelled']

const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }
const lbl = (t: string) => <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>{t}</span>

// ── New RFQ Modal ──────────────────────────────────────────────────────────
function NewRFQModal({ suppliers, materials, onClose, onSave }: {
  suppliers: Supplier[]; materials: Material[]; onClose: () => void; onSave: () => void
}) {
  const [supplierId, setSupplier] = useState(suppliers[0]?.id ?? '')
  const [expiresAt,  setExpiry]   = useState('')
  const [note,       setNote]     = useState('')
  const [lines, setLines] = useState([{ materialId: '', quantity: 1, note: '' }])
  const [loading, setLoad] = useState(false)
  const [err, setErr] = useState('')

  const setLine = (i: number, field: string, val: string | number) =>
    setLines(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: val } : l))

  const usedIds = lines.map(l => l.materialId).filter(Boolean)
  const availFor = (idx: number) => materials.filter(m => !usedIds.includes(m.id) || lines[idx].materialId === m.id)

  const save = async () => {
    if (!supplierId) return setErr('Select a supplier')
    const valid = lines.filter(l => l.materialId && l.quantity > 0)
    if (!valid.length) return setErr('Add at least one material')
    setLoad(true)
    try {
      await api.post('/rfqs', {
        supplierId,
        expiresAt: expiresAt || undefined,
        note: note || undefined,
        items: valid.map(l => ({ materialId: l.materialId, quantity: l.quantity, note: l.note || undefined })),
      })
      onSave(); onClose()
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Error') }
    finally { setLoad(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', overflowY: 'auto' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 640, maxWidth: '100%', fontFamily: FONT }}>
        <h2 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: DARK }}>New RFQ</h2>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748B' }}>Request a price quote from a supplier for specific materials.</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <label style={{ gridColumn: '1/-1' }}>
            {lbl('Supplier *')}
            <select value={supplierId} onChange={e => setSupplier(e.target.value)} style={inp}>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label>
            {lbl('Expiry Date (optional)')}
            <input type="date" value={expiresAt} onChange={e => setExpiry(e.target.value)} style={inp} />
          </label>
          <label>
            {lbl('Note (optional)')}
            <input value={note} onChange={e => setNote(e.target.value)} style={inp} />
          </label>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: DARK, marginBottom: 8 }}>Materials to Quote</div>
          <div style={{ background: '#F8FAFC', borderRadius: 8, padding: 12, border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 100px 1fr 28px', gap: 8, marginBottom: 8 }}>
              {['Material', 'Qty', 'Note', ''].map(h => (
                <span key={h} style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>{h}</span>
              ))}
            </div>
            {lines.map((line, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 100px 1fr 28px', gap: 8, marginBottom: 6, alignItems: 'center' }}>
                <select value={line.materialId} onChange={e => setLine(i, 'materialId', e.target.value)} style={inp}>
                  <option value="">— select —</option>
                  {availFor(i).map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
                </select>
                <input type="number" min={1} value={line.quantity} onChange={e => setLine(i, 'quantity', Number(e.target.value))} style={inp} />
                <input value={line.note} onChange={e => setLine(i, 'note', e.target.value)} placeholder="optional" style={inp} />
                <button onClick={() => setLines(prev => prev.filter((_, idx) => idx !== i))} style={{ border: 'none', background: 'transparent', color: '#EF4444', fontSize: 18, cursor: 'pointer', padding: 0 }}>×</button>
              </div>
            ))}
            {lines.length < materials.length && (
              <button onClick={() => setLines(prev => [...prev, { materialId: '', quantity: 1, note: '' }])}
                style={{ marginTop: 4, background: 'none', border: '1px dashed #CBD5E1', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 12, color: '#64748B', fontFamily: FONT }}>
                + Add Material
              </button>
            )}
          </div>
        </div>

        {err && <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 12 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn label="Cancel" variant="secondary" onClick={onClose} />
          <Btn label={loading ? 'Creating…' : 'Create RFQ'} onClick={save} />
        </div>
      </div>
    </div>
  )
}

// ── Record Quote Modal ─────────────────────────────────────────────────────
function QuoteModal({ rfq, onClose, onSave }: { rfq: RFQ; onClose: () => void; onSave: () => void }) {
  const [prices, setPrices] = useState<Record<string, string>>(
    Object.fromEntries(rfq.items.map(i => [i.id, i.unitPrice != null ? String(i.unitPrice) : '']))
  )
  const [loading, setLoad] = useState(false)
  const [err, setErr] = useState('')

  const save = async () => {
    const items = rfq.items.map(i => ({ id: i.id, unitPrice: Number(prices[i.id]) }))
    if (items.some(i => !i.unitPrice || i.unitPrice <= 0)) return setErr('Enter a price for every item')
    setLoad(true)
    try {
      await api.post(`/rfqs/${rfq.id}/quote`, { items })
      onSave(); onClose()
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Error') }
    finally { setLoad(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 520, fontFamily: FONT }}>
        <h2 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: DARK }}>Record Quote from {rfq.supplier.name}</h2>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748B' }}>Enter the price the supplier quoted per unit (AED).</p>
        <div style={{ marginBottom: 16 }}>
          {rfq.items.map(item => (
            <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 12, marginBottom: 10, alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: DARK }}>{item.material.name}</div>
                <div style={{ fontSize: 12, color: '#64748B' }}>{item.quantity} {item.material.unit}</div>
              </div>
              <label>
                {lbl('Unit Price (AED) *')}
                <input type="number" min={0} step="0.01" value={prices[item.id]} onChange={e => setPrices(p => ({ ...p, [item.id]: e.target.value }))} placeholder="0.00" style={inp} />
              </label>
            </div>
          ))}
        </div>
        {err && <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 12 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn label="Cancel" variant="secondary" onClick={onClose} />
          <Btn label={loading ? 'Saving…' : 'Save Quote'} onClick={save} />
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────
export function RFQsPage() {
  const [data,      setData]      = useState<RFQ[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading,   setLoading]   = useState(true)
  const [q,         setQ]         = useState('')
  const [statusFilter, setFilter] = useState<RFQStatus | 'all'>('all')
  const [showNew,   setNew]       = useState(false)
  const [quoting,   setQuoting]   = useState<RFQ | null>(null)
  const [actLoad,   setActLoad]   = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [r, s, m] = await Promise.all([
        api.get<{ data: RFQ[] }>('/rfqs?pageSize=200'),
        api.get<{ data: Supplier[] }>('/suppliers?pageSize=200'),
        api.get<{ data: Material[] }>('/materials?pageSize=500'),
      ])
      setData(r.data); setSuppliers(s.data); setMaterials(m.data)
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const action = async (id: string, endpoint: string, label: string) => {
    if (!window.confirm(`${label}?`)) return
    setActLoad(id)
    try { await api.post(`/rfqs/${id}/${endpoint}`, {}); load() }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Error') }
    finally { setActLoad(null) }
  }

  const convert = async (rfq: RFQ) => {
    if (!window.confirm(`Convert RFQ to Purchase Order? This will close the RFQ.`)) return
    setActLoad(rfq.id)
    try { await api.post(`/rfqs/${rfq.id}/convert`, {}); load() }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Error') }
    finally { setActLoad(null) }
  }

  const filtered = data.filter(r =>
    (statusFilter === 'all' || r.status === statusFilter) &&
    r.supplier.name.toLowerCase().includes(q.toLowerCase())
  )

  const btnBase: React.CSSProperties = { fontSize: 11, padding: '3px 8px', borderRadius: 5, cursor: 'pointer', fontFamily: FONT, border: '1px solid #E2E8F0', background: '#fff' }

  const rows = filtered.map(r => ({
    ref:      <code style={{ fontSize: 12 }}>{r.id.slice(0, 8).toUpperCase()}</code>,
    supplier: r.supplier.name,
    items:    r._count.items,
    status:   <Badge label={STATUS_LABEL[r.status]} color={STATUS_COLOR[r.status]} />,
    sentAt:   r.sentAt ? r.sentAt.slice(0, 10) : <span style={{ color: '#CBD5E1' }}>—</span>,
    expires:  r.expiresAt ? r.expiresAt.slice(0, 10) : <span style={{ color: '#CBD5E1' }}>—</span>,
    actions: (
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {r.status === 'draft' && (
          <button onClick={() => action(r.id, 'send', 'Mark as sent to supplier')} disabled={actLoad === r.id} style={{ ...btnBase, color: '#1D4ED8', borderColor: '#BFDBFE' }}>Send</button>
        )}
        {r.status === 'sent' && (
          <button onClick={async () => {
            const full = await api.get<RFQ>(`/rfqs/${r.id}`)
            setQuoting(full)
          }} style={{ ...btnBase, color: '#10B981', borderColor: '#A7F3D0' }}>Record Quote</button>
        )}
        {r.status === 'quoted' && (
          <button onClick={() => convert(r)} disabled={actLoad === r.id} style={{ ...btnBase, color: '#7C3AED', borderColor: '#DDD6FE' }}>→ PO</button>
        )}
        {['draft', 'sent'].includes(r.status) && (
          <button onClick={() => action(r.id, 'cancel', 'Cancel this RFQ')} disabled={actLoad === r.id} style={{ ...btnBase, color: '#EF4444', borderColor: '#FECACA' }}>Cancel</button>
        )}
      </div>
    ),
  }))

  const COLS = [
    { key: 'ref',      label: 'RFQ #',     width: 100 },
    { key: 'supplier', label: 'Supplier' },
    { key: 'items',    label: 'Lines',     width: 60 },
    { key: 'status',   label: 'Status',    width: 100 },
    { key: 'sentAt',   label: 'Sent',      width: 100 },
    { key: 'expires',  label: 'Expires',   width: 100 },
    { key: 'actions',  label: '',          width: 170 },
  ]

  return (
    <AdminLayout
      title="RFQs"
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <SearchInput value={q} onChange={setQ} placeholder="Search supplier…" />
          <Btn label="+ New RFQ" onClick={() => setNew(true)} />
        </div>
      }
    >
      <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#0C4A6E', fontFamily: FONT }}>
        <strong>Flow:</strong> Create RFQ → Mark as Sent → Record supplier quote → Convert to Purchase Order
      </div>

      <StatGrid>
        <StatCard label="Total RFQs"  value={String(data.length)}                                            sub="All requests" />
        <StatCard label="Sent"        value={String(data.filter(r => r.status === 'sent').length)}            sub="Awaiting quote"   color="#1D4ED8" />
        <StatCard label="Quoted"      value={String(data.filter(r => r.status === 'quoted').length)}          sub="Ready to convert" color="#10B981" />
        <StatCard label="Converted"   value={String(data.filter(r => r.status === 'closed').length)}          sub="Became a PO"      color="#7C3AED" />
      </StatGrid>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['all', ...STATUSES] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontFamily: FONT, fontWeight: 500, cursor: 'pointer', border: '1px solid #E2E8F0', background: statusFilter === s ? DARK : '#fff', color: statusFilter === s ? '#fff' : '#64748B' }}>
            {s === 'all' ? 'All' : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {loading
        ? <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
        : data.length === 0
          ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8', fontFamily: FONT }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>No RFQs yet</div>
              <div style={{ fontSize: 13, marginBottom: 20 }}>Request quotes from suppliers before placing orders.</div>
              <Btn label="+ New RFQ" onClick={() => setNew(true)} />
            </div>
          )
          : <><div style={{ fontSize: 13, color: '#64748B', marginBottom: 12, fontFamily: FONT }}>{filtered.length} RFQs</div><Table columns={COLS} rows={rows} /></>
      }

      {showNew && (
        <NewRFQModal suppliers={suppliers} materials={materials} onClose={() => setNew(false)} onSave={load} />
      )}
      {quoting && (
        <QuoteModal rfq={quoting} onClose={() => setQuoting(null)} onSave={load} />
      )}
    </AdminLayout>
  )
}
