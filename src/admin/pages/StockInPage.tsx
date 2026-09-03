import React, { useEffect, useState } from 'react'
import { AdminLayout, Table, Btn, SearchInput, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

interface Warehouse { id: string; name: string }
interface Material  { id: string; name: string; unit: string }
interface Supplier  { id: string; name: string }
interface Movement  {
  id: string; quantity: number; reference: string | null; note: string | null; unitCost: number | null; createdAt: string
  material:  { id: string; name: string; unit: string }
  warehouse: { id: string; name: string }
}

const inp: React.CSSProperties = {
  width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0',
  borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none',
}
const lbl = (text: string) => (
  <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>{text}</span>
)

interface Distribution { warehouseId: string; qty: number }

function StockInModal({ warehouses, materials, suppliers, onClose, onSave }: {
  warehouses: Warehouse[]; materials: Material[]; suppliers: Supplier[]
  onClose: () => void; onSave: () => void
}) {
  const [materialId, setMaterial] = useState('')
  const [supplierId, setSupplier] = useState('')
  const [unitCost,   setUnitCost] = useState('')
  const [note,       setNote]     = useState('')
  const [dists,      setDists]    = useState<Distribution[]>(
    warehouses.map(w => ({ warehouseId: w.id, qty: 0 }))
  )
  const [loading, setLoading] = useState(false)
  const [err,     setErr]     = useState('')

  const setQty = (whId: string, qty: number) =>
    setDists(prev => prev.map(d => d.warehouseId === whId ? { ...d, qty: Math.max(0, qty) } : d))

  const totalQty   = dists.reduce((s, d) => s + d.qty, 0)
  const selectedMat = materials.find(m => m.id === materialId)

  const save = async () => {
    if (!materialId) return setErr('Select a material')
    if (totalQty < 1) return setErr('Enter quantity for at least one warehouse')
    setLoading(true)
    try {
      await api.post('/stock-in', {
        materialId,
        supplierId:  supplierId || undefined,
        unitCost:    unitCost   ? Number(unitCost) : undefined,
        note:        note       || undefined,
        distributions: dists,
      })
      onSave(); onClose()
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Error') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 16px', overflowY: 'auto' }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 32, width: 660, maxWidth: '100%', fontFamily: FONT }}>
        <h2 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 700, color: DARK }}>Receive Stock</h2>
        <p style={{ margin: '0 0 24px', fontSize: 13, color: '#64748B' }}>Select a material, set the cost, then enter how many units each warehouse receives. Leave a warehouse at 0 to skip it.</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <label style={{ gridColumn: '1/-1' }}>
            {lbl('Material *')}
            <select value={materialId} onChange={e => setMaterial(e.target.value)} style={inp}>
              <option value="">— select material —</option>
              {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
            </select>
          </label>
          <label>
            {lbl('Supplier (optional)')}
            <select value={supplierId} onChange={e => setSupplier(e.target.value)} style={inp}>
              <option value="">— none —</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label>
            {lbl('Unit Cost (AED)')}
            <input type="number" min={0} step="0.01" value={unitCost} onChange={e => setUnitCost(e.target.value)} placeholder="0.00" style={inp} />
          </label>
          <label style={{ gridColumn: '1/-1' }}>
            {lbl('Note')}
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Purchased from trade fair, batch A" style={inp} />
          </label>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: DARK, marginBottom: 10 }}>
            Distribute to Warehouses
            {totalQty > 0 && selectedMat && (
              <span style={{ marginLeft: 10, fontSize: 12, fontWeight: 500, color: '#10B981' }}>
                Total: <strong>{totalQty} {selectedMat.unit}</strong>
              </span>
            )}
          </div>
          <div style={{ background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', padding: '8px 16px', borderBottom: '1px solid #E2E8F0', background: '#F1F5F9' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Warehouse</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Qty {selectedMat ? `(${selectedMat.unit})` : ''}</span>
            </div>
            {warehouses.map(w => {
              const d = dists.find(x => x.warehouseId === w.id)
              return (
                <div key={w.id} style={{ display: 'grid', gridTemplateColumns: '1fr 160px', padding: '10px 16px', borderBottom: '1px solid #F1F5F9', alignItems: 'center' }}>
                  <div style={{ fontSize: 13, color: DARK, fontWeight: 500 }}>{w.name}</div>
                  <input type="number" min={0} value={d?.qty ?? 0} onChange={e => setQty(w.id, Number(e.target.value))} style={{ ...inp, width: 120 }} />
                </div>
              )
            })}
          </div>
        </div>

        {err && <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 12 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn label="Cancel" variant="secondary" onClick={onClose} />
          <Btn label={loading ? 'Saving…' : `Receive ${totalQty > 0 ? totalQty + ' units' : 'Stock'}`} onClick={save} />
        </div>
      </div>
    </div>
  )
}

function FulfillModal({ warehouses, materials, onClose, onSave }: {
  warehouses: Warehouse[]; materials: Material[]; onClose: () => void; onSave: () => void
}) {
  const [materialId,  setMaterial] = useState('')
  const [warehouseId, setWh]       = useState(warehouses[0]?.id ?? '')
  const [quantity,    setQty]      = useState(1)
  const [orderId,     setOrderId]  = useState('')
  const [note,        setNote]     = useState('')
  const [loading, setLoading] = useState(false)
  const [err,     setErr]     = useState('')
  const [result,  setResult]  = useState<{ remainingQty: number } | null>(null)

  const selectedMat = materials.find(m => m.id === materialId)

  const save = async () => {
    if (!materialId)  return setErr('Select a material')
    if (!warehouseId) return setErr('Select a warehouse')
    if (quantity < 1) return setErr('Quantity must be at least 1')
    setLoading(true)
    try {
      const r = await api.post<{ remainingQty: number }>('/stock-in/fulfill', {
        materialId, warehouseId, quantity, orderId: orderId || undefined, note: note || undefined,
      })
      setResult(r)
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Error') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 32, width: 480, fontFamily: FONT }}>
        {result ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 22 }}>✓</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: DARK, marginBottom: 6 }}>Stock Deducted</div>
            <div style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>
              {quantity} {selectedMat?.unit ?? 'units'} fulfilled. Remaining in warehouse: <strong>{result.remainingQty}</strong>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <Btn label="Fulfill Another" variant="secondary" onClick={() => { setResult(null); setErr(''); setQty(1); setOrderId(''); setNote('') }} />
              <Btn label="Done" onClick={() => { onSave(); onClose() }} />
            </div>
          </div>
        ) : (
          <>
            <h2 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 700, color: DARK }}>Fulfill from Stock</h2>
            <p style={{ margin: '0 0 24px', fontSize: 13, color: '#64748B' }}>Deduct material stock from a specific warehouse to fulfill an order.</p>
            <div style={{ display: 'grid', gap: 14, marginBottom: 20 }}>
              <label>
                {lbl('Material *')}
                <select value={materialId} onChange={e => setMaterial(e.target.value)} style={inp}>
                  <option value="">— select —</option>
                  {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
                </select>
              </label>
              <label>
                {lbl('Warehouse *')}
                <select value={warehouseId} onChange={e => setWh(e.target.value)} style={inp}>
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </label>
              <label>
                {lbl(`Quantity to Deduct${selectedMat ? ` (${selectedMat.unit})` : ''} *`)}
                <input type="number" min={1} value={quantity} onChange={e => setQty(Number(e.target.value))} style={inp} />
              </label>
              <label>
                {lbl('Order ID / Reference')}
                <input value={orderId} onChange={e => setOrderId(e.target.value)} placeholder="e.g. ORD-2024-001" style={inp} />
              </label>
              <label>
                {lbl('Note')}
                <input value={note} onChange={e => setNote(e.target.value)} style={inp} />
              </label>
            </div>
            {err && <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 12 }}>{err}</div>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Btn label="Cancel" variant="secondary" onClick={onClose} />
              <Btn label={loading ? 'Processing…' : 'Deduct Stock'} onClick={save} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export function StockInPage() {
  const [data,        setData]      = useState<Movement[]>([])
  const [warehouses,  setWh]        = useState<Warehouse[]>([])
  const [materials,   setMaterials] = useState<Material[]>([])
  const [suppliers,   setSuppliers] = useState<Supplier[]>([])
  const [loading,     setLoading]   = useState(true)
  const [q,           setQ]         = useState('')
  const [showIn,      setShowIn]    = useState(false)
  const [showFulfill, setShowFulfill] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [r, w, m, s] = await Promise.all([
        api.get<{ data: Movement[] }>('/stock-in?pageSize=200'),
        api.get<{ data: Warehouse[] }>('/warehouses?pageSize=100'),
        api.get<{ data: Material[] }>('/materials?pageSize=500'),
        api.get<{ data: Supplier[] }>('/suppliers?pageSize=200'),
      ])
      setData(r.data); setWh(w.data); setMaterials(m.data); setSuppliers(s.data)
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const filtered = data.filter(r =>
    r.material.name.toLowerCase().includes(q.toLowerCase()) ||
    r.warehouse.name.toLowerCase().includes(q.toLowerCase()) ||
    (r.reference ?? '').toLowerCase().includes(q.toLowerCase())
  )

  const totalUnits = data.reduce((s, r) => s + r.quantity, 0)
  const uniqueRefs = new Set(data.map(r => r.reference)).size

  const rows = filtered.map(r => ({
    ref:       <code style={{ fontSize: 12 }}>{r.reference ?? '—'}</code>,
    material:  r.material.name,
    unit:      r.material.unit,
    warehouse: r.warehouse.name,
    qty:       <span style={{ fontWeight: 700, color: '#10B981' }}>+{r.quantity}</span>,
    cost:      r.unitCost != null ? `AED ${r.unitCost.toFixed(2)}` : <span style={{ color: '#CBD5E1' }}>—</span>,
    note:      r.note ? <span style={{ fontSize: 12, color: '#64748B' }}>{r.note}</span> : <span style={{ color: '#CBD5E1' }}>—</span>,
    date:      r.createdAt.slice(0, 10),
  }))

  const COLS = [
    { key: 'ref',       label: 'Reference',  width: 160 },
    { key: 'material',  label: 'Material' },
    { key: 'unit',      label: 'Unit',       width: 70  },
    { key: 'warehouse', label: 'Warehouse',  width: 150 },
    { key: 'qty',       label: 'Qty In',     width: 80  },
    { key: 'cost',      label: 'Unit Cost',  width: 110 },
    { key: 'note',      label: 'Note',       width: 180 },
    { key: 'date',      label: 'Date',       width: 100 },
  ]

  return (
    <AdminLayout
      title="Stock In"
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <SearchInput value={q} onChange={setQ} placeholder="Search material, warehouse, ref…" />
          <Btn label="Fulfill from Stock" variant="secondary" onClick={() => setShowFulfill(true)} />
          <Btn label="+ Receive Stock" onClick={() => setShowIn(true)} />
        </div>
      }
    >
      <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#14532D', fontFamily: FONT }}>
        <strong>Stock intake flow:</strong> First create your <a href="/admin/materials" style={{ color: '#15803D', fontWeight: 600 }}>Materials</a> (paper, card, ink, etc.), then use <strong>Receive Stock</strong> to log a purchase and distribute units across warehouses. Use <strong>Fulfill from Stock</strong> to deduct units when an order goes out.
      </div>

      <StatGrid>
        <StatCard label="Total Units In"  value={String(totalUnits)}                                          sub="Across all receipts"  color="#10B981" />
        <StatCard label="Stock Receipts"  value={String(uniqueRefs)}                                          sub="Intake batches"        color="#1D4ED8" />
        <StatCard label="Warehouses Fed"  value={String(new Set(data.map(r => r.warehouse.id)).size)}         sub="Distinct warehouses" />
        <StatCard label="Materials"       value={String(new Set(data.map(r => r.material.id)).size)}          sub="Unique materials received" />
      </StatGrid>

      {loading
        ? <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
        : data.length === 0
          ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8', fontFamily: FONT }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>No stock received yet</div>
              <div style={{ fontSize: 13, marginBottom: 20 }}>
                {materials.length === 0
                  ? 'First add your materials, then come back to receive stock.'
                  : 'Click "Receive Stock" to log your first purchase.'}
              </div>
              {materials.length === 0
                ? <Btn label="Go to Materials" onClick={() => window.location.href = '/admin/materials'} />
                : <Btn label="+ Receive Stock" onClick={() => setShowIn(true)} />
              }
            </div>
          )
          : (
            <>
              <div style={{ fontSize: 13, color: '#64748B', marginBottom: 12, fontFamily: FONT }}>{filtered.length} entries</div>
              <Table columns={COLS} rows={rows} />
            </>
          )
      }

      {showIn && (
        <StockInModal warehouses={warehouses} materials={materials} suppliers={suppliers} onClose={() => setShowIn(false)} onSave={load} />
      )}
      {showFulfill && (
        <FulfillModal warehouses={warehouses} materials={materials} onClose={() => setShowFulfill(false)} onSave={load} />
      )}
    </AdminLayout>
  )
}
