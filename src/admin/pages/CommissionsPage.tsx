import { useEffect, useState } from 'react'
import { AdminLayout, Table, SearchInput, Badge, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"

interface Commission {
  id: string; userId: string; amount: string; paidAt: string | null; createdAt: string
  salesOrder: { orderNumber: string }
}

const COLS = [
  { key: 'id', label: 'Ref #', width: 110 }, { key: 'soNumber', label: 'SO #', width: 130 },
  { key: 'userId', label: 'User', width: 200 }, { key: 'amount', label: 'Amount', width: 120 },
  { key: 'status', label: 'Status', width: 100 }, { key: 'paidAt', label: 'Paid At', width: 110 },
]

export function CommissionsPage() {
  const [data, setData] = useState<Commission[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  const load = async () => { setLoading(true); try { const r = await api.get<{ data: Commission[] }>('/commissions?pageSize=200'); setData(r.data) } finally { setLoading(false) } }
  useEffect(() => { load() }, [])

  const filtered = data.filter(r => r.salesOrder.orderNumber.toLowerCase().includes(q.toLowerCase()) || r.userId.toLowerCase().includes(q.toLowerCase()))
  const totalCommissions = data.reduce((s, r) => s + Number(r.amount), 0)
  const paid = data.filter(r => r.paidAt)
  const rows = filtered.map(r => ({
    id: r.id.slice(0, 8).toUpperCase(), soNumber: r.salesOrder.orderNumber,
    userId: r.userId.slice(0, 8) + '…', amount: <strong>AED {Number(r.amount).toLocaleString()}</strong>,
    status: <Badge label={r.paidAt ? 'Paid' : 'Pending'} color={r.paidAt ? '#10B981' : '#F59E0B'} />,
    paidAt: r.paidAt ? r.paidAt.slice(0, 10) : '—',
  }))

  return (
    <AdminLayout title="Commissions" actions={<SearchInput value={q} onChange={setQ} placeholder="Search SO #…" />}>
      <StatGrid>
        <StatCard label="Total Commissions" value={`AED ${totalCommissions.toLocaleString()}`} sub="All commissions" color="#1D4ED8" />
        <StatCard label="Paid" value={`AED ${paid.reduce((s, r) => s + Number(r.amount), 0).toLocaleString()}`} sub="Paid out" color="#10B981" />
        <StatCard label="Pending" value={`AED ${data.filter(r => !r.paidAt).reduce((s, r) => s + Number(r.amount), 0).toLocaleString()}`} sub="To be paid" color="#F59E0B" />
        <StatCard label="Records" value={String(data.length)} sub="Total records" color="#8B5CF6" />
      </StatGrid>
      {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
        : data.length === 0 ? <div style={{ padding: 60, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>No commission records yet.</div>
        : <><div style={{ fontSize: 13, color: '#64748B', marginBottom: 12, fontFamily: FONT }}>{filtered.length} commissions</div><Table columns={COLS} rows={rows} /></>}
    </AdminLayout>
  )
}
