import React, { useEffect, useState } from 'react'
import { AdminLayout, Table, Btn, SearchInput, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

interface Warehouse { id: string; name: string }
interface MaterialStock {
  id: string; quantity: number
  material: { id: string; name: string; unit: string }
}
interface Movement {
  id: string; quantity: number; reference: string | null; note: string | null; createdAt: string
  material:  { id: string; name: string; unit: string }
  warehouse: { id: string; name: string }
}

const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }
const lbl = (t: string) => <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>{t}</span>

interface LineItem { materialId: string; physicalQty: number; systemQty: number }

function NewAdjustmentModal({ warehouses, onClose, onSave }: { warehouses: Warehouse[]; onClose: () => void; onSave: () => void }) {
  const [warehouseId, setWh]   = useState(warehouses[0]?.id ?? '')
  const [reason,      setReason] = useState('')
  const [note,        setNote]   = useState('')
  const [stocks,      setStocks] = useState<MaterialStock[]>([])
  const [lines,       setLines]  = useState<LineItem[]>([{ materialId: '', physicalQty: 0, systemQty: 0 }])
  const [loading,     setLoad]   = useState(false)
  const [err,         setErr]    = useState('')

  // Load materials with stock in the selected warehouse
  useEffect(() => {
    if (!warehouseId) return
    api.get<{ data: MaterialStock[] }>(`/stock/material-levels?warehouseId=${warehouseId}&pageSize=500`)
      .then(r => {
        setStocks(r.data)
        setLines([{ materialId: '', physicalQty: 0, systemQty: 0 }])
      })
      .catch(() => {})
  }, [warehouseId])

  const setLine = (i: number, field: keyof LineItem, val: string | number) =>
    setLines(prev => prev.map((l, idx) => {
      if (idx !== i) return l
      const updated = { ...l, [field]: val }
      // Auto-fill system qty when material is selected
      if (field === 'materialId') {
        const s = stocks.find(s => s.material.id === val)
        updated.systemQty = s?.quantity ?? 0
        updated.physicalQty = s?.quantity ?? 0
      }
      return updated
    }))

  const usedIds = lines.map(l => l.materialId).filter(Boolean)
  const availableFor = (idx: number) => stocks.filter(s => !usedIds.includes(s.material.id) || lines[idx].materialId === s.material.id)

  const save = async () => {
    if (!warehouseId)   return setErr('Select a warehouse')
    if (!reason.trim()) return setErr('Reason is required')
    const valid = lines.filter(l => l.materialId)
    if (!valid.length)  return setErr('Add at least one material')
    setLoad(true)
    try {
      await api.post('/stock-in/adjust', {
        warehouseId, reason, note: note || undefined,
        items: valid.map(l => ({ materialId: l.materialId, physicalQty: l.physicalQty })),
      })
      onSave(); onClose()
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Error') }
    finally { setLoad(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', overflowY: 'auto' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 700, fontFamily: FONT, maxWidth: '100%' }}>
        <h2 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: DARK }}>New Stock Adjustment</h2>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748B' }}>Compare system qty vs physical count. The difference is applied to stock immediately on save.</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <label>
            {lbl('Warehouse *')}
            <select value={warehouseId} onChange={e => setWh(e.target.value)} style={inp}>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </label>
          <label>
            {lbl('Reason *')}
            <input value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Physical count, Damage write-off" style={inp} />
          </label>
          <label style={{ gridColumn: '1/-1' }}>
            {lbl('Note (optional)')}
            <input value={note} onChange={e => setNote(e.target.value)} style={inp} />
          </label>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: DARK, marginBottom: 8 }}>Line Items</div>

          {stocks.length === 0 ? (
            <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: '#92400E' }}>
              No stock found in this warehouse. Receive stock first via Stock In.
            </div>
          ) : (
            <div style={{ background: '#F8FAFC', borderRadius: 8, padding: 12, border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 110px 110px 32px', gap: 8, marginBottom: 8 }}>
                {['Material', 'System Qty', 'Physical Qty (actual)', ''].map(h => (
                  <span key={h} style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>{h}</span>
                ))}
              </div>
              {lines.map((line, i) => {
                const avail = availableFor(i)
                const diff  = line.materialId ? line.physicalQty - line.systemQty : 0
                const diffColor = diff > 0 ? '#10B981' : diff < 0 ? '#EF4444' : '#94A3B8'
                return (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 110px 110px 32px', gap: 8, marginBottom: 6, alignItems: 'center' }}>
                    <select value={line.materialId} onChange={e => setLine(i, 'materialId', e.target.value)} style={inp}>
                      <option value="">— select material —</option>
                      {avail.map(s => (
                        <option key={s.material.id} value={s.material.id}>
                          {s.material.name} ({s.quantity} {s.material.unit})
                        </option>
                      ))}
                    </select>
                    <div style={{ position: 'relative' }}>
                      <input type="number" min={0} value={line.systemQty} readOnly style={{ ...inp, background: '#F8FAFC', color: '#94A3B8', cursor: 'not-allowed' }} />
                    </div>
                    <div>
                      <input type="number" min={0} value={line.physicalQty} onChange={e => setLine(i, 'physicalQty', Number(e.target.value))} style={{ ...inp, borderColor: diff !== 0 ? diffColor : '#E2E8F0' }} />
                      {line.materialId && diff !== 0 && (
                        <div style={{ fontSize: 11, color: diffColor, fontWeight: 600, marginTop: 2 }}>
                          {diff > 0 ? `+${diff}` : diff}
                        </div>
                      )}
                    </div>
                    <button onClick={() => setLines(prev => prev.filter((_, idx) => idx !== i))} style={{ border: 'none', background: 'transparent', color: '#EF4444', fontSize: 18, cursor: 'pointer', padding: 0 }}>×</button>
                  </div>
                )
              })}
              {lines.length < stocks.length && (
                <button onClick={() => setLines(prev => [...prev, { materialId: '', physicalQty: 0, systemQty: 0 }])} style={{ marginTop: 4, background: 'none', border: '1px dashed #CBD5E1', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 12, color: '#64748B', fontFamily: FONT }}>
                  + Add Material
                </button>
              )}
            </div>
          )}
        </div>

        {err && <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 12 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn label="Cancel" variant="secondary" onClick={onClose} />
          <Btn label={loading ? 'Applying…' : 'Apply Adjustment'} onClick={save} />
        </div>
      </div>
    </div>
  )
}

export function StockAdjustmentsPage() {
  const [data,      setData]  = useState<Movement[]>([])
  const [warehouses,setWh]    = useState<Warehouse[]>([])
  const [loading,   setLoad]  = useState(true)
  const [q,         setQ]     = useState('')
  const [showNew,   setNew]   = useState(false)

  const loadAdj = async () => {
    setLoad(true)
    try {
      const [adj, w] = await Promise.all([
        api.get<{ data: Movement[] }>('/stock-in/adjustments?pageSize=200'),
        api.get<{ data: Warehouse[] }>('/warehouses?pageSize=100'),
      ])
      setData(adj.data); setWh(w.data)
    } finally { setLoad(false) }
  }

  useEffect(() => { loadAdj() }, [])

  const filtered = data.filter(r =>
    r.material.name.toLowerCase().includes(q.toLowerCase()) ||
    r.warehouse.name.toLowerCase().includes(q.toLowerCase()) ||
    (r.reference ?? '').toLowerCase().includes(q.toLowerCase()) ||
    (r.note ?? '').toLowerCase().includes(q.toLowerCase())
  )

  const positiveAdj = data.filter(r => r.quantity > 0).length
  const negativeAdj = data.filter(r => r.quantity < 0).length

  const rows = filtered.map(r => ({
    ref:       <code style={{ fontSize: 12 }}>{r.reference ?? '—'}</code>,
    material:  r.material.name,
    warehouse: r.warehouse.name,
    diff: (
      <span style={{ fontWeight: 700, color: r.quantity > 0 ? '#10B981' : r.quantity < 0 ? '#EF4444' : '#94A3B8' }}>
        {r.quantity > 0 ? `+${r.quantity}` : r.quantity} {r.material.unit}
      </span>
    ),
    note:  r.note ? <span style={{ fontSize: 12, color: '#64748B' }}>{r.note}</span> : <span style={{ color: '#CBD5E1' }}>—</span>,
    date:  r.createdAt.slice(0, 10),
  }))

  const COLS = [
    { key: 'ref',       label: 'Reference',  width: 160 },
    { key: 'material',  label: 'Material' },
    { key: 'warehouse', label: 'Warehouse',  width: 150 },
    { key: 'diff',      label: 'Adjustment', width: 120 },
    { key: 'note',      label: 'Reason / Note', width: 220 },
    { key: 'date',      label: 'Date',       width: 100 },
  ]

  return (
    <AdminLayout
      title="Stock Adjustments"
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <SearchInput value={q} onChange={setQ} placeholder="Search material, warehouse…" />
          <Btn label="+ New Adjustment" onClick={() => setNew(true)} />
        </div>
      }
    >
      <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#166534', fontFamily: FONT }}>
        <strong>How it works:</strong> Select a warehouse — materials in stock appear automatically. Enter the physical count and the difference is applied to stock immediately.
      </div>

      <StatGrid>
        <StatCard label="Total Adjustments" value={String(new Set(data.map(r => r.reference)).size)} sub="Adjustment batches" />
        <StatCard label="Lines"             value={String(data.length)}                               sub="Material corrections" color="#1D4ED8" />
        <StatCard label="Increases"         value={String(positiveAdj)}                               sub="Qty added"           color="#10B981" />
        <StatCard label="Decreases"         value={String(negativeAdj)}                               sub="Qty removed"         color="#EF4444" />
      </StatGrid>

      {loading
        ? <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
        : data.length === 0
          ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8', fontFamily: FONT }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>No adjustments yet</div>
              <div style={{ fontSize: 13, marginBottom: 20 }}>Correct stock levels after a physical count or write-off.</div>
              <Btn label="+ New Adjustment" onClick={() => setNew(true)} />
            </div>
          )
          : <><div style={{ fontSize: 13, color: '#64748B', marginBottom: 12, fontFamily: FONT }}>{filtered.length} adjustment lines</div><Table columns={COLS} rows={rows} /></>
      }

      {showNew && warehouses.length > 0 && (
        <NewAdjustmentModal warehouses={warehouses} onClose={() => setNew(false)} onSave={loadAdj} />
      )}
    </AdminLayout>
  )
}
