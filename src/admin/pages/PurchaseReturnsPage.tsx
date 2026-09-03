import React, { useEffect, useState } from 'react'
import { AdminLayout, Table, Btn, SearchInput, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

interface Material  { id: string; name: string; unit: string }
interface Supplier  { id: string; name: string }
interface Warehouse { id: string; name: string }
interface PO        { id: string; poNumber: string; supplier: Supplier }
interface ReturnItem {
  id: string; materialId: string; quantity: number; reason: string | null
  material: Material
}
interface PurchaseReturn {
  id: string; reason: string; note: string | null; returnDate: string; createdAt: string
  po: { id: string; poNumber: string }
  supplier: Supplier
  items: ReturnItem[]
  _count: { items: number }
}

const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }
const lbl = (t: string) => <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>{t}</span>

interface LineItem { materialId: string; warehouseId: string; quantity: number; reason: string }

function NewReturnModal({ suppliers, warehouses, onClose, onSave }: {
  suppliers: Supplier[]; warehouses: Warehouse[]; onClose: () => void; onSave: () => void
}) {
  const [supplierId, setSupplier] = useState(suppliers[0]?.id ?? '')
  const [pos,        setPOs]      = useState<PO[]>([])
  const [poId,       setPoId]     = useState('')
  const [reason,     setReason]   = useState('')
  const [returnDate, setDate]     = useState('')
  const [note,       setNote]     = useState('')
  const [lines, setLines]         = useState<LineItem[]>([{ materialId: '', warehouseId: warehouses[0]?.id ?? '', quantity: 1, reason: '' }])
  const [materials,  setMaterials] = useState<Material[]>([])
  const [loading,    setLoad]     = useState(false)
  const [err,        setErr]      = useState('')

  // Load received POs for selected supplier
  useEffect(() => {
    if (!supplierId) return
    api.get<{ data: PO[] }>(`/purchase-orders?supplierId=${supplierId}&pageSize=100`)
      .then(r => {
        const received = r.data.filter((p: any) => ['partially_received', 'fully_received'].includes(p.status))
        setPOs(received)
        setPoId(received[0]?.id ?? '')
      }).catch(() => {})
  }, [supplierId])

  // Load materials in stock across selected warehouses
  useEffect(() => {
    api.get<{ data: Material[] }>('/materials?pageSize=500')
      .then(r => setMaterials(r.data)).catch(() => {})
  }, [])

  const setLine = (i: number, field: keyof LineItem, val: string | number) =>
    setLines(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: val } : l))

  const save = async () => {
    if (!supplierId)   return setErr('Select a supplier')
    if (!poId)         return setErr('Select a purchase order')
    if (!reason.trim()) return setErr('Reason is required')
    const valid = lines.filter(l => l.materialId && l.warehouseId && l.quantity > 0)
    if (!valid.length) return setErr('Add at least one item')
    setLoad(true)
    try {
      await api.post('/purchase-returns', {
        poId, supplierId, reason, note: note || undefined,
        returnDate: returnDate || undefined,
        items: valid.map(l => ({ materialId: l.materialId, warehouseId: l.warehouseId, quantity: l.quantity, reason: l.reason || undefined })),
      })
      onSave(); onClose()
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Error') }
    finally { setLoad(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', overflowY: 'auto' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 680, maxWidth: '100%', fontFamily: FONT }}>
        <h2 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: DARK }}>New Purchase Return</h2>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748B' }}>Return materials to a supplier. Stock is deducted immediately on save.</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <label>
            {lbl('Supplier *')}
            <select value={supplierId} onChange={e => setSupplier(e.target.value)} style={inp}>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label>
            {lbl('Purchase Order *')}
            <select value={poId} onChange={e => setPoId(e.target.value)} style={inp}>
              <option value="">— select PO —</option>
              {pos.map(p => <option key={p.id} value={p.id}>{p.poNumber}</option>)}
            </select>
            {pos.length === 0 && supplierId && (
              <span style={{ fontSize: 11, color: '#F59E0B', marginTop: 4, display: 'block' }}>No received POs for this supplier</span>
            )}
          </label>
          <label>
            {lbl('Reason *')}
            <input value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Damaged on arrival, Wrong item" style={inp} />
          </label>
          <label>
            {lbl('Return Date')}
            <input type="date" value={returnDate} onChange={e => setDate(e.target.value)} style={inp} />
          </label>
          <label style={{ gridColumn: '1/-1' }}>
            {lbl('Note (optional)')}
            <input value={note} onChange={e => setNote(e.target.value)} style={inp} />
          </label>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: DARK, marginBottom: 8 }}>Items to Return</div>
          <div style={{ background: '#F8FAFC', borderRadius: 8, padding: 12, border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 80px 1fr 28px', gap: 8, marginBottom: 8 }}>
              {['Material', 'From Warehouse', 'Qty', 'Item Reason', ''].map(h => (
                <span key={h} style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>{h}</span>
              ))}
            </div>
            {lines.map((line, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 80px 1fr 28px', gap: 8, marginBottom: 6, alignItems: 'center' }}>
                <select value={line.materialId} onChange={e => setLine(i, 'materialId', e.target.value)} style={inp}>
                  <option value="">— material —</option>
                  {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
                </select>
                <select value={line.warehouseId} onChange={e => setLine(i, 'warehouseId', e.target.value)} style={inp}>
                  <option value="">— warehouse —</option>
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
                <input type="number" min={1} value={line.quantity} onChange={e => setLine(i, 'quantity', Number(e.target.value))} style={inp} />
                <input value={line.reason} onChange={e => setLine(i, 'reason', e.target.value)} placeholder="optional" style={inp} />
                <button onClick={() => setLines(prev => prev.filter((_, idx) => idx !== i))} style={{ border: 'none', background: 'transparent', color: '#EF4444', fontSize: 18, cursor: 'pointer', padding: 0 }}>×</button>
              </div>
            ))}
            <button onClick={() => setLines(prev => [...prev, { materialId: '', warehouseId: warehouses[0]?.id ?? '', quantity: 1, reason: '' }])}
              style={{ marginTop: 4, background: 'none', border: '1px dashed #CBD5E1', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 12, color: '#64748B', fontFamily: FONT }}>
              + Add Item
            </button>
          </div>
        </div>

        {err && <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 12 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn label="Cancel" variant="secondary" onClick={onClose} />
          <Btn label={loading ? 'Saving…' : 'Create Return'} onClick={save} />
        </div>
      </div>
    </div>
  )
}

export function PurchaseReturnsPage() {
  const [data,       setData]  = useState<PurchaseReturn[]>([])
  const [suppliers,  setSupp]  = useState<Supplier[]>([])
  const [warehouses, setWh]    = useState<Warehouse[]>([])
  const [loading,    setLoad]  = useState(true)
  const [q,          setQ]     = useState('')
  const [showNew,    setNew]   = useState(false)

  const load = async () => {
    setLoad(true)
    try {
      const [r, s, w] = await Promise.all([
        api.get<{ data: PurchaseReturn[] }>('/purchase-returns?pageSize=200'),
        api.get<{ data: Supplier[] }>('/suppliers?pageSize=200'),
        api.get<{ data: Warehouse[] }>('/warehouses?pageSize=100'),
      ])
      setData(r.data); setSupp(s.data); setWh(w.data)
    } finally { setLoad(false) }
  }
  useEffect(() => { load() }, [])

  const filtered = data.filter(r =>
    r.supplier.name.toLowerCase().includes(q.toLowerCase()) ||
    r.po.poNumber.toLowerCase().includes(q.toLowerCase()) ||
    r.reason.toLowerCase().includes(q.toLowerCase())
  )

  const rows = filtered.map(r => ({
    ref:      <code style={{ fontSize: 12 }}>{r.id.slice(0, 8).toUpperCase()}</code>,
    poNumber: r.po.poNumber,
    supplier: r.supplier.name,
    items:    r._count.items,
    materials: r.items.map(i => `${i.material.name} (${i.quantity} ${i.material.unit})`).join(', '),
    reason:   <span style={{ fontSize: 12, color: '#64748B' }}>{r.reason}</span>,
    date:     r.returnDate.slice(0, 10),
  }))

  const COLS = [
    { key: 'ref',       label: 'Return #',  width: 100 },
    { key: 'poNumber',  label: 'PO #',      width: 130 },
    { key: 'supplier',  label: 'Supplier',  width: 150 },
    { key: 'materials', label: 'Materials' },
    { key: 'reason',    label: 'Reason',    width: 180 },
    { key: 'date',      label: 'Date',      width: 100 },
  ]

  const thisMonth = new Date().toISOString().slice(0, 7)

  return (
    <AdminLayout
      title="Purchase Returns"
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <SearchInput value={q} onChange={setQ} placeholder="Search supplier, PO, reason…" />
          <Btn label="+ New Return" onClick={() => setNew(true)} />
        </div>
      }
    >
      <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#92400E', fontFamily: FONT }}>
        <strong>How it works:</strong> Select the supplier and the received PO, add the materials being returned and which warehouse they're coming from. Stock is deducted immediately.
      </div>

      <StatGrid>
        <StatCard label="Total Returns" value={String(data.length)}                                                              sub="All returns" />
        <StatCard label="This Month"    value={String(data.filter(r => r.createdAt.slice(0, 7) === thisMonth).length)}           sub="Current month"      color="#F59E0B" />
        <StatCard label="Suppliers"     value={String(new Set(data.map(r => r.supplier.id)).size)}                               sub="Unique suppliers"   color="#8B5CF6" />
        <StatCard label="Lines"         value={String(data.reduce((s, r) => s + r._count.items, 0))}                             sub="Total items returned" color="#EF4444" />
      </StatGrid>

      {loading
        ? <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
        : data.length === 0
          ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8', fontFamily: FONT }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>No purchase returns yet</div>
              <div style={{ fontSize: 13, marginBottom: 20 }}>Return damaged or incorrect materials back to a supplier.</div>
              <Btn label="+ New Return" onClick={() => setNew(true)} />
            </div>
          )
          : <><div style={{ fontSize: 13, color: '#64748B', marginBottom: 12, fontFamily: FONT }}>{filtered.length} returns</div><Table columns={COLS} rows={rows} /></>
      }

      {showNew && (
        <NewReturnModal suppliers={suppliers} warehouses={warehouses} onClose={() => setNew(false)} onSave={load} />
      )}
    </AdminLayout>
  )
}
