import { useEffect, useState } from 'react'
import { AdminLayout, Table, SearchInput, Badge, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

type SOStatus = 'draft' | 'confirmed' | 'partially_delivered' | 'delivered' | 'invoiced' | 'cancelled'

interface SalesOrder {
  id: string
  orderNumber: string
  status: SOStatus
  subtotal: string
  vatAmount: string
  total: string
  createdAt: string
  customer: { id: string; fullName: string | null; email: string }
  _count: { items: number; invoices: number }
}

const STATUS_LABEL: Record<SOStatus, string> = {
  draft:               'Draft',
  confirmed:           'Confirmed',
  partially_delivered: 'Part. Delivered',
  delivered:           'Delivered',
  invoiced:            'Invoiced',
  cancelled:           'Cancelled',
}
const STATUS_COLOR: Record<SOStatus, string> = {
  draft:               '#64748B',
  confirmed:           '#8B5CF6',
  partially_delivered: '#F59E0B',
  delivered:           '#10B981',
  invoiced:            '#1D4ED8',
  cancelled:           '#EF4444',
}

const COLS = [
  { key: 'orderNumber', label: 'SO #',      width: 130 },
  { key: 'customer',    label: 'Customer' },
  { key: 'items',       label: 'Lines',     width: 70  },
  { key: 'invoices',    label: 'Invoices',  width: 80  },
  { key: 'total',       label: 'Total',     width: 120 },
  { key: 'status',      label: 'Status',    width: 160 },
  { key: 'created',     label: 'Created',   width: 110 },
]

export function SalesOrdersPage() {
  const [data, setData]           = useState<SalesOrder[]>([])
  const [loading, setLoading]     = useState(true)
  const [q, setQ]                 = useState('')
  const [statusFilter, setFilter] = useState<SOStatus | 'all'>('all')

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get<{ data: SalesOrder[] }>('/sales-orders?pageSize=200')
      setData(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = data.filter(r =>
    (statusFilter === 'all' || r.status === statusFilter) &&
    (r.orderNumber.toLowerCase().includes(q.toLowerCase()) ||
     (r.customer.fullName ?? '').toLowerCase().includes(q.toLowerCase()) ||
     r.customer.email.toLowerCase().includes(q.toLowerCase()))
  )

  const rows = filtered.map(r => ({
    orderNumber: r.orderNumber,
    customer:    r.customer.fullName ?? r.customer.email,
    items:       r._count.items,
    invoices:    r._count.invoices,
    total:       <strong>AED {Number(r.total).toLocaleString()}</strong>,
    status:      <Badge label={STATUS_LABEL[r.status] ?? r.status} color={STATUS_COLOR[r.status] ?? '#64748B'} />,
    created:     r.createdAt.slice(0, 10),
  }))

  const statuses: SOStatus[] = ['draft', 'confirmed', 'partially_delivered', 'delivered', 'invoiced', 'cancelled']
  const totalRevenue = data.filter(r => r.status !== 'cancelled').reduce((s, r) => s + Number(r.total), 0)

  return (
    <AdminLayout title="Sales Orders" actions={<SearchInput value={q} onChange={setQ} placeholder="Search SO #, customer…" />}>
      <StatGrid>
        <StatCard label="Revenue"    value={`AED ${totalRevenue.toLocaleString()}`}                                   sub="Non-cancelled"     color="#1D4ED8" />
        <StatCard label="Confirmed"  value={String(data.filter(r => r.status === 'confirmed').length)}                sub="In progress"       color="#8B5CF6" />
        <StatCard label="Delivered"  value={String(data.filter(r => ['delivered','invoiced'].includes(r.status)).length)} sub="Delivered / invoiced" color="#10B981" />
        <StatCard label="Cancelled"  value={String(data.filter(r => r.status === 'cancelled').length)}                sub="Cancelled"         color="#EF4444" />
      </StatGrid>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['all', ...statuses] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontFamily: FONT, fontWeight: 500, cursor: 'pointer', border: '1px solid #E2E8F0', background: statusFilter === s ? DARK : '#fff', color: statusFilter === s ? '#fff' : '#64748B' }}>
            {s === 'all' ? 'All' : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT, fontSize: 14 }}>Loading…</div>
      ) : data.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#94A3B8', fontFamily: FONT, fontSize: 14 }}>No sales orders yet.</div>
      ) : (
        <>
          <div style={{ fontSize: 13, color: '#64748B', marginBottom: 12, fontFamily: FONT }}>{filtered.length} sales orders</div>
          <Table columns={COLS} rows={rows} />
        </>
      )}
    </AdminLayout>
  )
}
