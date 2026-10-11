import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AdminLayout, Table, Btn, SearchInput, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'
import { useAuth } from '../lib/AuthContext'
import { today } from '../lib/date'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

interface Material  { id: string; name: string; unit: string }
interface Supplier  { id: string; name: string }
interface Warehouse { id: string; name: string; isDefault?: boolean }
interface PO        { id: string; poNumber: string; supplier: Supplier }
interface ReturnItem {
  id: string; materialId: string; quantity: number; reason: string | null
  material: Material
}
interface PurchaseReturn {
  id: string; reason: string; note: string | null; returnDate: string; createdAt: string; totalAmount?: string; createdBy?: string | null
  po: { id: string; poNumber: string }
  supplier: Supplier
  items: ReturnItem[]
  _count: { items: number }
}

const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }
const lbl = (t: string) => <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>{t}</span>

interface ReturnableLine {
  materialId: string; name: string; unit: string; unitPrice: number
  received: number; returned: number; returnable: number
  stock: { warehouseId: string; warehouseName: string; quantity: number }[]
}
interface Returnable { po: { id: string; poNumber: string; status: string; supplier: Supplier }; canReturn: boolean; lines: ReturnableLine[] }
interface LineState { warehouseId: string; quantity: string; reason: string }

// Returns are raised against a received PO: only its materials, at most received − already
// returned, valued at the PO price. Needs the "return goods from purchase orders" right.
function NewReturnModal({ suppliers, warehouses, initialPoId, onClose, onSave }: {
  suppliers: Supplier[]; warehouses: Warehouse[]; initialPoId?: string | null; onClose: () => void; onSave: () => void
}) {
  const [supplierId, setSupplier] = useState(suppliers[0]?.id ?? '')
  const [pos,        setPOs]      = useState<PO[]>([])
  const [poId,       setPoId]     = useState(initialPoId ?? '')
  const [info,       setInfo]     = useState<Returnable | null>(null)
  const [reason,     setReason]   = useState('')
  const [returnDate, setDate]     = useState(today())
  const [note,       setNote]     = useState('')
  const [lines,      setLines]    = useState<Record<string, LineState>>({})
  const [loading,    setLoad]     = useState(false)
  const [err,        setErr]      = useState('')

  // Opened from a PO's "Return" button: jump straight to that PO and its supplier
  useEffect(() => {
    if (!initialPoId) return
    api.get<Returnable>(`/purchase-returns/returnable/${initialPoId}`).then(r => setSupplier(r.po.supplier.id)).catch(() => {})
  }, [initialPoId])

  // Received POs for the selected supplier
  useEffect(() => {
    if (!supplierId) return
    api.get<{ data: (PO & { status: string })[] }>(`/purchase-orders?supplierId=${supplierId}&pageSize=100`)
      .then(r => {
        const received = r.data.filter(p => ['partially_received', 'fully_received', 'closed'].includes(p.status))
        setPOs(received)
        setPoId(prev => received.some(p => p.id === prev) ? prev : received[0]?.id ?? '')
      }).catch(() => {})
  }, [supplierId])

  useEffect(() => {
    if (!poId) { setInfo(null); return }
    api.get<Returnable>(`/purchase-returns/returnable/${poId}`).then(r => {
      setInfo(r)
      const defaultWh = warehouses.find(w => w.isDefault)?.id
      setLines(Object.fromEntries(r.lines.map(l => {
        // Prefer the default warehouse if it holds this material, else where most of it is
        const withStock = l.stock.filter(s => s.quantity > 0).sort((a, b) => b.quantity - a.quantity)
        const wh = withStock.find(s => s.warehouseId === defaultWh)?.warehouseId ?? withStock[0]?.warehouseId ?? ''
        return [l.materialId, { warehouseId: wh, quantity: '', reason: '' }]
      })))
    }).catch(e => setErr(e.message))
  }, [poId])

  const setLine = (mid: string, k: keyof LineState, v: string) => setLines(p => ({ ...p, [mid]: { ...p[mid], [k]: v } }))
  const total = (info?.lines ?? []).reduce((s, l) => s + (Number(lines[l.materialId]?.quantity) || 0) * l.unitPrice, 0)

  const save = async () => {
    if (!poId || !info)  return setErr('Select a received purchase order')
    if (!reason.trim())  return setErr('Reason is required')
    const items = info.lines
      .map(l => ({ l, st: lines[l.materialId] }))
      .filter(({ st }) => Number(st?.quantity) > 0)
    if (!items.length) return setErr('Enter a quantity for at least one material')
    for (const { l, st } of items) {
      if (Number(st.quantity) > l.returnable) return setErr(`${l.name}: only ${l.returnable} ${l.unit} can be returned`)
      if (!st.warehouseId) return setErr(`${l.name}: choose the warehouse it is returned from`)
      const inWh = l.stock.find(s => s.warehouseId === st.warehouseId)?.quantity ?? 0
      if (Number(st.quantity) > inWh) return setErr(`${l.name}: only ${inWh} ${l.unit} in the selected warehouse`)
    }
    setLoad(true)
    try {
      await api.post('/purchase-returns', {
        poId, reason, note: note || undefined, returnDate: returnDate || undefined,
        items: items.map(({ l, st }) => ({ materialId: l.materialId, warehouseId: st.warehouseId, quantity: Number(st.quantity), reason: st.reason || undefined })),
      })
      onSave(); onClose()
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Error') }
    finally { setLoad(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', overflowY: 'auto' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 760, maxWidth: '100%', fontFamily: FONT }}>
        <h2 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: DARK }}>New Purchase Return</h2>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748B' }}>Return goods received on a purchase order. You can return at most what was received and not already returned. Stock is deducted and the supplier balance reduced on save.</p>

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

        {info && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: DARK, marginBottom: 8 }}>Items on {info.po.poNumber}</div>
            <div style={{ background: '#F8FAFC', borderRadius: 8, padding: 12, border: '1px solid #E2E8F0', overflowX: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1.6fr 80px 1.2fr', gap: 8, marginBottom: 8, minWidth: 620 }}>
                {['Material', 'Returnable', 'From Warehouse', 'Qty', 'Item Reason'].map(h => (
                  <span key={h} style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>{h}</span>
                ))}
              </div>
              {info.lines.map(l => {
                const st = lines[l.materialId] ?? { warehouseId: '', quantity: '', reason: '' }
                const over = Number(st.quantity) > l.returnable
                return (
                  <div key={l.materialId} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1.6fr 80px 1.2fr', gap: 8, marginBottom: 6, alignItems: 'center', minWidth: 620 }}>
                    <div style={{ fontSize: 13 }}><b>{l.name}</b><div style={{ fontSize: 11, color: '#64748B' }}>AED {l.unitPrice.toFixed(2)} / {l.unit}</div></div>
                    <div style={{ fontSize: 12, color: l.returnable > 0 ? DARK : '#94A3B8' }}>{l.returnable} {l.unit}<div style={{ fontSize: 11, color: '#94A3B8' }}>rcvd {l.received} · ret {l.returned}</div></div>
                    <select value={st.warehouseId} onChange={e => setLine(l.materialId, 'warehouseId', e.target.value)} style={inp} disabled={l.returnable <= 0}>
                      <option value="">— warehouse —</option>
                      {l.stock.map(s => <option key={s.warehouseId} value={s.warehouseId}>{s.warehouseName} ({s.quantity})</option>)}
                    </select>
                    <input type="number" min={0} max={l.returnable} step="any" value={st.quantity} onChange={e => setLine(l.materialId, 'quantity', e.target.value)} disabled={l.returnable <= 0}
                      style={{ ...inp, borderColor: over ? '#EF4444' : '#E2E8F0' }} />
                    <input value={st.reason} onChange={e => setLine(l.materialId, 'reason', e.target.value)} placeholder="optional" style={inp} disabled={l.returnable <= 0} />
                  </div>
                )
              })}
            </div>
            {total > 0 && <div style={{ textAlign: 'right', marginTop: 8, fontSize: 14, fontWeight: 700, color: DARK }}>Return value: AED {total.toFixed(2)} <span style={{ fontWeight: 400, fontSize: 12, color: '#64748B' }}>(incl. VAT, at PO price)</span></div>}
          </div>
        )}

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
  const { can } = useAuth()
  const canReturn = can('feature.purchase_returns')
  const [params, setParams] = useSearchParams()
  const [initialPoId, setInitialPoId] = useState<string | null>(null)
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

  // Arrived from a PO's "Return" button
  useEffect(() => {
    const id = params.get('poId')
    if (id) { params.delete('poId'); setParams(params, { replace: true }); if (canReturn) { setInitialPoId(id); setNew(true) } }
  }, [canReturn])

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
    reason:   <span style={{ fontSize: 12, color: '#64748B' }}>{r.reason}{r.createdBy ? <span style={{ display: 'block', fontSize: 11, color: '#94A3B8' }}>by {r.createdBy}</span> : null}</span>,
    amount:   Number(r.totalAmount ?? 0) > 0 ? `AED ${Number(r.totalAmount).toFixed(2)}` : <span style={{ color: '#CBD5E1' }}>—</span>,
    date:     r.returnDate.slice(0, 10),
  }))

  const COLS = [
    { key: 'ref',       label: 'Return #',  width: 100 },
    { key: 'poNumber',  label: 'PO #',      width: 130 },
    { key: 'supplier',  label: 'Supplier',  width: 150 },
    { key: 'materials', label: 'Materials' },
    { key: 'amount',    label: 'Value',     width: 110 },
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
          {canReturn && <Btn label="+ New Return" onClick={() => setNew(true)} />}
        </div>
      }
    >
      <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#92400E', fontFamily: FONT }}>
        <strong>How it works:</strong> Select the supplier and the received PO, then enter how much of each material goes back and from which warehouse. You can only return what was received on that PO (minus earlier returns). Stock is deducted immediately.
        {!canReturn && <div style={{ marginTop: 6, color: '#B91C1C' }}>You don't have permission to create purchase returns — ask the owner to grant "Can return goods from purchase orders".</div>}
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
              {canReturn && <Btn label="+ New Return" onClick={() => setNew(true)} />}
            </div>
          )
          : <><div style={{ fontSize: 13, color: '#64748B', marginBottom: 12, fontFamily: FONT }}>{filtered.length} returns</div><Table columns={COLS} rows={rows} /></>
      }

      {showNew && (
        <NewReturnModal suppliers={suppliers} warehouses={warehouses} initialPoId={initialPoId} onClose={() => { setNew(false); setInitialPoId(null) }} onSave={load} />
      )}
    </AdminLayout>
  )
}
