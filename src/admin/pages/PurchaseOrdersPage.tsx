import { useEffect, useState } from 'react'
import { AdminLayout, Table, SearchInput, Badge, StatCard, StatGrid, Btn } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

type POStatus = 'draft' | 'sent' | 'confirmed' | 'partially_received' | 'received' | 'fully_received' | 'cancelled'

interface POItem {
  id: string
  variantId: string
  quantity: number
  receivedQty: number
  unitPrice: string
  variant: { sku: string; product: { name: string } }
}

interface PODetail {
  id: string
  poNumber: string
  supplier: { id: string; name: string }
  items: POItem[]
}

interface PO {
  id: string
  poNumber: string
  supplierId: string
  rfqId: string | null
  status: POStatus
  orderDate: string
  expectedDate: string | null
  totalAmount: string
  note: string | null
  supplier: { id: string; name: string }
  _count: { items: number }
}

interface Warehouse { id: string; name: string }

const STATUS_LABEL: Record<POStatus, string> = {
  draft:              'Draft',
  sent:               'Sent',
  confirmed:          'Confirmed',
  partially_received: 'Partially Received',
  received:           'Received',
  fully_received:     'Fully Received',
  cancelled:          'Cancelled',
}

const STATUS_COLOR: Record<POStatus, string> = {
  draft:              '#64748B',
  sent:               '#1D4ED8',
  confirmed:          '#8B5CF6',
  partially_received: '#F59E0B',
  received:           '#10B981',
  fully_received:     '#10B981',
  cancelled:          '#EF4444',
}

const ALL_STATUSES: POStatus[] = ['draft', 'sent', 'confirmed', 'partially_received', 'received', 'fully_received', 'cancelled']

const COLS = [
  { key: 'poNumber',     label: 'PO Number', width: 130 },
  { key: 'supplierName', label: 'Supplier' },
  { key: 'itemCount',    label: 'Items',     width: 70 },
  { key: 'totalAmount',  label: 'Total',     width: 120 },
  { key: 'status',       label: 'Status',    width: 170 },
  { key: 'orderDate',    label: 'Ordered',   width: 110 },
  { key: 'expectedDate', label: 'Expected',  width: 110 },
  { key: 'actions',      label: '',          width: 120 },
]

const inp: React.CSSProperties = {
  width: '100%', padding: '7px 10px', border: '1px solid #E2E8F0',
  borderRadius: 7, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none',
}

interface ReceiveModalProps {
  po: PODetail
  warehouses: Warehouse[]
  onClose: () => void
  onDone: () => void
}

function ReceiveModal({ po, warehouses, onClose, onDone }: ReceiveModalProps) {
  const remaining = po.items.filter(i => i.receivedQty < i.quantity)
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id ?? '')
  const [qtys, setQtys] = useState<Record<string, { received: number; accepted: number }>>(
    Object.fromEntries(remaining.map(i => [i.id, { received: i.quantity - i.receivedQty, accepted: i.quantity - i.receivedQty }]))
  )
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const submit = async () => {
    if (!warehouseId) { setErr('Select a warehouse'); return }
    setSaving(true)
    try {
      const items = remaining.map(i => ({
        poItemId:    i.id,
        variantId:   i.variantId,
        quantity:    qtys[i.id]?.received ?? 0,
        acceptedQty: qtys[i.id]?.accepted ?? 0,
        rejectedQty: (qtys[i.id]?.received ?? 0) - (qtys[i.id]?.accepted ?? 0),
      })).filter(i => i.quantity > 0)

      await api.post(`/purchase-orders/${po.id}/receive`, { warehouseId, items })
      onDone()
      onClose()
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to record receipt')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 600, fontFamily: FONT, maxWidth: 'calc(100vw - 32px)', boxSizing: 'border-box', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: DARK }}>Receive Goods — {po.poNumber}</h2>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748B' }}>Supplier: {po.supplier.name}</p>

        <label style={{ display: 'block', marginBottom: 20 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Destination Warehouse *</span>
          <select value={warehouseId} onChange={e => setWarehouseId(e.target.value)} style={inp}>
            <option value="">Select warehouse…</option>
            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </label>

        <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 8, display: 'grid', gridTemplateColumns: '1fr 90px 90px', gap: 8 }}>
          <span>Item</span><span style={{ textAlign: 'right' }}>Received</span><span style={{ textAlign: 'right' }}>Accepted</span>
        </div>

        {remaining.map(item => {
          const pending = item.quantity - item.receivedQty
          const q = qtys[item.id] ?? { received: pending, accepted: pending }
          return (
            <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px', gap: 8, marginBottom: 10, alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: DARK }}>{item.variant.product.name}</div>
                <div style={{ fontSize: 11, color: '#94A3B8' }}>SKU: {item.variant.sku} · Ordered: {item.quantity} · Already received: {item.receivedQty}</div>
              </div>
              <input
                type="number" min={0} max={pending} value={q.received}
                onChange={e => setQtys(prev => ({ ...prev, [item.id]: { received: Number(e.target.value), accepted: Math.min(Number(e.target.value), prev[item.id]?.accepted ?? 0) } }))}
                style={{ ...inp, textAlign: 'right' }}
              />
              <input
                type="number" min={0} max={q.received} value={q.accepted}
                onChange={e => setQtys(prev => ({ ...prev, [item.id]: { ...prev[item.id], accepted: Number(e.target.value) } }))}
                style={{ ...inp, textAlign: 'right' }}
              />
            </div>
          )
        })}

        {err && <p style={{ color: '#EF4444', fontSize: 12, margin: '12px 0 0' }}>{err}</p>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
          <Btn label="Cancel" variant="secondary" onClick={onClose} />
          <Btn label={saving ? 'Recording…' : 'Record Receipt'} onClick={submit} />
        </div>
      </div>
    </div>
  )
}

export function PurchaseOrdersPage() {
  const [pos, setPos]         = useState<PO[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ]             = useState('')
  const [statusFilter, setStatusFilter] = useState<POStatus | 'all'>('all')
  const [receiveModal, setReceiveModal] = useState<PODetail | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [posRes, whRes] = await Promise.all([
        api.get<{ data: PO[] }>('/purchase-orders?pageSize=200'),
        api.get<{ data: Warehouse[] }>('/warehouses?pageSize=100&isActive=true'),
      ])
      setPos(posRes.data)
      setWarehouses(whRes.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openReceive = async (id: string) => {
    const detail = await api.get<PODetail>(`/purchase-orders/${id}`)
    setReceiveModal(detail)
  }

  const filtered = pos.filter(r =>
    (statusFilter === 'all' || r.status === statusFilter) &&
    (r.poNumber.toLowerCase().includes(q.toLowerCase()) ||
     r.supplier.name.toLowerCase().includes(q.toLowerCase()))
  )

  const fmt = (s: string) => `AED ${Number(s).toLocaleString()}`
  const fmtDate = (d: string | null) => d ? d.slice(0, 10) : '—'

  const rows = filtered.map(r => ({
    poNumber:     r.poNumber,
    supplierName: r.supplier.name,
    itemCount:    r._count.items,
    totalAmount:  <strong>{fmt(r.totalAmount)}</strong>,
    status:       <Badge label={STATUS_LABEL[r.status] ?? r.status} color={STATUS_COLOR[r.status] ?? '#64748B'} />,
    orderDate:    fmtDate(r.orderDate),
    expectedDate: fmtDate(r.expectedDate),
    actions: (
      <div style={{ display: 'flex', gap: 6 }}>
        {(r.status === 'confirmed' || r.status === 'partially_received') && (
          <button
            onClick={() => openReceive(r.id)}
            style={{ fontSize: 12, padding: '4px 10px', border: '1px solid #D1FAE5', borderRadius: 6, background: '#ECFDF5', color: '#065F46', cursor: 'pointer', fontFamily: FONT }}
          >Receive</button>
        )}
        {r.status === 'draft' && (
          <button
            onClick={async () => {
              if (!window.confirm('Cancel this PO?')) return
              await api.post(`/purchase-orders/${r.id}/cancel`, {})
              load()
            }}
            style={{ fontSize: 12, padding: '4px 10px', border: '1px solid #FECACA', borderRadius: 6, background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', fontFamily: FONT }}
          >Cancel</button>
        )}
      </div>
    ),
  }))

  const totalSpend = pos.reduce((s, r) => s + Number(r.totalAmount), 0)

  return (
    <AdminLayout
      title="Purchase Orders"
      actions={<SearchInput value={q} onChange={setQ} placeholder="Search POs…" />}
    >
      <StatGrid>
        <StatCard label="Total Spend"  value={`AED ${totalSpend.toLocaleString()}`}                                          sub="All POs"          color="#1D4ED8" />
        <StatCard label="In Transit"   value={String(pos.filter(r => ['sent', 'confirmed'].includes(r.status)).length)}      sub="Awaiting arrival"  color="#8B5CF6" />
        <StatCard label="Received"     value={String(pos.filter(r => r.status === 'received').length)}                        sub="Fully received"    color="#10B981" />
        <StatCard label="Partial"      value={String(pos.filter(r => r.status === 'partially_received').length)}              sub="Partial receipt"   color="#F59E0B" />
      </StatGrid>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['all', ...ALL_STATUSES] as const).map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontFamily: FONT, fontWeight: 500, cursor: 'pointer', border: '1px solid #E2E8F0', background: statusFilter === s ? DARK : '#fff', color: statusFilter === s ? '#fff' : '#64748B' }}>
            {s === 'all' ? 'All' : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT, fontSize: 14 }}>Loading…</div>
      ) : (
        <>
          <div style={{ fontSize: 13, color: '#64748B', marginBottom: 12 }}>{filtered.length} purchase orders</div>
          <Table columns={COLS} rows={rows} />
        </>
      )}

      {receiveModal && (
        <ReceiveModal
          po={receiveModal}
          warehouses={warehouses}
          onClose={() => setReceiveModal(null)}
          onDone={load}
        />
      )}
    </AdminLayout>
  )
}
