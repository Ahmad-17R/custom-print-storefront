import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { AdminLayout, Table, SearchInput, Badge, StatCard, StatGrid } from '../components/AdminLayout'
import { api, catalogImageUrl } from '../../lib/api'
import { useAuth } from '../lib/AuthContext'
import { PrinterIcon, PencilIcon, PinIcon, BulbIcon, CheckIcon } from '../components/icons'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

type ShipStatus = 'pending' | 'dispatched' | 'in_transit' | 'delivered' | 'returned'
interface FreightCost { id: string; amount: string; currency: string; description?: string | null }
interface ShipOrder {
  id: string; orderNumber: string; contactName?: string | null; contactPhone?: string | null
  deliveryLine1?: string | null; deliveryLine2?: string | null; deliveryCity?: string | null
  deliveryEmirate?: string | null; deliveryCountry?: string | null; deliveryNotes?: string | null
  paymentStatus?: string | null; total: string | number; status: string
  designFileUrl?: string | null; designFileName?: string | null
  customer?: { fullName?: string | null; email?: string | null }
}
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

const esc = (v: unknown) => String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string))
const isPaid = (o: ShipOrder | null) => (o?.paymentStatus ?? '').toLowerCase() === 'paid'
const addressLines = (o: ShipOrder | null) =>
  [o?.deliveryLine1, o?.deliveryLine2, [o?.deliveryCity, o?.deliveryEmirate].filter(Boolean).join(', '), o?.deliveryCountry]
    .map(l => (l ?? '').trim()).filter(Boolean)

// Build a printable parcel label (payment status, special instructions, customer + address).
// Modern courier layout: dark header band, ship-to block, instructions alert, barcode, meta.
// The artwork/design-file block is a placeholder for a later change.
function buildLabelHtml(s: Shipment): string {
  const o = s.order
  const paid = isPaid(o)
  const name = o?.contactName ?? o?.customer?.fullName ?? o?.customer?.email ?? '—'
  const phone = o?.contactPhone ?? ''
  const instructions = (o?.deliveryNotes ?? '').trim()
  const addr = addressLines(o)
  const created = new Date(s.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const track = s.trackingNo || `SH-${s.id.slice(0, 8).toUpperCase()}`
  const designUrl = o?.designFileUrl ? catalogImageUrl(o.designFileUrl) : ''
  const designIsPdf = (o?.designFileName ?? o?.designFileUrl ?? '').toLowerCase().endsWith('.pdf')
  const designArt = designUrl
    ? (designIsPdf
        ? `<div class="art"><span class="pdf">Design: ${esc(o?.designFileName ?? 'artwork.pdf')}</span></div>`
        : `<div class="art"><img src="${esc(designUrl)}" alt="design"></div>`)
    : `<div class="art empty">No design file attached</div>`
  return `<!doctype html><html><head><meta charset="utf-8"><title>Label ${esc(o?.orderNumber ?? '')}</title>
<style>
  @page { size: 100mm 150mm; margin: 0 }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact }
  html, body { margin: 0 }
  body { font-family: 'Poppins', system-ui, -apple-system, 'Segoe UI', Arial, sans-serif; color: #0F172A; background: #fff }
  .label { width: 100mm; height: 150mm; display: flex; flex-direction: column; border: 1px solid #0F172A; overflow: hidden }
  /* header */
  .head { background: #0F172A; color: #fff; padding: 4.5mm 6mm; display: flex; justify-content: space-between; align-items: center }
  .brand { font-size: 15px; font-weight: 800; letter-spacing: .3px }
  .brand small { display: block; font-size: 8.5px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; color: #94A3B8; margin-top: 1px }
  .pill { padding: 4px 11px; border-radius: 999px; font-size: 12px; font-weight: 800; letter-spacing: .3px; white-space: nowrap }
  .pill.paid { background: #10B981; color: #04231A }
  .pill.cod  { background: #FBBF24; color: #422006 }
  /* order strip */
  .strip { display: flex; border-bottom: 1px solid #E5E7EB }
  .strip > div { flex: 1; padding: 2.6mm 6mm }
  .strip > div + div { border-left: 1px solid #E5E7EB; text-align: right }
  .k { font-size: 8px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #94A3B8 }
  .v { font-size: 12px; font-weight: 700; margin-top: 1px }
  /* body */
  .body { flex: 1; padding: 4.5mm 6mm; display: flex; flex-direction: column }
  .cap { font-size: 8.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #94A3B8 }
  .name { font-size: 21px; font-weight: 800; line-height: 1.05; margin-top: 1.5mm }
  .phone { font-size: 15px; font-weight: 700; margin-top: 1mm; letter-spacing: .3px }
  .addr { font-size: 13px; line-height: 1.45; margin-top: 1.5mm; color: #1F2937 }
  .instr { margin-top: 3.5mm; display: flex; gap: 2.5mm; padding: 3mm; background: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 4px }
  .instr .ic { font-size: 15px; line-height: 1 }
  .instr .tx { font-size: 12.5px; font-weight: 600; line-height: 1.35; color: #422006 }
  .instr .cap { color: #92400E; margin-bottom: 1mm }
  .art { margin-top: 3.5mm; flex: 1; min-height: 18mm; border: 1px solid #E5E7EB; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #94A3B8; font-size: 10px; overflow: hidden; background: #F8FAFC }
  .art.empty { border-style: dashed }
  .art img { width: 100%; height: 100%; object-fit: contain }
  .art .cap { position: absolute; margin: 1.5mm }
  .artwrap { position: relative; flex: 1; display: flex; margin-top: 3.5mm }
  .pdf { font-size: 11px; font-weight: 700; color: #DC2626 }
  /* barcode footer */
  .foot { border-top: 1px solid #E5E7EB; padding: 3mm 6mm 4mm }
  .meta { display: flex; justify-content: space-between; font-size: 10.5px; color: #64748B; margin-bottom: 2mm }
  .meta b { color: #0F172A; font-weight: 700 }
  .track { display: flex; align-items: baseline; gap: 3mm; margin-top: 1mm }
  .track .k { font-size: 8.5px }
  .code { font-family: 'SF Mono', ui-monospace, Menlo, monospace; font-size: 15px; font-weight: 700; letter-spacing: 2px }
</style></head><body>
<div class="label">
  <div class="head">
    <div class="brand">MyPrintingWorld<small>Print &amp; Delivery</small></div>
    <div class="pill ${paid ? 'paid' : 'cod'}">${paid ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px"><path d="M20 6 9 17l-5-5"/></svg> PAID' : `COD · AED ${fmt(Number(o?.total ?? 0))}`}</div>
  </div>
  <div class="strip">
    <div><div class="k">Order</div><div class="v">${esc(o?.orderNumber ?? '—')}</div></div>
    <div><div class="k">Date</div><div class="v">${esc(created)}</div></div>
  </div>
  <div class="body">
    <div class="cap">Ship to</div>
    <div class="name">${esc(name)}</div>
    ${phone ? `<div class="phone">${esc(phone)}</div>` : ''}
    <div class="addr">${addr.length ? addr.map(esc).join('<br>') : '<span style="color:#94A3B8">No address on file</span>'}</div>
    ${instructions ? `<div class="instr"><div class="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#92400E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 1.8 18a1.7 1.7 0 0 0 1.5 2.5h17.4a1.7 1.7 0 0 0 1.5-2.5L13.7 3.9a1.7 1.7 0 0 0-3 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg></div><div><div class="cap">Delivery instructions</div><div class="tx">${esc(instructions)}</div></div></div>` : ''}
    ${designArt}
  </div>
  <div class="foot">
    <div class="meta"><span>Carrier · <b>${esc(carrierLabel(s))}</b></span><span>${esc(routeLabel(s))}</span></div>
    <div class="track"><span class="k">Tracking</span><span class="code">${esc(track)}</span></div>
  </div>
</div>
<script>window.onload=function(){window.print()}</script>
</body></html>`
}

function printLabel(s: Shipment) {
  const w = window.open('', '_blank', 'width=420,height=640')
  if (!w) { alert('Please allow pop-ups to print the parcel label.'); return }
  w.document.write(buildLabelHtml(s))
  w.document.close()
}

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

function ShipmentModal({ carriers, routes, initialOrderId, onClose, onSaved }: { carriers: Carrier[]; routes: Route[]; initialOrderId?: string; onClose: () => void; onSaved: () => void }) {
  const [orders, setOrders] = useState<ShipOrder[]>([])
  const [orderId, setOrderId] = useState(initialOrderId ?? '')
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

const STATUS_OPTIONS: ShipStatus[] = ['pending', 'dispatched', 'in_transit', 'delivered', 'returned']

function EditShipmentModal({ shipment, carriers, routes, onClose, onSaved }: { shipment: Shipment; carriers: Carrier[]; routes: Route[]; onClose: () => void; onSaved: () => void }) {
  const [carrierId, setCarrierId] = useState(shipment.carrier?.id ?? '')
  const [routeId, setRouteId] = useState(shipment.route?.id ?? '')
  const [status, setStatus] = useState<ShipStatus>(shipment.status)
  const [tracking, setTracking] = useState(shipment.trackingNo ?? '')
  const [notes, setNotes] = useState(shipment.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const save = async () => {
    setSaving(true); setErr('')
    try {
      await api.patch(`/shipments/${shipment.id}`, {
        carrierId: carrierId || null,
        routeId: routeId || null,
        status,
        trackingNo: tracking.trim() || null,
        notes: notes.trim() || null,
      })
      onSaved()
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Could not update shipment') }
    finally { setSaving(false) }
  }

  return (
    <Modal title={`Edit Shipment · ${shipment.order?.orderNumber ?? ''}`} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div><label style={lbl}>Carrier / Rider</label>
          <select style={inp} value={carrierId} onChange={e => setCarrierId(e.target.value)}>
            <option value="">— Unassigned —</option>
            {carriers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div><label style={lbl}>Route</label>
          <select style={inp} value={routeId} onChange={e => setRouteId(e.target.value)}>
            <option value="">— None —</option>
            {routes.map(r => <option key={r.id} value={r.id}>{r.origin} → {r.destination}</option>)}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={lbl}>Status</label>
            <select style={inp} value={status} onChange={e => setStatus(e.target.value as ShipStatus)}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          </div>
          <div><label style={lbl}>Tracking #</label><input style={inp} value={tracking} onChange={e => setTracking(e.target.value)} /></div>
        </div>
        <div><label style={lbl}>Notes</label><input style={inp} value={notes} onChange={e => setNotes(e.target.value)} /></div>
        {err && <div style={{ color: '#EF4444', fontSize: 12 }}>{err}</div>}
        <div style={{ fontSize: 11, color: '#94A3B8' }}>Editing status here does not re-post journals. Marking “Delivered” also closes the linked order only via the “Mark Delivered” action.</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button style={btn('ghost')} onClick={onClose}>Cancel</button>
          <button style={btn('primary')} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
        </div>
      </div>
    </Modal>
  )
}

interface LocGroupOrder {
  id: string; orderNumber: string; status: string; total: string | number; createdAt: string
  contactName?: string | null; contactPhone?: string | null; deliveryLine1?: string | null
  deliveryCity?: string | null; deliveryEmirate?: string | null
  customer?: { fullName?: string | null; email?: string | null }
}
interface LocGroup { key: string; city: string; emirate: string; total: number; ready: number; inProgress: number; orders: LocGroupOrder[] }

const ORDER_STATUS_LABEL: Record<string, string> = { confirmed: 'Confirmed', in_production: 'In Production', ready: 'Ready to ship' }
const ORDER_STATUS_COLOR: Record<string, string> = { confirmed: '#64748B', in_production: '#F59E0B', ready: '#10B981' }

// "Ship by location": clusters of un-shipped orders going to the same city, so the admin can
// consolidate a delivery and save freight. Ready orders get a Ship button; the group flags how
// many others are still in production (worth waiting for one trip).
function LocationGroups({ onShip, onOpen }: { onShip: (orderId: string) => void; onOpen: (orderId: string) => void }) {
  const [groups, setGroups] = useState<LocGroup[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    api.get<{ data: LocGroup[] }>('/shipments/location-groups').then(r => setGroups(r.data)).catch(() => setGroups([])).finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
  if (!groups.length) return <div style={{ padding: 60, textAlign: 'center', color: '#94A3B8', fontFamily: FONT, border: '2px dashed #E2E8F0', borderRadius: 12 }}>No un-shipped orders right now.</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {groups.map(g => {
        const consolidate = g.total > 1
        return (
          <div key={g.key} style={{ border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: consolidate ? '#F0F9FF' : '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: FONT, fontWeight: 700, fontSize: 15, color: DARK }}><PinIcon style={{ color: '#0369A1' }} /> {g.city}{g.emirate && g.emirate !== g.city ? `, ${g.emirate}` : ''}</span>
              <span style={{ fontFamily: FONT, fontSize: 12, color: '#64748B' }}>{g.total} order{g.total > 1 ? 's' : ''}</span>
              <span style={{ display: 'inline-flex', gap: 6 }}>
                {g.ready > 0 && <Badge label={`${g.ready} ready`} color="#10B981" />}
                {g.inProgress > 0 && <Badge label={`${g.inProgress} in progress`} color="#F59E0B" />}
              </span>
              {consolidate && g.ready > 0 && g.inProgress > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 'auto', fontFamily: FONT, fontSize: 12, color: '#0369A1', fontWeight: 600 }}><BulbIcon /> {g.inProgress} more coming here — wait to ship together &amp; save freight</span>
              )}
              {consolidate && g.ready > 1 && g.inProgress === 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 'auto', fontFamily: FONT, fontSize: 12, color: '#047857', fontWeight: 600 }}><CheckIcon /> {g.ready} ready to the same city — send on one trip</span>
              )}
            </div>
            <div>
              {g.orders.map((o, i) => {
                const who = o.contactName ?? o.customer?.fullName ?? o.customer?.email ?? 'Online'
                const inProgress = o.status !== 'ready'
                return (
                  <div key={o.id} onClick={inProgress ? () => onOpen(o.id) : undefined}
                    title={inProgress ? 'Open in Order Handling' : undefined}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderTop: i ? '1px solid #F1F5F9' : 'none', cursor: inProgress ? 'pointer' : 'default' }}>
                    <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 13, color: inProgress ? '#2563EB' : DARK, width: 170, textDecoration: inProgress ? 'underline' : 'none' }}>{o.orderNumber}</span>
                    <span style={{ fontFamily: FONT, fontSize: 13, color: '#374151', flex: 1 }}>{who}{o.contactPhone ? ` · ${o.contactPhone}` : ''}</span>
                    <Badge label={ORDER_STATUS_LABEL[o.status] ?? o.status} color={ORDER_STATUS_COLOR[o.status] ?? '#64748B'} />
                    <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 13, width: 90, textAlign: 'right' }}>AED {fmt(Number(o.total))}</span>
                    {o.status === 'ready'
                      ? <button style={{ ...btn('success'), padding: '5px 12px', fontSize: 12 }} onClick={e => { e.stopPropagation(); onShip(o.id) }}>Ship →</button>
                      : <span style={{ fontFamily: FONT, fontSize: 11, color: '#2563EB', width: 70, textAlign: 'center', fontWeight: 600 }}>Open →</span>}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function ShipmentsPage() {
  const [data, setData] = useState<Shipment[]>([])
  const [carriers, setCarriers] = useState<Carrier[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [tab, setTab] = useState<'active' | 'history' | 'location'>('active')
  const [showNew, setNew] = useState(false)
  const [editing, setEditing] = useState<Shipment | null>(null)
  const [busyId, setBusyId] = useState('')
  const { can } = useAuth()
  const canEdit = can('feature.edit_shipment')
  const navigate = useNavigate()
  const openHandling = (orderId: string) => navigate(`/admin/online-order-handling?order=${orderId}`)
  const [params, setParams] = useSearchParams()
  // Deep-link from Order Handling: /admin/shipments?newOrder=<id> opens the New Shipment
  // modal with that order pre-selected.
  const newOrderId = params.get('newOrder') ?? ''
  useEffect(() => { if (newOrderId) setNew(true) }, [newOrderId])
  const closeNew = () => { setNew(false); if (newOrderId) setParams(p => { const n = new URLSearchParams(p); n.delete('newOrder'); return n }, { replace: true }) }

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
    order: r.order
      ? <span onClick={() => openHandling(r.order!.id)} title="Open in Order Handling" style={{ fontWeight: 600, color: '#2563EB', cursor: 'pointer', textDecoration: 'underline' }}>{r.order.orderNumber}</span>
      : <span style={{ color: '#94A3B8' }}>—</span>,
    customer: r.order?.contactName ?? r.order?.customer?.fullName ?? r.order?.customer?.email ?? '—',
    carrier: carrierLabel(r),
    route: routeLabel(r),
    price: <span style={{ fontWeight: 600 }}>AED {fmt(price(r))}</span>,
    status: <Badge label={STATUS_LABEL[r.status]} color={STATUS_COLOR[r.status]} />,
    action: (
      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
        <button style={{ ...btn('ghost'), padding: '5px 10px', fontSize: 12 }} onClick={() => printLabel(r)} title="Print parcel label"><PrinterIcon /> Label</button>
        {canEdit && <button style={{ ...btn('ghost'), padding: '5px 10px', fontSize: 12 }} onClick={() => setEditing(r)} title="Edit shipment"><PencilIcon /> Edit</button>}
        {isActive(r)
          ? <button style={{ ...btn('success'), padding: '5px 12px', fontSize: 12 }} disabled={busyId === r.id} onClick={() => markDelivered(r.id)}>{busyId === r.id ? '…' : 'Mark Delivered'}</button>
          : <span style={{ fontSize: 12, color: '#94A3B8' }}>{r.deliveredAt ? new Date(r.deliveredAt).toLocaleDateString() : ''}</span>}
      </div>
    ),
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
        {(['active', 'history', 'location'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 16px', borderRadius: 20, fontSize: 12, fontFamily: FONT, fontWeight: 600, cursor: 'pointer', border: '1px solid #E2E8F0', background: tab === t ? DARK : '#fff', color: tab === t ? '#fff' : '#64748B' }}>
            {t === 'active' ? `Out for Delivery (${active.length})` : t === 'history' ? `History (${data.length - active.length})` : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><PinIcon /> Ship by Location</span>}
          </button>
        ))}
      </div>

      {tab === 'location' ? <LocationGroups onShip={id => setParams(p => { const n = new URLSearchParams(p); n.set('newOrder', id); return n }, { replace: true })} onOpen={openHandling} />
        : loading ? <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
        : filtered.length === 0 ? <div style={{ padding: 60, textAlign: 'center', color: '#94A3B8', fontFamily: FONT, border: '2px dashed #E2E8F0', borderRadius: 12 }}>{tab === 'active' ? 'No shipments out for delivery. Click “+ New Shipment”.' : 'No delivered shipments yet.'}</div>
        : <Table columns={[
            { key: 'order', label: 'Order', width: 150 }, { key: 'customer', label: 'Customer' },
            { key: 'carrier', label: 'Carrier / Rider', width: 170 }, { key: 'route', label: 'Route', width: 190 },
            { key: 'price', label: 'Price', width: 110 }, { key: 'status', label: 'Status', width: 140 },
            { key: 'action', label: '', width: 280 },
          ]} rows={rows} />}

      {showNew && <ShipmentModal carriers={carriers} routes={routes} initialOrderId={newOrderId || undefined} onClose={closeNew} onSaved={() => { closeNew(); load() }} />}
      {editing && canEdit && <EditShipmentModal shipment={editing} carriers={carriers} routes={routes} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load() }} />}
    </AdminLayout>
  )
}
