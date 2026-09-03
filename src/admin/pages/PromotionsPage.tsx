import { useEffect, useState } from 'react'
import { AdminLayout, Table, SearchInput, Badge, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"

interface Promotion {
  id: string; name: string; discountPct: string | null; discountAmt: string | null; minQty: number | null; isActive: boolean; validFrom: string | null; validTo: string | null; createdAt: string
  priceList: { id: string; name: string }
}

const COLS = [
  { key: 'name', label: 'Name' }, { key: 'priceList', label: 'Price List', width: 160 },
  { key: 'discount', label: 'Discount', width: 120 }, { key: 'minQty', label: 'Min Qty', width: 80 },
  { key: 'status', label: 'Status', width: 90 }, { key: 'validFrom', label: 'Valid From', width: 110 },
  { key: 'validTo', label: 'Valid To', width: 110 },
]

export function PromotionsPage() {
  const [data, setData] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  const load = async () => { setLoading(true); try { const r = await api.get<{ data: Promotion[] }>('/promotions?pageSize=200'); setData(r.data) } finally { setLoading(false) } }
  useEffect(() => { load() }, [])

  const filtered = data.filter(r => r.name.toLowerCase().includes(q.toLowerCase()) || r.priceList.name.toLowerCase().includes(q.toLowerCase()))
  const rows = filtered.map(r => ({
    name: r.name, priceList: r.priceList.name,
    discount: r.discountPct ? `${r.discountPct}%` : r.discountAmt ? `AED ${Number(r.discountAmt).toLocaleString()}` : '—',
    minQty: r.minQty ?? '—',
    status: <Badge label={r.isActive ? 'Active' : 'Inactive'} color={r.isActive ? '#10B981' : '#64748B'} />,
    validFrom: r.validFrom ? r.validFrom.slice(0, 10) : '—', validTo: r.validTo ? r.validTo.slice(0, 10) : '—',
  }))

  return (
    <AdminLayout title="Promotions" actions={<SearchInput value={q} onChange={setQ} placeholder="Search promotion, price list…" />}>
      <StatGrid>
        <StatCard label="Total" value={String(data.length)} sub="All promotions" />
        <StatCard label="Active" value={String(data.filter(r => r.isActive).length)} sub="Currently active" color="#10B981" />
        <StatCard label="% Discounts" value={String(data.filter(r => r.discountPct).length)} sub="Percentage-based" color="#8B5CF6" />
        <StatCard label="Flat Discounts" value={String(data.filter(r => r.discountAmt).length)} sub="Fixed amount" color="#1D4ED8" />
      </StatGrid>
      {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
        : data.length === 0 ? <div style={{ padding: 60, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>No promotions yet.</div>
        : <><div style={{ fontSize: 13, color: '#64748B', marginBottom: 12, fontFamily: FONT }}>{filtered.length} promotions</div><Table columns={COLS} rows={rows} /></>}
    </AdminLayout>
  )
}
