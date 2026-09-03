import { useEffect, useState } from 'react'
import { AdminLayout, Table, SearchInput, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"

interface Material { id: string; name: string; unit: string }
interface GRItem { quantity: number; material: Material }
interface GR {
  id: string; poId: string; receivedDate: string; note: string | null
  po: { poNumber: string; supplier: { id: string; name: string } }
  warehouse: { id: string; name: string }
  items: GRItem[]
}

export function GoodsReceiptsPage() {
  const [data,    setData]    = useState<GR[]>([])
  const [loading, setLoading] = useState(true)
  const [q,       setQ]       = useState('')

  const load = async () => {
    setLoading(true)
    try { const r = await api.get<{ data: GR[] }>('/goods-receipts?pageSize=200'); setData(r.data) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const filtered = data.filter(r =>
    r.po.poNumber.toLowerCase().includes(q.toLowerCase()) ||
    r.po.supplier.name.toLowerCase().includes(q.toLowerCase()) ||
    r.warehouse.name.toLowerCase().includes(q.toLowerCase())
  )

  const rows = filtered.map(r => ({
    grId:      <code style={{ fontSize: 12 }}>{r.id.slice(0, 8).toUpperCase()}</code>,
    poNumber:  r.po.poNumber,
    supplier:  r.po.supplier.name,
    warehouse: r.warehouse.name,
    materials: r.items.map(i => `${i.material.name} (${i.quantity} ${i.material.unit})`).join(', '),
    date:      r.receivedDate.slice(0, 10),
    note:      r.note ?? <span style={{ color: '#CBD5E1' }}>—</span>,
  }))

  const COLS = [
    { key: 'grId',      label: 'GR #',      width: 100 },
    { key: 'poNumber',  label: 'PO #',      width: 130 },
    { key: 'supplier',  label: 'Supplier',  width: 150 },
    { key: 'warehouse', label: 'Warehouse', width: 140 },
    { key: 'materials', label: 'Materials Received' },
    { key: 'date',      label: 'Date',      width: 100 },
    { key: 'note',      label: 'Note',      width: 160 },
  ]

  const totalQty = data.reduce((s, r) => s + r.items.reduce((ss, i) => ss + i.quantity, 0), 0)

  return (
    <AdminLayout title="Goods Receipts" actions={<SearchInput value={q} onChange={setQ} placeholder="Search PO, supplier, warehouse…" />}>
      <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#14532D', fontFamily: FONT }}>
        Goods receipts are created automatically when you click <strong>Receive</strong> on a confirmed Purchase Order. Each receipt updates stock levels immediately.
      </div>

      <StatGrid>
        <StatCard label="Total Receipts"  value={String(data.length)}   sub="All GRs" />
        <StatCard label="Units Received"  value={String(totalQty)}      sub="Total qty in"     color="#10B981" />
        <StatCard label="POs Covered"     value={String(new Set(data.map(r => r.poId)).size)} sub="Distinct POs" color="#1D4ED8" />
        <StatCard label="Suppliers"       value={String(new Set(data.map(r => r.po.supplier.id)).size)} sub="Unique suppliers" />
      </StatGrid>

      {loading
        ? <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
        : data.length === 0
          ? <div style={{ padding: 60, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>No goods receipts yet. Use "Receive" on a confirmed Purchase Order.</div>
          : <><div style={{ fontSize: 13, color: '#64748B', marginBottom: 12, fontFamily: FONT }}>{filtered.length} receipts</div><Table columns={COLS} rows={rows} /></>
      }
    </AdminLayout>
  )
}
