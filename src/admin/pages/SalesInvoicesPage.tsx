import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminLayout, Table, SearchInput, StatCard, StatGrid } from '../components/AdminLayout'
import { fetchOrderInvoices, type OrderInvoice } from '../../lib/api'

const money = (v: string | number) => `AED ${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
const columns = [
  { key: 'invoiceNumber', label: 'Invoice #', width: 150 },
  { key: 'order', label: 'Order' },
  { key: 'customer', label: 'Customer' },
  { key: 'total', label: 'Total', width: 120 },
  { key: 'payment', label: 'Payment', width: 140 },
  { key: 'date', label: 'Date', width: 110 },
  { key: 'actions', label: '', width: 130 },
]

export function SalesInvoicesPage() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<OrderInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  useEffect(() => { fetchOrderInvoices('invoice').then(setRows).catch(() => setRows([])).finally(() => setLoading(false)) }, [])

  const filtered = rows.filter(r => `${r.invoiceNumber} ${r.order?.orderNumber ?? ''} ${r.order?.customer?.fullName ?? ''} ${r.order?.customer?.email ?? ''}`.toLowerCase().includes(q.toLowerCase()))
  const totalValue = rows.reduce((s, r) => s + Number(r.total), 0)
  const tableRows = filtered.map(r => ({
    invoiceNumber: r.invoiceNumber,
    order: r.order?.orderNumber ?? '—',
    customer: r.order?.contactName ?? r.order?.customer?.fullName ?? r.order?.customer?.email ?? '—',
    total: money(r.total),
    payment: <span style={{ textTransform: 'capitalize', color: r.order?.paymentStatus === 'paid' ? '#047857' : '#D97706' }}>{(r.order?.paymentStatus ?? '').replaceAll('_', ' ')}</span>,
    date: new Date(r.issueDate).toLocaleDateString(),
    actions: <button onClick={() => navigate(`/admin/invoice/${r.orderId}`)} style={{ fontSize: 12, padding: '5px 12px', border: '1px solid #CBD5E1', borderRadius: 6, background: '#fff', cursor: 'pointer' }}>View / Print</button>,
  }))

  return <AdminLayout title="Sales Invoices" actions={<SearchInput value={q} onChange={setQ} placeholder="Search invoice, order or customer…" />}>
    <StatGrid>
      <StatCard label="Invoices" value={String(rows.length)} sub="Tax invoices issued" />
      <StatCard label="Invoiced Value" value={money(totalValue)} sub="VAT-inclusive" color="#10B981" />
      <StatCard label="Paid" value={String(rows.filter(r => r.order?.paymentStatus === 'paid').length)} sub="Settled" color="#047857" />
      <StatCard label="Unpaid" value={String(rows.filter(r => r.order?.paymentStatus !== 'paid').length)} sub="On account (A/R)" color="#F59E0B" />
    </StatGrid>
    {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>Loading invoices…</div>
      : rows.length === 0 ? <div style={{ padding: 50, textAlign: 'center', color: '#64748B', border: '2px dashed #E2E8F0', borderRadius: 12 }}>No invoices yet. A tax invoice is issued automatically when an online order is confirmed/paid.</div>
      : <Table columns={columns} rows={tableRows} />}
  </AdminLayout>
}
