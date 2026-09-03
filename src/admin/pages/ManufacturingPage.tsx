import { useEffect, useState } from 'react'
import { AdminLayout, Table, SearchInput, Badge, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

type MfgStatus = 'draft' | 'planned' | 'in_progress' | 'completed' | 'cancelled'

interface MO {
  id: string
  moNumber: string
  quantity: number
  status: MfgStatus
  scheduledAt: string | null
  completedAt: string | null
  notes: string | null
  createdAt: string
  bom: { id: string }
  warehouse: { id: string; name: string }
}

const STATUS_LABEL: Record<MfgStatus, string> = {
  draft:       'Draft',
  planned:     'Planned',
  in_progress: 'In Progress',
  completed:   'Completed',
  cancelled:   'Cancelled',
}
const STATUS_COLOR: Record<MfgStatus, string> = {
  draft:       '#64748B',
  planned:     '#1D4ED8',
  in_progress: '#F59E0B',
  completed:   '#10B981',
  cancelled:   '#EF4444',
}

const COLS = [
  { key: 'moNumber',    label: 'MO #',        width: 140 },
  { key: 'quantity',    label: 'Qty',          width: 70  },
  { key: 'warehouse',   label: 'Warehouse',    width: 160 },
  { key: 'status',      label: 'Status',       width: 130 },
  { key: 'scheduledAt', label: 'Scheduled',    width: 110 },
  { key: 'completedAt', label: 'Completed',    width: 110 },
  { key: 'created',     label: 'Created',      width: 110 },
]

const STATUSES: MfgStatus[] = ['draft', 'planned', 'in_progress', 'completed', 'cancelled']

export function ManufacturingPage() {
  const [data, setData]           = useState<MO[]>([])
  const [loading, setLoading]     = useState(true)
  const [q, setQ]                 = useState('')
  const [statusFilter, setFilter] = useState<MfgStatus | 'all'>('all')

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get<{ data: MO[] }>('/manufacturing-orders?pageSize=200')
      setData(res.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = data.filter(r =>
    (statusFilter === 'all' || r.status === statusFilter) &&
    (r.moNumber.toLowerCase().includes(q.toLowerCase()) ||
     r.warehouse.name.toLowerCase().includes(q.toLowerCase()))
  )

  const rows = filtered.map(r => ({
    moNumber:    r.moNumber,
    quantity:    r.quantity,
    warehouse:   r.warehouse.name,
    status:      <Badge label={STATUS_LABEL[r.status]} color={STATUS_COLOR[r.status]} />,
    scheduledAt: r.scheduledAt ? r.scheduledAt.slice(0, 10) : '—',
    completedAt: r.completedAt ? r.completedAt.slice(0, 10) : '—',
    created:     r.createdAt.slice(0, 10),
  }))

  const totalQty = data.filter(r => r.status !== 'cancelled').reduce((s, r) => s + r.quantity, 0)

  return (
    <AdminLayout title="Manufacturing" actions={<SearchInput value={q} onChange={setQ} placeholder="Search MO #, warehouse…" />}>
      <StatGrid>
        <StatCard label="Total Orders"  value={String(data.length)}                                              sub="All MOs" />
        <StatCard label="In Progress"   value={String(data.filter(r => r.status === 'in_progress').length)}      sub="Currently running"  color="#F59E0B" />
        <StatCard label="Completed"     value={String(data.filter(r => r.status === 'completed').length)}        sub="Finished"           color="#10B981" />
        <StatCard label="Total Qty"     value={String(totalQty)}                                                 sub="Units produced/planned" color="#1D4ED8" />
      </StatGrid>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['all', ...STATUSES] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontFamily: FONT, fontWeight: 500, cursor: 'pointer', border: '1px solid #E2E8F0', background: statusFilter === s ? DARK : '#fff', color: statusFilter === s ? '#fff' : '#64748B' }}>
            {s === 'all' ? 'All' : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT, fontSize: 14 }}>Loading…</div>
      ) : data.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#94A3B8', fontFamily: FONT, fontSize: 14 }}>No manufacturing orders yet.</div>
      ) : (
        <>
          <div style={{ fontSize: 13, color: '#64748B', marginBottom: 12, fontFamily: FONT }}>{filtered.length} manufacturing orders</div>
          <Table columns={COLS} rows={rows} />
        </>
      )}
    </AdminLayout>
  )
}
