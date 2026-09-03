import { useEffect, useState } from 'react'
import { AdminLayout, Table, SearchInput, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"

interface SalesReturn {
  id: string; reason: string; total: string; createdAt: string
  invoice: { invoiceNumber: string; salesOrder: { orderNumber: string; customer: { fullName: string | null; email: string } } }
  _count: { items: number }
}

const COLS = [
  { key: 'id', label: 'Return #', width: 110 }, { key: 'invoiceNo', label: 'Invoice #', width: 140 },
  { key: 'soNumber', label: 'SO #', width: 130 }, { key: 'customer', label: 'Customer' },
  { key: 'items', label: 'Lines', width: 70 }, { key: 'total', label: 'Total', width: 120 },
  { key: 'reason', label: 'Reason' }, { key: 'created', label: 'Date', width: 110 },
]

export function SalesReturnsPage() {
  const [data, setData] = useState<SalesReturn[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  const load = async () => { setLoading(true); try { const r = await api.get<{ data: SalesReturn[] }>('/sales-returns?pageSize=200'); setData(r.data) } finally { setLoading(false) } }
  useEffect(() => { load() }, [])

  const filtered = data.filter(r => r.invoice.invoiceNumber.toLowerCase().includes(q.toLowerCase()) || (r.invoice.salesOrder.customer.fullName ?? '').toLowerCase().includes(q.toLowerCase()))
  const totalValue = data.reduce((s, r) => s + Number(r.total), 0)
  const rows = filtered.map(r => ({
    id: r.id.slice(0, 8).toUpperCase(), invoiceNo: r.invoice.invoiceNumber,
    soNumber: r.invoice.salesOrder.orderNumber, customer: r.invoice.salesOrder.customer.fullName ?? r.invoice.salesOrder.customer.email,
    items: r._count.items, total: <strong>AED {Number(r.total).toLocaleString()}</strong>,
    reason: r.reason, created: r.createdAt.slice(0, 10),
  }))

  return (
    <AdminLayout title="Sales Returns" actions={<SearchInput value={q} onChange={setQ} placeholder="Search invoice #, customer…" />}>
      <StatGrid>
        <StatCard label="Total Returns" value={String(data.length)} sub="All returns" />
        <StatCard label="Return Value" value={`AED ${totalValue.toLocaleString()}`} sub="Total value returned" color="#EF4444" />
        <StatCard label="This Month" value={String(data.filter(r => r.createdAt.slice(0, 7) === new Date().toISOString().slice(0, 7)).length)} sub="Current month" color="#F59E0B" />
        <StatCard label="Avg Value" value={data.length ? `AED ${Math.round(totalValue / data.length).toLocaleString()}` : '—'} sub="Per return" color="#8B5CF6" />
      </StatGrid>
      {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
        : data.length === 0 ? <div style={{ padding: 60, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>No sales returns yet.</div>
        : <><div style={{ fontSize: 13, color: '#64748B', marginBottom: 12, fontFamily: FONT }}>{filtered.length} returns</div><Table columns={COLS} rows={rows} /></>}
    </AdminLayout>
  )
}
