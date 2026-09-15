import { useEffect, useState } from 'react'
import { AdminLayout, Table, SearchInput, Badge, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

type ShipStatus = 'pending' | 'dispatched' | 'in_transit' | 'delivered' | 'returned'
interface FreightCost { id: string; amount: string; currency: string; description?: string | null }
interface ShipOrder { id: string; orderNumber: string; contactName?: string | null; deliveryCity?: string | null; deliveryEmirate?: string | null; total: string | number; status: string; customer?: { fullName?: string | null; email?: string | null } }
interface Shipment {
  id: string; orderId: string | null; trackingNo: string | null; status: ShipStatus
  carrierName: string | null; routeText: string | null; price: string | number | null
  shippedAt: string | null; deliveredAt: string | null; notes: string | null; createdAt: string
  order: ShipOrder | null
  carrier: { id: string; name: string } | null
  route: { id: string; origin: string; destination: string } | null
  freightCosts: FreightCost[]
}
interface Carrier { id: string; name: string }
interface Route   { id: string; origin: string; destination: string }

const STATUS_LABEL: Record<ShipStatus, string> = { pending: 'Pending', dispatched: 'Out for Delivery', in_transit: 'In Transit', delivered: 'Delivered', returned: 'Returned' }
const STATUS_COLOR: Record<ShipStatus, string> = { pending: '#64748B', dispatched: '#F59E0B', in_transit: '#F59E0B', delivered: '#10B981', returned: '#EF4444' }

const btn = (v: 'primary' | 'ghost' | 'success' = 'ghost'): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8,
  fontSize: 13, fontFamily: FONT, fontWeight: 500, cursor: 'pointer', border: 'none',
  background: v === 'primary' ? DARK : v === 'success' ? '#059669' : '#F1F5F9',
  color: v === 'primary' || v === 'success' ? '#fff' : '#374151',
})
const inp: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13, fontFamily: FONT, outline: 'none', boxSizing: 'border-box' }
const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#64748B', fontFamily: FONT, display: 'block', marginBottom: 4 }
const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2 })
const carrierLabel = (s: Shipment) => s.carrier?.name ?? s.carrierName ?? '—'
const routeLabel = (s: Shipment) => s.route ? `${s.route.origin} → ${s.route.destination}` : (s.routeText ?? '—')

function Modal({ title, onClose, children, width = 480 }: { title: string; onClose: () => void; children: React.ReactNode; width?: number }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 26, width, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 16, color: DARK }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94A3B8' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function ShipmentModal({ carriers, routes, onClose, onSaved }: { carriers: Carrier[]; routes: Route[]; onClose: () => void; onSaved: () => void }) {
  const [orders, setOrders] = useState<ShipOrder[]>([])
  const [orderId, setOrderId] = useState('')
  const [carrierId, setCarrierId] = useState('')
  const [carrierName, setCarrierName] = useState('')
  const [routeId, setRouteId] = useState('')
  const [routeText, setRouteText] = useState('')
  const [price, setPrice] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [tracking, setTracking] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => { api.get<{ data: ShipOrder[] }>('/shipments/eligible-orders').then(r => setOrders(r.data)).catch(() => setOrders([])) }, [])

  const save = async () => {
    if (!orderId) return setErr('Select an order to ship')
    setSaving(true); setErr('')
    try {
      await api.post('/shipments', {
        orderId,
        carrierId: carrierId === '__other__' ? null : carrierId || null,
        carrierName: carrierId === '__other__' ? carrierName.trim() : null,
        routeId: routeId === '__other__' ? null : routeId || null,
        routeText: routeId === '__other__' ? routeText.trim() : null,
        price: price === '' ? null : Number(price),
        paymentMethod,
        trackingNo: tracking.trim() || null,
        notes: notes.trim() || null,
      })
      onSaved()
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Could not create shipment') }
    finally { setSaving(false) }
  }

  return (
    <Modal title="New Shipment" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div><label style={lbl}>Online Order *</label>
          <select style={inp} value={orderId} onChange={e => setOrderId(e.target.value)}>
            <option value="">— Select an order —</option>
            {orders.map(o => <option key={o.id} value={o.id}>{o.orderNumber} · {o.contactName ?? o.customer?.fullName ?? o.customer?.email ?? 'Online'} · {o.deliveryCity ?? ''} · AED {fmt(Number(o.total))}</option>)}
          </select>
          {orders.length === 0 && <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>No orders are ready to ship right now.</div>}
        </div>

        <div><label style={lbl}>Carrier / Rider</label>
          <select style={inp} value={carrierId} onChange={e => setCarrierId(e.target.value)}>
            <option value="">— Select carrier —</option>
            {carriers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            <option value="__other__">Other / Own rider (type name)…</option>
          </select>
          {carrierId === '__other__' && <input style={{ ...inp, marginTop: 8 }} value={carrierName} onChange={e => setCarrierName(e.target.value)} placeholder="e.g. Own rider — Ahmed, or Aramex" />}
        </div>

        <div><label style={lbl}>Route</label>
          <select style={inp} value={routeId} onChange={e => setRouteId(e.target.value)}>
            <option value="">— Select route —</option>
            {routes.map(r => <option key={r.id} value={r.id}>{r.origin} → {r.destination}</option>)}
            <option value="__other__">Other (type route)…</option>
          </select>
          {routeId === '__other__' && <input style={{ ...inp, marginTop: 8 }} value={routeText} onChange={e => setRouteText(e.target.value)} placeholder="e.g. Warehouse → Dubai Marina" />}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={lbl}>Shipment Price (AED)</label><input type="number" min={0} step="0.01" style={inp} value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 25" /></div>
          <div><label style={lbl}>Paid via</label>
            <select style={inp} value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
              <option value="cash">Cash</option><option value="card">Bank/Card</option><option value="credit">On account</option>
            </select>
          </div>
        </div>

        <div><label style={lbl}>Tracking # (optional)</label><input style={inp} value={tracking} onChange={e => setTracking(e.target.value)} /></div>
        <div><label style={lbl}>Notes (optional)</label><input style={inp} value={notes} onChange={e => setNotes(e.target.value)} /></div>

        {err && <div style={{ color: '#EF4444', fontSize: 12 }}>{err}</div>}
        <div style={{ fontSize: 11, color: '#94A3B8' }}>Creating a shipment marks the order “Out for Delivery” and posts the price to Delivery &amp; Freight Expense.</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button style={btn('ghost')} onClick={onClose}>Cancel</button>
          <button style={btn('primary')} onClick={save} disabled={saving}>{saving ? 'Creating…' : 'Create Shipment'}</button>
        </div>
      </div>
    </Modal>
  )
}

export function ShipmentsPage() {
  const [data, setData] = useState<Shipment[]>([])
  const [carriers, setCarriers] = useState<Carrier[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [tab, setTab] = useState<'active' | 'history'>('active')
  const [showNew, setNew] = useState(false)
  const [busyId, setBusyId] = useState('')

  const load = async () => {
    setLoading(true)
    try { const r = await api.get<{ data: Shipment[] }>('/shipments?pageSize=300'); setData(r.data) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])
  useEffect(() => {
    api.get<{ data: Carrier[] }>('/carriers?pageSize=200').then(r => setCarriers(r.data)).catch(() => {})
    api.get<{ data: Route[] }>('/carriers/routes?pageSize=200').then(r => setRoutes(r.data)).catch(() => {})
  }, [])

  const markDelivered = async (id: string) => {
    setBusyId(id)
    try { await api.post(`/shipments/${id}/deliver`, {}); await load() }
    finally { setBusyId('') }
  }

  const isActive = (s: Shipment) => !['delivered', 'returned'].includes(s.status)
  const scoped = data.filter(s => tab === 'active' ? isActive(s) : !isActive(s))
  const filtered = scoped.filter(r => `${r.order?.orderNumber ?? ''} ${carrierLabel(r)} ${r.trackingNo ?? ''}`.toLowerCase().includes(q.toLowerCase()))

  const price = (r: Shipment) => Number(r.price ?? 0) || r.freightCosts.reduce((s, f) => s + Number(f.amount), 0)
  const rows = filtered.map(r => ({
    order: r.order ? <span style={{ fontWeight: 600, color: DARK }}>{r.order.orderNumber}</span> : <span style={{ color: '#94A3B8' }}>—</span>,
    customer: r.order?.contactName ?? r.order?.customer?.fullName ?? r.order?.customer?.email ?? '—',
    carrier: carrierLabel(r),
    route: routeLabel(r),
    price: <span style={{ fontWeight: 600 }}>AED {fmt(price(r))}</span>,
    status: <Badge label={STATUS_LABEL[r.status]} color={STATUS_COLOR[r.status]} />,
    action: isActive(r)
      ? <button style={{ ...btn('success'), padding: '5px 12px', fontSize: 12 }} disabled={busyId === r.id} onClick={() => markDelivered(r.id)}>{busyId === r.id ? '…' : 'Mark Delivered'}</button>
      : <span style={{ fontSize: 12, color: '#94A3B8' }}>{r.deliveredAt ? new Date(r.deliveredAt).toLocaleDateString() : ''}</span>,
  }))

  const active = data.filter(isActive)
  const totalSpend = data.reduce((s, r) => s + price(r), 0)

  return (
    <AdminLayout title="Shipments" actions={
      <div style={{ display: 'flex', gap: 8 }}>
        <SearchInput value={q} onChange={setQ} placeholder="Search order, carrier, tracking…" />
        <button style={btn('primary')} onClick={() => setNew(true)}>+ New Shipment</button>
      </div>
    }>
      <StatGrid>
        <StatCard label="Out for Delivery" value={String(active.length)} sub="Active shipments" color="#F59E0B" />
        <StatCard label="Delivered" value={String(data.filter(r => r.status === 'delivered').length)} sub="Completed" color="#10B981" />
        <StatCard label="Total Shipments" value={String(data.length)} sub="All time" />
        <StatCard label="Delivery Spend" value={`AED ${fmt(totalSpend)}`} sub="Freight logged" color="#DC2626" />
      </StatGrid>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {(['active', 'history'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 16px', borderRadius: 20, fontSize: 12, fontFamily: FONT, fontWeight: 600, cursor: 'pointer', border: '1px solid #E2E8F0', background: tab === t ? DARK : '#fff', color: tab === t ? '#fff' : '#64748B' }}>
            {t === 'active' ? `Out for Delivery (${active.length})` : `History (${data.length - active.length})`}
          </button>
        ))}
      </div>

      {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
        : filtered.length === 0 ? <div style={{ padding: 60, textAlign: 'center', color: '#94A3B8', fontFamily: FONT, border: '2px dashed #E2E8F0', borderRadius: 12 }}>{tab === 'active' ? 'No shipments out for delivery. Click “+ New Shipment”.' : 'No delivered shipments yet.'}</div>
        : <Table columns={[
            { key: 'order', label: 'Order', width: 150 }, { key: 'customer', label: 'Customer' },
            { key: 'carrier', label: 'Carrier / Rider', width: 170 }, { key: 'route', label: 'Route', width: 190 },
            { key: 'price', label: 'Price', width: 110 }, { key: 'status', label: 'Status', width: 140 },
            { key: 'action', label: '', width: 140 },
          ]} rows={rows} />}

      {showNew && <ShipmentModal carriers={carriers} routes={routes} onClose={() => setNew(false)} onSaved={() => { setNew(false); load() }} />}
    </AdminLayout>
  )
}
