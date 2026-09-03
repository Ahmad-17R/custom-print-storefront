import { useEffect, useState } from 'react'
import { AdminLayout, Table, SearchInput, Badge, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled'

interface SalesInvoice {
  id: string
  invoiceNumber: string
  status: InvoiceStatus
  issueDate: string
  dueDate: string | null
  subtotal: string
  vatAmount: string
  total: string
  paidAmount: string
  createdAt: string
  salesOrder: {
    orderNumber: string
    customer: { id: string; fullName: string | null; email: string }
  }
}

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft:          'Draft',
  sent:           'Sent',
  paid:           'Paid',
  partially_paid: 'Part. Paid',
  overdue:        'Overdue',
  cancelled:      'Cancelled',
}
const STATUS_COLOR: Record<InvoiceStatus, string> = {
  draft:          '#64748B',
  sent:           '#1D4ED8',
  paid:           '#10B981',
  partially_paid: '#F59E0B',
  overdue:        '#EF4444',
  cancelled:      '#94A3B8',
}

const COLS = [
  { key: 'invoiceNumber', label: 'Invoice #',  width: 140 },
  { key: 'soNumber',      label: 'SO #',        width: 130 },
  { key: 'customer',      label: 'Customer' },
  { key: 'total',         label: 'Total',       width: 120 },
  { key: 'paid',          label: 'Paid',        width: 110 },
  { key: 'status',        label: 'Status',      width: 130 },
  { key: 'dueDate',       label: 'Due',         width: 110 },
]

export function SalesInvoicesPage() {
  const [data, setData]           = useState<SalesInvoice[]>([])
  const [loading, setLoading]     = useState(true)
  const [q, setQ]                 = useState('')
  const [statusFilter, setFilter] = useState<InvoiceStatus | 'all'>('all')

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get<{ data: SalesInvoice[] }>('/sales-invoices?pageSize=200')
      setData(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = data.filter(r =>
    (statusFilter === 'all' || r.status === statusFilter) &&
    (r.invoiceNumber.toLowerCase().includes(q.toLowerCase()) ||
     r.salesOrder.orderNumber.toLowerCase().includes(q.toLowerCase()) ||
     (r.salesOrder.customer.fullName ?? '').toLowerCase().includes(q.toLowerCase()))
  )

  const fmt = (v: string) => `AED ${Number(v).toLocaleString()}`

  const rows = filtered.map(r => ({
    invoiceNumber: r.invoiceNumber,
    soNumber:      r.salesOrder.orderNumber,
    customer:      r.salesOrder.customer.fullName ?? r.salesOrder.customer.email,
    total:         <strong>{fmt(r.total)}</strong>,
    paid:          fmt(r.paidAmount),
    status:        <Badge label={STATUS_LABEL[r.status] ?? r.status} color={STATUS_COLOR[r.status] ?? '#64748B'} />,
    dueDate:       r.dueDate ? r.dueDate.slice(0, 10) : '—',
  }))

  const statuses: InvoiceStatus[] = ['draft', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled']
  const totalBilled  = data.reduce((s, r) => s + Number(r.total), 0)
  const totalCollected = data.reduce((s, r) => s + Number(r.paidAmount), 0)
  const overdue = data.filter(r => r.status === 'overdue').length

  return (
    <AdminLayout title="Sales Invoices" actions={<SearchInput value={q} onChange={setQ} placeholder="Search invoice #, SO #, customer…" />}>
      <StatGrid>
        <StatCard label="Total Billed"    value={`AED ${totalBilled.toLocaleString()}`}     sub="All invoices"    color="#1D4ED8" />
        <StatCard label="Collected"       value={`AED ${totalCollected.toLocaleString()}`}  sub="Payments received" color="#10B981" />
        <StatCard label="Outstanding"     value={`AED ${(totalBilled - totalCollected).toLocaleString()}`} sub="Not yet paid" color="#F59E0B" />
        <StatCard label="Overdue"         value={String(overdue)}                           sub="Past due date"   color="#EF4444" />
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
        <div style={{ padding: 60, textAlign: 'center', color: '#94A3B8', fontFamily: FONT, fontSize: 14 }}>No invoices yet.</div>
      ) : (
        <>
          <div style={{ fontSize: 13, color: '#64748B', marginBottom: 12, fontFamily: FONT }}>{filtered.length} invoices</div>
          <Table columns={COLS} rows={rows} />
        </>
      )}
    </AdminLayout>
  )
}
