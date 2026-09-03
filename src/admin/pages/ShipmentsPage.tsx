import { useEffect, useState } from 'react'
import { AdminLayout, Table, SearchInput, Badge, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

type ShipStatus = 'pending' | 'dispatched' | 'in_transit' | 'delivered' | 'returned'
interface FreightCost { id: string; amount: string; currency: string; description?: string | null }
interface Shipment {
  id: string; salesOrderId: string | null; trackingNo: string | null; status: ShipStatus
  shippedAt: string | null; estimatedAt: string | null; deliveredAt: string | null; notes: string | null; createdAt: string
  carrier: { id: string; name: string } | null
  route: { id: string; origin: string; destination: string } | null
  freightCosts: FreightCost[]
}
interface Carrier { id: string; name: string }
interface Route   { id: string; origin: string; destination: string }

const STATUS_LABEL: Record<ShipStatus, string> = { pending: 'Pending', dispatched: 'Dispatched', in_transit: 'In Transit', delivered: 'Delivered', returned: 'Returned' }
const STATUS_COLOR: Record<ShipStatus, string> = { pending: '#64748B', dispatched: '#8B5CF6', in_transit: '#F59E0B', delivered: '#10B981', returned: '#EF4444' }
const STATUSES: ShipStatus[] = ['pending', 'dispatched', 'in_transit', 'delivered', 'returned']

const btn = (v: 'primary' | 'ghost' | 'danger' = 'ghost'): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8,
  fontSize: 13, fontFamily: FONT, fontWeight: 500, cursor: 'pointer', border: 'none',
  background: v === 'primary' ? DARK : v === 'danger' ? '#FEF2F2' : '#F1F5F9',
  color: v === 'primary' ? '#fff' : v === 'danger' ? '#EF4444' : '#374151',
})
const inp: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13, fontFamily: FONT, outline: 'none', boxSizing: 'border-box' }
const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#64748B', fontFamily: FONT, display: 'block', marginBottom: 4 }
const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2 })

function Modal({ title, onClose, children, width = 460 }: { title: string; onClose: () => void; children: React.ReactNode; width?: number }) {
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
  const [ref, setRef]         = useState('')
  const [carrierId, setCarrier] = useState('')
  const [routeId, setRoute]   = useState('')
  const [tracking, setTrack]  = useState('')
  const [eta, setEta]         = useState('')
  const [saving, setSaving]   = useState(false)
  const save = async () => {
    setSaving(true)
    try {
      await api.post('/shipments', { salesOrderId: ref.trim() || null, carrierId: carrierId || null, routeId: routeId || null, trackingNo: tracking.trim() || null, estimatedAt: eta || null })
      onSaved()
    } finally { setSaving(false) }
  }
  return (
    <Modal title="New Shipment" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div><label style={lbl}>Order Reference</label><input style={inp} value={ref} onChange={e => setRef(e.target.value)} placeholder="Walk-in / online order no. (optional)" /></div>
        <div><label style={lbl}>Carrier</label>
          <select style={inp} value={carrierId} onChange={e => setCarrier(e.target.value)}>
            <option value="">— Select carrier —</option>
            {carriers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div><label style={lbl}>Route</label>
          <select style={inp} value={routeId} onChange={e => setRoute(e.target.value)}>
            <option value="">— Select route —</option>
            {routes.map(r => <option key={r.id} value={r.id}>{r.origin} → {r.destination}</option>)}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={lbl}>Tracking #</label><input style={inp} value={tracking} onChange={e => setTrack(e.target.value)} /></div>
          <div><label style={lbl}>ETA</label><input type="date" style={inp} value={eta} onChange={e => setEta(e.target.value)} /></div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button style={btn('ghost')} onClick={onClose}>Cancel</button>
          <button style={btn('primary')} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Create Shipment'}</button>
        </div>
      </div>
    </Modal>
  )
}

function ShipmentDetail({ shipment, onClose, onUpdated }: { shipment: Shipment; onClose: () => void; onUpdated: () => void }) {
  const [amount, setAmount]   = useState('')
  const [method, setMethod]   = useState('cash')
  const [desc, setDesc]       = useState('')
  const [saving, setSaving]   = useState(false)
  const freight = shipment.freightCosts.reduce((s, f) => s + Number(f.amount), 0)

  const addFreight = async () => {
    if (!amount || Number(amount) <= 0) return
    setSaving(true)
    try {
      await api.post(`/shipments/${shipment.id}/freight`, { amount: Number(amount), method, description: desc.trim() || null })
      setAmount(''); setDesc(''); onUpdated()
    } finally { setSaving(false) }
  }
  const setStatus = async (action: 'dispatch' | 'deliver') => { await api.post(`/shipments/${shipment.id}/${action}`, {}); onUpdated() }

  return (
    <Modal title={`Shipment ${shipment.id.slice(0, 8).toUpperCase()}`} onClose={onClose} width={520}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', background: '#F8FAFC', borderRadius: 10, padding: '12px 16px' }}>
          <div><div style={lbl}>Status</div><Badge label={STATUS_LABEL[shipment.status]} color={STATUS_COLOR[shipment.status]} /></div>
          <div><div style={lbl}>Carrier</div><div style={{ fontFamily: FONT, fontSize: 13 }}>{shipment.carrier?.name ?? '—'}</div></div>
          <div><div style={lbl}>Route</div><div style={{ fontFamily: FONT, fontSize: 13 }}>{shipment.route ? `${shipment.route.origin} → ${shipment.route.destination}` : '—'}</div></div>
          <div><div style={lbl}>Order Ref</div><div style={{ fontFamily: FONT, fontSize: 13 }}>{shipment.salesOrderId ?? '—'}</div></div>
        </div>

        {/* Status actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          {shipment.status === 'pending' && <button style={btn('primary')} onClick={() => setStatus('dispatch')}>Mark Dispatched</button>}
          {['dispatched', 'in_transit'].includes(shipment.status) && <button style={btn('primary')} onClick={() => setStatus('deliver')}>Mark Delivered</button>}
        </div>

        {/* Freight costs */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: DARK }}>Freight Costs</span>
            <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: '#DC2626' }}>AED {fmt(freight)}</span>
          </div>
          {shipment.freightCosts.length === 0 && <div style={{ color: '#94A3B8', fontSize: 12, fontFamily: FONT, marginBottom: 8 }}>No freight recorded yet.</div>}
          {shipment.freightCosts.map(f => (
            <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#F8FAFC', borderRadius: 8, marginBottom: 6, fontSize: 12, fontFamily: FONT }}>
              <span>{f.description || 'Freight'}</span>
              <span style={{ fontWeight: 600 }}>AED {fmt(Number(f.amount))}</span>
            </div>
          ))}
          {/* Add freight */}
          <div style={{ border: '1px dashed #CBD5E1', borderRadius: 10, padding: 12, marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div><label style={lbl}>Amount (AED)</label><input type="number" min={0} step="0.01" style={inp} value={amount} onChange={e => setAmount(e.target.value)} /></div>
            <div><label style={lbl}>Paid via</label>
              <select style={inp} value={method} onChange={e => setMethod(e.target.value)}>
                <option value="cash">Cash</option><option value="card">Bank/Card</option><option value="credit">On account (payable)</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}><label style={lbl}>Description</label><input style={inp} value={desc} onChange={e => setDesc(e.target.value)} placeholder="e.g. fuel + driver" /></div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
              <button style={btn('primary')} onClick={addFreight} disabled={saving}>{saving ? 'Recording…' : '+ Record Freight (auto-journals)'}</button>
            </div>
          </div>
          <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: FONT, marginTop: 6 }}>
            Recording freight posts: Debit “Delivery &amp; Freight Expense”, Credit Cash / Bank / Payable.
          </div>
        </div>
      </div>
    </Modal>
  )
}

export function ShipmentsPage() {
  const [data, setData]       = useState<Shipment[]>([])
  const [carriers, setCarriers] = useState<Carrier[]>([])
  const [routes, setRoutes]   = useState<Route[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ]             = useState('')
  const [statusFilter, setFilter] = useState<ShipStatus | 'all'>('all')
  const [showNew, setNew]     = useState(false)
  const [detailId, setDetail] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try { const r = await api.get<{ data: Shipment[] }>('/shipments?pageSize=200'); setData(r.data) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])
  useEffect(() => {
    api.get<{ data: Carrier[] }>('/carriers?pageSize=200').then(r => setCarriers(r.data))
    api.get<{ data: Route[] }>('/carriers/routes?pageSize=200').then(r => setRoutes(r.data))
  }, [])

  const filtered = data.filter(r => (statusFilter === 'all' || r.status === statusFilter) && ((r.trackingNo ?? '').toLowerCase().includes(q.toLowerCase()) || (r.carrier?.name ?? '').toLowerCase().includes(q.toLowerCase()) || (r.salesOrderId ?? '').toLowerCase().includes(q.toLowerCase())))
  const rows = filtered.map(r => ({
    id: <button onClick={() => setDetail(r.id)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: FONT, fontWeight: 600, fontSize: 13, color: '#1D4ED8' }}>{r.id.slice(0, 8).toUpperCase()}</button>,
    ref: r.salesOrderId ?? <span style={{ color: '#94A3B8', fontSize: 12 }}>—</span>,
    carrier: r.carrier?.name ?? <span style={{ color: '#94A3B8', fontSize: 12 }}>—</span>,
    route: r.route ? `${r.route.origin} → ${r.route.destination}` : <span style={{ color: '#94A3B8', fontSize: 12 }}>—</span>,
    freight: <span style={{ fontFamily: FONT, fontWeight: 600 }}>AED {fmt(r.freightCosts.reduce((s, f) => s + Number(f.amount), 0))}</span>,
    status: <Badge label={STATUS_LABEL[r.status]} color={STATUS_COLOR[r.status]} />,
    action: <button style={{ ...btn('ghost'), padding: '4px 10px', fontSize: 12 }} onClick={() => setDetail(r.id)}>Open</button>,
  }))

  const totalFreight = data.reduce((s, r) => s + r.freightCosts.reduce((a, f) => a + Number(f.amount), 0), 0)
  const detail = data.find(d => d.id === detailId)

  return (
    <AdminLayout title="Shipments" actions={
      <div style={{ display: 'flex', gap: 8 }}>
        <SearchInput value={q} onChange={setQ} placeholder="Search tracking, carrier, ref…" />
        <button style={btn('primary')} onClick={() => setNew(true)}>+ New Shipment</button>
      </div>
    }>
      <StatGrid>
        <StatCard label="Total"         value={String(data.length)}                                                              sub="All shipments" />
        <StatCard label="In Transit"    value={String(data.filter(r => ['dispatched', 'in_transit'].includes(r.status)).length)} sub="On the way"       color="#F59E0B" />
        <StatCard label="Delivered"     value={String(data.filter(r => r.status === 'delivered').length)}                        sub="Completed"        color="#10B981" />
        <StatCard label="Freight Spend" value={`AED ${fmt(totalFreight)}`}                                                       sub="Total logged"     color="#DC2626" />
      </StatGrid>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['all', ...STATUSES] as const).map(s => <button key={s} onClick={() => setFilter(s)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontFamily: FONT, fontWeight: 500, cursor: 'pointer', border: '1px solid #E2E8F0', background: statusFilter === s ? DARK : '#fff', color: statusFilter === s ? '#fff' : '#64748B' }}>{s === 'all' ? 'All' : STATUS_LABEL[s]}</button>)}
      </div>
      {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
        : data.length === 0 ? <div style={{ padding: 60, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>No shipments yet. Click “+ New Shipment”.</div>
        : <><div style={{ fontSize: 13, color: '#64748B', marginBottom: 12, fontFamily: FONT }}>{filtered.length} shipments</div>
            <Table columns={[{ key: 'id', label: 'Ref #', width: 100 }, { key: 'ref', label: 'Order', width: 130 }, { key: 'carrier', label: 'Carrier', width: 150 }, { key: 'route', label: 'Route', width: 200 }, { key: 'freight', label: 'Freight', width: 110 }, { key: 'status', label: 'Status', width: 120 }, { key: 'action', label: '', width: 80 }]} rows={rows} /></>}

      {showNew && <ShipmentModal carriers={carriers} routes={routes} onClose={() => setNew(false)} onSaved={() => { setNew(false); load() }} />}
      {detail && <ShipmentDetail shipment={detail} onClose={() => setDetail(null)} onUpdated={load} />}
    </AdminLayout>
  )
}
