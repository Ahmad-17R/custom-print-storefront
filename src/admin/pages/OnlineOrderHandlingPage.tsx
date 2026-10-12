import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { AdminLayout, StatCard, StatGrid, Badge } from '../components/AdminLayout'
import { AdminOrderInformation, AdminOrderDetails, type AdminOrderDetail } from '../components/AdminOrderDetails'
import { api, catalogImageUrl } from '../../lib/api'
import { TruckIcon, InvoiceIcon } from '../components/icons'
import { useAuth } from '../lib/AuthContext'
import { OrderPortalPanel } from '../components/OrderPortalPanel'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'
const BLUE = '#3B82F6'
const fmt = (n: number) => Number(n).toLocaleString(undefined, { minimumFractionDigits: 2 })
const digits = (s?: string | null) => (s ?? '').replace(/[^\d]/g, '')

// Soft guards (UAE: COD is valid, so warn + confirm rather than hard-block).
type GuardOrder = { orderNumber: string; total: string | number; amountPaid?: string | number | null; proofStatus?: string | null }
const balanceOf = (o: GuardOrder) => Math.round((Number(o.total) - Number(o.amountPaid ?? 0)) * 100) / 100
function confirmShip(o: GuardOrder): boolean {
  const bal = balanceOf(o)
  const proofPending = o.proofStatus === 'sent' || o.proofStatus === 'changes_requested'
  const w: string[] = []
  if (proofPending) w.push('• The artwork proof is NOT approved yet.')
  if (bal > 0.009) w.push(`• Balance of AED ${bal.toFixed(2)} is still due — ship as COD (collect on delivery)?`)
  if (!w.length) return true
  return window.confirm(`Create shipment for ${o.orderNumber}?\n\n${w.join('\n')}\n\nContinue anyway?`)
}
function confirmDeliver(o: GuardOrder): boolean {
  const bal = balanceOf(o)
  if (bal <= 0.009) return true
  return window.confirm(`Mark ${o.orderNumber} delivered?\n\nBalance of AED ${bal.toFixed(2)} is still due. If this was collected on delivery, record the payment afterwards.\n\nMark delivered anyway?`)
}

const HANDLING = ['confirmed', 'in_production', 'ready', 'out_for_delivery'] as const
const S_LABEL: Record<string, string> = { confirmed: 'Confirmed', in_production: 'In Production', ready: 'Ready', out_for_delivery: 'Out for Delivery', delivered: 'Delivered', cancelled: 'Cancelled', pending: 'Pending' }
const S_COLOR: Record<string, string> = { confirmed: '#8B5CF6', in_production: '#3B82F6', ready: '#10B981', out_for_delivery: '#F59E0B', delivered: '#059669', cancelled: '#EF4444', pending: '#64748B' }
const JOB_COLOR: Record<string, string> = { pending: '#94A3B8', in_progress: '#3B82F6', done: '#10B981', cancelled: '#EF4444' }
const STEP_STATUSES = ['pending', 'in_progress', 'done', 'cancelled']
const SUP_STATUSES = ['sent', 'in_progress', 'received']

interface OMat { id: string; name: string; materialId?: string | null; quantity: number; totalCost: number }
interface OJob {
  id: string; stepName: string; productName?: string | null; status: string; type: string; note?: string | null
  assignedToId?: string | null; assignedTo?: { name: string } | null
  supplierId?: string | null; supplier?: { name: string } | null; supplierCost?: number | null; supplierStatus?: string | null
  materials: OMat[]
}
type OnlineOrder = Omit<AdminOrderDetail, 'jobs'> & { jobs: OJob[] }
interface Ref { id: string; name: string }
interface Worker { id: string; name: string; jobTitle?: string; activeJobs: number }

const inp: React.CSSProperties = { width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13, fontFamily: FONT, outline: 'none', boxSizing: 'border-box' }
const lbl = (t: string) => <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B', fontFamily: FONT, display: 'block', marginBottom: 3 }}>{t}</span>

// ── Job panel ─────────────────────────────────────────────────────────────────
function JobPanel({ orderId, job, suppliers, materials, workers, whStock, onChanged }: {
  orderId: string; job: OJob; suppliers: Ref[]; materials: { id: string; name: string; unit: string }[]; workers: Worker[]; whStock: Record<string, number>; onChanged: () => void
}) {
  const [open, setOpen]   = useState(false)
  const [addMat, setAdd]  = useState(false)
  const [mName, setMName] = useState(''); const [mId, setMId] = useState(''); const [mQty, setMQty] = useState('1')
  const [err, setErr]     = useState('')
  const [editId, setEditId] = useState(''); const [editQty, setEditQty] = useState('')

  const patch = async (body: Record<string, any>) => { await api.patch(`/orders/${orderId}/jobs/${job.id}`, body); onChanged() }
  const addMaterial = async () => {
    if (!mName.trim()) return
    setErr('')
    try { await api.post(`/orders/${orderId}/jobs/${job.id}/materials`, { name: mName.trim(), materialId: mId || undefined, quantity: parseFloat(mQty) || 1 }); setMName(''); setMId(''); setMQty('1'); setAdd(false); onChanged() }
    catch (e: any) { setErr(e?.message ?? 'Could not add') }
  }
  const saveEdit = async (id: string) => {
    setErr('')
    try { await api.patch(`/orders/${orderId}/jobs/${job.id}/materials/${id}`, { quantity: parseFloat(editQty) || 1 }); setEditId(''); onChanged() }
    catch (e: any) { setErr(e?.message ?? 'Could not update') }
  }
  const delMaterial = async (id: string) => { await api.delete(`/orders/${orderId}/jobs/${job.id}/materials/${id}`); onChanged() }

  return (
    <div style={{ border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden', marginBottom: 8 }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#F8FAFC', cursor: 'pointer' }}>
        <span>{open ? '▾' : '▸'}</span>
        <span style={{ fontWeight: 600, fontSize: 13, color: DARK, flex: 1 }}>{job.productName ? `${job.productName} → ` : ''}{job.stepName}</span>
        <Badge label={S_LABEL[job.status] ?? job.status} color={JOB_COLOR[job.status] ?? '#64748B'} />
        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, fontWeight: 600, background: job.type === 'in_house' ? '#EFF6FF' : '#FDF4FF', color: job.type === 'in_house' ? BLUE : '#7C3AED' }}>{job.type === 'in_house' ? 'In-house' : 'Supplier'}</span>
        {job.type === 'in_house'
          ? <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, fontWeight: 600, background: job.assignedTo ? '#ECFDF5' : '#FEF2F2', color: job.assignedTo ? '#059669' : '#DC2626' }}>{job.assignedTo ? job.assignedTo.name : 'Unassigned'}</span>
          : job.supplier && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, fontWeight: 600, background: '#FDF4FF', color: '#7C3AED' }}>@ {job.supplier.name}</span>}
      </div>
      {open && (
        <div style={{ padding: '14px 16px', borderTop: '1px solid #F1F5F9' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <label>{lbl('Step Status')}
              <select value={job.status} onChange={e => patch({ status: e.target.value })} style={inp}>
                {STEP_STATUSES.map(s => <option key={s} value={s}>{s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </label>
            <label>{lbl('Execution Type')}
              <select value={job.type} onChange={e => patch({ type: e.target.value })} style={inp}>
                <option value="in_house">In-house</option><option value="supplier">Assign to Supplier</option>
              </select>
            </label>
          </div>

          {job.type === 'in_house' ? (
            <>
              <label style={{ display: 'block', marginBottom: 12 }}>{lbl('Assigned Worker')}
                <select value={job.assignedToId ?? ''} onChange={e => patch({ assignedToId: e.target.value })} style={inp}>
                  <option value="">— Unassigned —</option>
                  {workers.map(w => <option key={w.id} value={w.id}>{w.name}{w.jobTitle ? ` (${w.jobTitle})` : ''} — {w.activeJobs} active</option>)}
                </select>
              </label>
              <div style={{ fontSize: 12, fontWeight: 700, color: DARK, marginBottom: 6 }}>Materials Used</div>
              {job.materials.map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#F8FAFC', borderRadius: 8, marginBottom: 6, fontSize: 12 }}>
                  <span style={{ flex: 1, fontWeight: 600 }}>{m.name}{m.materialId ? '' : ' (custom)'}</span>
                  {Number(m.totalCost) > 0 && <span style={{ color: '#7C3AED', fontWeight: 600 }}>AED {fmt(m.totalCost)}</span>}
                  {editId === m.id ? (
                    <>
                      <input type="number" min={0.01} step="0.01" value={editQty} onChange={e => setEditQty(e.target.value)} style={{ width: 56, padding: '3px 6px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12 }} />
                      <button onClick={() => saveEdit(m.id)} style={{ border: 'none', background: BLUE, color: '#fff', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: 11 }}>Save</button>
                      <button onClick={() => setEditId('')} style={{ border: 'none', background: 'none', color: '#94A3B8', cursor: 'pointer' }}>✕</button>
                    </>
                  ) : (
                    <>
                      <span style={{ color: '#64748B' }}>×{Number(m.quantity)}</span>
                      <button onClick={() => { setEditId(m.id); setEditQty(String(Number(m.quantity))); setErr('') }} style={{ border: 'none', background: 'none', color: BLUE, cursor: 'pointer' }}>✎</button>
                      <button onClick={() => delMaterial(m.id)} style={{ border: 'none', background: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 15 }}>×</button>
                    </>
                  )}
                </div>
              ))}
              {err && <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 6 }}>{err}</div>}
              {addMat ? (
                <div style={{ border: '1px dashed #CBD5E1', borderRadius: 10, padding: 12, marginTop: 6, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <label>{lbl('From Catalog (deducts stock)')}
                    <select value={mId} onChange={e => { setMId(e.target.value); const mm = materials.find(x => x.id === e.target.value); if (mm) setMName(mm.name) }} style={inp}>
                      <option value="">— custom name —</option>
                      {materials.map(m => { const a = whStock[m.id] ?? 0; return <option key={m.id} value={m.id} disabled={a <= 0}>{m.name} ({m.unit}) — {a} in stock{a <= 0 ? ' (out)' : ''}</option> })}
                    </select>
                  </label>
                  <label>{lbl('Name')}<input value={mName} onChange={e => setMName(e.target.value)} style={inp} /></label>
                  <label>{lbl('Quantity')}<input type="number" min={0.01} step="0.01" value={mQty} onChange={e => setMQty(e.target.value)} style={inp} /></label>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
                    <button onClick={addMaterial} style={{ background: DARK, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Add</button>
                    <button onClick={() => setAdd(false)} style={{ background: '#F1F5F9', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              ) : <button onClick={() => { setAdd(true); setErr('') }} style={{ marginTop: 4, background: 'none', border: '1px dashed #CBD5E1', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12, color: '#64748B', fontFamily: FONT }}>+ Add Material</button>}
            </>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <label>{lbl('Supplier')}
                <select value={job.supplierId ?? ''} onChange={e => patch({ supplierId: e.target.value })} style={inp}>
                  <option value="">— Select supplier —</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>
              <label>{lbl('Supplier Cost (AED)')}<input type="number" min={0} step="0.01" defaultValue={String(job.supplierCost ?? '')} onBlur={e => patch({ supplierCost: e.target.value })} style={inp} /></label>
              <label style={{ gridColumn: '1 / -1' }}>{lbl('Supplier Status')}
                <select value={job.supplierStatus ?? ''} onChange={e => patch({ supplierStatus: e.target.value })} style={inp}>
                  <option value="">—</option>
                  {SUP_STATUSES.map(s => <option key={s} value={s}>{s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Handling drawer ───────────────────────────────────────────────────────────
// Installment payments panel — deposit + balance collection, mirroring walk-in sales.
function PaymentPanel({ order, canRecord, onRecorded }: { order: AdminOrderDetail; canRecord: boolean; onRecorded: () => void }) {
  const total = Number(order.total)
  const paid = Number(order.amountPaid ?? 0)
  const balance = Math.round((total - paid) * 100) / 100
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('cash')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [open, setOpen] = useState(false)

  const record = async () => {
    setSaving(true); setErr('')
    try {
      await api.post(`/orders/${order.id}/payments`, { amount: Number(amount), method, note: note.trim() || undefined, type: 'installment' })
      setAmount(''); setNote(''); setOpen(false); onRecorded()
    } catch (e: any) { setErr(e?.message ?? 'Could not record payment') } finally { setSaving(false) }
  }

  const pill = (label: string, value: string, color: string) => (
    <div style={{ flex: 1, textAlign: 'center' }}><div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>{label}</div><div style={{ fontSize: 15, fontWeight: 800, color }}>{value}</div></div>
  )
  const phone = digits(order.contactPhone)
  const email = order.contactEmail ?? order.customer?.email ?? ''

  return (
    <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: DARK }}>Payments</span>
        {order.requiresDeposit && <span style={{ fontSize: 11, fontWeight: 700, color: '#B45309', background: '#FEF3C7', padding: '2px 8px', borderRadius: 999 }}>Deposit order · balance in installments</span>}
      </div>
      <div style={{ display: 'flex', gap: 8, padding: '10px 0', borderTop: '1px solid #F8FAFC', borderBottom: '1px solid #F1F5F9', marginBottom: 10 }}>
        {pill('Total', `AED ${fmt(total)}`, DARK)}
        {pill('Paid', `AED ${fmt(paid)}`, '#059669')}
        {pill('Balance', `AED ${fmt(balance)}`, balance > 0 ? '#DC2626' : '#059669')}
      </div>

      {order.payments && order.payments.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          {order.payments.map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#475569', padding: '3px 0' }}>
              <span style={{ textTransform: 'capitalize' }}>{p.type} · {p.method}{p.recordedBy ? ` · ${p.recordedBy.name}` : ''}</span>
              <span style={{ fontWeight: 600 }}>AED {fmt(Number(p.amount))} · {new Date(p.paidAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}

      {balance > 0 && (phone || email) && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          {phone && <a href={`https://wa.me/${phone}?text=${encodeURIComponent(`Hello, regarding your order ${order.orderNumber}: the remaining balance is AED ${balance.toFixed(2)}.`)}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, fontWeight: 600, color: '#059669', textDecoration: 'none', border: '1px solid #A7F3D0', borderRadius: 8, padding: '5px 10px' }}>WhatsApp balance</a>}
          {email && <a href={`mailto:${email}?subject=${encodeURIComponent(`Invoice for order ${order.orderNumber}`)}&body=${encodeURIComponent(`Your remaining balance is AED ${balance.toFixed(2)}.`)}`} style={{ fontSize: 12, fontWeight: 600, color: '#2563EB', textDecoration: 'none', border: '1px solid #BFDBFE', borderRadius: 8, padding: '5px 10px' }}>Email invoice</a>}
        </div>
      )}

      {balance <= 0 ? <div style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>Fully paid ✓</div>
        : !canRecord ? <div style={{ fontSize: 11, color: '#94A3B8' }}>You do not have permission to record payments.</div>
        : !open ? <button onClick={() => { setOpen(true); setAmount(String(balance)) }} style={{ background: DARK, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>+ Record payment</button>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: '#F8FAFC', padding: 12, borderRadius: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div><label style={{ fontSize: 11, fontWeight: 600, color: '#64748B' }}>Amount (AED)</label><input type="number" min={0} step="0.01" value={amount} onChange={e => setAmount(e.target.value)} style={inp} /></div>
              <div><label style={{ fontSize: 11, fontWeight: 600, color: '#64748B' }}>Method</label>
                <select value={method} onChange={e => setMethod(e.target.value)} style={inp}><option value="cash">Cash</option><option value="card">Card</option><option value="bank">Bank transfer</option></select>
              </div>
            </div>
            <div><label style={{ fontSize: 11, fontWeight: 600, color: '#64748B' }}>Note (optional)</label><input value={note} onChange={e => setNote(e.target.value)} style={inp} placeholder="e.g. 2nd installment" /></div>
            {err && <div style={{ color: '#EF4444', fontSize: 12 }}>{err}</div>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setOpen(false); setErr('') }} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, padding: '6px 14px', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
              <button onClick={record} disabled={saving || !amount} style={{ background: '#059669', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{saving ? 'Saving…' : 'Record'}</button>
            </div>
          </div>
        )}
    </div>
  )
}

function OrderDrawer({ orderId, warehouses, suppliers, materials, onClose, onUpdated }: {
  orderId: string; warehouses: Ref[]; suppliers: Ref[]; materials: { id: string; name: string; unit: string }[]; onClose: () => void; onUpdated: () => void
}) {
  const navigate = useNavigate()
  const { can } = useAuth()
  const canRecord = can('feature.record_payments')
  const [order, setOrder]   = useState<OnlineOrder | null>(null)
  const [workers, setWorkers] = useState<Worker[]>([])
  const [whStock, setWhStock] = useState<Record<string, number>>({})
  const [whPick, setWhPick]   = useState('')
  const [saving, setSaving]   = useState(false)
  const [err, setErr]         = useState('')

  const load = useCallback(async () => { setOrder(await api.get<OnlineOrder>(`/orders/${orderId}`)) }, [orderId])
  useEffect(() => { load() }, [load])
  const reloadAll = useCallback(async () => { await load(); onUpdated() }, [load, onUpdated])

  const whId = order?.handlingWarehouseId ?? ''
  const refreshWh = useCallback(() => {
    if (!whId) { setWorkers([]); setWhStock({}); return }
    api.get<{ data: Worker[] }>(`/production/workers?warehouseId=${whId}`).then(r => setWorkers(r.data))
    api.get<{ data: Record<string, number> }>(`/production/warehouse-stock?warehouseId=${whId}`).then(r => setWhStock(r.data))
  }, [whId])
  useEffect(() => { refreshWh() }, [refreshWh])

  const setWarehouse = async (warehouseId: string) => {
    if (!warehouseId) return
    setSaving(true); setErr('')
    try { await api.patch(`/orders/${orderId}/handling-warehouse`, { warehouseId }); await reloadAll() }
    catch (e: any) { setErr(e?.message ?? 'Could not set warehouse') } finally { setSaving(false) }
  }
  const markDelivered = async () => { if (order && !confirmDeliver(order as GuardOrder)) return; await api.patch(`/orders/${orderId}/status`, { status: 'delivered' }); await reloadAll() }

  const shell = (body: React.ReactNode) => (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 899 }} onClick={onClose} />
      <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 640, maxWidth: '100%', background: '#fff', boxShadow: '-4px 0 24px rgba(0,0,0,0.1)', zIndex: 900, fontFamily: FONT, overflowY: 'auto' }}>{body}</div>
    </>
  )

  if (!order) return shell(<div style={{ padding: 40, color: '#94A3B8' }}>Loading…</div>)

  const wLocked = order.jobs.some(j => j.status === 'done') || order.jobs.some(j => j.materials.some(m => m.materialId))
  const whName = warehouses.find(w => w.id === order.handlingWarehouseId)?.name ?? '—'
  const done = order.jobs.filter(j => j.status === 'done').length

  // Warehouse gate
  if (!order.handlingWarehouseId) {
    return shell(
      <div style={{ padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 10 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: DARK }}>{order.orderNumber}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => navigate(`/admin/invoice/${orderId}`)} title="Open the tax invoice for this order" style={{ background: '#fff', color: DARK, border: '1px solid #CBD5E1', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}><InvoiceIcon /> Print Invoice</button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94A3B8' }}>×</button>
          </div>
        </div>
        <AdminOrderInformation order={order} onUpdated={reloadAll} />
        <PaymentPanel order={order} canRecord={canRecord} onRecorded={reloadAll} />
        <OrderPortalPanel order={order} onChanged={reloadAll} />
        <div style={{ marginTop: 24, textAlign: 'center', maxWidth: 380, margin: '24px auto 0' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: DARK, marginBottom: 8 }}>Which warehouse is handling this order?</div>
          <div style={{ fontSize: 13, color: '#64748B', marginBottom: 20, lineHeight: 1.6 }}>Workers and materials come from the warehouse you pick. Changeable until work begins.</div>
          <select value={whPick} onChange={e => setWhPick(e.target.value)} style={{ ...inp, marginBottom: 12 }}>
            <option value="">— Select warehouse —</option>
            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          {err && <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 10 }}>{err}</div>}
          <button onClick={() => setWarehouse(whPick)} disabled={!whPick || saving} style={{ width: '100%', padding: 10, borderRadius: 8, border: 'none', background: whPick ? DARK : '#E2E8F0', color: whPick ? '#fff' : '#94A3B8', fontWeight: 700, cursor: whPick ? 'pointer' : 'not-allowed' }}>{saving ? 'Setting…' : 'Start Handling'}</button>
        </div>
      </div>
    )
  }

  return shell(
    <div>
      <div style={{ padding: '18px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: DARK }}>{order.orderNumber}</h2>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{order.customer?.fullName ?? order.customer?.email ?? 'Online customer'}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate(`/admin/invoice/${orderId}`)} title="Open the tax invoice for this order" style={{ background: '#fff', color: DARK, border: '1px solid #CBD5E1', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}><InvoiceIcon /> Print Invoice</button>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 24, cursor: 'pointer', color: '#94A3B8' }}>×</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderBottom: '1px solid #F1F5F9' }}>
        {[
          { l: 'Order Total', v: `AED ${fmt(Number(order.total))}`, c: DARK },
          { l: 'Balance', v: `AED ${fmt(Number(order.total) - Number(order.amountPaid ?? 0))}`, c: (Number(order.total) - Number(order.amountPaid ?? 0)) > 0 ? '#DC2626' : '#10B981' },
          { l: 'Status', v: S_LABEL[order.status] ?? order.status, c: S_COLOR[order.status] ?? DARK },
        ].map(x => <div key={x.l} style={{ padding: '12px 16px', textAlign: 'center', borderRight: '1px solid #F1F5F9' }}><div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>{x.l}</div><div style={{ fontSize: 14, fontWeight: 700, color: x.c }}>{x.v}</div></div>)}
      </div>

      <AdminOrderInformation order={order} onUpdated={reloadAll} />

      <PaymentPanel order={order} canRecord={canRecord} onRecorded={reloadAll} />
      <OrderPortalPanel order={order} onChanged={reloadAll} />

      {/* Warehouse bar */}
      <div style={{ padding: '8px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 10, background: '#F8FAFC' }}>
        <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>Handling from:</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: DARK }}>{whName}</span>
        {wLocked ? <span style={{ fontSize: 11, color: '#94A3B8', marginLeft: 'auto' }}>🔒 Locked — work has begun</span>
          : <select value={order.handlingWarehouseId ?? ''} onChange={e => setWarehouse(e.target.value)} style={{ marginLeft: 'auto', padding: '5px 10px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12, fontFamily: FONT }}>{warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select>}
      </div>

      {/* Ship / deliver action */}
      {order.status !== 'delivered' && order.status !== 'cancelled' && (
        <div style={{ padding: '10px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {order.status === 'ready' && (
            <button onClick={() => { if (confirmShip(order as GuardOrder)) navigate(`/admin/shipments?newOrder=${orderId}`) }} title="Create a shipment for this order"
              style={{ background: '#059669', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <TruckIcon /> Create Shipment →
            </button>
          )}
          <button onClick={markDelivered} disabled={order.status !== 'ready'} title={order.status !== 'ready' ? 'All jobs must be done first' : 'Mark delivered without a shipment record'}
            style={{ background: '#fff', color: order.status === 'ready' ? '#059669' : '#94A3B8', border: `1px solid ${order.status === 'ready' ? '#059669' : '#E2E8F0'}`, borderRadius: 8, padding: '7px 18px', fontSize: 12, fontWeight: 700, cursor: order.status === 'ready' ? 'pointer' : 'not-allowed' }}>
            Mark Delivered
          </button>
          {order.status !== 'ready' && <span style={{ fontSize: 11, color: '#64748B' }}>Ships once all jobs are done ({done}/{order.jobs.length} done)</span>}
        </div>
      )}

      <div style={{ padding: '16px 20px' }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: DARK, marginBottom: 12 }}>Jobs</div>
        {order.jobs.length === 0 ? <div style={{ color: '#94A3B8', fontSize: 13 }}>No job steps defined for these products.</div>
          : order.jobs.map(j => <JobPanel key={j.id} orderId={orderId} job={j} suppliers={suppliers} materials={materials} workers={workers} whStock={whStock} onChanged={reloadAll} />)}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function OnlineOrderHandlingPage() {
  const [orders, setOrders] = useState<OnlineOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [statusF, setStatusF] = useState('all')
  const [warehouses, setWh] = useState<Ref[]>([])
  const [suppliers, setSup] = useState<Ref[]>([])
  const [materials, setMat] = useState<{ id: string; name: string; unit: string }[]>([])
  const [params, setParams] = useSearchParams()
  const drawerId = params.get('order')
  const viewId = params.get('view')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await Promise.all(HANDLING.map(s => api.get<{ orders?: OnlineOrder[]; data?: OnlineOrder[] }>(`/orders?status=${s}&limit=200`).then(r => r.orders ?? r.data ?? []).catch(() => [])))
      setOrders(res.flat())
    } finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])
  useEffect(() => {
    api.get<{ data: Ref[] }>('/warehouses?pageSize=100').then(r => setWh(r.data))
    api.get<{ data: Ref[] }>('/suppliers?pageSize=500').then(r => setSup(r.data))
    api.get<{ data: { id: string; name: string; unit: string }[] }>('/materials?pageSize=500').then(r => setMat(r.data))
  }, [])

  const navigate = useNavigate()
  const openDrawer = (id: string) => setParams(p => { const n = new URLSearchParams(p); n.set('order', id); n.delete('view'); return n })
  const closeDrawer = () => setParams(p => { const n = new URLSearchParams(p); n.delete('order'); return n })
  const openView = (id: string) => setParams(p => { const n = new URLSearchParams(p); n.set('view', id); n.delete('order'); return n })
  const closeView = () => setParams(p => { const n = new URLSearchParams(p); n.delete('view'); return n })

  const filtered = orders.filter(o => statusF === 'all' || o.status === statusF)

  return (
    <AdminLayout title="Online Order Handling" actions={<></>}>
      <StatGrid>
        <StatCard label="Active Online" value={String(orders.length)} sub="Need handling" />
        <StatCard label="Confirmed" value={String(orders.filter(o => o.status === 'confirmed').length)} sub="Awaiting production" color="#8B5CF6" />
        <StatCard label="In Production" value={String(orders.filter(o => o.status === 'in_production').length)} sub="Being worked on" color="#3B82F6" />
        <StatCard label="Ready" value={String(orders.filter(o => o.status === 'ready').length)} sub="Ready to deliver" color="#10B981" />
      </StatGrid>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['all', ...HANDLING] as const).map(s => (
          <button key={s} onClick={() => setStatusF(s)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontFamily: FONT, fontWeight: 500, cursor: 'pointer', border: '1px solid #E2E8F0', background: statusF === s ? DARK : '#fff', color: statusF === s ? '#fff' : '#64748B' }}>
            {s === 'all' ? `All (${orders.length})` : `${S_LABEL[s]} (${orders.filter(o => o.status === s).length})`}
          </button>
        ))}
      </div>

      {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
        : filtered.length === 0 ? <div style={{ padding: 60, textAlign: 'center', color: '#94A3B8', fontFamily: FONT, border: '2px dashed #E2E8F0', borderRadius: 12 }}>No online orders need handling right now.</div>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(o => {
              const total = o.jobs.length, doneJ = o.jobs.filter(j => j.status === 'done').length
              const pct = total ? Math.round(doneJ / total * 100) : 0
              const unassigned = o.jobs.filter(j => j.type === 'in_house' && !j.assignedTo && j.status !== 'done').length
              return (
                <div key={o.id} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 18 }}>
                  {o.designFileUrl
                    ? <img src={catalogImageUrl(o.designFileUrl)} alt="design" title={`Design: ${o.designFileName ?? ''}`} style={{ width: 38, height: 38, borderRadius: 8, objectFit: 'cover', border: '1px solid #E2E8F0', flexShrink: 0 }} />
                    : <div title="No design file" style={{ width: 38, height: 38, borderRadius: 8, border: '1px dashed #CBD5E1', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#94A3B8', textAlign: 'center', lineHeight: 1.1 }}>no art</div>}
                  <div style={{ minWidth: 165 }}>
                    <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: DARK }}>{o.orderNumber}</div>
                    <div style={{ fontFamily: FONT, fontSize: 12, color: '#64748B' }}>{o.customer?.fullName ?? o.customer?.email ?? 'Online'}</div>
                  </div>
                  <Badge label={S_LABEL[o.status] ?? o.status} color={S_COLOR[o.status] ?? '#64748B'} />
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: o.paymentStatus === 'paid' ? '#ECFDF5' : '#FFFBEB', color: o.paymentStatus === 'paid' ? '#059669' : '#D97706', fontWeight: 600, textTransform: 'capitalize' }}>{o.paymentStatus.replaceAll('_', ' ')}</span>
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: '#94A3B8', fontFamily: FONT }}>Jobs</span>
                      <span style={{ fontSize: 11, color: DARK, fontFamily: FONT, fontWeight: 600 }}>{doneJ}/{total} done</span>
                    </div>
                    <div style={{ height: 6, background: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}><div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#10B981' : '#3B82F6', borderRadius: 3 }} /></div>
                  </div>
                  {unassigned > 0 && <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 999, background: '#FEF2F2', color: '#DC2626' }}>{unassigned} unassigned</span>}
                  <div style={{ minWidth: 100, textAlign: 'right', fontFamily: FONT }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: DARK }}>AED {fmt(Number(o.total))}</div>
                    {(Number(o.total) - Number(o.amountPaid ?? 0)) > 0.001 && Number(o.amountPaid ?? 0) > 0 && <div style={{ fontSize: 10, color: '#DC2626', fontWeight: 600 }}>Bal AED {fmt(Number(o.total) - Number(o.amountPaid ?? 0))}</div>}
                  </div>
                  <button onClick={() => navigate(`/admin/invoice/${o.id}`)} title="Print the tax invoice" style={{ background: '#fff', color: DARK, border: '1px solid #CBD5E1', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 600, fontFamily: FONT, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}><InvoiceIcon /> Invoice</button>
                  <button onClick={() => openView(o.id)} style={{ background: '#fff', color: DARK, border: '1px solid #CBD5E1', borderRadius: 8, padding: '7px 16px', fontSize: 12, fontWeight: 600, fontFamily: FONT, cursor: 'pointer' }}>View</button>
                  {o.status === 'ready'
                    ? <button onClick={() => { if (confirmShip(o as GuardOrder)) navigate(`/admin/shipments?newOrder=${o.id}`) }} title="Create a shipment for this order" style={{ background: '#059669', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 12, fontWeight: 700, fontFamily: FONT, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}><TruckIcon /> Ship →</button>
                    : total > 0
                      ? <button onClick={() => openDrawer(o.id)} style={{ background: DARK, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 12, fontWeight: 700, fontFamily: FONT, cursor: 'pointer' }}>Order Handling →</button>
                      : <span title="No production jobs — set the status from View" style={{ fontSize: 11, color: '#94A3B8', fontFamily: FONT, minWidth: 110, textAlign: 'center' }}>No jobs · set status in View</span>}
                </div>
              )
            })}
          </div>
        )}

      {drawerId && <OrderDrawer orderId={drawerId} warehouses={warehouses} suppliers={suppliers} materials={materials} onClose={closeDrawer} onUpdated={load} />}
      {viewId && <>
        <div onClick={closeView} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', zIndex: 999 }} />
        <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 680, maxWidth: '100%', background: '#fff', overflowY: 'auto', zIndex: 1000, boxShadow: '-8px 0 30px rgba(0,0,0,.15)' }}>
          <button onClick={closeView} style={{ position: 'absolute', top: 14, right: 14, zIndex: 1, border: 0, background: 'none', fontSize: 22, cursor: 'pointer' }}>×</button>
          <AdminOrderDetails orderId={viewId} onUpdated={load} />
        </div>
      </>}
    </AdminLayout>
  )
}
