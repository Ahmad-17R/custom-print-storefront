import { useEffect, useState } from 'react'
import { AdminLayout, Table, SearchInput, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"

interface MaterialStockRow {
  id: string
  quantity: number
  material:  { id: string; name: string; unit: string }
  warehouse: { id: string; name: string }
}
interface Warehouse { id: string; name: string }

const COLS = [
  { key: 'material',  label: 'Material' },
  { key: 'unit',      label: 'Unit',      width: 80  },
  { key: 'warehouse', label: 'Warehouse', width: 180 },
  { key: 'qty',       label: 'On Hand',   width: 100 },
  { key: 'status',    label: 'Status',    width: 110 },
]

function chip(col: string, text: string) {
  return <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 12, background: col + '20', color: col, fontWeight: 600, fontFamily: FONT }}>{text}</span>
}

export function StockPage() {
  const [data,      setData]     = useState<MaterialStockRow[]>([])
  const [warehouses,setWh]       = useState<Warehouse[]>([])
  const [loading,   setLoading]  = useState(true)
  const [q,         setQ]        = useState('')
  const [whFilter,  setWhFilter] = useState('all')

  const load = async () => {
    setLoading(true)
    try {
      const [s, w] = await Promise.all([
        api.get<{ data: MaterialStockRow[] }>('/stock/material-levels?pageSize=500'),
        api.get<{ data: Warehouse[] }>('/warehouses?pageSize=100'),
      ])
      setData(s.data); setWh(w.data)
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const filtered = data
    .filter(s => whFilter === 'all' || s.warehouse.id === whFilter)
    .filter(s =>
      s.material.name.toLowerCase().includes(q.toLowerCase()) ||
      s.warehouse.name.toLowerCase().includes(q.toLowerCase())
    )

  const totalQty   = data.reduce((s, r) => s + r.quantity, 0)
  const outOfStock = data.filter(r => r.quantity <= 0).length
  const lowStock   = data.filter(r => r.quantity > 0 && r.quantity <= 10).length

  const rows = filtered.map(r => {
    const col = r.quantity <= 0 ? '#EF4444' : r.quantity <= 10 ? '#F59E0B' : '#10B981'
    return {
      material:  r.material.name,
      unit:      <code style={{ fontSize: 12 }}>{r.material.unit}</code>,
      warehouse: r.warehouse.name,
      qty:       <span style={{ fontWeight: 700, color: col }}>{r.quantity}</span>,
      status:    chip(col, r.quantity <= 0 ? 'Out of Stock' : r.quantity <= 10 ? 'Low Stock' : 'In Stock'),
    }
  })

  return (
    <AdminLayout
      title="Stock Levels"
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={whFilter} onChange={e => setWhFilter(e.target.value)} style={{ padding: '6px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, background: '#fff', cursor: 'pointer' }}>
            <option value="all">All Warehouses</option>
            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          <SearchInput value={q} onChange={setQ} placeholder="Search material, warehouse…" />
        </div>
      }
    >
      <StatGrid>
        <StatCard label="Total On Hand"  value={String(totalQty)}   sub="Units across all warehouses" color="#1D4ED8" />
        <StatCard label="Low Stock"      value={String(lowStock)}   sub="10 units or fewer"           color="#F59E0B" />
        <StatCard label="Out of Stock"   value={String(outOfStock)} sub="Zero units"                  color="#EF4444" />
        <StatCard label="Materials"      value={String(new Set(data.map(r => r.material.id)).size)} sub="Tracked materials" />
      </StatGrid>

      {loading
        ? <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
        : data.length === 0
          ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8', fontFamily: FONT }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>No stock recorded yet</div>
              <div style={{ fontSize: 13 }}>Receive stock via <a href="/admin/stock-in" style={{ color: '#1D4ED8' }}>Stock In</a> to see levels here.</div>
            </div>
          )
          : (
            <>
              <div style={{ fontSize: 13, color: '#64748B', marginBottom: 12, fontFamily: FONT }}>{filtered.length} entries</div>
              <Table columns={COLS} rows={rows} />
            </>
          )
      }
    </AdminLayout>
  )
}
