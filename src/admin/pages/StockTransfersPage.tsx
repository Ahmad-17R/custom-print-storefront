import React, { useEffect, useState } from 'react'
import { AdminLayout, Table, Btn, SearchInput, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

interface Warehouse { id: string; name: string }
interface MaterialStock {
  id: string; quantity: number
  material: { id: string; name: string; unit: string }
  warehouse: { id: string; name: string }
}
interface Transfer {
  id: string; quantity: number; reference: string | null; note: string | null; createdAt: string
  material:  { id: string; name: string; unit: string }
  warehouse: { id: string; name: string }
}

const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }
const lbl = (t: string) => <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>{t}</span>

interface LineItem { materialId: string; quantity: number }

function NewTransferModal({ warehouses, onClose, onSave }: { warehouses: Warehouse[]; onClose: () => void; onSave: () => void }) {
  const [fromId,   setFrom]  = useState(warehouses[0]?.id ?? '')
  const [toId,     setTo]    = useState(warehouses[1]?.id ?? '')
  const [note,     setNote]  = useState('')
  const [lines,    setLines] = useState<LineItem[]>([{ materialId: '', quantity: 1 }])
  const [stocks,   setStocks] = useState<MaterialStock[]>([])
  const [loading,  setLoad]  = useState(false)
  const [err,      setErr]   = useState('')

  // Load materials available in the source warehouse whenever fromId changes
  useEffect(() => {
    if (!fromId) return
    api.get<{ data: MaterialStock[] }>(`/stock/material-levels?warehouseId=${fromId}&pageSize=500`)
      .then(r => {
        setStocks(r.data.filter(s => s.quantity > 0))
        setLines([{ materialId: '', quantity: 1 }])
      })
      .catch(() => {})
  }, [fromId])

  const setLine = (i: number, field: keyof LineItem, val: string | number) =>
    setLines(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: val } : l))

  const availableFor = (idx: number) => {
    const usedIds = lines.filter((_, i) => i !== idx).map(l => l.materialId)
    return stocks.filter(s => !usedIds.includes(s.material.id))
  }

  const maxQty = (materialId: string) =>
    stocks.find(s => s.material.id === materialId)?.quantity ?? 0

  const save = async () => {
    if (!fromId || !toId)          return setErr('Select both warehouses')
    if (fromId === toId)           return setErr('Source and destination must differ')
    const valid = lines.filter(l => l.materialId && l.quantity > 0)
    if (!valid.length)             return setErr('Add at least one item')
    setLoad(true)
    try {
      await api.post('/stock-in/transfer', {
        fromWarehouseId: fromId,
        toWarehouseId:   toId,
        note:            note || undefined,
        items: valid.map(l => ({ materialId: l.materialId, quantity: l.quantity })),
      })
      onSave(); onClose()
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Error') }
    finally { setLoad(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', overflowY: 'auto' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 640, fontFamily: FONT, maxWidth: '100%' }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: DARK }}>New Stock Transfer</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <label>
            {lbl('From Warehouse *')}
            <select value={fromId} onChange={e => setFrom(e.target.value)} style={inp}>
              {warehouses.filter(w => w.id !== toId).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </label>
          <label>
            {lbl('To Warehouse *')}
            <select value={toId} onChange={e => setTo(e.target.value)} style={inp}>
              {warehouses.filter(w => w.id !== fromId).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </label>
          <label style={{ gridColumn: '1/-1' }}>
            {lbl('Note')}
            <input value={note} onChange={e => setNote(e.target.value)} style={inp} />
          </label>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: DARK, marginBottom: 8 }}>Materials to Transfer</div>

          {stocks.length === 0 ? (
            <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: '#92400E' }}>
              No stock available in the selected source warehouse.
            </div>
          ) : (
            <div style={{ background: '#F8FAFC', borderRadius: 8, padding: 12, border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '3fr 120px 32px', gap: 8, marginBottom: 8 }}>
                {['Material (available qty)', 'Quantity', ''].map(h => (
                  <span key={h} style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>{h}</span>
                ))}
              </div>
              {lines.map((line, i) => {
                const avail = availableFor(i)
                const max   = maxQty(line.materialId)
                const stock = stocks.find(s => s.material.id === line.materialId)
                return (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '3fr 120px 32px', gap: 8, marginBottom: 6, alignItems: 'center' }}>
                    <select value={line.materialId} onChange={e => setLine(i, 'materialId', e.target.value)} style={inp}>
                      <option value="">— select material —</option>
                      {avail.map(s => (
                        <option key={s.material.id} value={s.material.id}>
                          {s.material.name} ({s.quantity} {s.material.unit} available)
                        </option>
                      ))}
                      {line.materialId && !avail.find(s => s.material.id === line.materialId) && stock && (
                        <option value={line.materialId}>{stock.material.name}</option>
                      )}
                    </select>
                    <input
                      type="number" min={1} max={max || undefined} value={line.quantity}
                      onChange={e => setLine(i, 'quantity', Math.min(Number(e.target.value), max || 999999))}
                      style={inp}
                    />
                    <button onClick={() => setLines(prev => prev.filter((_, idx) => idx !== i))} style={{ border: 'none', background: 'transparent', color: '#EF4444', fontSize: 18, cursor: 'pointer', padding: 0 }}>×</button>
                  </div>
                )
              })}
              {lines.length < stocks.length && (
                <button
                  onClick={() => setLines(prev => [...prev, { materialId: '', quantity: 1 }])}
                  style={{ marginTop: 4, background: 'none', border: '1px dashed #CBD5E1', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 12, color: '#64748B', fontFamily: FONT }}
                >+ Add Material</button>
              )}
            </div>
          )}
        </div>

        {err && <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 12 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn label="Cancel" variant="secondary" onClick={onClose} />
          <Btn label={loading ? 'Transferring…' : 'Transfer Stock'} onClick={save} />
        </div>
      </div>
    </div>
  )
}

export function StockTransfersPage() {
  const [data,      setData]  = useState<Transfer[]>([])
  const [warehouses,setWh]    = useState<Warehouse[]>([])
  const [loading,   setLoad]  = useState(true)
  const [q,         setQ]     = useState('')
  const [showNew,   setNew]   = useState(false)

  const load = async () => {
    setLoad(true)
    try {
      const [r, w] = await Promise.all([
        api.get<{ data: Transfer[] }>('/stock-in/transfers?pageSize=200'),
        api.get<{ data: Warehouse[] }>('/warehouses?pageSize=100'),
      ])
      setData(r.data); setWh(w.data)
    } finally { setLoad(false) }
  }
  useEffect(() => { load() }, [])

  const filtered = data.filter(r =>
    r.material.name.toLowerCase().includes(q.toLowerCase()) ||
    r.warehouse.name.toLowerCase().includes(q.toLowerCase()) ||
    (r.reference ?? '').toLowerCase().includes(q.toLowerCase())
  )

  // Group by reference for display
  const grouped = filtered.reduce<Record<string, Transfer[]>>((acc, r) => {
    const key = r.reference ?? r.id
    if (!acc[key]) acc[key] = []
    acc[key].push(r)
    return acc
  }, {})

  const rows = Object.entries(grouped).map(([ref, items]) => ({
    ref:      <code style={{ fontSize: 12 }}>{ref}</code>,
    from:     items[0].warehouse.name,
    materials: items.map(i => `${i.material.name} (${Math.abs(i.quantity)} ${i.material.unit})`).join(', '),
    date:     items[0].createdAt.slice(0, 10),
    note:     items[0].note ?? <span style={{ color: '#CBD5E1' }}>—</span>,
  }))

  const COLS = [
    { key: 'ref',       label: 'Reference',  width: 160 },
    { key: 'from',      label: 'From Warehouse', width: 160 },
    { key: 'materials', label: 'Materials' },
    { key: 'date',      label: 'Date',       width: 100 },
    { key: 'note',      label: 'Note',       width: 180 },
  ]

  const uniqueRefs = Object.keys(grouped).length

  return (
    <AdminLayout
      title="Stock Transfers"
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <SearchInput value={q} onChange={setQ} placeholder="Search material, warehouse, ref…" />
          <Btn label="+ New Transfer" onClick={() => setNew(true)} />
        </div>
      }
    >
      <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#92400E', fontFamily: FONT }}>
        <strong>How it works:</strong> Select the source warehouse — only materials with available stock are shown. Pick quantities and destination. Stock levels update immediately on submit.
      </div>

      <StatGrid>
        <StatCard label="Total Transfers" value={String(uniqueRefs)}                                        sub="Completed batches" />
        <StatCard label="Lines Moved"     value={String(data.length)}                                       sub="Material movements" color="#1D4ED8" />
        <StatCard label="Warehouses"      value={String(new Set(data.map(r => r.warehouse.id)).size)}       sub="Source warehouses"  />
        <StatCard label="Materials"       value={String(new Set(data.map(r => r.material.id)).size)}        sub="Unique materials"   color="#10B981" />
      </StatGrid>

      {loading
        ? <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
        : data.length === 0
          ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8', fontFamily: FONT }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>No transfers yet</div>
              <div style={{ fontSize: 13, marginBottom: 20 }}>Move stock between warehouses by creating a transfer.</div>
              <Btn label="+ New Transfer" onClick={() => setNew(true)} />
            </div>
          )
          : <><div style={{ fontSize: 13, color: '#64748B', marginBottom: 12, fontFamily: FONT }}>{rows.length} transfers</div><Table columns={COLS} rows={rows} /></>
      }

      {showNew && warehouses.length >= 2 && (
        <NewTransferModal warehouses={warehouses} onClose={() => setNew(false)} onSave={load} />
      )}
      {showNew && warehouses.length < 2 && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, fontFamily: FONT, width: 360, textAlign: 'center' }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>At least 2 warehouses required</div>
            <Btn label="Close" variant="secondary" onClick={() => setNew(false)} />
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
