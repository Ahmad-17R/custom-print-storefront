import { useEffect, useState } from 'react'
import { AdminLayout, Table, SearchInput, Badge, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

type OrderStatus = 'pending' | 'confirmed' | 'in_production' | 'ready' | 'delivered' | 'cancelled'

interface Order {
  id: string; status: OrderStatus; total: number; paymentMethod: string
  customer: { id: string; email: string; fullName?: string }
  createdAt: string; notes?: string
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending:       'Pending',
  confirmed:     'Confirmed',
  in_production: 'In Production',
  ready:         'Ready',
  delivered:     'Delivered',
  cancelled:     'Cancelled',
}

const statusColor: Record<OrderStatus, string> = {
  pending:       '#F59E0B',
  confirmed:     '#1D4ED8',
  in_production: '#8B5CF6',
  ready:         '#10B981',
  delivered:     '#10B981',
  cancelled:     '#EF4444',
}

const STATUSES = Object.keys(STATUS_LABELS) as OrderStatus[]

const COLS = [
  { key: 'id',            label: 'Order ID',    width: 130 },
  { key: 'customer',      label: 'Customer' },
  { key: 'total',         label: 'Total',       width: 110 },
  { key: 'paymentMethod', label: 'Payment',     width: 120 },
  { key: 'status',        label: 'Status',      width: 140 },
  { key: 'createdAt',     label: 'Date',        width: 110 },
  { key: 'actions',       label: '',            width: 80  },
]

function DetailModal({ order, onClose, onUpdate }: { order: Order; onClose: () => void; onUpdate: () => void }) {
  const [status, setStatus] = useState<OrderStatus>(order.status)
  const [loading, setLoading] = useState(false)

  const save = async () => {
    setLoading(true)
    try {
      await api.patch(`/orders/${order.id}/status`, { status })
      onUpdate(); onClose()
    } finally { setLoading(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 460, fontFamily: FONT }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: DARK }}>Order {order.id.slice(0, 8)}…</h2>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748B' }}>{order.customer.email}</p>
        <div style={{ background: '#F8FAFC', borderRadius: 8, padding: '12px 14px', marginBottom: 20, fontSize: 13 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span>Total</span><strong>AED {order.total.toLocaleString()}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Payment</span><span>{order.paymentMethod}</span>
          </div>
          {order.notes && <div style={{ marginTop: 8, color: '#64748B' }}>Notes: {order.notes}</div>}
        </div>
        <label style={{ display: 'block', marginBottom: 20 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Update Status</span>
          <select value={status} onChange={e => setStatus(e.target.value as OrderStatus)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, outline: 'none' }}>
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </label>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', border: '1px solid #E2E8F0', borderRadius: 8, background: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: FONT }}>Close</button>
          <button onClick={save} disabled={loading} style={{ padding: '8px 16px', border: 'none', borderRadius: 8, background: DARK, color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: FONT }}>{loading ? 'Saving…' : 'Update Status'}</button>
        </div>
      </div>
    </div>
  )
}

export function OrdersPage() {
  const [data, setData]     = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ]           = useState('')
  const [status, setStatus] = useState<OrderStatus | 'all'>('all')
  const [selected, setSelected] = useState<Order | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const url = status === 'all' ? '/orders?limit=100' : `/orders?status=${status}&limit=100`
      const res = await api.get<{ data: Order[]; orders?: Order[] }>(url)
      setData(res.data ?? (res as unknown as { orders: Order[] }).orders ?? [])
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [status])

  const filtered = data.filter(o =>
    o.id.toLowerCase().includes(q.toLowerCase()) ||
    o.customer.email.toLowerCase().includes(q.toLowerCase()) ||
    (o.customer.fullName ?? '').toLowerCase().includes(q.toLowerCase())
  )

  const rows = filtered.map(o => ({
    ...o,
    id:            o.id.slice(0, 12) + '…',
    customer:      o.customer.fullName ?? o.customer.email,
    total:         `AED ${o.total.toLocaleString()}`,
    status:        <Badge label={STATUS_LABELS[o.status]} color={statusColor[o.status]} />,
    createdAt:     o.createdAt.slice(0, 10),
    actions:       <button onClick={() => setSelected(o)} style={{ fontSize: 12, padding: '4px 10px', border: '1px solid #E2E8F0', borderRadius: 6, background: '#fff', cursor: 'pointer', fontFamily: FONT }}>View</button>,
  }))

  const revenue = data.filter(o => o.status !== 'cancelled').reduce((s,o) => s + o.total, 0)

  return (
    <AdminLayout title="Orders" actions={<SearchInput value={q} onChange={setQ} placeholder="Search orders…" />}>
      <StatGrid>
        <StatCard label="Total Orders"   value={String(data.length)}                                          sub="All time" />
        <StatCard label="Revenue"        value={`AED ${revenue.toLocaleString()}`}                            sub="Excl. cancelled" color="#10B981" />
        <StatCard label="In Progress"    value={String(data.filter(o=>['confirmed','in_production'].includes(o.status)).length)} sub="" color="#1D4ED8" />
        <StatCard label="Cancelled"      value={String(data.filter(o=>o.status==='cancelled').length)}        sub="" color="#EF4444" />
      </StatGrid>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['all', ...STATUSES] as const).map(s => (
          <button key={s} onClick={() => setStatus(s)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontFamily: FONT, fontWeight: 500, cursor: 'pointer', border: '1px solid #E2E8F0', background: status===s ? DARK : '#fff', color: status===s ? '#fff' : '#64748B' }}>
            {s === 'all' ? 'All' : STATUS_LABELS[s as OrderStatus]}
          </button>
        ))}
      </div>
      {loading
        ? <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
        : data.length === 0
          ? <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8', fontFamily: FONT }}>No orders yet.</div>
          : <Table columns={COLS} rows={rows} />
      }
      {selected && <DetailModal order={selected} onClose={() => setSelected(null)} onUpdate={load} />}
    </AdminLayout>
  )
}
