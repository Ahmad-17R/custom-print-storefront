import React, { useEffect, useState } from 'react'
import { AdminLayout, Table, Btn, SearchInput, Badge, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

type SerialStatus = 'available' | 'sold' | 'returned' | 'defective'
interface Serial {
  id: string; serial: string; status: SerialStatus; createdAt: string
  variant: { id: string; sku: string; product: { name: string } }
}
interface Variant { id: string; sku: string; product: { name: string } }

const STATUS_COLOR: Record<SerialStatus, string> = { available: '#10B981', sold: '#1D4ED8', returned: '#F59E0B', defective: '#EF4444' }
const STATUS_LABEL: Record<SerialStatus, string> = { available: 'Available', sold: 'Sold', returned: 'Returned', defective: 'Defective' }
const STATUSES: SerialStatus[] = ['available', 'sold', 'returned', 'defective']

const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }
const lbl = (text: string) => <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>{text}</span>

function SerialModal({ serial, variants, onClose, onSave }: {
  serial: Partial<Serial> | null; variants: Variant[]; onClose: () => void; onSave: () => void
}) {
  const [variantId, setVariant] = useState(serial?.variant?.id ?? '')
  const [serialNum, setSerial]  = useState(serial?.serial ?? '')
  const [status, setStatus]     = useState<SerialStatus>(serial?.status ?? 'available')
  const [bulkMode, setBulk]     = useState(false)
  const [bulkText, setBulkText] = useState('')
  const [loading, setLoading]   = useState(false)
  const [err, setErr]           = useState('')

  const save = async () => {
    if (!variantId) return setErr('Select a variant')
    setLoading(true)
    try {
      if (serial?.id) {
        await api.patch(`/serials/${serial.id}`, { status })
      } else if (bulkMode) {
        const nums = bulkText.split(/[\n,]+/).map(s => s.trim()).filter(Boolean)
        if (!nums.length) return setErr('Enter at least one serial number')
        await Promise.all(nums.map(s => api.post('/serials', { variantId, serial: s, status })))
      } else {
        if (!serialNum.trim()) return setErr('Serial number is required')
        await api.post('/serials', { variantId, serial: serialNum.trim(), status })
      }
      onSave(); onClose()
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Error') }
    finally { setLoading(false) }
  }

  if (serial === null) return null
  const isEdit = !!serial.id

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 480, fontFamily: FONT }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: DARK }}>{isEdit ? 'Edit Serial Number' : 'Add Serial Number(s)'}</h2>

        <label style={{ display: 'block', marginBottom: 16 }}>
          {lbl('Product Variant *')}
          <select value={variantId} onChange={e => setVariant(e.target.value)} style={inp} disabled={isEdit}>
            <option value="">— select variant —</option>
            {variants.map(v => <option key={v.id} value={v.id}>{v.product.name} · {v.sku}</option>)}
          </select>
        </label>

        {!isEdit && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button onClick={() => setBulk(false)} style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: '1px solid #E2E8F0', background: !bulkMode ? DARK : '#fff', color: !bulkMode ? '#fff' : '#64748B', fontFamily: FONT, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Single</button>
            <button onClick={() => setBulk(true)}  style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: '1px solid #E2E8F0', background: bulkMode ? DARK : '#fff',  color: bulkMode ? '#fff' : '#64748B',  fontFamily: FONT, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Bulk (multiple)</button>
          </div>
        )}

        {!isEdit && !bulkMode && (
          <label style={{ display: 'block', marginBottom: 16 }}>
            {lbl('Serial Number *')}
            <input value={serialNum} onChange={e => setSerial(e.target.value)} placeholder="e.g. SN-2024-00001" style={inp} />
          </label>
        )}

        {!isEdit && bulkMode && (
          <label style={{ display: 'block', marginBottom: 16 }}>
            {lbl('Serial Numbers (one per line or comma-separated)')}
            <textarea value={bulkText} onChange={e => setBulkText(e.target.value)} rows={6} placeholder={'SN-001\nSN-002\nSN-003'} style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} />
          </label>
        )}

        <label style={{ display: 'block', marginBottom: 20 }}>
          {lbl('Status')}
          <select value={status} onChange={e => setStatus(e.target.value as SerialStatus)} style={inp}>
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
        </label>

        {err && <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 12 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn label="Cancel" variant="secondary" onClick={onClose} />
          <Btn label={loading ? 'Saving…' : isEdit ? 'Save' : bulkMode ? 'Add All' : 'Add'} onClick={save} />
        </div>
      </div>
    </div>
  )
}

export function SerialsPage() {
  const [data, setData]         = useState<Serial[]>([])
  const [variants, setVariants] = useState<Variant[]>([])
  const [loading, setLoading]   = useState(true)
  const [q, setQ]               = useState('')
  const [statusFilter, setFilter] = useState<SerialStatus | 'all'>('all')
  const [modal, setModal]       = useState<Partial<Serial> | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [r, v] = await Promise.all([
        api.get<{ data: Serial[] }>('/serials?pageSize=500'),
        api.get<{ data: Variant[] }>('/variants?pageSize=500'),
      ])
      setData(r.data); setVariants(v.data)
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const remove = async (id: string, serial: string) => {
    if (!window.confirm(`Delete serial "${serial}"?`)) return
    try { await api.delete(`/serials/${id}`); load() }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Delete failed') }
  }

  const filtered = data.filter(r =>
    (statusFilter === 'all' || r.status === statusFilter) &&
    (r.serial.toLowerCase().includes(q.toLowerCase()) || r.variant.product.name.toLowerCase().includes(q.toLowerCase()) || r.variant.sku.toLowerCase().includes(q.toLowerCase()))
  )

  const btnBase: React.CSSProperties = { fontSize: 12, padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: FONT }

  const rows = filtered.map(r => ({
    serial:  <code style={{ fontSize: 12 }}>{r.serial}</code>,
    product: r.variant.product.name,
    sku:     r.variant.sku,
    status:  <Badge label={STATUS_LABEL[r.status]} color={STATUS_COLOR[r.status]} />,
    created: r.createdAt.slice(0, 10),
    actions: (
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => setModal(r)} style={{ ...btnBase, border: '1px solid #E2E8F0', background: '#fff' }}>Edit</button>
        <button onClick={() => remove(r.id, r.serial)} style={{ ...btnBase, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626' }}>Delete</button>
      </div>
    ),
  }))

  const COLS = [
    { key: 'serial', label: 'Serial #', width: 160 }, { key: 'product', label: 'Product' },
    { key: 'sku', label: 'SKU', width: 120 }, { key: 'status', label: 'Status', width: 110 },
    { key: 'created', label: 'Created', width: 100 }, { key: 'actions', label: '', width: 130 },
  ]

  return (
    <AdminLayout title="Serial Numbers" actions={<></>}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center', maxWidth: 420, fontFamily: FONT }}>
          <div style={{ marginBottom: 16, color: "#991B1B" }}><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg></div>
          <div style={{ fontWeight: 700, fontSize: 18, color: '#991B1B', marginBottom: 8 }}>Temporarily Unavailable</div>
          <div style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6 }}>
            This module has been made unavailable by <strong>Ahmad</strong> — Serial Number tracking is not necessary for the Custom Print ERP and has been disabled to keep the system focused.
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
