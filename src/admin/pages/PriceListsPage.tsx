import { useEffect, useState } from 'react'
import { AdminLayout, Table, SearchInput, Badge, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"

interface PriceList {
  id: string; name: string; isActive: boolean; validFrom: string | null; validTo: string | null; createdAt: string
  brand: { id: string; name: string }
  _count: { promotions: number }
}

const COLS = [
  { key: 'name', label: 'Name' }, { key: 'brand', label: 'Brand', width: 150 },
  { key: 'promotions', label: 'Promotions', width: 100 }, { key: 'status', label: 'Status', width: 90 },
  { key: 'validFrom', label: 'Valid From', width: 110 }, { key: 'validTo', label: 'Valid To', width: 110 },
]

export function PriceListsPage() {
  const [data, setData] = useState<PriceList[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  const load = async () => { setLoading(true); try { const r = await api.get<{ data: PriceList[] }>('/price-lists?pageSize=200'); setData(r.data) } finally { setLoading(false) } }
  useEffect(() => { load() }, [])

  const filtered = data.filter(r => r.name.toLowerCase().includes(q.toLowerCase()) || r.brand.name.toLowerCase().includes(q.toLowerCase()))
  const rows = filtered.map(r => ({
    name: r.name, brand: r.brand.name, promotions: r._count.promotions,
    status: <Badge label={r.isActive ? 'Active' : 'Inactive'} color={r.isActive ? '#10B981' : '#64748B'} />,
    validFrom: r.validFrom ? r.validFrom.slice(0, 10) : '—', validTo: r.validTo ? r.validTo.slice(0, 10) : '—',
  }))

  return (
    <AdminLayout title="Price Lists" actions={<SearchInput value={q} onChange={setQ} placeholder="Search name, brand…" />}>
      <StatGrid>
        <StatCard label="Total" value={String(data.length)} sub="All price lists" />
        <StatCard label="Active" value={String(data.filter(r => r.isActive).length)} sub="Currently active" color="#10B981" />
        <StatCard label="Inactive" value={String(data.filter(r => !r.isActive).length)} sub="Inactive" color="#64748B" />
        <StatCard label="Promotions" value={String(data.reduce((s, r) => s + r._count.promotions, 0))} sub="Total promotions" color="#8B5CF6" />
      </StatGrid>
      {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
        : data.length === 0 ? <div style={{ padding: 60, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>No price lists yet.</div>
        : <><div style={{ fontSize: 13, color: '#64748B', marginBottom: 12, fontFamily: FONT }}>{filtered.length} price lists</div><Table columns={COLS} rows={rows} /></>}
    </AdminLayout>
  )
}
