import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminLayout, Table, SearchInput, StatCard, StatGrid } from '../components/AdminLayout'
import { fetchOrderInvoices, type OrderInvoice } from '../../lib/api'

const money = (v: string | number) => `AED ${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
const columns = [
  { key: 'invoiceNumber', label: 'Credit Note #', width: 160 },
  { key: 'order', label: 'Order' },
  { key: 'customer', label: 'Customer' },
  { key: 'total', label: 'Amount', width: 120 },
  { key: 'reason', label: 'Reason' },
  { key: 'date', label: 'Date', width: 110 },
  { key: 'actions', label: '', width: 130 },
]

export function CreditNotesPage() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<OrderInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  useEffect(() => { fetchOrderInvoices('credit_note').then(setRows).catch(() => setRows([])).finally(() => setLoading(false)) }, [])

  const filtered = rows.filter(r => `${r.invoiceNumber} ${r.order?.orderNumber ?? ''} ${r.order?.customer?.fullName ?? ''}`.toLowerCase().includes(q.toLowerCase()))
  const totalValue = rows.reduce((s, r) => s + Number(r.total), 0)
  const tableRows = filtered.map(r => ({
    invoiceNumber: r.invoiceNumber,
    order: r.order?.orderNumber ?? '—',
    customer: r.order?.contactName ?? r.order?.customer?.fullName ?? r.order?.customer?.email ?? '—',
    total: <span style={{ color: '#DC2626', fontWeight: 600 }}>−{money(r.total)}</span>,
    reason: <span style={{ color: '#64748B' }}>{r.notes ?? '—'}</span>,
    date: new Date(r.issueDate).toLocaleDateString(),
    actions: <button onClick={() => navigate(`/admin/invoice/${r.orderId}?type=credit_note`)} style={{ fontSize: 12, padding: '5px 12px', border: '1px solid #CBD5E1', borderRadius: 6, background: '#fff', cursor: 'pointer' }}>View / Print</button>,
  }))

  return <AdminLayout title="Credit Notes" actions={<SearchInput value={q} onChange={setQ} placeholder="Search credit note, order or customer…" />}>
    <StatGrid>
      <StatCard label="Credit Notes" value={String(rows.length)} sub="Refunds / cancellations" />
      <StatCard label="Credited Value" value={money(totalValue)} sub="Reversed from revenue" color="#DC2626" />
    </StatGrid>
    {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>Loading credit notes…</div>
      : rows.length === 0 ? <div style={{ padding: 50, textAlign: 'center', color: '#64748B', border: '2px dashed #E2E8F0', borderRadius: 12 }}>No credit notes. One is issued automatically when an order is cancelled or refunded.</div>
      : <Table columns={columns} rows={tableRows} />}
  </AdminLayout>
}
