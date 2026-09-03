import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminLayout, Btn, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'
import { useAuth } from '../lib/AuthContext'

const FONT  = "'Poppins', system-ui, sans-serif"
const DARK  = '#0F172A'
const BLUE  = '#3B82F6'
const GREEN = '#10B981'

const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }
const lbl = (t: string) => <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>{t}</span>
const fmt = (n: any) => Number(n).toFixed(2)

// ── Interfaces ────────────────────────────────────────────────────────────────
export interface Customer { id: string; name: string; phone?: string; email?: string; company?: string }
export interface Product { id: string; name: string }
export interface Supplier { id: string; name: string }
export interface Material { id: string; name: string; unit: string }

interface SaleItem { id: string; productId: string; productName: string; quantity: number; unitPrice: number; total: number; customization?: string; product?: Product }
interface Payment  { id: string; amount: number; type: string; method: string; note?: string; paidAt: string }
interface JobMaterial { id: string; name: string; materialId?: string; quantity: number; unitCost: number; totalCost: number; note?: string }
interface Job {
  id: string; stepName: string; status: string; sortOrder: number
  itemId?: string; productName?: string
  type: string; supplierId?: string; supplierCost?: number; supplierStatus?: string; note?: string
  assignedToId?: string
  assignedTo?: { id: string; name: string; jobTitle?: string }
  supplier?: { id: string; name: string }
  materials: JobMaterial[]
}
export interface Worker { id: string; name: string; jobTitle?: string; activeJobs: number }
export interface Warehouse { id: string; name: string }
interface Sale {
  id: string; saleNumber: string; status: string; totalAmount: number; advancePaid: number; dueDate?: string; note?: string; createdAt: string
  handlingWarehouseId?: string | null
  customer: Customer; items: SaleItem[]; payments: Payment[]; jobs: Job[]
  _count: { items: number; payments: number }
}
interface SaleRow {
  id: string; saleNumber: string; status: string; totalAmount: number; advancePaid: number; createdAt: string
  customer: { id: string; name: string; phone?: string }
  _count: { items: number; jobs: number }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending:          { bg: '#FEF9C3', color: '#854D0E' },
  confirmed:        { bg: '#DBEAFE', color: '#1E40AF' },
  in_production:    { bg: '#EDE9FE', color: '#5B21B6' },
  ready_for_pickup: { bg: '#D1FAE5', color: '#065F46' },
  completed:        { bg: '#F0FDF4', color: '#166534' },
  cancelled:        { bg: '#FEE2E2', color: '#991B1B' },
}
const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending', confirmed: 'Confirmed', in_production: 'In Production',
  ready_for_pickup: 'Ready for Pickup', completed: 'Completed', cancelled: 'Cancelled',
}
const SUPPLIER_STATUS_OPTS = [
  { value: 'waiting_to_send',       label: 'Waiting to Send' },
  { value: 'sent_to_supplier',      label: 'Sent to Supplier' },
  { value: 'received_from_supplier',label: 'Received from Supplier' },
]
const STEP_STATUS_OPTS = ['pending', 'in_progress', 'done']

function StatusPill({ status }: { status: string }) {
  const s = STATUS_COLORS[status] ?? { bg: '#F1F5F9', color: '#64748B' }
  return <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: s.bg, color: s.color }}>{STATUS_LABELS[status] ?? status}</span>
}

function StepBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    pending:     { bg: '#F1F5F9', color: '#94A3B8', label: 'Pending' },
    in_progress: { bg: '#FEF3C7', color: '#92400E', label: 'In Progress' },
    done:        { bg: '#D1FAE5', color: '#065F46', label: 'Done' },
  }
  const s = map[status] ?? map.pending
  return <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: s.bg, color: s.color }}>{s.label}</span>
}

// ── New Sale Modal ────────────────────────────────────────────────────────────
function NewSaleModal({ customers, products, onClose, onSaved }: {
  customers: Customer[]; products: Product[]; onClose: () => void; onSaved: () => void
}) {
  const [customerId, setCustomer] = useState('')
  const [note,       setNote]     = useState('')
  const [dueDate,    setDue]      = useState('')
  const [advAmt,     setAdv]      = useState('')
  const [advMethod,  setAdvM]     = useState('cash')
  const [items,      setItems]    = useState<{ productId: string; quantity: number; unitPrice: number; customization: string }[]>([])
  const [err,        setErr]      = useState('')
  const [saving,     setSaving]   = useState(false)

  const addItem = () => {
    const pid = products.find(p => !items.find(i => i.productId === p.id))?.id ?? products[0]?.id
    if (pid) setItems(prev => [...prev, { productId: pid, quantity: 1, unitPrice: 0, customization: '' }])
  }
  const removeItem = (idx: number) => setItems(p => p.filter((_, i) => i !== idx))
  const setItem = (idx: number, key: string, val: any) => setItems(p => p.map((it, i) => i === idx ? { ...it, [key]: val } : it))

  const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
  const advance = parseFloat(advAmt) || 0

  const save = async () => {
    if (!customerId) return setErr('Select a customer')
    if (!items.length) return setErr('Add at least one product')
    if (items.some(i => i.unitPrice <= 0)) return setErr('Set price for all items')
    setSaving(true)
    try {
      await api.post('/walk-in-sales', { customerId, note, dueDate, advanceAmount: advance, advanceMethod: advMethod, items })
      onSaved(); onClose()
    } catch (e: any) { setErr(e.message ?? 'Error') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', overflowY: 'auto' }}>
      <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 640, fontFamily: FONT, padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: DARK }}>New Walk-in Sale</h2>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 22, cursor: 'pointer', color: '#94A3B8' }}>×</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
          <label style={{ gridColumn: '1 / -1' }}>
            {lbl('Customer *')}
            <select value={customerId} onChange={e => setCustomer(e.target.value)} style={inp}>
              <option value="">— select customer —</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` · ${c.phone}` : ''}</option>)}
            </select>
          </label>
          <label>{lbl('Due Date')}<input type="date" value={dueDate} onChange={e => setDue(e.target.value)} style={inp} /></label>
          <label>{lbl('Note')}<input value={note} onChange={e => setNote(e.target.value)} placeholder="Order notes…" style={inp} /></label>
        </div>

        {/* Products */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: DARK }}>Products</span>
            <Btn label="+ Add Product" variant="secondary" onClick={addItem} />
          </div>
          {items.length === 0 && <div style={{ textAlign: 'center', padding: '16px 0', color: '#94A3B8', fontSize: 13 }}>No products yet</div>}
          {items.map((it, idx) => (
            <div key={idx} style={{ background: '#F8FAFC', borderRadius: 10, padding: '12px 14px', marginBottom: 8, border: '1px solid #F1F5F9' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 90px', gap: 8, marginBottom: 8 }}>
                <select value={it.productId} onChange={e => setItem(idx, 'productId', e.target.value)} style={inp}>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input type="number" min={1} value={it.quantity} onChange={e => setItem(idx, 'quantity', Number(e.target.value))} placeholder="Qty" style={inp} />
                <input type="number" min={0} step="0.01" value={it.unitPrice || ''} onChange={e => setItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)} placeholder="Price" style={inp} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={it.customization} onChange={e => setItem(idx, 'customization', e.target.value)} placeholder="Customization notes…" style={{ ...inp, flex: 1 }} />
                <button onClick={() => removeItem(idx)} style={{ border: 'none', background: '#FEE2E2', color: '#DC2626', borderRadius: 8, padding: '0 12px', cursor: 'pointer', fontSize: 16 }}>×</button>
              </div>
            </div>
          ))}
        </div>

        {/* Advance payment */}
        <div style={{ background: '#F0FDF4', borderRadius: 10, padding: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#065F46', marginBottom: 10 }}>Advance Payment</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label>{lbl('Amount (AED)')}
              <input type="number" min={0} step="0.01" value={advAmt} onChange={e => setAdv(e.target.value)} placeholder="0.00" style={inp} />
            </label>
            <label>{lbl('Method')}
              <select value={advMethod} onChange={e => setAdvM(e.target.value)} style={inp}>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </label>
          </div>
        </div>

        {/* Summary */}
        {items.length > 0 && (
          <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: '#64748B' }}>Total: <strong style={{ color: DARK }}>AED {fmt(total)}</strong></span>
            <span style={{ color: '#64748B' }}>Balance: <strong style={{ color: '#EF4444' }}>AED {fmt(Math.max(0, total - advance))}</strong></span>
          </div>
        )}

        {err && <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 10 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn label="Cancel" variant="secondary" onClick={onClose} />
          <Btn label={saving ? 'Creating…' : 'Create Sale'} onClick={save} />
        </div>
      </div>
    </div>
  )
}

// ── Payment Modal ─────────────────────────────────────────────────────────────
function PaymentModal({ sale, onClose, onSaved }: { sale: Sale; onClose: () => void; onSaved: () => void }) {
  const balance = sale.totalAmount - sale.advancePaid
  const [amount, setAmount] = useState(String(Math.max(0, balance).toFixed(2)))
  const [type,   setType]   = useState('balance')
  const [method, setMethod] = useState('cash')
  const [note,   setNote]   = useState('')
  const [err,    setErr]    = useState('')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) return setErr('Enter a valid amount')
    setSaving(true)
    try {
      await api.post(`/walk-in-sales/${sale.id}/payments`, { amount: amt, type, method, note })
      onSaved(); onClose()
    } catch (e: any) { setErr(e.message ?? 'Error') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 26, width: 400, fontFamily: FONT }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: DARK }}>Record Payment</h3>
        <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: '#64748B' }}>Order Total</span><span style={{ fontWeight: 600 }}>AED {fmt(Number(sale.totalAmount))}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: '#64748B' }}>Collected</span><span style={{ color: GREEN, fontWeight: 600 }}>AED {fmt(Number(sale.advancePaid))}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E2E8F0', paddingTop: 6, marginTop: 4 }}>
            <span style={{ color: '#64748B' }}>Balance Due</span><span style={{ color: '#EF4444', fontWeight: 700 }}>AED {fmt(Math.max(0, Number(balance)))}</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 14 }}>
          <label>{lbl('Amount (AED)')}
            <input type="number" min={0} step="0.01" value={amount} onChange={e => setAmount(e.target.value)} style={inp} />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label>{lbl('Type')}
              <select value={type} onChange={e => setType(e.target.value)} style={inp}>
                <option value="advance">Advance</option>
                <option value="balance">Balance</option>
                <option value="partial">Partial</option>
              </select>
            </label>
            <label>{lbl('Method')}
              <select value={method} onChange={e => setMethod(e.target.value)} style={inp}>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </label>
          </div>
          <label>{lbl('Note')}<input value={note} onChange={e => setNote(e.target.value)} placeholder="Optional note…" style={inp} /></label>
        </div>
        {err && <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 10 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn label="Cancel" variant="secondary" onClick={onClose} />
          <Btn label={saving ? 'Saving…' : 'Record Payment'} onClick={save} />
        </div>
      </div>
    </div>
  )
}

// ── Job Step Panel ────────────────────────────────────────────────────────────
function JobStepPanel({ job, saleId, suppliers, materials, workers, whStock, locked, preConfirm, onUpdated, onWorkerChange }: {
  job: Job; saleId: string; suppliers: Supplier[]; materials: Material[]; workers: Worker[]; whStock: Record<string, number>; locked: boolean; preConfirm: boolean; onUpdated: () => void; onWorkerChange: () => void
}) {
  const [expanded,       setExpanded]    = useState(false)
  const [saving,         setSaving]      = useState(false)
  const [type,           setType]        = useState(job.type)
  const [assignedToId,   setAssigned]    = useState(job.assignedToId ?? '')
  const [supplierId,     setSupplier]    = useState(job.supplierId ?? '')
  const [supplierCost,   setSupCost]     = useState(String(job.supplierCost ?? ''))
  const [supplierStatus, setSupStatus]   = useState(job.supplierStatus ?? '')
  const [stepStatus,     setStepStatus]  = useState(job.status)
  const [addingMat,      setAddingMat]   = useState(false)
  const [matName,        setMatName]     = useState('')
  const [matId,          setMatId]       = useState('')
  const [matQty,         setMatQty]      = useState('1')
  const [matNote,        setMatNote]     = useState('')
  const [matSaving,      setMatSaving]   = useState(false)
  const [matError,       setMatError]    = useState('')
  const [editMatId,      setEditMatId]   = useState('')
  const [editQty,        setEditQty]     = useState('')

  const saveJob = async (patch: Record<string, any>) => {
    setSaving(true)
    try {
      await api.patch(`/walk-in-sales/${saleId}/jobs/${job.id}`, patch)
      onUpdated()
    } finally { setSaving(false) }
  }

  const saveMat = async () => {
    if (!matName.trim()) return
    setMatSaving(true); setMatError('')
    try {
      await api.post(`/walk-in-sales/${saleId}/jobs/${job.id}/materials`, { name: matName.trim(), materialId: matId || undefined, quantity: parseFloat(matQty) || 1, note: matNote })
      setMatName(''); setMatId(''); setMatQty('1'); setMatNote(''); setAddingMat(false)
      onUpdated(); onWorkerChange()
    } catch (e: any) { setMatError(e?.message ?? 'Could not add material') }
    finally { setMatSaving(false) }
  }

  const saveEditQty = async (matRowId: string) => {
    setMatError('')
    try {
      await api.patch(`/walk-in-sales/${saleId}/jobs/${job.id}/materials/${matRowId}`, { quantity: parseFloat(editQty) || 1 })
      setEditMatId(''); setEditQty('')
      onUpdated(); onWorkerChange()
    } catch (e: any) { setMatError(e?.message ?? 'Could not update quantity') }
  }

  const deleteMat = async (matRowId: string) => {
    await api.delete(`/walk-in-sales/${saleId}/jobs/${job.id}/materials/${matRowId}`)
    onUpdated(); onWorkerChange()
  }

  const handleMaterialSelect = (id: string) => {
    setMatId(id)
    if (id) {
      const m = materials.find(m => m.id === id)
      if (m) setMatName(m.name)
    }
  }

  return (
    <div style={{ border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden', marginBottom: 8 }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#F8FAFC', cursor: 'pointer' }} onClick={() => setExpanded(p => !p)}>
        <span style={{ fontSize: 16 }}>{expanded ? '▾' : '▸'}</span>
        <span style={{ fontWeight: 600, fontSize: 13, color: DARK, flex: 1 }}>{job.sortOrder + 1}. {job.stepName}</span>
        <StepBadge status={job.status} />
        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: job.type === 'in_house' ? '#EFF6FF' : '#FDF4FF', color: job.type === 'in_house' ? BLUE : '#7C3AED', fontWeight: 600 }}>
          {job.type === 'in_house' ? 'In-house' : 'Supplier'}
        </span>
        {job.type === 'in_house' && (
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, fontWeight: 600, background: job.assignedTo ? '#ECFDF5' : '#FEF2F2', color: job.assignedTo ? '#059669' : '#DC2626' }}>
            {job.assignedTo ? job.assignedTo.name : 'Unassigned'}
          </span>
        )}
        {job.type === 'supplier' && job.supplier && (
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, fontWeight: 600, background: '#FDF4FF', color: '#7C3AED' }}>@ {job.supplier.name}</span>
        )}
        {job.type === 'supplier' && job.supplierCost && (
          <span style={{ fontSize: 11, color: '#64748B' }}>AED {fmt(Number(job.supplierCost))}</span>
        )}
      </div>

      {expanded && (
        <div style={{ padding: '14px 16px', borderTop: '1px solid #F1F5F9' }}>

          {/* Lock notice — only nudge to confirm before the order is confirmed */}
          {locked && preConfirm && (
            <div style={{ background: '#FEF9C3', border: '1px solid #FDE047', borderRadius: 8, padding: '7px 12px', marginBottom: 12, fontSize: 12, color: '#854D0E', display: 'flex', alignItems: 'center', gap: 6 }}>
              🔒 Confirm the order first to start working on jobs.
            </div>
          )}
          {/* Read-only notice for finished / cancelled orders */}
          {locked && !preConfirm && (
            <div style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 8, padding: '7px 12px', marginBottom: 12, fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 6 }}>
              This order is closed — jobs are read-only.
            </div>
          )}

          {/* Step status + execution type */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <label>
              {lbl('Step Status')}
              <select value={stepStatus} onChange={e => { setStepStatus(e.target.value); saveJob({ status: e.target.value }) }} style={{ ...inp, opacity: locked ? 0.5 : 1 }} disabled={locked || saving}>
                {STEP_STATUS_OPTS.map(s => <option key={s} value={s}>{s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </label>
            <label>
              {lbl('Execution Type')}
              <select value={type} onChange={e => { setType(e.target.value); saveJob({ type: e.target.value }) }} style={{ ...inp, opacity: locked ? 0.5 : 1 }} disabled={locked || saving}>
                <option value="in_house">In-house</option>
                <option value="supplier">Assign to Supplier</option>
              </select>
            </label>
          </div>

          {/* IN-HOUSE: assigned worker */}
          {type === 'in_house' && (
            <div style={{ marginBottom: 14 }}>
              <label>
                {lbl('Assigned Worker')}
                <select
                  value={assignedToId}
                  onChange={e => { setAssigned(e.target.value); saveJob({ assignedToId: e.target.value }).then(onWorkerChange) }}
                  style={{ ...inp, opacity: locked ? 0.5 : 1 }}
                  disabled={locked || saving}
                >
                  <option value="">— Unassigned —</option>
                  {workers.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name}{w.jobTitle ? ` (${w.jobTitle})` : ''} — {w.activeJobs} active job{w.activeJobs === 1 ? '' : 's'}
                    </option>
                  ))}
                </select>
              </label>
              {job.assignedTo && (
                <div style={{ marginTop: 6, fontSize: 12, color: BLUE, fontWeight: 600 }}>
                  Currently handled by {job.assignedTo.name}
                </div>
              )}
            </div>
          )}

          {/* IN-HOUSE: materials */}
          {type === 'in_house' && (
            <div>
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: DARK }}>Materials Used</span>
              </div>

              {job.materials.length === 0 && !addingMat && (
                <div style={{ color: '#94A3B8', fontSize: 12, marginBottom: 8 }}>No materials added yet.</div>
              )}

              {job.materials.map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#F8FAFC', borderRadius: 8, marginBottom: 6, fontSize: 12 }}>
                  <span style={{ flex: 1, fontWeight: 600, color: DARK }}>
                    {m.name}
                    {m.materialId ? <span style={{ color: '#94A3B8', fontWeight: 400 }}> · from stock</span> : <span style={{ color: '#94A3B8', fontWeight: 400 }}> · custom</span>}
                  </span>
                  {Number(m.totalCost) > 0 && <span style={{ color: '#7C3AED', fontWeight: 600 }}>AED {fmt(Number(m.totalCost))}</span>}
                  {editMatId === m.id ? (
                    <>
                      <input type="number" min={0.01} step="0.01" value={editQty} onChange={e => setEditQty(e.target.value)} style={{ width: 60, padding: '3px 6px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12 }} />
                      <button onClick={() => saveEditQty(m.id)} style={{ border: 'none', background: BLUE, color: '#fff', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: 11 }}>Save</button>
                      <button onClick={() => { setEditMatId(''); setEditQty('') }} style={{ border: 'none', background: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: 12 }}>✕</button>
                    </>
                  ) : (
                    <>
                      <span style={{ color: '#64748B' }}>×{Number(m.quantity)}</span>
                      <button onClick={() => { setEditMatId(m.id); setEditQty(String(Number(m.quantity))); setMatError('') }} title="Edit quantity" style={{ border: 'none', background: 'none', color: BLUE, cursor: 'pointer', fontSize: 12, padding: '0 2px' }}>✎</button>
                      <button onClick={() => deleteMat(m.id)} style={{ border: 'none', background: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 15, padding: '0 2px' }}>×</button>
                    </>
                  )}
                </div>
              ))}
              {matError && <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 6 }}>{matError}</div>}

              {addingMat ? (
                <div style={{ border: '1px dashed #CBD5E1', borderRadius: 10, padding: 12, marginTop: 8 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                    <label>
                      {lbl('From Catalog (deducts stock)')}
                      <select value={matId} onChange={e => handleMaterialSelect(e.target.value)} style={inp}>
                        <option value="">— or enter custom name —</option>
                        {materials.map(m => {
                          const avail = whStock[m.id] ?? 0
                          return <option key={m.id} value={m.id} disabled={avail <= 0}>{m.name} ({m.unit}) — {avail} in stock{avail <= 0 ? ' (out)' : ''}</option>
                        })}
                      </select>
                    </label>
                    <label>
                      {lbl('Material Name *')}
                      <input value={matName} onChange={e => setMatName(e.target.value)} placeholder="e.g. Vinyl wrap" style={inp} />
                    </label>
                    <label>
                      {lbl('Quantity')}
                      <input type="number" min={0} step="0.01" value={matQty} onChange={e => setMatQty(e.target.value)} style={inp} />
                    </label>
                    <label style={{ gridColumn: '1 / -1' }}>
                      {lbl('Note')}
                      <input value={matNote} onChange={e => setMatNote(e.target.value)} placeholder="Optional note…" style={inp} />
                    </label>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Btn label={matSaving ? 'Adding…' : 'Add Material'} onClick={saveMat} />
                    <Btn label="Cancel" variant="secondary" onClick={() => { setAddingMat(false); setMatName(''); setMatId('') }} />
                  </div>
                </div>
              ) : (
                <button onClick={() => setAddingMat(true)} style={{ fontSize: 12, color: BLUE, border: `1px dashed ${BLUE}`, borderRadius: 8, padding: '5px 14px', background: 'none', cursor: 'pointer', fontFamily: FONT }}>
                  + Add Material
                </button>
              )}
            </div>
          )}

          {/* SUPPLIER: assign + track */}
          {type === 'supplier' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <label>
                  {lbl('Supplier')}
                  <select value={supplierId} onChange={e => { setSupplier(e.target.value); saveJob({ supplierId: e.target.value }) }} style={inp} disabled={saving}>
                    <option value="">— select supplier —</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </label>
                <label>
                  {lbl('Supplier Cost (AED)')}
                  <input type="number" min={0} step="0.01" value={supplierCost}
                    onChange={e => setSupCost(e.target.value)}
                    onBlur={() => saveJob({ supplierCost: supplierCost })}
                    placeholder="0.00" style={inp} />
                </label>
              </div>
              <label>
                {lbl('Supplier Status')}
                <select value={supplierStatus} onChange={e => { setSupStatus(e.target.value); saveJob({ supplierStatus: e.target.value }) }} style={inp} disabled={saving}>
                  <option value="">— not set —</option>
                  {SUPPLIER_STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </label>
              {supplierStatus && (
                <div style={{ display: 'flex', gap: 6 }}>
                  {SUPPLIER_STATUS_OPTS.map((o, idx) => (
                    <div key={o.value} style={{ flex: 1, textAlign: 'center', padding: '5px 8px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                      background: SUPPLIER_STATUS_OPTS.findIndex(x => x.value === supplierStatus) >= idx ? '#EDE9FE' : '#F1F5F9',
                      color:      SUPPLIER_STATUS_OPTS.findIndex(x => x.value === supplierStatus) >= idx ? '#5B21B6' : '#CBD5E1' }}>
                      {o.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div style={{ marginTop: 12 }}>
            <JobNoteEditor saleId={saleId} jobId={job.id} initialNote={job.note ?? ''} onSaved={onUpdated} />
          </div>
        </div>
      )}
    </div>
  )
}

function JobNoteEditor({ saleId, jobId, initialNote, onSaved }: { saleId: string; jobId: string; initialNote: string; onSaved: () => void }) {
  const [note,   setNote]   = useState(initialNote)
  const [saving, setSaving] = useState(false)
  const dirty = note !== initialNote
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
      <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Job note…" rows={2}
        style={{ flex: 1, ...inp, resize: 'vertical', fontSize: 12 }} />
      {dirty && (
        <button onClick={async () => { setSaving(true); await api.patch(`/walk-in-sales/${saleId}/jobs/${jobId}`, { note }); onSaved(); setSaving(false) }}
          style={{ border: 'none', background: BLUE, color: '#fff', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', fontSize: 12, fontFamily: FONT }}>
          {saving ? '…' : 'Save'}
        </button>
      )}
    </div>
  )
}

// ── Edit Sale Modal ───────────────────────────────────────────────────────────
function EditSaleModal({ sale, products, onClose, onSaved }: {
  sale: Sale; products: Product[]; onClose: () => void; onSaved: () => void
}) {
  const [note,    setNote]   = useState(sale.note ?? '')
  const [dueDate, setDue]    = useState(sale.dueDate ? sale.dueDate.slice(0, 10) : '')
  const [items,   setItems]  = useState<{ productId: string; quantity: number; unitPrice: number; customization: string }[]>(
    sale.items.map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: Number(i.unitPrice), customization: i.customization ?? '' }))
  )
  const [err,    setErr]    = useState('')
  const [saving, setSaving] = useState(false)

  const addItem = () => {
    const pid = products.find(p => !items.find(i => i.productId === p.id))?.id ?? products[0]?.id
    if (pid) setItems(prev => [...prev, { productId: pid, quantity: 1, unitPrice: 0, customization: '' }])
  }
  const removeItem = (idx: number) => setItems(p => p.filter((_, i) => i !== idx))
  const setItem = (idx: number, key: string, val: any) => setItems(p => p.map((it, i) => i === idx ? { ...it, [key]: val } : it))

  const newTotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)

  const save = async () => {
    if (!items.length)                          return setErr('At least one item is required')
    if (items.some(i => i.unitPrice <= 0))      return setErr('Set a price for all items')
    setSaving(true)
    try {
      await api.patch(`/walk-in-sales/${sale.id}`, { note, dueDate, items })
      onSaved(); onClose()
    } catch (e: any) { setErr(e.message ?? 'Error') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', overflowY: 'auto' }}>
      <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 640, fontFamily: FONT, padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: DARK }}>Edit Order — {sale.saleNumber}</h2>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 22, cursor: 'pointer', color: '#94A3B8' }}>×</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
          <label style={{ gridColumn: '1 / -1' }}>
            {lbl('Note')}
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Order notes…" style={{ ...inp, resize: 'vertical' }} />
          </label>
          <label>
            {lbl('Due Date')}
            <input type="date" value={dueDate} onChange={e => setDue(e.target.value)} style={inp} />
          </label>
        </div>

        {/* Items */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: DARK }}>Products</span>
            <Btn label="+ Add Product" variant="secondary" onClick={addItem} />
          </div>
          {items.map((it, idx) => (
            <div key={idx} style={{ background: '#F8FAFC', borderRadius: 10, padding: '12px 14px', marginBottom: 8, border: '1px solid #F1F5F9' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px', gap: 8, marginBottom: 8 }}>
                <select value={it.productId} onChange={e => setItem(idx, 'productId', e.target.value)} style={inp}>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input type="number" min={1} value={it.quantity}
                  onChange={e => setItem(idx, 'quantity', Number(e.target.value))}
                  placeholder="Qty" style={inp} />
                <input type="number" min={0} step="0.01"
                  value={it.unitPrice || ''}
                  onChange={e => setItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                  placeholder="Price AED" style={inp} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={it.customization}
                  onChange={e => setItem(idx, 'customization', e.target.value)}
                  placeholder="Customization notes…" style={{ ...inp, flex: 1 }} />
                <button onClick={() => removeItem(idx)} style={{ border: 'none', background: '#FEE2E2', color: '#DC2626', borderRadius: 8, padding: '0 12px', cursor: 'pointer', fontSize: 16 }}>×</button>
              </div>
            </div>
          ))}
        </div>

        {/* Total preview */}
        <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
          <span style={{ color: '#64748B' }}>Previous total: <strong>AED {fmt(Number(sale.totalAmount))}</strong></span>
          <span style={{ color: DARK }}>New total: <strong style={{ color: newTotal !== Number(sale.totalAmount) ? BLUE : DARK }}>AED {fmt(newTotal)}</strong></span>
        </div>

        {err && <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 10 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn label="Cancel" variant="secondary" onClick={onClose} />
          <Btn label={saving ? 'Saving…' : 'Save Changes'} onClick={save} />
        </div>
      </div>
    </div>
  )
}

// ── Sale Detail Drawer ────────────────────────────────────────────────────────
const STATUS_FLOW = ['pending', 'confirmed', 'in_production', 'ready_for_pickup', 'completed']

export function SaleDrawer({ saleId, suppliers, materials, products, warehouses, onClose, onUpdated }: {
  saleId: string; suppliers: Supplier[]; materials: Material[]; products: Product[]; warehouses: Warehouse[]; onClose: () => void; onUpdated: () => void
}) {
  const { can } = useAuth()
  const [sale,       setSale]    = useState<Sale | null>(null)
  const [tab,        setTab]     = useState<'jobs' | 'items' | 'payments'>('jobs')
  const [showPay,    setShowPay] = useState(false)
  const [showEdit,   setEdit]    = useState(false)
  const [advancing,  setAdv]     = useState(false)
  const [workers,    setWorkers] = useState<Worker[]>([])
  const [whStock,    setWhStock] = useState<Record<string, number>>({})
  const [whPick,     setWhPick]  = useState('')
  const [whSaving,   setWhSaving]= useState(false)
  const [whError,    setWhError] = useState('')

  const load = useCallback(async () => {
    const s = await api.get<Sale>(`/walk-in-sales/${saleId}`)
    setSale(s)
  }, [saleId])

  // Reload the drawer AND notify the parent list so the outer page stays in sync
  const reloadAll = useCallback(async () => { await load(); onUpdated() }, [load, onUpdated])

  useEffect(() => { load() }, [load])

  // Load workers + stock scoped to the order's handling warehouse
  const whId = sale?.handlingWarehouseId ?? ''
  const refreshWarehouseData = useCallback(() => {
    if (!whId) { setWorkers([]); setWhStock({}); return }
    api.get<{ data: Worker[] }>(`/production/workers?warehouseId=${whId}`).then(r => setWorkers(r.data))
    api.get<{ data: Record<string, number> }>(`/production/warehouse-stock?warehouseId=${whId}`).then(r => setWhStock(r.data))
  }, [whId])
  useEffect(() => { refreshWarehouseData() }, [refreshWarehouseData])

  const setHandlingWarehouse = async (warehouseId: string) => {
    if (!warehouseId) return
    setWhSaving(true); setWhError('')
    try {
      await api.patch(`/walk-in-sales/${saleId}/handling-warehouse`, { warehouseId })
      await reloadAll()
    } catch (e: any) { setWhError(e?.message ?? 'Could not set warehouse') }
    finally { setWhSaving(false) }
  }

  if (!sale) return (
    <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 620, background: '#fff', boxShadow: '-4px 0 24px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, zIndex: 900 }}>
      <span style={{ color: '#94A3B8' }}>Loading…</span>
    </div>
  )

  const warehouseLocked = sale.jobs.some(j => j.status === 'done') || sale.jobs.some((j: any) => (j.materials ?? []).some((m: any) => m.materialId))
  const warehouseName = warehouses.find(w => w.id === sale.handlingWarehouseId)?.name ?? '—'

  // Gate: must choose a handling warehouse before doing anything
  if (!sale.handlingWarehouseId) {
    return (
      <>
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 899 }} onClick={onClose} />
        <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 620, maxWidth: '100%', background: '#fff', boxShadow: '-4px 0 24px rgba(0,0,0,0.1)', zIndex: 900, fontFamily: FONT, padding: 28, boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: DARK }}>{sale.saleNumber}</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94A3B8' }}>×</button>
          </div>
          <div style={{ marginTop: 40, textAlign: 'center', maxWidth: 380, marginLeft: 'auto', marginRight: 'auto' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: DARK, marginBottom: 8 }}>Which warehouse is handling this order?</div>
            <div style={{ fontSize: 13, color: '#64748B', marginBottom: 20, lineHeight: 1.6 }}>
              Workers and materials for this order come from the warehouse you choose. You can change it later — but only until work begins.
            </div>
            <select value={whPick} onChange={e => setWhPick(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 14, fontFamily: FONT, marginBottom: 12 }}>
              <option value="">— Select warehouse —</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
            {whError && <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 10 }}>{whError}</div>}
            <button onClick={() => setHandlingWarehouse(whPick)} disabled={!whPick || whSaving}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: whPick ? DARK : '#E2E8F0', color: whPick ? '#fff' : '#94A3B8', fontSize: 14, fontWeight: 700, fontFamily: FONT, cursor: whPick ? 'pointer' : 'not-allowed' }}>
              {whSaving ? 'Setting…' : 'Start Handling'}
            </button>
          </div>
        </div>
      </>
    )
  }

  const balance   = Number(sale.totalAmount) - Number(sale.advancePaid)
  const jobCosts  = sale.jobs.reduce((s, j) => s + Number(j.supplierCost ?? 0), 0)
  const nextStatus     = STATUS_FLOW[STATUS_FLOW.indexOf(sale.status) + 1]
  const isFullyPaid    = Number(sale.advancePaid) >= Number(sale.totalAmount)

  // Ready-for-pickup requires every job (all products) to be done
  const totalJobs      = sale.jobs.length
  const doneJobs       = sale.jobs.filter(j => j.status === 'done').length
  const jobsIncomplete = nextStatus === 'ready_for_pickup' && totalJobs > 0 && doneJobs < totalJobs

  // These transitions are driven automatically by job progress — never pressed by hand
  const autoStatus      = nextStatus === 'in_production' || nextStatus === 'ready_for_pickup'
  const autoReason      = nextStatus === 'in_production'
    ? 'Starts automatically when a worker begins a job'
    : `Happens automatically when all jobs are done (${doneJobs}/${totalJobs} done)`

  const paymentBlocked  = nextStatus === 'completed' && !isFullyPaid
  const blocked         = paymentBlocked || jobsIncomplete || autoStatus
  const blockReason     = autoStatus
    ? autoReason
    : paymentBlocked ? 'Collect full payment before completing' : undefined

  const advanceStatus = async () => {
    if (!nextStatus || blocked) return
    setAdv(true)
    try {
      await api.patch(`/walk-in-sales/${saleId}/status`, { status: nextStatus })
      await load(); onUpdated()
    } catch (e: any) { alert(e.message ?? 'Error') }
    setAdv(false)
  }
  const cancelSale = async () => {
    if (!confirm('Cancel this order?')) return
    await api.patch(`/walk-in-sales/${saleId}/status`, { status: 'cancelled' })
    await load(); onUpdated()
  }

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 899 }} onClick={onClose} />
      <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 660, background: '#fff', boxShadow: '-4px 0 32px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', zIndex: 900, fontFamily: FONT }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: DARK, marginBottom: 4 }}>{sale.saleNumber}</div>
            <div style={{ fontSize: 13, color: '#64748B' }}>
              {sale.customer.name}
              {sale.customer.phone && <> · {sale.customer.phone}</>}
              {sale.customer.company && <> · {sale.customer.company}</>}
            </div>
            <div style={{ marginTop: 6 }}><StatusPill status={sale.status} /></div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {(() => {
              // Fraud control: order value is locked once confirmed — unless you have the right.
              const editable = ['pending', 'draft', 'quote'].includes(sale.status) || can('feature.edit_confirmed')
              return (
                <button onClick={() => editable && setEdit(true)} disabled={!editable}
                  title={editable ? undefined : 'Locked after confirmation — only the owner can change a confirmed order'}
                  style={{ border: '1px solid #E2E8F0', background: editable ? '#F8FAFC' : '#F1F5F9', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600, fontFamily: FONT, cursor: editable ? 'pointer' : 'not-allowed', color: editable ? '#64748B' : '#CBD5E1', display: 'flex', alignItems: 'center', gap: 5 }}>
                  {editable ? 'Edit Order' : '🔒 Edit Order'}
                </button>
              )
            })()}
            <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 24, cursor: 'pointer', color: '#94A3B8' }}>×</button>
          </div>
        </div>

        {/* Financial summary */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${can('feature.view_costs') ? 4 : 3}, 1fr)`, gap: 0, borderBottom: '1px solid #F1F5F9' }}>
          {[
            { label: 'Order Total', value: `AED ${fmt(Number(sale.totalAmount))}`, color: DARK },
            { label: 'Collected',   value: `AED ${fmt(Number(sale.advancePaid))}`, color: GREEN },
            { label: 'Balance Due', value: `AED ${fmt(Math.max(0, balance))}`, color: balance > 0 ? '#EF4444' : GREEN },
            ...(can('feature.view_costs') ? [{ label: 'Job Costs', value: `AED ${fmt(jobCosts)}`, color: '#7C3AED' }] : []),
          ].map(c => (
            <div key={c.label} style={{ padding: '12px 16px', textAlign: 'center', borderRight: '1px solid #F1F5F9' }}>
              <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, marginBottom: 2 }}>{c.label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* Handling warehouse bar */}
        <div style={{ padding: '8px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 10, background: '#F8FAFC' }}>
          <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>Handling from:</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: DARK }}>{warehouseName}</span>
          {warehouseLocked ? (
            <span style={{ fontSize: 11, color: '#94A3B8', marginLeft: 'auto' }}>🔒 Locked — work has begun</span>
          ) : (
            <select value={sale.handlingWarehouseId ?? ''} onChange={e => setHandlingWarehouse(e.target.value)} disabled={whSaving}
              style={{ marginLeft: 'auto', padding: '5px 10px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12, fontFamily: FONT }}>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          )}
        </div>

        {/* Status actions */}
        {sale.status !== 'completed' && sale.status !== 'cancelled' && (
          <div style={{ borderBottom: '1px solid #F1F5F9' }}>
            <div style={{ padding: '10px 20px', display: 'flex', gap: 8, alignItems: 'center' }}>
              {nextStatus && (
                <button
                  onClick={advanceStatus}
                  disabled={advancing || blocked}
                  title={blockReason}
                  style={{ background: blocked ? '#E2E8F0' : BLUE, color: blocked ? '#94A3B8' : '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontSize: 12, fontWeight: 700, fontFamily: FONT, cursor: blocked ? 'not-allowed' : 'pointer' }}>
                  {advancing ? 'Updating…' : `→ ${STATUS_LABELS[nextStatus]}${autoStatus ? ' (auto)' : ''}`}
                </button>
              )}
              <button onClick={() => setShowPay(true)} disabled={isFullyPaid}
                title={isFullyPaid ? 'Order is fully paid' : undefined}
                style={{ background: isFullyPaid ? '#E2E8F0' : GREEN, color: isFullyPaid ? '#94A3B8' : '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontSize: 12, fontWeight: 700, fontFamily: FONT, cursor: isFullyPaid ? 'not-allowed' : 'pointer' }}>
                {isFullyPaid ? '✓ Fully Paid' : '+ Record Payment'}
              </button>
              <button onClick={cancelSale}
                style={{ marginLeft: 'auto', background: 'none', color: '#EF4444', border: '1px solid #FCA5A5', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontFamily: FONT, cursor: 'pointer' }}>
                Cancel Order
              </button>
            </div>
            {autoStatus && (
              <div style={{ padding: '0 20px 8px', fontSize: 11, color: '#64748B' }}>
                {autoReason}.
              </div>
            )}
            {paymentBlocked && (
              <div style={{ padding: '0 20px 8px', fontSize: 11, color: '#EF4444' }}>
                Balance due: AED {fmt(balance)} — collect full payment to complete the order.
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #F1F5F9' }}>
          {([['jobs', `Jobs (${sale.jobs.length})`], ['items', `Items (${sale.items.length})`], ['payments', `Payments (${sale.payments.length})`]] as [string, string][]).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key as any)}
              style={{ flex: 1, padding: '10px 0', border: 'none', background: 'none', fontSize: 13, fontWeight: tab === key ? 700 : 500, color: tab === key ? BLUE : '#64748B', borderBottom: `2px solid ${tab === key ? BLUE : 'transparent'}`, cursor: 'pointer', fontFamily: FONT }}>
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

          {tab === 'jobs' && (() => {
            if (sale.jobs.length === 0) return (
              <div style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center', padding: '40px 0' }}>No job steps for this order. Add job steps to the products first.</div>
            )
            const editable  = ['confirmed', 'in_production', 'ready_for_pickup'].includes(sale.status)
            const locked    = !editable
            // Only nudge to confirm when the order genuinely hasn't been confirmed yet
            const preConfirm = ['pending', 'draft', 'quote'].includes(sale.status)

            // Group jobs by productName / itemId
            const groups = new Map<string, { productName: string; jobs: Job[] }>()
            for (const job of sale.jobs) {
              const key = job.itemId ?? 'general'
              const label = job.productName ?? 'General'
              if (!groups.has(key)) groups.set(key, { productName: label, jobs: [] })
              groups.get(key)!.jobs.push(job)
            }

            // Progress indicator: active job(s) currently in_progress
            const activeJobs = sale.jobs.filter(j => j.status === 'in_progress')
            const pendingJobs = sale.jobs.filter(j => j.status === 'pending')
            const doneJobs = sale.jobs.filter(j => j.status === 'done')
            const total = sale.jobs.length

            let progressLine = ''
            if (sale.status === 'pending') progressLine = 'Confirm the order to begin production.'
            else if (activeJobs.length > 0) {
              const names = [...new Set(activeJobs.map(j => `${j.productName ? j.productName + ' → ' : ''}${j.stepName}`))]
              progressLine = `Currently working on: ${names.join(', ')}`
            } else if (doneJobs.length === total) progressLine = '✓ All steps completed — ready for pickup.'
            else if (pendingJobs.length === total) progressLine = 'No steps started yet.'
            else progressLine = `${doneJobs.length} of ${total} steps done.`

            return (
              <div>
                {/* Progress line */}
                <div style={{ background: sale.status === 'pending' ? '#FEF9C3' : activeJobs.length ? '#EFF6FF' : doneJobs.length === total ? '#D1FAE5' : '#F8FAFC',
                  border: `1px solid ${sale.status === 'pending' ? '#FDE047' : activeJobs.length ? '#BFDBFE' : doneJobs.length === total ? '#6EE7B7' : '#E2E8F0'}`,
                  borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 12,
                  color: sale.status === 'pending' ? '#854D0E' : activeJobs.length ? '#1E40AF' : doneJobs.length === total ? '#065F46' : '#64748B',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{progressLine}</span>
                  <span style={{ fontWeight: 700 }}>{doneJobs.length}/{total} done</span>
                </div>

                {/* Per-product job groups */}
                {[...groups.entries()].map(([key, group]) => {
                  const grpDone = group.jobs.filter(j => j.status === 'done').length
                  const grpActive = group.jobs.find(j => j.status === 'in_progress')
                  return (
                    <div key={key} style={{ marginBottom: 16 }}>
                      {groups.size > 1 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: DARK }}>{group.productName}</span>
                          <span style={{ fontSize: 11, color: '#94A3B8' }}>{grpDone}/{group.jobs.length} steps done</span>
                          {grpActive && <span style={{ fontSize: 11, color: BLUE, fontWeight: 600 }}>↪ {grpActive.stepName}</span>}
                        </div>
                      )}
                      {group.jobs.map(job => (
                        <JobStepPanel key={job.id} job={job} saleId={sale.id} suppliers={suppliers} materials={materials} workers={workers} whStock={whStock} locked={locked} preConfirm={preConfirm} onUpdated={reloadAll} onWorkerChange={refreshWarehouseData} />
                      ))}
                    </div>
                  )
                })}
              </div>
            )
          })()}

          {tab === 'items' && (
            <div>
              {sale.items.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 14px', background: '#F8FAFC', borderRadius: 10, marginBottom: 8, border: '1px solid #F1F5F9' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: DARK }}>{item.productName}</div>
                    {item.customization && <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{item.customization}</div>}
                    <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>Qty: {item.quantity} × AED {fmt(Number(item.unitPrice))}</div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: DARK }}>AED {fmt(Number(item.total))}</div>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 14px', fontWeight: 700, color: DARK, fontSize: 14, borderTop: '1px solid #F1F5F9', marginTop: 8 }}>
                Total: AED {fmt(Number(sale.totalAmount))}
              </div>
            </div>
          )}

          {tab === 'payments' && (
            <div>
              {sale.payments.length === 0 && <div style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>No payments recorded yet.</div>}
              {sale.payments.map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#F8FAFC', borderRadius: 10, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: DARK, textTransform: 'capitalize' }}>{p.type} · {p.method.replace('_', ' ')}</div>
                    {p.note && <div style={{ fontSize: 11, color: '#64748B' }}>{p.note}</div>}
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>{new Date(p.paidAt).toLocaleDateString()}</div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: GREEN }}>AED {fmt(Number(p.amount))}</div>
                </div>
              ))}
              <div style={{ padding: '10px 14px', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 4 }}>
                <span style={{ color: '#64748B' }}>Collected</span>
                <span style={{ fontWeight: 700, color: GREEN }}>AED {fmt(Number(sale.advancePaid))}</span>
              </div>
              {balance > 0 && (
                <div style={{ padding: '4px 14px', display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: '#64748B' }}>Balance Due</span>
                  <span style={{ fontWeight: 700, color: '#EF4444' }}>AED {fmt(Number(balance))}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showPay  && <PaymentModal  sale={sale} onClose={() => setShowPay(false)}  onSaved={() => { load(); onUpdated() }} />}
      {showEdit && <EditSaleModal sale={sale} products={products} onClose={() => setEdit(false)} onSaved={() => { load(); onUpdated() }} />}
    </>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function WalkInSalesPage() {
  const navigate = useNavigate()
  const { can } = useAuth()
  const [sales,     setSales]    = useState<SaleRow[]>([])
  const [customers, setCustomers]= useState<Customer[]>([])
  const [products,  setProducts] = useState<Product[]>([])
  const [loading,   setLoading]  = useState(true)
  const [total,     setTotal]    = useState(0)
  const [page,      setPage]     = useState(1)
  const PAGE_SIZE = 30

  // Filters
  const [search,    setSearch]   = useState('')
  const [status,    setStatus]   = useState('')
  const [dateFrom,  setFrom]     = useState('')
  const [dateTo,    setTo]       = useState('')
  const [custFilter,setCustF]    = useState('')

  const [showNew,  setNew]       = useState(false)
  const [editSale, setEditSale]  = useState<Sale | null>(null)
  const openHandling = (id: string) => navigate(`/admin/order-handling?order=${id}`)
  const openSummary  = (id: string) => navigate(`/admin/order-summary?order=${id}`)
  const isPast = (status: string) => ['completed', 'cancelled'].includes(status)
  const isDraftLike = (status: string) => ['pending', 'draft', 'quote'].includes(status)
  // Route a row/Open click by the order's stage
  const openRow = (s: SaleRow) => { if (isPast(s.status)) openSummary(s.id); else if (!isDraftLike(s.status)) openHandling(s.id) }
  const canEditDraft = can('walk-in-customers') || can('walk-in-sales')
  const openEdit = async (id: string) => { const full = await api.get<Sale>(`/walk-in-sales/${id}`); setEditSale(full) }

  const load = useCallback(async (pg = page) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ pageSize: String(PAGE_SIZE), page: String(pg) })
      if (search)    params.set('search',     search)
      if (status)    params.set('status',     status)
      if (dateFrom)  params.set('dateFrom',   dateFrom)
      if (dateTo)    params.set('dateTo',     dateTo)
      if (custFilter)params.set('customerId', custFilter)
      const r = await api.get<{ data: SaleRow[]; meta: any }>(`/walk-in-sales?${params}`)
      setSales(r.data); setTotal(r.meta.total)
    } finally { setLoading(false) }
  }, [page, search, status, dateFrom, dateTo, custFilter])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    api.get<{ data: Customer[] }>('/walk-in-customers?pageSize=500').then(r => setCustomers(r.data))
    api.get<{ data: Product[]  }>('/products?pageSize=500&isActive=true').then(r => setProducts(r.data))
  }, [])

  const clearFilters = () => { setSearch(''); setStatus(''); setFrom(''); setTo(''); setCustF(''); setPage(1) }

  const [confirming, setConfirming] = useState<string | null>(null)
  const confirmOrder = async (id: string) => {
    setConfirming(id)
    try { await api.patch(`/walk-in-sales/${id}/status`, { status: 'confirmed' }); await load() }
    catch (e: any) { alert(e?.message ?? 'Could not confirm') }
    finally { setConfirming(null) }
  }

  // KPIs
  const totalRevenue  = sales.reduce((s, r) => s + Number(r.totalAmount), 0)
  const totalCollected= sales.reduce((s, r) => s + Number(r.advancePaid), 0)
  const inProduction  = sales.filter(r => r.status === 'in_production').length
  const balanceDue    = sales.reduce((s, r) => s + Math.max(0, Number(r.totalAmount) - Number(r.advancePaid)), 0)

  return (
    <AdminLayout
      title="Walk-in Sales"
      actions={<Btn label="+ New Sale" onClick={() => setNew(true)} />}
    >
      <StatGrid>
        <StatCard label="Sales (this view)"  value={String(total)}                 sub="Matching filters" />
        <StatCard label="Revenue"            value={`AED ${fmt(totalRevenue)}`}    sub="Order totals"     color={BLUE} />
        <StatCard label="Collected"          value={`AED ${fmt(totalCollected)}`}  sub="Payments received" color={GREEN} />
        <StatCard label="Balance Due"        value={`AED ${fmt(balanceDue)}`}      sub="Pending collection" color={balanceDue > 0 ? '#EF4444' : GREEN} />
        <StatCard label="In Production"      value={String(inProduction)}          sub="Active jobs"      color="#7C3AED" />
      </StatGrid>

      {/* Filter bar */}
      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 18px', marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '2 1 220px' }}>
          {lbl('Search')}
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Sale # or customer name / phone…" style={inp} />
        </div>
        <div style={{ flex: '1 1 160px' }}>
          {lbl('Customer')}
          <select value={custFilter} onChange={e => { setCustF(e.target.value); setPage(1) }} style={inp}>
            <option value="">All customers</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div style={{ flex: '1 1 140px' }}>
          {lbl('Status')}
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }} style={inp}>
            <option value="">All statuses</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div style={{ flex: '1 1 130px' }}>
          {lbl('From')}
          <input type="date" value={dateFrom} onChange={e => { setFrom(e.target.value); setPage(1) }} style={inp} />
        </div>
        <div style={{ flex: '1 1 130px' }}>
          {lbl('To')}
          <input type="date" value={dateTo} onChange={e => { setTo(e.target.value); setPage(1) }} style={inp} />
        </div>
        {(search || status || dateFrom || dateTo || custFilter) && (
          <button onClick={clearFilters} style={{ border: '1px solid #E2E8F0', background: '#F8FAFC', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontFamily: FONT, cursor: 'pointer', color: '#64748B', alignSelf: 'flex-end' }}>
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
      ) : sales.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8', fontFamily: FONT }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🛍️</div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>No sales found</div>
          <Btn label="+ New Sale" onClick={() => setNew(true)} />
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONT, fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                {['Sale #', 'Customer', 'Items / Jobs', 'Total', 'Collected', 'Balance', 'Status', 'Date', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94A3B8', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sales.map(s => {
                const balance = Number(s.totalAmount) - Number(s.advancePaid)
                return (
                  <tr key={s.id} style={{ borderBottom: '1px solid #F1F5F9', cursor: isDraftLike(s.status) ? 'default' : 'pointer' }} onClick={() => { if (!isDraftLike(s.status)) openRow(s) }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: BLUE }}>{s.saleNumber}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontWeight: 600, color: DARK }}>{s.customer.name}</div>
                      {s.customer.phone && <div style={{ fontSize: 11, color: '#94A3B8' }}>{s.customer.phone}</div>}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#64748B' }}>{s._count.items} items · {s._count.jobs} jobs</td>
                    <td style={{ padding: '10px 14px', fontWeight: 600 }}>AED {fmt(Number(s.totalAmount))}</td>
                    <td style={{ padding: '10px 14px', color: GREEN, fontWeight: 600 }}>AED {fmt(Number(s.advancePaid))}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: balance > 0 ? '#EF4444' : GREEN }}>AED {fmt(Math.max(0, balance))}</td>
                    <td style={{ padding: '10px 14px' }}><StatusPill status={s.status} /></td>
                    <td style={{ padding: '10px 14px', color: '#94A3B8', fontSize: 12 }}>{new Date(s.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: '10px 14px' }}>
                      {isDraftLike(s.status) ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          {canEditDraft && <Btn label="Edit" variant="secondary" onClick={e => { e.stopPropagation(); openEdit(s.id) }} />}
                          {can('feature.confirm_orders')
                            ? <Btn label={confirming === s.id ? 'Confirming…' : 'Confirm'} onClick={e => { e.stopPropagation(); confirmOrder(s.id) }} />
                            : <span title="You don't have permission to confirm orders" style={{ fontSize: 12, color: '#CBD5E1', fontFamily: FONT, alignSelf: 'center' }}>🔒 Confirm</span>}
                        </div>
                      ) : (
                        <Btn label={isPast(s.status) ? 'Summary' : 'Open'} variant="secondary" onClick={e => { e.stopPropagation(); openRow(s) }} />
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Pagination */}
          {total > PAGE_SIZE && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid #F1F5F9', fontSize: 13, color: '#64748B' }}>
              <span>Showing {Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)} of {total}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <Btn label="← Prev" variant="secondary" onClick={() => setPage(p => Math.max(1, p - 1))} />
                <Btn label="Next →" variant="secondary" onClick={() => setPage(p => Math.min(Math.ceil(total / PAGE_SIZE), p + 1))} />
              </div>
            </div>
          )}
        </div>
      )}

      {showNew && (
        <NewSaleModal customers={customers} products={products} onClose={() => setNew(false)} onSaved={() => { setNew(false); load() }} />
      )}

      {editSale && (
        <EditSaleModal sale={editSale} products={products} onClose={() => setEditSale(null)} onSaved={() => { setEditSale(null); load() }} />
      )}
    </AdminLayout>
  )
}
