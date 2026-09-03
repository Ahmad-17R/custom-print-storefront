import { useEffect, useState } from 'react'
import { AdminLayout, Table, SearchInput, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"

interface CreditNote {
  id: string; amount: string; reason: string | null; createdAt: string
  invoice: { invoiceNumber: string; salesOrder: { orderNumber: string; customer: { fullName: string | null; email: string } } }
}

const COLS = [
  { key: 'id', label: 'CN #', width: 110 }, { key: 'invoiceNo', label: 'Invoice #', width: 140 },
  { key: 'customer', label: 'Customer' }, { key: 'amount', label: 'Amount', width: 120 },
  { key: 'reason', label: 'Reason' }, { key: 'created', label: 'Date', width: 110 },
]

export function CreditNotesPage() {
  const [data, setData] = useState<CreditNote[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  const load = async () => { setLoading(true); try { const r = await api.get<{ data: CreditNote[] }>('/credit-notes?pageSize=200'); setData(r.data) } finally { setLoading(false) } }
  useEffect(() => { load() }, [])

  const filtered = data.filter(r => r.invoice.invoiceNumber.toLowerCase().includes(q.toLowerCase()) || (r.invoice.salesOrder.customer.fullName ?? '').toLowerCase().includes(q.toLowerCase()))
  const totalValue = data.reduce((s, r) => s + Number(r.amount), 0)
  const rows = filtered.map(r => ({
    id: r.id.slice(0, 8).toUpperCase(), invoiceNo: r.invoice.invoiceNumber,
    customer: r.invoice.salesOrder.customer.fullName ?? r.invoice.salesOrder.customer.email,
    amount: <strong>AED {Number(r.amount).toLocaleString()}</strong>,
    reason: r.reason ?? <span style={{ color: '#94A3B8', fontSize: 12 }}>—</span>, created: r.createdAt.slice(0, 10),
  }))

  return (
    <AdminLayout title="Credit Notes" actions={<SearchInput value={q} onChange={setQ} placeholder="Search invoice #, customer…" />}>
      <StatGrid>
        <StatCard label="Total Credit Notes" value={String(data.length)} sub="All credit notes" />
        <StatCard label="Total Credit Value" value={`AED ${totalValue.toLocaleString()}`} sub="Sum of all credits" color="#EF4444" />
        <StatCard label="This Month" value={String(data.filter(r => r.createdAt.slice(0, 7) === new Date().toISOString().slice(0, 7)).length)} sub="Current month" color="#F59E0B" />
        <StatCard label="Avg Credit" value={data.length ? `AED ${Math.round(totalValue / data.length).toLocaleString()}` : '—'} sub="Per note" color="#8B5CF6" />
      </StatGrid>
      {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
        : data.length === 0 ? <div style={{ padding: 60, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>No credit notes yet.</div>
        : <><div style={{ fontSize: 13, color: '#64748B', marginBottom: 12, fontFamily: FONT }}>{filtered.length} credit notes</div><Table columns={COLS} rows={rows} /></>}
    </AdminLayout>
  )
}
