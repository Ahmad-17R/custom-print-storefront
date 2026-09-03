import React, { useEffect, useState } from 'react'
import { AdminLayout, Table, Btn, SearchInput, Badge, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

type POStatus = 'draft' | 'confirmed' | 'partially_received' | 'fully_received' | 'closed' | 'cancelled'
interface Material  { id: string; name: string; unit: string }
interface Supplier  { id: string; name: string }
interface Warehouse { id: string; name: string }
interface POItem {
  id: string; materialId: string; quantity: number; unitPrice: number; receivedQty: number
  material: Material
}
interface PO {
  id: string; poNumber: string; status: POStatus; totalAmount: number
  orderDate: string; expectedDate: string | null; note: string | null; createdAt: string
  supplier: Supplier
  items: POItem[]
  _count: { items: number; receipts: number }
}

const STATUS_LABEL: Record<POStatus, string> = {
  draft: 'Draft', confirmed: 'Confirmed', partially_received: 'Partial',
  fully_received: 'Received', closed: 'Closed', cancelled: 'Cancelled',
}
const STATUS_COLOR: Record<POStatus, string> = {
  draft: '#64748B', confirmed: '#1D4ED8', partially_received: '#F59E0B',
  fully_received: '#10B981', closed: '#7C3AED', cancelled: '#EF4444',
}
const STATUSES: POStatus[] = ['draft', 'confirmed', 'partially_received', 'fully_received', 'closed', 'cancelled']

const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }
const lbl = (t: string) => <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>{t}</span>

// ── New PO Modal ───────────────────────────────────────────────────────────
function NewPOModal({ suppliers, materials, onClose, onSave }: {
  suppliers: Supplier[]; materials: Material[]; onClose: () => void; onSave: () => void
}) {
  const [supplierId,   setSupplier]  = useState(suppliers[0]?.id ?? '')
  const [expectedDate, setExpected]  = useState('')
  const [note,         setNote]      = useState('')
  const [lines, setLines] = useState([{ materialId: '', quantity: 1, unitPrice: '' }])
  const [loading, setLoad] = useState(false)
  const [err, setErr] = useState('')

  const setLine = (i: number, field: string, val: string | number) =>
    setLines(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: val } : l))

  const usedIds = lines.map(l => l.materialId).filter(Boolean)
  const availFor = (idx: number) => materials.filter(m => !usedIds.includes(m.id) || lines[idx].materialId === m.id)

  const total = lines.reduce((s, l) => s + (l.quantity || 0) * (Number(l.unitPrice) || 0), 0)

  const save = async () => {
    if (!supplierId) return setErr('Select a supplier')
    const valid = lines.filter(l => l.materialId && l.quantity > 0 && Number(l.unitPrice) > 0)
    if (!valid.length) return setErr('Add at least one item with material, qty and price')
    setLoad(true)
    try {
      await api.post('/purchase-orders', {
        supplierId,
        expectedDate: expectedDate || undefined,
        note: note || undefined,
        items: valid.map(l => ({ materialId: l.materialId, quantity: l.quantity, unitPrice: Number(l.unitPrice) })),
      })
      onSave(); onClose()
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Error') }
    finally { setLoad(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', overflowY: 'auto' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 700, maxWidth: '100%', fontFamily: FONT }}>
        <h2 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: DARK }}>New Purchase Order</h2>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748B' }}>Create a direct PO to a supplier. You can also convert a quoted RFQ to a PO from the RFQs page.</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <label style={{ gridColumn: '1/-1' }}>
            {lbl('Supplier *')}
            <select value={supplierId} onChange={e => setSupplier(e.target.value)} style={inp}>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label>
            {lbl('Expected Delivery Date')}
            <input type="date" value={expectedDate} onChange={e => setExpected(e.target.value)} style={inp} />
          </label>
          <label>
            {lbl('Note (optional)')}
            <input value={note} onChange={e => setNote(e.target.value)} style={inp} />
          </label>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: DARK, marginBottom: 8 }}>Line Items</div>
          <div style={{ background: '#F8FAFC', borderRadius: 8, padding: 12, border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 100px 120px 28px', gap: 8, marginBottom: 8 }}>
              {['Material', 'Qty', 'Unit Price (AED)', ''].map(h => (
                <span key={h} style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>{h}</span>
              ))}
            </div>
            {lines.map((line, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 100px 120px 28px', gap: 8, marginBottom: 6, alignItems: 'center' }}>
                <select value={line.materialId} onChange={e => setLine(i, 'materialId', e.target.value)} style={inp}>
                  <option value="">— select —</option>
                  {availFor(i).map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
                </select>
                <input type="number" min={1} value={line.quantity} onChange={e => setLine(i, 'quantity', Number(e.target.value))} style={inp} />
                <input type="number" min={0} step="0.01" value={line.unitPrice} onChange={e => setLine(i, 'unitPrice', e.target.value)} placeholder="0.00" style={inp} />
                <button onClick={() => setLines(prev => prev.filter((_, idx) => idx !== i))} style={{ border: 'none', background: 'transparent', color: '#EF4444', fontSize: 18, cursor: 'pointer', padding: 0 }}>×</button>
              </div>
            ))}
            {lines.length < materials.length && (
              <button onClick={() => setLines(prev => [...prev, { materialId: '', quantity: 1, unitPrice: '' }])}
                style={{ marginTop: 4, background: 'none', border: '1px dashed #CBD5E1', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 12, color: '#64748B', fontFamily: FONT }}>
                + Add Line
              </button>
            )}
          </div>
          {total > 0 && (
            <div style={{ textAlign: 'right', marginTop: 8, fontSize: 14, fontWeight: 700, color: DARK }}>
              Total: AED {total.toFixed(2)}
            </div>
          )}
        </div>

        {err && <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 12 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn label="Cancel" variant="secondary" onClick={onClose} />
          <Btn label={loading ? 'Creating…' : 'Create PO'} onClick={save} />
        </div>
      </div>
    </div>
  )
}

// ── Receive Goods Modal ────────────────────────────────────────────────────
// Each pending item has its own list of { warehouseId, quantity } rows
type DistRow = { warehouseId: string; quantity: number }

function ReceiveModal({ po, warehouses, onClose, onSave }: {
  po: PO; warehouses: Warehouse[]; onClose: () => void; onSave: () => void
}) {
  const pending = po.items.filter(i => i.quantity - i.receivedQty > 0)

  const [note,  setNote]  = useState('')
  const [hasLanded,  setHasLanded]  = useState(false)
  const [landedCost, setLandedCost] = useState('')
  const [landedMethod, setLandedMethod] = useState('credit')
  // itemDists: poItemId → list of distribution rows
  const [itemDists, setItemDists] = useState<Record<string, DistRow[]>>(
    Object.fromEntries(pending.map(i => [i.id, [{ warehouseId: warehouses[0]?.id ?? '', quantity: 0 }]]))
  )
  const [loading, setLoad] = useState(false)
  const [err,     setErr]  = useState('')

  const updateRow = (itemId: string, rowIdx: number, field: keyof DistRow, val: string | number) =>
    setItemDists(prev => ({
      ...prev,
      [itemId]: prev[itemId].map((r, i) => i === rowIdx ? { ...r, [field]: val } : r),
    }))

  const addRow = (itemId: string) =>
    setItemDists(prev => ({ ...prev, [itemId]: [...prev[itemId], { warehouseId: '', quantity: 0 }] }))

  const removeRow = (itemId: string, rowIdx: number) =>
    setItemDists(prev => ({ ...prev, [itemId]: prev[itemId].filter((_, i) => i !== rowIdx) }))

  const rowTotal = (itemId: string) => (itemDists[itemId] ?? []).reduce((s, r) => s + r.quantity, 0)

  const usedWh = (itemId: string, rowIdx: number) =>
    (itemDists[itemId] ?? []).filter((_, i) => i !== rowIdx).map(r => r.warehouseId)

  const save = async () => {
    const items = pending.map(i => ({
      poItemId: i.id,
      distributions: (itemDists[i.id] ?? []).filter(r => r.warehouseId && r.quantity > 0),
    })).filter(i => i.distributions.length > 0)

    if (!items.length) return setErr('Add at least one warehouse with qty > 0')

    for (const item of pending) {
      const total = rowTotal(item.id)
      const remaining = item.quantity - item.receivedQty
      if (total > remaining) return setErr(`${item.material.name}: total ${total} exceeds remaining ${remaining}`)
    }

    if (hasLanded && (!landedCost || Number(landedCost) <= 0)) return setErr('Enter the landed cost amount, or turn it off.')

    setLoad(true)
    try {
      await api.post(`/purchase-orders/${po.id}/receive`, {
        note: note || undefined,
        items,
        landedCost: hasLanded ? Number(landedCost) : undefined,
        landedCostMethod: hasLanded ? landedMethod : undefined,
      })
      onSave(); onClose()
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Error') }
    finally { setLoad(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', overflowY: 'auto' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 620, maxWidth: '100%', fontFamily: FONT }}>
        <h2 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: DARK }}>Receive Goods — {po.poNumber}</h2>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748B' }}>For each material, choose which warehouses receive stock and how many units each gets.</p>

        <label style={{ display: 'block', marginBottom: 20 }}>
          {lbl('Note (optional)')}
          <input value={note} onChange={e => setNote(e.target.value)} style={inp} />
        </label>

        {pending.length === 0 ? (
          <div style={{ color: '#94A3B8', fontSize: 13 }}>All items fully received.</div>
        ) : pending.map(item => {
          const remaining = item.quantity - item.receivedQty
          const total     = rowTotal(item.id)
          const over      = total > remaining
          return (
            <div key={item.id} style={{ marginBottom: 20, border: `1px solid ${over ? '#FECACA' : '#E2E8F0'}`, borderRadius: 10, overflow: 'hidden' }}>
              {/* Item header */}
              <div style={{ background: '#F8FAFC', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: DARK }}>
                  {item.material.name}
                  <span style={{ fontWeight: 400, color: '#64748B', marginLeft: 6, fontSize: 12 }}>{item.material.unit}</span>
                </div>
                <div style={{ fontSize: 12, color: over ? '#EF4444' : '#64748B', fontWeight: over ? 700 : 400 }}>
                  {total > 0 ? `${total} / ${remaining} remaining` : `${remaining} remaining`}
                  {item.receivedQty > 0 && ` (${item.receivedQty} already in)`}
                </div>
              </div>

              {/* Warehouse rows */}
              <div style={{ padding: '10px 14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 28px', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>Warehouse</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>Qty</span>
                  <span />
                </div>
                {(itemDists[item.id] ?? []).map((row, ri) => (
                  <div key={ri} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 28px', gap: 8, marginBottom: 6, alignItems: 'center' }}>
                    <select value={row.warehouseId} onChange={e => updateRow(item.id, ri, 'warehouseId', e.target.value)} style={inp}>
                      <option value="">— select warehouse —</option>
                      {warehouses
                        .filter(w => !usedWh(item.id, ri).includes(w.id))
                        .map(w => <option key={w.id} value={w.id}>{w.name}</option>)
                      }
                    </select>
                    <input
                      type="number" min={0} value={row.quantity}
                      onChange={e => updateRow(item.id, ri, 'quantity', Number(e.target.value))}
                      style={inp}
                    />
                    <button onClick={() => removeRow(item.id, ri)} style={{ border: 'none', background: 'transparent', color: '#EF4444', fontSize: 18, cursor: 'pointer', padding: 0 }}>×</button>
                  </div>
                ))}
                {(itemDists[item.id]?.length ?? 0) < warehouses.length && (
                  <button onClick={() => addRow(item.id)}
                    style={{ marginTop: 4, background: 'none', border: '1px dashed #CBD5E1', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12, color: '#64748B', fontFamily: FONT }}>
                    + Add Warehouse
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {/* Landed cost prompt */}
        {pending.length > 0 && (
          <div style={{ border: '1px solid #E2E8F0', borderRadius: 10, padding: '12px 14px', marginBottom: 16, background: '#F8FAFC' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: DARK, cursor: 'pointer' }}>
              <input type="checkbox" checked={hasLanded} onChange={e => setHasLanded(e.target.checked)} />
              Did you pay any landed cost on this delivery? (freight / customs duty / clearing)
            </label>
            {hasLanded && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
                  <div>
                    {lbl('Landed Cost (AED)')}
                    <input type="number" min={0} step="0.01" value={landedCost} onChange={e => setLandedCost(e.target.value)} placeholder="e.g. 200" style={inp} />
                  </div>
                  <div>
                    {lbl('Paid via')}
                    <select value={landedMethod} onChange={e => setLandedMethod(e.target.value)} style={inp}>
                      <option value="credit">On account (payable)</option>
                      <option value="cash">Cash</option>
                      <option value="card">Bank / Card</option>
                    </select>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 6 }}>
                  This is added to inventory value — posts: Debit Inventory, Credit {landedMethod === 'cash' ? 'Cash' : landedMethod === 'card' ? 'Bank' : 'Accounts Payable'}.
                </div>
              </>
            )}
          </div>
        )}

        {err && <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 12 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn label="Cancel" variant="secondary" onClick={onClose} />
          <Btn label={loading ? 'Receiving…' : 'Confirm Receipt'} onClick={save} />
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────
export function PurchaseOrdersPage() {
  const [data,       setData]  = useState<PO[]>([])
  const [suppliers,  setSupp]  = useState<Supplier[]>([])
  const [materials,  setMats]  = useState<Material[]>([])
  const [warehouses, setWh]    = useState<Warehouse[]>([])
  const [loading,    setLoad]  = useState(true)
  const [q,          setQ]     = useState('')
  const [statusFilter, setFilter] = useState<POStatus | 'all'>('all')
  const [showNew,    setNew]   = useState(false)
  const [receiving,  setReceiving] = useState<PO | null>(null)
  const [actLoad,    setActLoad] = useState<string | null>(null)
  const [detail,     setDetail] = useState<PO | null>(null)

  const load = async () => {
    setLoad(true)
    try {
      const [r, s, m, w] = await Promise.all([
        api.get<{ data: PO[] }>('/purchase-orders?pageSize=200'),
        api.get<{ data: Supplier[] }>('/suppliers?pageSize=200'),
        api.get<{ data: Material[] }>('/materials?pageSize=500'),
        api.get<{ data: Warehouse[] }>('/warehouses?pageSize=100'),
      ])
      setData(r.data); setSupp(s.data); setMats(m.data); setWh(w.data)
    } finally { setLoad(false) }
  }
  useEffect(() => { load() }, [])

  const action = async (id: string, endpoint: string, label: string) => {
    if (!window.confirm(`${label}?`)) return
    setActLoad(id)
    try { await api.post(`/purchase-orders/${id}/${endpoint}`, {}); load() }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Error') }
    finally { setActLoad(null) }
  }

  const openReceive = async (po: PO) => {
    // Fetch full PO with items
    const full = await api.get<PO>(`/purchase-orders/${po.id}`)
    setReceiving(full)
  }

  const openDetail = async (po: PO) => {
    const full = await api.get<PO>(`/purchase-orders/${po.id}`)
    setDetail(full)
  }

  const filtered = data.filter(r =>
    (statusFilter === 'all' || r.status === statusFilter) &&
    (r.supplier.name.toLowerCase().includes(q.toLowerCase()) || r.poNumber.toLowerCase().includes(q.toLowerCase()))
  )

  const btnBase: React.CSSProperties = { fontSize: 11, padding: '3px 8px', borderRadius: 5, cursor: 'pointer', fontFamily: FONT, border: '1px solid #E2E8F0', background: '#fff' }

  const rows = filtered.map(r => ({
    poNumber: <code style={{ fontSize: 12, cursor: 'pointer', color: '#1D4ED8' }} onClick={() => openDetail(r)}>{r.poNumber}</code>,
    supplier: r.supplier.name,
    lines:    r._count.items,
    total:    `AED ${Number(r.totalAmount).toFixed(2)}`,
    status:   <Badge label={STATUS_LABEL[r.status]} color={STATUS_COLOR[r.status]} />,
    expected: r.expectedDate ? r.expectedDate.slice(0, 10) : <span style={{ color: '#CBD5E1' }}>—</span>,
    actions: (
      <div style={{ display: 'flex', gap: 4 }}>
        {r.status === 'draft' && (
          <button onClick={() => action(r.id, 'confirm', 'Confirm this Purchase Order')} disabled={actLoad === r.id} style={{ ...btnBase, color: '#1D4ED8', borderColor: '#BFDBFE' }}>Confirm</button>
        )}
        {['confirmed', 'partially_received'].includes(r.status) && (
          <button onClick={() => openReceive(r)} style={{ ...btnBase, color: '#10B981', borderColor: '#A7F3D0' }}>Receive</button>
        )}
        {['draft', 'confirmed'].includes(r.status) && (
          <button onClick={() => action(r.id, 'cancel', 'Cancel this Purchase Order')} disabled={actLoad === r.id} style={{ ...btnBase, color: '#EF4444', borderColor: '#FECACA' }}>Cancel</button>
        )}
      </div>
    ),
  }))

  const COLS = [
    { key: 'poNumber', label: 'PO Number', width: 130 },
    { key: 'supplier', label: 'Supplier' },
    { key: 'lines',    label: 'Lines',    width: 60 },
    { key: 'total',    label: 'Total',    width: 120 },
    { key: 'status',   label: 'Status',   width: 110 },
    { key: 'expected', label: 'Expected', width: 100 },
    { key: 'actions',  label: '',         width: 160 },
  ]

  const totalValue = data.reduce((s, r) => s + Number(r.totalAmount), 0)

  return (
    <AdminLayout
      title="Purchase Orders"
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <SearchInput value={q} onChange={setQ} placeholder="Search supplier, PO number…" />
          <Btn label="+ New PO" onClick={() => setNew(true)} />
        </div>
      }
    >
      <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#14532D', fontFamily: FONT }}>
        <strong>Flow:</strong> Draft → Confirm → Receive Goods (auto-updates stock). You can also convert a quoted RFQ into a PO from the RFQs page.
      </div>

      <StatGrid>
        <StatCard label="Total POs"     value={String(data.length)}                                                  sub="All orders" />
        <StatCard label="Confirmed"     value={String(data.filter(r => r.status === 'confirmed').length)}             sub="Awaiting delivery" color="#1D4ED8" />
        <StatCard label="In Progress"   value={String(data.filter(r => r.status === 'partially_received').length)}    sub="Partial receipt"   color="#F59E0B" />
        <StatCard label="Total Value"   value={`AED ${totalValue.toFixed(0)}`}                                        sub="Across all POs"   color="#10B981" />
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
              <div style={{ fontWeight: 600, marginBottom: 6 }}>No purchase orders yet</div>
              <div style={{ fontSize: 13, marginBottom: 20 }}>Create a PO directly or convert a quoted RFQ.</div>
              <Btn label="+ New PO" onClick={() => setNew(true)} />
            </div>
          )
          : <><div style={{ fontSize: 13, color: '#64748B', marginBottom: 12, fontFamily: FONT }}>{filtered.length} orders</div><Table columns={COLS} rows={rows} /></>
      }

      {showNew && (
        <NewPOModal suppliers={suppliers} materials={materials} onClose={() => setNew(false)} onSave={load} />
      )}
      {receiving && (
        <ReceiveModal po={receiving} warehouses={warehouses} onClose={() => setReceiving(null)} onSave={load} />
      )}

      {/* Detail drawer */}
      {detail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ background: '#fff', width: 480, overflowY: 'auto', padding: 28, fontFamily: FONT }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: DARK }}>{detail.poNumber}</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{detail.supplier.name}</div>
              </div>
              <button onClick={() => setDetail(null)} style={{ border: 'none', background: 'transparent', fontSize: 20, cursor: 'pointer', color: '#94A3B8' }}>×</button>
            </div>
            <Badge label={STATUS_LABEL[detail.status]} color={STATUS_COLOR[detail.status]} />
            <div style={{ marginTop: 20 }}>
              {detail.items.map(item => {
                const received = item.receivedQty
                const pct = Math.round((received / item.quantity) * 100)
                return (
                  <div key={item.id} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, color: DARK }}>
                      <span>{item.material.name}</span>
                      <span>AED {(item.quantity * Number(item.unitPrice)).toFixed(2)}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>
                      {item.quantity} {item.material.unit} × AED {Number(item.unitPrice).toFixed(2)} — received {received} / {item.quantity}
                    </div>
                    <div style={{ background: '#E2E8F0', borderRadius: 4, height: 6 }}>
                      <div style={{ background: pct >= 100 ? '#10B981' : '#1D4ED8', borderRadius: 4, height: 6, width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 16, marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 14, color: DARK }}>
                <span>Total</span>
                <span>AED {Number(detail.totalAmount).toFixed(2)}</span>
              </div>
              {detail.note && <div style={{ fontSize: 12, color: '#64748B', marginTop: 8 }}>Note: {detail.note}</div>}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
