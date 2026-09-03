import { useEffect, useState } from 'react'
import { AdminLayout, Table, Badge, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

interface Carrier { id: string; name: string; contact: string | null; isActive: boolean; createdAt: string; _count: { shipments: number } }
interface Route   { id: string; origin: string; destination: string; transitDays: number | null; isActive: boolean; createdAt: string }

const btn = (v: 'primary' | 'ghost' | 'danger' = 'ghost'): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8,
  fontSize: 13, fontFamily: FONT, fontWeight: 500, cursor: 'pointer', border: 'none',
  background: v === 'primary' ? DARK : v === 'danger' ? '#FEF2F2' : '#F1F5F9',
  color: v === 'primary' ? '#fff' : v === 'danger' ? '#EF4444' : '#374151',
})
const inp: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13, fontFamily: FONT, outline: 'none', boxSizing: 'border-box' }
const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#64748B', fontFamily: FONT, display: 'block', marginBottom: 4 }

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 26, width: 440, maxWidth: '95vw' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 16, color: DARK }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94A3B8' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function CarrierModal({ carrier, onClose, onSaved }: { carrier?: Carrier; onClose: () => void; onSaved: () => void }) {
  const [name, setName]       = useState(carrier?.name ?? '')
  const [contact, setContact] = useState(carrier?.contact ?? '')
  const [isActive, setActive] = useState(carrier?.isActive ?? true)
  const [saving, setSaving]   = useState(false)
  const save = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      const payload = { name: name.trim(), contact: contact.trim() || null, isActive }
      if (carrier) await api.patch(`/carriers/${carrier.id}`, payload)
      else await api.post('/carriers', payload)
      onSaved()
    } finally { setSaving(false) }
  }
  return (
    <Modal title={carrier ? 'Edit Carrier' : 'New Carrier'} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div><label style={lbl}>Carrier Name *</label><input style={inp} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Aramex, own driver" /></div>
        <div><label style={lbl}>Contact</label><input style={inp} value={contact} onChange={e => setContact(e.target.value)} placeholder="Phone or contact person" /></div>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontFamily: FONT, fontSize: 13, color: DARK }}>
          <input type="checkbox" checked={isActive} onChange={e => setActive(e.target.checked)} /> Active
        </label>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button style={btn('ghost')} onClick={onClose}>Cancel</button>
          <button style={btn('primary')} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </Modal>
  )
}

function RouteModal({ route, onClose, onSaved }: { route?: Route; onClose: () => void; onSaved: () => void }) {
  const [origin, setOrigin] = useState(route?.origin ?? '')
  const [dest, setDest]     = useState(route?.destination ?? '')
  const [days, setDays]     = useState(String(route?.transitDays ?? ''))
  const [isActive, setActive] = useState(route?.isActive ?? true)
  const [saving, setSaving] = useState(false)
  const save = async () => {
    if (!origin.trim() || !dest.trim()) return
    setSaving(true)
    try {
      const payload = { origin: origin.trim(), destination: dest.trim(), transitDays: days ? Number(days) : null, isActive }
      if (route) await api.patch(`/carriers/routes/${route.id}`, payload)
      else await api.post('/carriers/routes', payload)
      onSaved()
    } finally { setSaving(false) }
  }
  return (
    <Modal title={route ? 'Edit Route' : 'New Route'} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div><label style={lbl}>Origin *</label><input style={inp} value={origin} onChange={e => setOrigin(e.target.value)} placeholder="e.g. Al Quoz Warehouse" /></div>
        <div><label style={lbl}>Destination *</label><input style={inp} value={dest} onChange={e => setDest(e.target.value)} placeholder="e.g. Deira, Dubai" /></div>
        <div><label style={lbl}>Transit Days</label><input type="number" min={0} style={inp} value={days} onChange={e => setDays(e.target.value)} placeholder="e.g. 1" /></div>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontFamily: FONT, fontSize: 13, color: DARK }}>
          <input type="checkbox" checked={isActive} onChange={e => setActive(e.target.checked)} /> Active
        </label>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button style={btn('ghost')} onClick={onClose}>Cancel</button>
          <button style={btn('primary')} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </Modal>
  )
}

export function CarriersPage() {
  const [tab, setTab]         = useState<'carriers' | 'routes'>('carriers')
  const [carriers, setCarriers] = useState<Carrier[]>([])
  const [routes, setRoutes]   = useState<Route[]>([])
  const [loading, setLoading] = useState(true)
  const [carrierModal, setCarrierModal] = useState<{ open: boolean; edit?: Carrier }>({ open: false })
  const [routeModal, setRouteModal]     = useState<{ open: boolean; edit?: Route }>({ open: false })

  const load = async () => {
    setLoading(true)
    try {
      const [c, r] = await Promise.all([
        api.get<{ data: Carrier[] }>('/carriers?pageSize=200'),
        api.get<{ data: Route[] }>('/carriers/routes?pageSize=200'),
      ])
      setCarriers(c.data); setRoutes(r.data)
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const delCarrier = async (id: string) => { if (!confirm('Delete this carrier?')) return; try { await api.delete(`/carriers/${id}`); load() } catch (e: any) { alert(e.message ?? 'Cannot delete') } }
  const delRoute   = async (id: string) => { if (!confirm('Delete this route?')) return; try { await api.delete(`/carriers/routes/${id}`); load() } catch (e: any) { alert(e.message ?? 'Cannot delete') } }

  const carrierRows = carriers.map(r => ({
    name: <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 13 }}>{r.name}</span>,
    contact: r.contact ?? <span style={{ color: '#94A3B8', fontSize: 12 }}>—</span>,
    shipments: r._count.shipments,
    status: <Badge label={r.isActive ? 'Active' : 'Inactive'} color={r.isActive ? '#10B981' : '#64748B'} />,
    actions: (
      <div style={{ display: 'flex', gap: 6 }}>
        <button style={{ ...btn('ghost'), padding: '4px 10px', fontSize: 12 }} onClick={() => setCarrierModal({ open: true, edit: r })}>Edit</button>
        <button style={{ ...btn('danger'), padding: '4px 10px', fontSize: 12 }} onClick={() => delCarrier(r.id)}>Delete</button>
      </div>
    ),
  }))

  const routeRows = routes.map(r => ({
    route: <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 13 }}>{r.origin} → {r.destination}</span>,
    transit: r.transitDays != null ? `${r.transitDays} day${r.transitDays === 1 ? '' : 's'}` : <span style={{ color: '#94A3B8', fontSize: 12 }}>—</span>,
    status: <Badge label={r.isActive ? 'Active' : 'Inactive'} color={r.isActive ? '#10B981' : '#64748B'} />,
    actions: (
      <div style={{ display: 'flex', gap: 6 }}>
        <button style={{ ...btn('ghost'), padding: '4px 10px', fontSize: 12 }} onClick={() => setRouteModal({ open: true, edit: r })}>Edit</button>
        <button style={{ ...btn('danger'), padding: '4px 10px', fontSize: 12 }} onClick={() => delRoute(r.id)}>Delete</button>
      </div>
    ),
  }))

  return (
    <AdminLayout
      title="Carriers & Routes"
      actions={
        tab === 'carriers'
          ? <button style={btn('primary')} onClick={() => setCarrierModal({ open: true })}>+ New Carrier</button>
          : <button style={btn('primary')} onClick={() => setRouteModal({ open: true })}>+ New Route</button>
      }
    >
      <StatGrid>
        <StatCard label="Carriers"        value={String(carriers.length)}                                sub="All carriers" />
        <StatCard label="Active Carriers" value={String(carriers.filter(c => c.isActive).length)}         sub="In use"        color="#10B981" />
        <StatCard label="Routes"          value={String(routes.length)}                                   sub="Delivery routes" color="#8B5CF6" />
        <StatCard label="Shipments"       value={String(carriers.reduce((s, c) => s + c._count.shipments, 0))} sub="Total shipments" color="#1D4ED8" />
      </StatGrid>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        <button onClick={() => setTab('carriers')} style={{ padding: '6px 16px', borderRadius: 8, border: 'none', fontFamily: FONT, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: tab === 'carriers' ? DARK : '#F1F5F9', color: tab === 'carriers' ? '#fff' : '#64748B' }}>Carriers ({carriers.length})</button>
        <button onClick={() => setTab('routes')}   style={{ padding: '6px 16px', borderRadius: 8, border: 'none', fontFamily: FONT, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: tab === 'routes' ? DARK : '#F1F5F9', color: tab === 'routes' ? '#fff' : '#64748B' }}>Routes ({routes.length})</button>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
      ) : tab === 'carriers' ? (
        carriers.length === 0
          ? <div style={{ padding: 60, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>No carriers yet. Add your delivery companies or own drivers.</div>
          : <Table columns={[{ key: 'name', label: 'Carrier Name' }, { key: 'contact', label: 'Contact', width: 180 }, { key: 'shipments', label: 'Shipments', width: 100 }, { key: 'status', label: 'Status', width: 90 }, { key: 'actions', label: '', width: 150 }]} rows={carrierRows} />
      ) : (
        routes.length === 0
          ? <div style={{ padding: 60, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>No routes yet. Add the delivery routes you use.</div>
          : <Table columns={[{ key: 'route', label: 'Route' }, { key: 'transit', label: 'Transit Time', width: 130 }, { key: 'status', label: 'Status', width: 90 }, { key: 'actions', label: '', width: 150 }]} rows={routeRows} />
      )}

      {carrierModal.open && <CarrierModal carrier={carrierModal.edit} onClose={() => setCarrierModal({ open: false })} onSaved={() => { setCarrierModal({ open: false }); load() }} />}
      {routeModal.open   && <RouteModal   route={routeModal.edit}     onClose={() => setRouteModal({ open: false })}   onSaved={() => { setRouteModal({ open: false }); load() }} />}
    </AdminLayout>
  )
}
