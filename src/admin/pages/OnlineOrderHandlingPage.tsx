import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AdminLayout, StatCard, StatGrid, Badge } from '../components/AdminLayout'
import { AdminOrderInformation, type AdminOrderDetail } from '../components/AdminOrderDetails'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'
const BLUE = '#3B82F6'
const fmt = (n: number) => Number(n).toLocaleString(undefined, { minimumFractionDigits: 2 })

const HANDLING = ['confirmed', 'in_production', 'ready'] as const
const S_LABEL: Record<string, string> = { confirmed: 'Confirmed', in_production: 'In Production', ready: 'Ready', delivered: 'Delivered', cancelled: 'Cancelled', pending: 'Pending' }
const S_COLOR: Record<string, string> = { confirmed: '#8B5CF6', in_production: '#3B82F6', ready: '#10B981', delivered: '#059669', cancelled: '#EF4444', pending: '#64748B' }
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
function OrderDrawer({ orderId, warehouses, suppliers, materials, onClose, onUpdated }: {
  orderId: string; warehouses: Ref[]; suppliers: Ref[]; materials: { id: string; name: string; unit: string }[]; onClose: () => void; onUpdated: () => void
}) {
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
  const markDelivered = async () => { await api.patch(`/orders/${orderId}/status`, { status: 'delivered' }); await reloadAll() }

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
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: DARK }}>{order.orderNumber}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94A3B8' }}>×</button>
        </div>
        <AdminOrderInformation order={order} />
        <div style={{ marginTop: 40, textAlign: 'center', maxWidth: 380, margin: '40px auto 0' }}>
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
        <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 24, cursor: 'pointer', color: '#94A3B8' }}>×</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderBottom: '1px solid #F1F5F9' }}>
        {[
          { l: 'Order Total', v: `AED ${fmt(Number(order.total))}`, c: DARK },
          { l: 'Payment', v: order.paymentStatus === 'paid' ? 'Paid ✓' : order.paymentStatus, c: '#10B981' },
          { l: 'Status', v: S_LABEL[order.status] ?? order.status, c: S_COLOR[order.status] ?? DARK },
        ].map(x => <div key={x.l} style={{ padding: '12px 16px', textAlign: 'center', borderRight: '1px solid #F1F5F9' }}><div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>{x.l}</div><div style={{ fontSize: 14, fontWeight: 700, color: x.c }}>{x.v}</div></div>)}
      </div>

      <AdminOrderInformation order={order} />

      {/* Warehouse bar */}
      <div style={{ padding: '8px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 10, background: '#F8FAFC' }}>
        <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>Handling from:</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: DARK }}>{whName}</span>
        {wLocked ? <span style={{ fontSize: 11, color: '#94A3B8', marginLeft: 'auto' }}>🔒 Locked — work has begun</span>
          : <select value={order.handlingWarehouseId ?? ''} onChange={e => setWarehouse(e.target.value)} style={{ marginLeft: 'auto', padding: '5px 10px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12, fontFamily: FONT }}>{warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select>}
      </div>

      {/* Delivered action */}
      {order.status !== 'delivered' && order.status !== 'cancelled' && (
        <div style={{ padding: '10px 20px', borderBottom: '1px solid #F1F5F9' }}>
          <button onClick={markDelivered} disabled={order.status !== 'ready'} title={order.status !== 'ready' ? 'All jobs must be done first' : undefined}
            style={{ background: order.status === 'ready' ? '#059669' : '#E2E8F0', color: order.status === 'ready' ? '#fff' : '#94A3B8', border: 'none', borderRadius: 8, padding: '7px 18px', fontSize: 12, fontWeight: 700, cursor: order.status === 'ready' ? 'pointer' : 'not-allowed' }}>
            Mark Delivered
          </button>
          {order.status !== 'ready' && <span style={{ fontSize: 11, color: '#64748B', marginLeft: 10 }}>Auto-advances as jobs progress ({done}/{order.jobs.length} done)</span>}
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

  const openDrawer = (id: string) => setParams(p => { const n = new URLSearchParams(p); n.set('order', id); return n })
  const closeDrawer = () => setParams(p => { const n = new URLSearchParams(p); n.delete('order'); return n })

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
                <div key={o.id} onClick={() => openDrawer(o.id)} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 18 }}>
                  <div style={{ minWidth: 180 }}>
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
                  <div style={{ minWidth: 100, textAlign: 'right', fontFamily: FONT, fontSize: 13, fontWeight: 700, color: DARK }}>AED {fmt(Number(o.total))}</div>
                  <button style={{ background: DARK, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 12, fontWeight: 700, fontFamily: FONT, cursor: 'pointer' }}>Handle →</button>
                </div>
              )
            })}
          </div>
        )}

      {drawerId && <OrderDrawer orderId={drawerId} warehouses={warehouses} suppliers={suppliers} materials={materials} onClose={closeDrawer} onUpdated={load} />}
    </AdminLayout>
  )
}
