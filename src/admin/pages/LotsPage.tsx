import React, { useEffect, useState } from 'react'
import { AdminLayout, Table, Btn, SearchInput, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

interface Lot {
  id: string; lotNumber: string; qty: number; expiresAt: string | null; manufacturedAt: string | null; createdAt: string
  variant: { id: string; sku: string; product: { name: string } }
  warehouse: { id: string; name: string }
}
interface Warehouse { id: string; name: string }
interface Variant { id: string; sku: string; product: { name: string } }

const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }
const lbl = (text: string) => <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>{text}</span>

function LotModal({ lot, warehouses, variants, onClose, onSave }: {
  lot: Partial<Lot> | null; warehouses: Warehouse[]; variants: Variant[]; onClose: () => void; onSave: () => void
}) {
  const [variantId, setVariant]   = useState(lot?.variant?.id ?? '')
  const [warehouseId, setWh]      = useState(lot?.warehouse?.id ?? warehouses[0]?.id ?? '')
  const [lotNumber, setLotNumber] = useState(lot?.lotNumber ?? '')
  const [qty, setQty]             = useState(String(lot?.qty ?? 1))
  const [expiresAt, setExpiry]    = useState(lot?.expiresAt ? lot.expiresAt.slice(0, 10) : '')
  const [mfgAt, setMfg]           = useState(lot?.manufacturedAt ? lot.manufacturedAt.slice(0, 10) : '')
  const [loading, setLoading]     = useState(false)
  const [err, setErr]             = useState('')

  const save = async () => {
    if (!variantId) return setErr('Select a variant')
    if (!warehouseId) return setErr('Select a warehouse')
    if (!lotNumber.trim()) return setErr('Lot number is required')
    if (Number(qty) < 1) return setErr('Quantity must be at least 1')
    setLoading(true)
    try {
      const body = { variantId, warehouseId, lotNumber, qty: Number(qty), expiresAt: expiresAt || undefined, manufacturedAt: mfgAt || undefined }
      if (lot?.id) await api.patch(`/lots/${lot.id}`, body)
      else         await api.post('/lots', body)
      onSave(); onClose()
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Error') }
    finally { setLoading(false) }
  }

  if (!lot) return null
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 500, fontFamily: FONT }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: DARK }}>{lot.id ? 'Edit Lot' : 'New Lot / Batch'}</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <label style={{ gridColumn: '1/-1' }}>
            {lbl('Product Variant *')}
            <select value={variantId} onChange={e => setVariant(e.target.value)} style={inp}>
              <option value="">— select variant —</option>
              {variants.map(v => <option key={v.id} value={v.id}>{v.product.name} · {v.sku}</option>)}
            </select>
          </label>
          <label>
            {lbl('Warehouse *')}
            <select value={warehouseId} onChange={e => setWh(e.target.value)} style={inp}>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </label>
          <label>
            {lbl('Lot Number *')}
            <input value={lotNumber} onChange={e => setLotNumber(e.target.value)} placeholder="e.g. LOT-2024-001" style={inp} />
          </label>
          <label>
            {lbl('Quantity *')}
            <input type="number" min={1} value={qty} onChange={e => setQty(e.target.value)} style={inp} />
          </label>
          <label>
            {lbl('Expiry Date')}
            <input type="date" value={expiresAt} onChange={e => setExpiry(e.target.value)} style={inp} />
          </label>
          <label>
            {lbl('Manufactured Date')}
            <input type="date" value={mfgAt} onChange={e => setMfg(e.target.value)} style={inp} />
          </label>
        </div>

        {err && <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 12 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn label="Cancel" variant="secondary" onClick={onClose} />
          <Btn label={loading ? 'Saving…' : 'Save'} onClick={save} />
        </div>
      </div>
    </div>
  )
}

export function LotsPage() {
  const [data, setData]         = useState<Lot[]>([])
  const [warehouses, setWh]     = useState<Warehouse[]>([])
  const [variants, setVariants] = useState<Variant[]>([])
  const [loading, setLoading]   = useState(true)
  const [q, setQ]               = useState('')
  const [modal, setModal]       = useState<Partial<Lot> | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [r, w, v] = await Promise.all([
        api.get<{ data: Lot[] }>('/lots?pageSize=500'),
        api.get<{ data: Warehouse[] }>('/warehouses?pageSize=100'),
        api.get<{ data: Variant[] }>('/variants?pageSize=500'),
      ])
      setData(r.data); setWh(w.data); setVariants(v.data)
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const remove = async (id: string, lotNumber: string) => {
    if (!window.confirm(`Delete lot "${lotNumber}"?`)) return
    try { await api.delete(`/lots/${id}`); load() }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Delete failed') }
  }

  const now = new Date()
  const expiringSoon = data.filter(r => {
    if (!r.expiresAt) return false
    const d = new Date(r.expiresAt); const days = (d.getTime() - now.getTime()) / 86400000
    return days >= 0 && days <= 30
  }).length
  const expired = data.filter(r => r.expiresAt && new Date(r.expiresAt) < now).length

  const filtered = data.filter(r =>
    r.lotNumber.toLowerCase().includes(q.toLowerCase()) ||
    r.variant.product.name.toLowerCase().includes(q.toLowerCase()) ||
    r.variant.sku.toLowerCase().includes(q.toLowerCase()) ||
    r.warehouse.name.toLowerCase().includes(q.toLowerCase())
  )

  const btnBase: React.CSSProperties = { fontSize: 12, padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: FONT }

  const expiryChip = (expiresAt: string | null) => {
    if (!expiresAt) return <span style={{ color: '#94A3B8' }}>—</span>
    const d = new Date(expiresAt); const days = (d.getTime() - now.getTime()) / 86400000
    const col = days < 0 ? '#EF4444' : days <= 30 ? '#F59E0B' : '#10B981'
    return <span style={{ color: col, fontWeight: 600, fontSize: 12 }}>{d.toLocaleDateString()}{days < 0 ? '' : days <= 30 ? '' : ''}</span>
  }

  const rows = filtered.map(r => ({
    lotNumber: <code style={{ fontSize: 12 }}>{r.lotNumber}</code>,
    product:   r.variant.product.name,
    sku:       r.variant.sku,
    warehouse: r.warehouse.name,
    qty:       r.qty,
    expiresAt: expiryChip(r.expiresAt),
    created:   r.createdAt.slice(0, 10),
    actions: (
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => setModal(r)} style={{ ...btnBase, border: '1px solid #E2E8F0', background: '#fff' }}>Edit</button>
        <button onClick={() => remove(r.id, r.lotNumber)} style={{ ...btnBase, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626' }}>Delete</button>
      </div>
    ),
  }))

  const COLS = [
    { key: 'lotNumber', label: 'Lot #', width: 130 }, { key: 'product', label: 'Product' },
    { key: 'sku', label: 'SKU', width: 120 }, { key: 'warehouse', label: 'Warehouse', width: 140 },
    { key: 'qty', label: 'Qty', width: 70 }, { key: 'expiresAt', label: 'Expiry', width: 120 },
    { key: 'created', label: 'Created', width: 100 }, { key: 'actions', label: '', width: 130 },
  ]

  return (
    <AdminLayout title="Lots & Batches" actions={<></>}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center', maxWidth: 420, fontFamily: FONT }}>
          <div style={{ marginBottom: 16, color: "#991B1B" }}><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg></div>
          <div style={{ fontWeight: 700, fontSize: 18, color: '#991B1B', marginBottom: 8 }}>Temporarily Unavailable</div>
          <div style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6 }}>
            This module has been made unavailable by <strong>Ahmad</strong> — Lot &amp; Batch tracking is not necessary for the Custom Print ERP and has been disabled to keep the system focused.
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
