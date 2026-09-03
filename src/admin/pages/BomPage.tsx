import { useEffect, useState } from 'react'
import { AdminLayout, Table, SearchInput, Badge, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"

interface Bom {
  id: string; version: string; isActive: boolean; notes: string | null; createdAt: string
  product: { id: string; name: string }
  _count: { components: number; manufacturingOrders: number }
}

const COLS = [
  { key: 'product', label: 'Product' }, { key: 'version', label: 'Version', width: 100 },
  { key: 'components', label: 'Components', width: 110 }, { key: 'moCount', label: 'MOs', width: 70 },
  { key: 'status', label: 'Status', width: 90 }, { key: 'created', label: 'Created', width: 110 },
]

export function BomPage() {
  const [data, setData] = useState<Bom[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  const load = async () => { setLoading(true); try { const r = await api.get<{ data: Bom[] }>('/bom?pageSize=200'); setData(r.data) } finally { setLoading(false) } }
  useEffect(() => { load() }, [])

  const filtered = data.filter(r => r.product.name.toLowerCase().includes(q.toLowerCase()))
  const rows = filtered.map(r => ({
    product: r.product.name, version: r.version, components: r._count.components, moCount: r._count.manufacturingOrders,
    status: <Badge label={r.isActive ? 'Active' : 'Inactive'} color={r.isActive ? '#10B981' : '#64748B'} />,
    created: r.createdAt.slice(0, 10),
  }))

  return (
    <AdminLayout title="Bills of Materials" actions={<SearchInput value={q} onChange={setQ} placeholder="Search product…" />}>
      <StatGrid>
        <StatCard label="Total BOMs" value={String(data.length)} sub="All bills of materials" />
        <StatCard label="Active" value={String(data.filter(r => r.isActive).length)} sub="Active BOMs" color="#10B981" />
        <StatCard label="Components" value={String(data.reduce((s, r) => s + r._count.components, 0))} sub="Total components" color="#1D4ED8" />
        <StatCard label="MOs Created" value={String(data.reduce((s, r) => s + r._count.manufacturingOrders, 0))} sub="Manufacturing orders" color="#8B5CF6" />
      </StatGrid>
      {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
        : data.length === 0 ? <div style={{ padding: 60, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>No bills of materials yet.</div>
        : <><div style={{ fontSize: 13, color: '#64748B', marginBottom: 12, fontFamily: FONT }}>{filtered.length} BOMs</div><Table columns={COLS} rows={rows} /></>}
    </AdminLayout>
  )
}
