import { useEffect, useState } from 'react'
import { AdminLayout, Table, SearchInput, Badge, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

interface GRItem {
  quantity: number
  acceptedQty: number
}

interface GR {
  id: string
  poId: string
  receivedDate: string
  note: string | null
  po: {
    poNumber: string
    supplier: { id: string; name: string }
  }
  warehouse: { id: string; name: string }
  items: GRItem[]
}

const COLS = [
  { key: 'grId',         label: 'GR #',      width: 130 },
  { key: 'poNumber',     label: 'PO #',       width: 130 },
  { key: 'supplier',     label: 'Supplier' },
  { key: 'itemCount',    label: 'Lines',      width: 70  },
  { key: 'received',     label: 'Received',   width: 90  },
  { key: 'accepted',     label: 'Accepted',   width: 90  },
  { key: 'status',       label: 'Status',     width: 160 },
  { key: 'receivedDate', label: 'Date',       width: 110 },
  { key: 'warehouse',    label: 'Warehouse',  width: 150 },
]

function grStatus(items: GRItem[]): { label: string; color: string } {
  if (items.length === 0) return { label: 'Pending', color: '#64748B' }
  const totalReceived = items.reduce((s, i) => s + i.quantity, 0)
  const totalAccepted = items.reduce((s, i) => s + i.acceptedQty, 0)
  if (totalAccepted === 0) return { label: 'Rejected', color: '#EF4444' }
  if (totalAccepted < totalReceived) return { label: 'Partially Accepted', color: '#8B5CF6' }
  return { label: 'Accepted', color: '#10B981' }
}

export function GoodsReceiptsPage() {
  const [data, setData]     = useState<GR[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ]           = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get<{ data: GR[] }>('/goods-receipts?pageSize=200')
      setData(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = data.filter(r =>
    r.id.toLowerCase().includes(q.toLowerCase()) ||
    r.po.poNumber.toLowerCase().includes(q.toLowerCase()) ||
    r.po.supplier.name.toLowerCase().includes(q.toLowerCase()) ||
    r.warehouse.name.toLowerCase().includes(q.toLowerCase())
  )

  const rows = filtered.map(r => {
    const totalReceived = r.items.reduce((s, i) => s + i.quantity, 0)
    const totalAccepted = r.items.reduce((s, i) => s + i.acceptedQty, 0)
    const { label, color } = grStatus(r.items)
    return {
      grId:         r.id.slice(0, 8).toUpperCase(),
      poNumber:     r.po.poNumber,
      supplier:     r.po.supplier.name,
      itemCount:    r.items.length,
      received:     totalReceived,
      accepted:     totalAccepted,
      status:       <Badge label={label} color={color} />,
      receivedDate: r.receivedDate.slice(0, 10),
      warehouse:    r.warehouse.name,
    }
  })

  const accepted   = data.filter(r => grStatus(r.items).label === 'Accepted').length
  const issues     = data.filter(r => ['Rejected', 'Partially Accepted'].includes(grStatus(r.items).label)).length
  const totalItems = data.reduce((s, r) => s + r.items.reduce((ss, i) => ss + i.quantity, 0), 0)

  return (
    <AdminLayout
      title="Goods Receipts"
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <SearchInput value={q} onChange={setQ} placeholder="Search receipts…" />
        </div>
      }
    >
      <StatGrid>
        <StatCard label="Total Receipts" value={String(data.length)}   sub="All GRs" />
        <StatCard label="Accepted"       value={String(accepted)}      sub="Fully accepted"     color="#10B981" />
        <StatCard label="Issues"         value={String(issues)}        sub="Rejected / partial"  color="#EF4444" />
        <StatCard label="Items Received" value={String(totalItems)}    sub="Total qty received"  color="#1D4ED8" />
      </StatGrid>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT, fontSize: 14 }}>Loading…</div>
      ) : data.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#94A3B8', fontFamily: FONT, fontSize: 14 }}>
          No goods receipts yet. Use "Receive" on a confirmed Purchase Order to record a receipt.
        </div>
      ) : (
        <>
          <div style={{ fontSize: 13, color: '#64748B', marginBottom: 12, fontFamily: FONT }}>{filtered.length} receipts</div>
          <Table columns={COLS} rows={rows} />
        </>
      )}
    </AdminLayout>
  )
}
