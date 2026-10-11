import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminLayout, Table, SearchInput, Badge, StatCard, StatGrid } from '../components/AdminLayout'
import { api, fetchOrderInvoices, type OrderInvoice } from '../../lib/api'
import { printInvoice, sourceRef, SOURCE_LABEL, DEFAULT_ISSUER, type SalesInvoice } from '../lib/invoicePrint'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

type InvoiceStatus = SalesInvoice['status']
type Source = SalesInvoice['source']

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft:          'Draft',
  sent:           'Unpaid',
  paid:           'Paid',
  partially_paid: 'Partially Paid',
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
const SOURCE_COLOR: Record<Source, string> = { online: '#8B5CF6', walk_in: '#0EA5E9', pos: '#F97316', sales_order: '#64748B' }

const COLS = [
  { key: 'invoiceNumber', label: 'Invoice #',  width: 150 },
  { key: 'source',        label: 'Source',     width: 90  },
  { key: 'ref',           label: 'Order Ref',  width: 140 },
  { key: 'customer',      label: 'Customer' },
  { key: 'total',         label: 'Total',      width: 120 },
  { key: 'vat',           label: 'VAT',        width: 90  },
  { key: 'paid',          label: 'Paid',       width: 110 },
  { key: 'status',        label: 'Status',     width: 120 },
  { key: 'issued',        label: 'Issued',     width: 100 },
  { key: 'actions',       label: '',           width: 80  },
]

const money = (n: string | number) => Number(n).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const customerOf = (r: SalesInvoice) => r.customerName ?? r.salesOrder?.customer.fullName ?? r.salesOrder?.customer.email ?? '—'

// Online orders are invoiced by the order engine (OrderInvoice, issued on confirm / payment);
// shown here in the same register, opened on their own invoice document page.
type Row = SalesInvoice & { onlineOrderId?: string }
function fromOrderInvoice(o: OrderInvoice): Row {
  const paid = o.order?.paymentStatus === 'paid'
  return {
    id: o.id, invoiceNumber: o.invoiceNumber, source: 'online', customerId: null,
    status: paid ? 'paid' : o.order?.paymentStatus === 'partially_paid' ? 'partially_paid' : 'sent',
    issueDate: o.issueDate, dueDate: null,
    subtotal: String(o.subtotal), vatAmount: String(o.vatAmount), total: String(o.total), paidAmount: paid ? String(o.total) : '0',
    issuerName: null, issuerTrn: null, issuerAddress: null,
    customerName: o.order?.contactName ?? o.order?.customer?.fullName ?? o.order?.customer?.email ?? null,
    customerPhone: null, customerEmail: o.order?.customer?.email ?? null, customerTrn: null, customerAddress: null,
    lines: null, notes: o.notes ?? null, issuedBy: null, createdAt: o.issueDate,
    order: { id: o.orderId, orderNumber: o.order?.orderNumber ?? '—', status: '' },
    onlineOrderId: o.orderId,
  }
}

// Every tax invoice — online orders, walk-in sales and POS sales — issued under the
// company's legal name (AL Waqar by default). Walk-in invoices are issued automatically
// when the order is completed, online ones at delivery, POS ones at the sale.
export function SalesInvoicesPage() {
  const navigate = useNavigate()
  const [data, setData]           = useState<Row[]>([])
  const [loading, setLoading]     = useState(true)
  const [q, setQ]                 = useState('')
  const [statusFilter, setFilter] = useState<InvoiceStatus | 'all'>('all')
  const [source, setSource]       = useState<Source | 'all'>('all')

  const load = async () => {
    setLoading(true)
    try {
      const [res, online] = await Promise.all([
        api.get<{ data: SalesInvoice[] }>('/sales-invoices?pageSize=500'),
        fetchOrderInvoices('invoice').catch(() => [] as OrderInvoice[]),
      ])
      const rows: Row[] = [...res.data.filter(r => r.source !== 'online'), ...online.map(fromOrderInvoice)]
      setData(rows.sort((a, b) => b.issueDate.localeCompare(a.issueDate)))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = data.filter(r =>
    (statusFilter === 'all' || r.status === statusFilter) &&
    (source === 'all' || r.source === source) &&
    (r.invoiceNumber.toLowerCase().includes(q.toLowerCase()) ||
      customerOf(r).toLowerCase().includes(q.toLowerCase()) ||
      sourceRef(r).toLowerCase().includes(q.toLowerCase()) ||
      (r.customerPhone ?? '').includes(q))
  )

  const open = (r: Row) => r.onlineOrderId ? navigate(`/admin/invoice/${r.onlineOrderId}`) : printInvoice(r)
  const rows = filtered.map(r => ({
    invoiceNumber: <span style={{ fontFamily: 'ui-monospace, monospace', whiteSpace: 'nowrap', fontWeight: 600, fontSize: 12, color: '#1D4ED8', cursor: 'pointer' }} onClick={() => open(r)}>{r.invoiceNumber}</span>,
    source:   <Badge label={SOURCE_LABEL[r.source] ?? r.source} color={SOURCE_COLOR[r.source] ?? '#64748B'} />,
    ref:      <span style={{ fontSize: 12 }}>{sourceRef(r)}</span>,
    customer: <div><div>{customerOf(r)}</div>{r.customerTrn && <div style={{ fontSize: 11, color: '#64748B' }}>TRN {r.customerTrn}</div>}</div>,
    total:    <strong>AED {money(r.total)}</strong>,
    vat:      money(r.vatAmount),
    paid:     <span style={{ color: Number(r.paidAmount) >= Number(r.total) ? '#10B981' : '#F59E0B' }}>AED {money(r.paidAmount)}</span>,
    status:   <Badge label={STATUS_LABEL[r.status] ?? r.status} color={STATUS_COLOR[r.status] ?? '#64748B'} />,
    issued:   r.issueDate.slice(0, 10),
    actions:  <button onClick={() => open(r)} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 5, cursor: 'pointer', fontFamily: FONT, border: '1px solid #E2E8F0', background: '#fff' }}>{r.onlineOrderId ? 'View / Print' : 'Print'}</button>,
  }))

  const statuses: InvoiceStatus[] = ['sent', 'partially_paid', 'paid', 'overdue', 'cancelled']
  const live = data.filter(r => r.status !== 'cancelled')
  const totalValue    = live.reduce((s, r) => s + Number(r.total), 0)
  const totalVat      = live.reduce((s, r) => s + Number(r.vatAmount), 0)
  const outstanding   = live.reduce((s, r) => s + Math.max(0, Number(r.total) - Number(r.paidAmount)), 0)
  const issuer = data.find(r => r.issuerName)?.issuerName ?? DEFAULT_ISSUER

  return (
    <AdminLayout title="Sales Invoices" actions={<SearchInput value={q} onChange={setQ} placeholder="Search invoice, order, customer…" />}>
      <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#1E3A8A', fontFamily: FONT }}>
        All invoices are issued by <strong>{issuer}</strong> for online and offline (walk-in & POS) orders. Walk-in invoices are created when the order is completed (or earlier with “Issue invoice” on the order), online invoices when the order is confirmed / paid, POS invoices at the sale. Change the issuing name in <em>Company Settings</em>.
      </div>
      <StatGrid>
        <StatCard label="Invoiced"    value={`AED ${money(totalValue)}`}  sub={`${live.length} invoices (excl. cancelled)`} color="#1D4ED8" />
        <StatCard label="Output VAT"  value={`AED ${money(totalVat)}`}    sub="On live invoices"      color="#7C3AED" />
        <StatCard label="Outstanding" value={`AED ${money(outstanding)}`} sub="Not yet collected"     color="#EF4444" />
        <StatCard label="Paid"        value={String(data.filter(r => r.status === 'paid').length)} sub="Fully settled" color="#10B981" />
      </StatGrid>

      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
        {(['all', 'online', 'walk_in', 'pos'] as const).map(s => (
          <button key={s} onClick={() => setSource(s)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontFamily: FONT, fontWeight: 600, cursor: 'pointer', border: '1px solid #E2E8F0', background: source === s ? DARK : '#fff', color: source === s ? '#fff' : '#64748B' }}>
            {s === 'all' ? `All sources (${data.length})` : `${SOURCE_LABEL[s]} (${data.filter(r => r.source === s).length})`}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['all', ...statuses] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontFamily: FONT, fontWeight: 500, cursor: 'pointer', border: '1px solid #E2E8F0', background: statusFilter === s ? '#334155' : '#fff', color: statusFilter === s ? '#fff' : '#64748B' }}>
            {s === 'all' ? 'Any status' : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT, fontSize: 14 }}>Loading…</div>
      ) : data.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#94A3B8', fontFamily: FONT, fontSize: 14 }}>No invoices yet. They appear here automatically as orders are completed.</div>
      ) : (
        <>
          <div style={{ fontSize: 13, color: '#64748B', marginBottom: 12, fontFamily: FONT }}>{filtered.length} invoices</div>
          <Table columns={COLS} rows={rows} />
        </>
      )}
    </AdminLayout>
  )
}
