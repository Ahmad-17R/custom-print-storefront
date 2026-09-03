import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AdminLayout, Table, SearchInput, Badge, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'
const fmt = (n: number) => Number(n).toLocaleString(undefined, { minimumFractionDigits: 2 })

const STATUS_LABEL: Record<string, string> = { pending: 'Pending', confirmed: 'Confirmed', in_production: 'In Production', ready_for_pickup: 'Ready for Pickup', completed: 'Completed', cancelled: 'Cancelled' }
const STATUS_COLOR: Record<string, string> = { pending: '#64748B', confirmed: '#8B5CF6', in_production: '#3B82F6', ready_for_pickup: '#10B981', completed: '#059669', cancelled: '#EF4444' }
const JOB_COLOR: Record<string, string>    = { pending: '#94A3B8', started: '#3B82F6', in_progress: '#3B82F6', done: '#10B981', cancelled: '#EF4444' }

interface JobMat { id: string; name: string; materialId?: string | null; quantity: number; totalCost: number }
interface Job {
  id: string; stepName: string; productName?: string | null; status: string; type: string
  assignedTo?: { name: string } | null; supplier?: { name: string } | null; supplierStatus?: string | null; supplierCost?: number | null
  materials: JobMat[]
}
interface Payment { id: string; amount: number; type: string; method: string; paidAt: string }
interface OrderRow {
  id: string; saleNumber: string; status: string; totalAmount: number; advancePaid: number; createdAt: string
  handlingWarehouseId?: string | null
  customer: { name: string; phone?: string; company?: string }
}
interface OrderFull extends OrderRow {
  items: { id: string; productName: string; quantity: number; total: number }[]
  jobs: Job[]; payments: Payment[]
}
interface Warehouse { id: string; name: string }

// ── Detail view ───────────────────────────────────────────────────────────────
function SummaryDetail({ order, warehouses, onBack }: { order: OrderFull; warehouses: Warehouse[]; onBack: () => void }) {
  const balance      = Number(order.totalAmount) - Number(order.advancePaid)
  const supplierCost = order.jobs.reduce((s, j) => s + Number(j.supplierCost ?? 0), 0)
  const materialCost = order.jobs.reduce((s, j) => s + j.materials.reduce((a, m) => a + Number(m.totalCost ?? 0), 0), 0)
  const inHouse      = order.jobs.filter(j => j.type === 'in_house').length
  const outsourced   = order.jobs.filter(j => j.type !== 'in_house').length
  const doneJobs     = order.jobs.filter(j => j.status === 'done').length
  const whName       = warehouses.find(w => w.id === order.handlingWarehouseId)?.name ?? '—'

  return (
    <AdminLayout title={`Summary — ${order.saleNumber}`} actions={<button onClick={onBack} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: '#F1F5F9', color: '#374151', fontFamily: FONT, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>← Back</button>}>
      {/* Header */}
      <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'center' }}>
        <div><div style={cap}>Customer</div><div style={val}>{order.customer.name}{order.customer.company ? ` · ${order.customer.company}` : ''}</div></div>
        <div><div style={cap}>Status</div><div style={{ marginTop: 4 }}><Badge label={STATUS_LABEL[order.status] ?? order.status} color={STATUS_COLOR[order.status] ?? '#64748B'} /></div></div>
        <div><div style={cap}>Handled from</div><div style={val}>{whName}</div></div>
        <div><div style={cap}>Date</div><div style={val}>{new Date(order.createdAt).toLocaleDateString()}</div></div>
      </div>

      <StatGrid>
        <StatCard label="Order Total"  value={`AED ${fmt(order.totalAmount)}`} sub={`Collected AED ${fmt(order.advancePaid)}`} />
        <StatCard label="Balance"      value={`AED ${fmt(Math.max(0, balance))}`} sub={balance > 0 ? 'Due' : 'Settled'} color={balance > 0 ? '#EF4444' : '#10B981'} />
        <StatCard label="Jobs"         value={`${doneJobs}/${order.jobs.length}`} sub={`${inHouse} in-house · ${outsourced} supplier`} color="#3B82F6" />
        <StatCard label="Job Costs"    value={`AED ${fmt(supplierCost + materialCost)}`} sub={`Supplier ${fmt(supplierCost)} · Materials ${fmt(materialCost)}`} color="#7C3AED" />
      </StatGrid>

      {/* Jobs breakdown */}
      <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 15, color: DARK, margin: '8px 0 12px' }}>Jobs — who did what</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {order.jobs.length === 0 && <div style={{ color: '#94A3B8', fontFamily: FONT, fontSize: 13 }}>No jobs on this order.</div>}
        {order.jobs.map((j, i) => (
          <div key={j.id} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, padding: '12px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: DARK }}>{i + 1}. {j.productName ? `${j.productName} → ` : ''}{j.stepName}</span>
              <Badge label={STATUS_LABEL[j.status] ?? j.status} color={JOB_COLOR[j.status] ?? '#64748B'} />
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, fontWeight: 600, background: j.type === 'in_house' ? '#EFF6FF' : '#FDF4FF', color: j.type === 'in_house' ? '#3B82F6' : '#7C3AED' }}>
                {j.type === 'in_house' ? 'In-house' : 'Supplier'}
              </span>
              <span style={{ marginLeft: 'auto', fontFamily: FONT, fontSize: 13, fontWeight: 600, color: DARK }}>
                {j.type === 'in_house'
                  ? (j.assignedTo ? `👤 ${j.assignedTo.name}` : <span style={{ color: '#DC2626' }}>Unassigned</span>)
                  : (j.supplier ? `🏭 ${j.supplier.name}${j.supplierStatus ? ` · ${j.supplierStatus}` : ''}${j.supplierCost ? ` · AED ${fmt(j.supplierCost)}` : ''}` : <span style={{ color: '#DC2626' }}>No supplier</span>)}
              </span>
            </div>
            {/* Materials */}
            {j.materials.length > 0 && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #F1F5F9' }}>
                <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: FONT, marginBottom: 6, fontWeight: 600 }}>MATERIALS USED</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {j.materials.map(m => (
                    <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontFamily: FONT, color: '#475569' }}>
                      <span>{m.name} {m.materialId ? '' : '(custom)'} × {Number(m.quantity)}</span>
                      {Number(m.totalCost) > 0 && <span style={{ color: '#7C3AED', fontWeight: 600 }}>AED {fmt(m.totalCost)}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Payments */}
      <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 15, color: DARK, margin: '24px 0 12px' }}>Payments</div>
      {order.payments.length === 0 ? (
        <div style={{ color: '#94A3B8', fontFamily: FONT, fontSize: 13 }}>No payments recorded.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {order.payments.map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', background: '#F8FAFC', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontFamily: FONT }}>
              <span style={{ color: '#475569', textTransform: 'capitalize' }}>{p.type} · {p.method}</span>
              <span style={{ color: '#94A3B8' }}>{new Date(p.paidAt).toLocaleDateString()}</span>
              <span style={{ fontWeight: 700, color: '#10B981' }}>AED {fmt(p.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  )
}
const cap: React.CSSProperties = { fontSize: 11, color: '#94A3B8', fontFamily: FONT, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }
const val: React.CSSProperties = { fontFamily: FONT, fontSize: 13, color: DARK, marginTop: 4, fontWeight: 600 }

// ── List ──────────────────────────────────────────────────────────────────────
const COLS = [
  { key: 'saleNumber', label: 'Order #', width: 140 },
  { key: 'customer',   label: 'Customer' },
  { key: 'jobs',       label: 'Jobs', width: 90 },
  { key: 'total',      label: 'Total', width: 120 },
  { key: 'status',     label: 'Status', width: 130 },
  { key: 'date',       label: 'Date', width: 110 },
  { key: 'action',     label: '', width: 100 },
]

export function OrderSummaryPage() {
  const [orders, setOrders]   = useState<(OrderRow & { _count?: { jobs: number } })[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ]             = useState('')
  const [statusF, setStatusF] = useState('all')
  const [detail, setDetail]   = useState<OrderFull | null>(null)
  const [params, setParams]   = useSearchParams()

  const load = useCallback(async () => {
    setLoading(true)
    try { const r = await api.get<{ data: (OrderRow & { _count?: { jobs: number } })[] }>('/walk-in-sales?pageSize=300'); setOrders(r.data) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])
  useEffect(() => { api.get<{ data: Warehouse[] }>('/warehouses?pageSize=100').then(r => setWarehouses(r.data)) }, [])

  const openDetail = useCallback(async (id: string) => {
    const full = await api.get<OrderFull>(`/walk-in-sales/${id}`)
    setDetail(full)
    setParams(prev => { const p = new URLSearchParams(prev); p.set('order', id); return p })
  }, [setParams])

  // Deep-link support
  useEffect(() => {
    const id = params.get('order')
    if (id && (!detail || detail.id !== id)) openDetail(id)
    if (!id && detail) setDetail(null)
  }, [params, detail, openDetail])

  const back = () => setParams(prev => { const p = new URLSearchParams(prev); p.delete('order'); return p })

  if (detail) return <SummaryDetail order={detail} warehouses={warehouses} onBack={back} />

  const filtered = orders.filter(o =>
    (statusF === 'all' || o.status === statusF) &&
    (o.saleNumber.toLowerCase().includes(q.toLowerCase()) || o.customer.name.toLowerCase().includes(q.toLowerCase()))
  )
  const rows = filtered.map(o => ({
    saleNumber: <button onClick={() => openDetail(o.id)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: FONT, fontWeight: 700, fontSize: 13, color: '#1D4ED8' }}>{o.saleNumber}</button>,
    customer: <span style={{ fontFamily: FONT, fontSize: 13 }}>{o.customer.name}</span>,
    jobs: o._count?.jobs ?? '—',
    total: <span style={{ fontFamily: FONT, fontWeight: 600 }}>AED {fmt(o.totalAmount)}</span>,
    status: <Badge label={STATUS_LABEL[o.status] ?? o.status} color={STATUS_COLOR[o.status] ?? '#64748B'} />,
    date: new Date(o.createdAt).toLocaleDateString(),
    action: <button onClick={() => openDetail(o.id)} style={{ padding: '4px 12px', borderRadius: 8, border: 'none', background: '#F1F5F9', color: '#374151', fontFamily: FONT, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>View</button>,
  }))

  const STATUSES = ['all', 'completed', 'ready_for_pickup', 'in_production', 'confirmed', 'cancelled']

  return (
    <AdminLayout title="Order Summary" actions={<SearchInput value={q} onChange={setQ} placeholder="Search order or customer…" />}>
      <StatGrid>
        <StatCard label="All Orders" value={String(orders.length)} sub="Full history" />
        <StatCard label="Completed"  value={String(orders.filter(o => o.status === 'completed').length)} sub="Finished" color="#059669" />
        <StatCard label="Active"     value={String(orders.filter(o => ['confirmed', 'in_production', 'ready_for_pickup'].includes(o.status)).length)} sub="In progress" color="#3B82F6" />
        <StatCard label="Cancelled"  value={String(orders.filter(o => o.status === 'cancelled').length)} sub="Cancelled" color="#EF4444" />
      </StatGrid>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {STATUSES.map(s => (
          <button key={s} onClick={() => setStatusF(s)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontFamily: FONT, fontWeight: 500, cursor: 'pointer', border: '1px solid #E2E8F0', background: statusF === s ? DARK : '#fff', color: statusF === s ? '#fff' : '#64748B' }}>
            {s === 'all' ? 'All' : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
        : filtered.length === 0 ? <div style={{ padding: 60, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>No orders found.</div>
        : <><div style={{ fontSize: 13, color: '#64748B', marginBottom: 12, fontFamily: FONT }}>{filtered.length} orders</div><Table columns={COLS} rows={rows} /></>}
    </AdminLayout>
  )
}
