import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AdminLayout, StatCard, StatGrid, Badge } from '../components/AdminLayout'
import { api } from '../../lib/api'
import { SaleDrawer, type Supplier, type Material, type Product, type Warehouse } from './WalkInSalesPage'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

// Only these stages need active handling
const HANDLING_STATUSES = ['confirmed', 'in_production', 'ready_for_pickup'] as const
const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Confirmed', in_production: 'In Production', ready_for_pickup: 'Ready for Pickup',
}
const STATUS_COLOR: Record<string, string> = {
  confirmed: '#8B5CF6', in_production: '#3B82F6', ready_for_pickup: '#10B981',
}

interface JobBrief { id: string; status: string; type: string; stepName: string; productName?: string; assignedTo?: { name: string } | null; supplier?: { name: string } | null }
interface OrderRow {
  id: string; saleNumber: string; status: string
  totalAmount: number; advancePaid: number; createdAt: string; dueDate?: string
  customer: { id: string; name: string; phone?: string }
  jobs: JobBrief[]
}

export function OrderHandlingPage() {
  const [orders, setOrders]   = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [statusF, setStatusF] = useState<string>('all')
  const [q, setQ]             = useState('')
  const [searchParams, setSearchParams] = useSearchParams()
  const drawerId = searchParams.get('order')
  const openDrawer  = (id: string) => setSearchParams(prev => { const p = new URLSearchParams(prev); p.set('order', id); return p })
  const closeDrawer = () => setSearchParams(prev => { const p = new URLSearchParams(prev); p.delete('order'); return p })

  // Reference data for the handling panel
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [products,  setProducts]  = useState<Product[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // Pull active orders across the handling statuses
      const results = await Promise.all(
        HANDLING_STATUSES.map(s =>
          api.get<{ data: OrderRow[] }>(`/walk-in-sales?status=${s}&pageSize=200`).then(r => r.data).catch(() => [])
        )
      )
      const merged = results.flat().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      setOrders(merged)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    api.get<{ data: Supplier[] }>('/suppliers?pageSize=500').then(r => setSuppliers(r.data))
    api.get<{ data: Material[] }>('/materials?pageSize=500').then(r => setMaterials(r.data))
    api.get<{ data: Product[]  }>('/products?pageSize=500&isActive=true').then(r => setProducts(r.data))
    api.get<{ data: Warehouse[] }>('/warehouses?pageSize=100').then(r => setWarehouses(r.data))
  }, [])

  const filtered = orders.filter(o =>
    (statusF === 'all' || o.status === statusF) &&
    (o.saleNumber.toLowerCase().includes(q.toLowerCase()) || o.customer.name.toLowerCase().includes(q.toLowerCase()))
  )

  const jobProgress = (jobs: JobBrief[]) => {
    const total = jobs.length
    const done  = jobs.filter(j => j.status === 'done').length
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0 }
  }

  return (
    <AdminLayout
      title="Handling Walk-in Orders"
      actions={
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search order or customer…"
          style={{ padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, width: 240, outline: 'none' }} />
      }
    >
      <StatGrid>
        <StatCard label="Active Orders"    value={String(orders.length)}                                              sub="Need handling" />
        <StatCard label="Confirmed"        value={String(orders.filter(o => o.status === 'confirmed').length)}        sub="Awaiting production" color="#8B5CF6" />
        <StatCard label="In Production"    value={String(orders.filter(o => o.status === 'in_production').length)}    sub="Being worked on"    color="#3B82F6" />
        <StatCard label="Ready for Pickup" value={String(orders.filter(o => o.status === 'ready_for_pickup').length)} sub="Awaiting collection" color="#10B981" />
      </StatGrid>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['all', ...HANDLING_STATUSES] as const).map(s => (
          <button key={s} onClick={() => setStatusF(s)}
            style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontFamily: FONT, fontWeight: 500, cursor: 'pointer', border: '1px solid #E2E8F0', background: statusF === s ? DARK : '#fff', color: statusF === s ? '#fff' : '#64748B' }}>
            {s === 'all' ? `All (${orders.length})` : `${STATUS_LABEL[s]} (${orders.filter(o => o.status === s).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#94A3B8', fontFamily: FONT, border: '2px dashed #E2E8F0', borderRadius: 12 }}>
          No orders currently need handling. Confirm a walk-in sale to start production.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(o => {
            const { total, done, pct } = jobProgress(o.jobs)
            const balance = Number(o.totalAmount) - Number(o.advancePaid)
            const unassigned = o.jobs.filter(j => j.type === 'in_house' && !j.assignedTo && j.status !== 'done').length
            return (
              <div key={o.id} onClick={() => openDrawer(o.id)}
                style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 18 }}>
                {/* Order + customer */}
                <div style={{ minWidth: 190 }}>
                  <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: DARK }}>{o.saleNumber}</div>
                  <div style={{ fontFamily: FONT, fontSize: 12, color: '#64748B' }}>{o.customer.name}{o.customer.phone ? ` · ${o.customer.phone}` : ''}</div>
                </div>

                {/* Status */}
                <Badge label={STATUS_LABEL[o.status] ?? o.status} color={STATUS_COLOR[o.status] ?? '#64748B'} />

                {/* Job progress */}
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: '#94A3B8', fontFamily: FONT }}>Jobs</span>
                    <span style={{ fontSize: 11, color: DARK, fontFamily: FONT, fontWeight: 600 }}>{done}/{total} done</span>
                  </div>
                  <div style={{ height: 6, background: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#10B981' : '#3B82F6', borderRadius: 3 }} />
                  </div>
                </div>

                {/* Unassigned warning */}
                {unassigned > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 999, background: '#FEF2F2', color: '#DC2626' }}>
                    {unassigned} unassigned
                  </span>
                )}

                {/* Payment */}
                <div style={{ minWidth: 120, textAlign: 'right' }}>
                  <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: DARK }}>AED {Number(o.totalAmount).toLocaleString()}</div>
                  <div style={{ fontFamily: FONT, fontSize: 11, color: balance > 0 ? '#DC2626' : '#059669' }}>
                    {balance > 0 ? `AED ${balance.toLocaleString()} due` : 'Fully paid'}
                  </div>
                </div>

                <button style={{ background: DARK, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 12, fontWeight: 700, fontFamily: FONT, cursor: 'pointer' }}>
                  Handle →
                </button>
              </div>
            )
          })}
        </div>
      )}

      {drawerId && (
        <SaleDrawer
          saleId={drawerId}
          suppliers={suppliers}
          materials={materials}
          products={products}
          warehouses={warehouses}
          onClose={closeDrawer}
          onUpdated={load}
        />
      )}
    </AdminLayout>
  )
}
