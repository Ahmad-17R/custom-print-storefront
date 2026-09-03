import { useEffect, useState } from 'react'
import { AdminLayout, Table, SearchInput, Badge, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'

interface Quotation {
  id: string
  status: QuotationStatus
  validUntil: string | null
  subtotal: string
  vatAmount: string
  total: string
  createdAt: string
  customer: { id: string; fullName: string | null; email: string }
  _count: { items: number }
}

const STATUS_LABEL: Record<QuotationStatus, string> = {
  draft:    'Draft',
  sent:     'Sent',
  accepted: 'Accepted',
  rejected: 'Rejected',
  expired:  'Expired',
}
const STATUS_COLOR: Record<QuotationStatus, string> = {
  draft:    '#64748B',
  sent:     '#1D4ED8',
  accepted: '#10B981',
  rejected: '#EF4444',
  expired:  '#F59E0B',
}

const COLS = [
  { key: 'id',        label: 'Ref',       width: 110 },
  { key: 'customer',  label: 'Customer' },
  { key: 'items',     label: 'Lines',     width: 70  },
  { key: 'total',     label: 'Total',     width: 120 },
  { key: 'status',    label: 'Status',    width: 120 },
  { key: 'validUntil',label: 'Valid Until',width: 110 },
  { key: 'created',   label: 'Created',   width: 110 },
]

export function QuotationsPage() {
  const [data, setData]           = useState<Quotation[]>([])
  const [loading, setLoading]     = useState(true)
  const [q, setQ]                 = useState('')
  const [statusFilter, setFilter] = useState<QuotationStatus | 'all'>('all')

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get<{ data: Quotation[] }>('/quotations?pageSize=200')
      setData(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = data.filter(r =>
    (statusFilter === 'all' || r.status === statusFilter) &&
    ((r.customer.fullName ?? '').toLowerCase().includes(q.toLowerCase()) ||
      r.customer.email.toLowerCase().includes(q.toLowerCase()))
  )

  const rows = filtered.map(r => ({
    id:         r.id.slice(0, 8).toUpperCase(),
    customer:   r.customer.fullName ?? r.customer.email,
    items:      r._count.items,
    total:      <strong>AED {Number(r.total).toLocaleString()}</strong>,
    status:     <Badge label={STATUS_LABEL[r.status] ?? r.status} color={STATUS_COLOR[r.status] ?? '#64748B'} />,
    validUntil: r.validUntil ? r.validUntil.slice(0, 10) : '—',
    created:    r.createdAt.slice(0, 10),
  }))

  const statuses: QuotationStatus[] = ['draft', 'sent', 'accepted', 'rejected', 'expired']
  const totalValue = data.reduce((s, r) => s + Number(r.total), 0)

  return (
    <AdminLayout title="Quotations" actions={<SearchInput value={q} onChange={setQ} placeholder="Search customer…" />}>
      <StatGrid>
        <StatCard label="Total Value"  value={`AED ${totalValue.toLocaleString()}`} sub="All quotations"   color="#1D4ED8" />
        <StatCard label="Sent"         value={String(data.filter(r => r.status === 'sent').length)}     sub="Awaiting response" color="#8B5CF6" />
        <StatCard label="Accepted"     value={String(data.filter(r => r.status === 'accepted').length)} sub="Won"               color="#10B981" />
        <StatCard label="Rejected"     value={String(data.filter(r => r.status === 'rejected').length)} sub="Lost"              color="#EF4444" />
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
        <div style={{ padding: 60, textAlign: 'center', color: '#94A3B8', fontFamily: FONT, fontSize: 14 }}>No quotations yet.</div>
      ) : (
        <>
          <div style={{ fontSize: 13, color: '#64748B', marginBottom: 12, fontFamily: FONT }}>{filtered.length} quotations</div>
          <Table columns={COLS} rows={rows} />
        </>
      )}
    </AdminLayout>
  )
}
