import { useEffect, useState } from 'react'
import { AdminLayout, Table, SearchInput, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"

interface StockRow {
  id: string
  qty: number
  reservedQty: number
  variant: { id: string; sku: string; product: { id: string; name: string } }
  warehouse: { id: string; name: string }
  binLocation?: { id: string; code: string } | null
}

const COLS = [
  { key: 'product',   label: 'Product' },
  { key: 'sku',       label: 'SKU',        width: 150 },
  { key: 'warehouse', label: 'Warehouse',  width: 160 },
  { key: 'bin',       label: 'Bin',        width: 90  },
  { key: 'qty',       label: 'On Hand',    width: 100 },
  { key: 'reserved',  label: 'Reserved',   width: 100 },
  { key: 'available', label: 'Available',  width: 100 },
  { key: 'status',    label: 'Status',     width: 110 },
]

function availColor(avail: number) {
  if (avail <= 0)  return '#EF4444'
  if (avail <= 10) return '#F59E0B'
  return '#10B981'
}

export function StockPage() {
  const [data, setData]   = useState<StockRow[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ]         = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get<{ data: StockRow[] }>('/stock?pageSize=200')
      setData(res.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = data.filter(s =>
    s.variant.product.name.toLowerCase().includes(q.toLowerCase()) ||
    s.variant.sku.toLowerCase().includes(q.toLowerCase()) ||
    s.warehouse.name.toLowerCase().includes(q.toLowerCase())
  )

  const totalQty      = data.reduce((s,r) => s + r.qty, 0)
  const totalReserved = data.reduce((s,r) => s + r.reservedQty, 0)
  const outOfStock    = data.filter(r => (r.qty - r.reservedQty) <= 0).length
  const lowStock      = data.filter(r => { const a = r.qty - r.reservedQty; return a > 0 && a <= 10 }).length

  const rows = filtered.map(r => {
    const avail = r.qty - r.reservedQty
    const col   = availColor(avail)
    return {
      product:   r.variant.product.name,
      sku:       r.variant.sku,
      warehouse: r.warehouse.name,
      bin:       r.binLocation?.code ?? '—',
      reserved:  r.reservedQty,
      available: <span style={{ fontWeight: 600, color: col }}>{avail}</span>,
      status: (
        <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 12, background: col + '20', color: col, fontWeight: 600, fontFamily: FONT }}>
          {avail <= 0 ? 'Out' : avail <= 10 ? 'Low' : 'OK'}
        </span>
      ),
    }
  })

  return (
    <AdminLayout title="Stock" actions={<SearchInput value={q} onChange={setQ} placeholder="Search product, SKU, warehouse…" />}>
      <StatGrid>
        <StatCard label="Total On Hand"  value={String(totalQty)}      sub="Units across all warehouses" color="#1D4ED8" />
        <StatCard label="Reserved"       value={String(totalReserved)} sub="Committed to orders"         color="#F59E0B" />
        <StatCard label="Low Stock"      value={String(lowStock)}      sub="≤ 10 units available"        color="#F59E0B" />
        <StatCard label="Out of Stock"   value={String(outOfStock)}    sub="Zero available"              color="#EF4444" />
      </StatGrid>
      {loading
        ? <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
        : data.length === 0
          ? <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8', fontFamily: FONT }}>No stock records yet. Add products and variants first.</div>
          : <Table columns={COLS} rows={rows} />
      }
    </AdminLayout>
  )
}
