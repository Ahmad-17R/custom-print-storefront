import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { supabase } from '../../lib/supabase'
import {
  fetchCustomerProfile, updateCustomerProfile, fetchCustomerOrders,
  addCustomerAddress, updateCustomerAddress, deleteCustomerAddress,
  type CustomerProfile, type CustomerAddress, type AddressInput, type CustomerOrder,
} from '../../lib/api'
import { orderToCartItems } from '../lib/reorder'

const BLUE = '#1D4ED8'
const money = (v: string | number) => `AED ${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
const STATUS_COLOR: Record<string, string> = { pending: '#D97706', confirmed: '#1D4ED8', in_production: '#7C3AED', ready: '#059669', out_for_delivery: '#F59E0B', delivered: '#047857', cancelled: '#DC2626', refunded: '#DC2626' }
const NAV: { id: Tab; label: string; icon: string }[] = [
  { id: 'overview',  label: 'Overview',        icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { id: 'orders',    label: 'My Orders',       icon: 'M3 6l1 12h16l1-12H3zM8 6V4a2 2 0 014 0v2' },
  { id: 'addresses', label: 'Saved Addresses', icon: 'M12 11a3 3 0 100-6 3 3 0 000 6zM12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z' },
  { id: 'profile',   label: 'Profile',         icon: 'M12 12a5 5 0 100-10 5 5 0 000 10zM3 22a9 9 0 0118 0' },
]
const EMIRATES = ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah']

const input: React.CSSProperties = { width: '100%', padding: '9px 11px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', outline: 'none', fontFamily: 'system-ui' }
const label: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }
const card: React.CSSProperties = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 22 }
const btn = (primary = true): React.CSSProperties => ({ padding: '9px 18px', borderRadius: 8, border: primary ? 'none' : '1px solid #E2E8F0', background: primary ? BLUE : '#fff', color: primary ? '#fff' : '#334155', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'system-ui' })

type Tab = 'overview' | 'orders' | 'addresses' | 'profile'

export function AccountPage() {
  const { session, user, signOut } = useAuth()
  const token = session?.access_token
  const [params, setParams] = useSearchParams()
  const tab = (['overview', 'orders', 'addresses', 'profile'].includes(params.get('tab') ?? '') ? params.get('tab') : 'overview') as Tab
  const setTab = (t: Tab) => setParams(p => { const n = new URLSearchParams(p); n.set('tab', t); return n }, { replace: true })
  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) { setLoading(false); return }
    Promise.all([
      fetchCustomerProfile(token).then(setProfile),
      fetchCustomerOrders(token).then(setOrders).catch(() => {}),
    ]).catch(e => setError(e instanceof Error ? e.message : 'Could not load')).finally(() => setLoading(false))
  }, [token])

  if (!session) return (
    <div className="storefront-order-flow" style={{ minHeight: '65vh', display: 'grid', placeItems: 'center', fontFamily: 'system-ui' }}>
      <Link to="/login" state={{ from: '/account' }}>Sign in to view your dashboard</Link>
    </div>
  )

  const initials = (user?.user_metadata?.full_name ?? user?.email ?? '?').toString().trim()[0]?.toUpperCase() ?? '?'

  return (
    <div className="storefront-order-flow" style={{ minHeight: '100vh', background: '#F1F5F9', fontFamily: 'system-ui' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '28px 20px', display: 'grid', gridTemplateColumns: 'minmax(0, 240px) 1fr', gap: 24, alignItems: 'start' }}>
        {/* Sidebar */}
        <aside style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: 16, position: 'sticky', top: 20 }}>
          <div style={{ display: 'flex', gap: 11, alignItems: 'center', padding: '4px 6px 14px', borderBottom: '1px solid #F1F5F9', marginBottom: 10 }}>
            <span style={{ width: 42, height: 42, borderRadius: '50%', background: BLUE, color: '#fff', fontSize: 18, fontWeight: 700, display: 'grid', placeItems: 'center' }}>{initials}</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile?.fullName ?? 'My account'}</div>
              <div style={{ fontSize: 12, color: '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
            </div>
          </div>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setTab(n.id)} style={{ display: 'flex', alignItems: 'center', gap: 11, width: '100%', textAlign: 'left', padding: '10px 12px', marginBottom: 3, borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'system-ui', background: tab === n.id ? '#EFF6FF' : 'transparent', color: tab === n.id ? BLUE : '#475569' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={n.icon} /></svg>
              {n.label}
            </button>
          ))}
          <button onClick={() => { signOut(); }} style={{ display: 'flex', alignItems: 'center', gap: 11, width: '100%', textAlign: 'left', padding: '10px 12px', marginTop: 6, borderTop: '1px solid #F1F5F9', borderRadius: 0, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#DC2626', fontFamily: 'system-ui' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" /></svg>
            Sign out
          </button>
        </aside>

        {/* Main */}
        <main style={{ minWidth: 0 }}>
          {loading ? <div style={{ ...card, color: '#64748B' }}>Loading…</div>
            : error ? <div style={{ ...card, color: '#B91C1C' }}>{error}</div>
            : tab === 'overview'  ? <OverviewTab profile={profile} orders={orders} onGo={setTab} />
            : tab === 'orders'    ? <OrdersTab orders={orders} />
            : tab === 'addresses' && profile ? <AddressesTab token={token!} profile={profile} onChange={setProfile} />
            : tab === 'profile'   && profile ? <div style={{ display: 'grid', gap: 20 }}><ProfileTab token={token!} profile={profile} onSaved={setProfile} /><PasswordTab /></div>
            : null}
        </main>
      </div>
    </div>
  )
}

function StatCard({ label, value, color = '#0F172A' }: { label: string; value: string | number; color?: string }) {
  return <div style={{ ...card, padding: 18 }}><div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>{label}</div><div style={{ fontSize: 24, fontWeight: 800, color, marginTop: 4 }}>{value}</div></div>
}

const ACTIVE = new Set(['pending', 'confirmed', 'in_production', 'ready', 'out_for_delivery'])

function OverviewTab({ profile, orders, onGo }: { profile: CustomerProfile | null; orders: CustomerOrder[]; onGo: (t: Tab) => void }) {
  const active = orders.filter(o => ACTIVE.has(o.status)).length
  const spent = orders.filter(o => !['cancelled', 'refunded'].includes(o.status)).reduce((s, o) => s + Number(o.total), 0)
  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div>
        <h1 style={{ fontSize: 24, margin: '0 0 4px' }}>Welcome back{profile?.fullName ? `, ${profile.fullName.split(' ')[0]}` : ''} 👋</h1>
        <p style={{ color: '#64748B', margin: 0, fontSize: 14 }}>Here's a quick look at your account.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
        <StatCard label="Total orders" value={orders.length} />
        <StatCard label="In progress" value={active} color="#7C3AED" />
        <StatCard label="Total spent" value={money(spent)} color="#059669" />
        <StatCard label="Saved addresses" value={profile?.addresses.length ?? 0} color={BLUE} />
      </div>
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontSize: 16, margin: 0 }}>Recent orders</h2>
          <button onClick={() => onGo('orders')} style={{ ...btn(false), padding: '6px 12px', fontSize: 13 }}>View all →</button>
        </div>
        {orders.length === 0 ? <div style={{ color: '#94A3B8', fontSize: 14, padding: '10px 0' }}>You haven't placed any orders yet. <Link to="/catalog" style={{ color: BLUE }}>Start shopping →</Link></div>
          : orders.slice(0, 4).map(o => <OrderRow key={o.id} order={o} />)}
      </div>
    </div>
  )
}

function OrdersTab({ orders }: { orders: CustomerOrder[] }) {
  const [filter, setFilter] = useState('all')
  const shown = orders.filter(o => filter === 'all' || (filter === 'active' ? ACTIVE.has(o.status) : o.status === filter))
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>My Orders</h1>
        <Link to="/catalog" style={{ ...btn(), textDecoration: 'none' }}>+ New order</Link>
      </div>
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
        {['all', 'active', 'delivered', 'cancelled'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: '7px 14px', borderRadius: 20, border: '1px solid #E2E8F0', background: filter === f ? BLUE : '#fff', color: filter === f ? '#fff' : '#475569', textTransform: 'capitalize', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>{f}</button>
        ))}
      </div>
      {shown.length === 0 ? <div style={{ ...card, textAlign: 'center', color: '#64748B', padding: 40 }}>No orders here yet.</div>
        : <div style={{ display: 'grid', gap: 10 }}>{shown.map(o => <OrderRow key={o.id} order={o} detailed />)}</div>}
    </div>
  )
}

function OrderRow({ order, detailed }: { order: CustomerOrder; detailed?: boolean }) {
  const { addItem } = useCart()
  const navigate = useNavigate()
  const [msg, setMsg] = useState('')
  const reorder = () => {
    const { items, skipped } = orderToCartItems(order)
    if (!items.length) { setMsg('These products are no longer available'); return }
    items.forEach(addItem)
    if (skipped > 0) setMsg(`${skipped} item(s) unavailable — added the rest`)
    navigate('/cart')
  }
  return (
    <div style={{ border: '1px solid #E2E8F0', borderRadius: 11, padding: detailed ? 16 : '11px 4px', background: detailed ? '#fff' : 'transparent', borderWidth: detailed ? 1 : 0, borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 9, alignItems: 'center', flexWrap: 'wrap' }}>
          <strong style={{ fontSize: 14 }}>{order.orderNumber}</strong>
          <span style={{ color: STATUS_COLOR[order.status] ?? '#64748B', fontSize: 11, fontWeight: 800, textTransform: 'capitalize' }}>{order.status.replaceAll('_', ' ')}</span>
        </div>
        <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>{new Date(order.createdAt).toLocaleDateString()} · {order.items.map(i => `${i.productName}×${i.quantity}`).join(', ')}</div>
        {msg && <div style={{ fontSize: 11, color: '#D97706', marginTop: 4 }}>{msg}</div>}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <strong style={{ fontSize: 14 }}>{money(order.total)}</strong>
        <Link to={`/orders/${order.id}`} style={{ ...btn(false), padding: '6px 12px', fontSize: 12, textDecoration: 'none' }}>View</Link>
        <button onClick={reorder} style={{ ...btn(), padding: '6px 12px', fontSize: 12 }}>Reorder</button>
      </div>
    </div>
  )
}

function ProfileTab({ token, profile, onSaved }: { token: string; profile: CustomerProfile; onSaved: (p: CustomerProfile) => void }) {
  const [fullName, setFullName] = useState(profile.fullName ?? '')
  const [phone, setPhone] = useState(profile.phone ?? '')
  const [companyName, setCompanyName] = useState(profile.companyName ?? '')
  const [trn, setTrn] = useState(profile.trn ?? '')
  const [corporateTaxNumber, setCorporateTaxNumber] = useState(profile.corporateTaxNumber ?? '')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const save = async () => {
    setSaving(true); setMsg('')
    try { onSaved(await updateCustomerProfile(token, { fullName, phone, companyName, trn, corporateTaxNumber })); setMsg('Saved ✓') }
    catch (e: unknown) { setMsg(e instanceof Error ? e.message : 'Save failed') }
    finally { setSaving(false) }
  }

  return (
    <div style={card}>
      <label style={{ display: 'block', marginBottom: 14 }}><span style={label}>Full name</span><input style={input} value={fullName} onChange={e => setFullName(e.target.value)} /></label>
      <label style={{ display: 'block', marginBottom: 14 }}><span style={label}>Email</span><input style={{ ...input, background: '#F8FAFC', color: '#94A3B8' }} value={profile.email} disabled /></label>
      <label style={{ display: 'block', marginBottom: 14 }}><span style={label}>Phone</span><input style={input} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+971 5X XXX XXXX" /></label>
      <label style={{ display: 'block', marginBottom: 14 }}><span style={label}>Company (optional)</span><input style={input} value={companyName} onChange={e => setCompanyName(e.target.value)} /></label>
      <label style={{ display: 'block', marginBottom: 6 }}><span style={label}>TRN — Tax Registration Number</span><input style={input} maxLength={15} value={trn} onChange={e => setTrn(e.target.value)} placeholder="15 characters (for your VAT invoices)" /></label>
      <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 14 }}>Add your TRN and Corporate Tax number so they appear on your invoices and statements.</div>
      <label style={{ display: 'block', marginBottom: 18 }}><span style={label}>Corporate Tax Number (optional)</span><input style={input} value={corporateTaxNumber} onChange={e => setCorporateTaxNumber(e.target.value)} placeholder="e.g. CT1234567890" /></label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button style={btn()} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
        {msg && <span style={{ fontSize: 13, color: msg.includes('✓') ? '#059669' : '#DC2626' }}>{msg}</span>}
      </div>
    </div>
  )
}

const emptyAddress: AddressInput = { label: 'Home', line1: '', line2: '', city: '', emirate: 'Dubai', isDefault: false }

function AddressesTab({ token, profile, onChange }: { token: string; profile: CustomerProfile; onChange: (p: CustomerProfile) => void }) {
  const [editing, setEditing] = useState<AddressInput & { id?: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const refresh = async () => onChange(await fetchCustomerProfile(token))

  const save = async () => {
    if (!editing) return
    if (!editing.line1.trim() || !editing.city.trim()) return setErr('Address line and city are required')
    setBusy(true); setErr('')
    try {
      const body: AddressInput = { label: editing.label, line1: editing.line1, line2: editing.line2, city: editing.city, emirate: editing.emirate, isDefault: editing.isDefault }
      if (editing.id) await updateCustomerAddress(token, editing.id, body)
      else await addCustomerAddress(token, body)
      await refresh(); setEditing(null)
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Save failed') }
    finally { setBusy(false) }
  }

  const remove = async (id: string) => {
    if (!window.confirm('Delete this address?')) return
    await deleteCustomerAddress(token, id); await refresh()
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {profile.addresses.length === 0 && !editing && <div style={{ ...card, color: '#64748B', textAlign: 'center' }}>No saved addresses yet.</div>}

      {profile.addresses.map((a: CustomerAddress) => (
        <div key={a.id} style={{ ...card, display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ fontWeight: 700, display: 'flex', gap: 8, alignItems: 'center' }}>
              {a.label}{a.isDefault && <span style={{ fontSize: 10, fontWeight: 800, color: BLUE, border: `1px solid ${BLUE}`, borderRadius: 4, padding: '1px 6px' }}>DEFAULT</span>}
            </div>
            <div style={{ fontSize: 13, color: '#475569', marginTop: 5 }}>{a.line1}{a.line2 ? `, ${a.line2}` : ''}<br />{a.city}, {a.emirate}, {a.country}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
            <button style={{ ...btn(false), padding: '5px 12px', fontSize: 12 }} onClick={() => setEditing({ id: a.id, label: a.label, line1: a.line1, line2: a.line2 ?? '', city: a.city, emirate: a.emirate, isDefault: a.isDefault })}>Edit</button>
            <button style={{ background: 'transparent', border: 'none', color: '#DC2626', fontSize: 12, cursor: 'pointer' }} onClick={() => remove(a.id)}>Delete</button>
          </div>
        </div>
      ))}

      {editing ? (
        <div style={card}>
          <h3 style={{ margin: '0 0 14px', fontSize: 15 }}>{editing.id ? 'Edit address' : 'New address'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <label><span style={label}>Label</span><input style={input} value={editing.label} onChange={e => setEditing({ ...editing, label: e.target.value })} placeholder="Home / Office" /></label>
            <label><span style={label}>Emirate</span><select style={input} value={editing.emirate} onChange={e => setEditing({ ...editing, emirate: e.target.value })}>{EMIRATES.map(em => <option key={em} value={em}>{em}</option>)}</select></label>
          </div>
          <label style={{ display: 'block', marginBottom: 12 }}><span style={label}>Address line 1 *</span><input style={input} value={editing.line1} onChange={e => setEditing({ ...editing, line1: e.target.value })} /></label>
          <label style={{ display: 'block', marginBottom: 12 }}><span style={label}>Address line 2</span><input style={input} value={editing.line2 ?? ''} onChange={e => setEditing({ ...editing, line2: e.target.value })} /></label>
          <label style={{ display: 'block', marginBottom: 12 }}><span style={label}>City / Area *</span><input style={input} value={editing.city} onChange={e => setEditing({ ...editing, city: e.target.value })} /></label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16, fontSize: 13, cursor: 'pointer' }}><input type="checkbox" checked={!!editing.isDefault} onChange={e => setEditing({ ...editing, isDefault: e.target.checked })} />Set as default address</label>
          {err && <div style={{ color: '#DC2626', fontSize: 13, marginBottom: 12 }}>{err}</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={btn()} onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save address'}</button>
            <button style={btn(false)} onClick={() => { setEditing(null); setErr('') }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button style={{ ...btn(false), justifySelf: 'start' }} onClick={() => setEditing({ ...emptyAddress })}>+ Add address</button>
      )}
    </div>
  )
}

function PasswordTab() {
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const save = async () => {
    if (pw.length < 6) return setMsg('Password must be at least 6 characters')
    if (pw !== confirm) return setMsg('Passwords do not match')
    setBusy(true); setMsg('')
    const { error } = await supabase.auth.updateUser({ password: pw })
    setBusy(false)
    if (error) return setMsg(error.message)
    setPw(''); setConfirm(''); setMsg('Password updated ✓')
  }

  return (
    <div style={card}>
      <label style={{ display: 'block', marginBottom: 14 }}><span style={label}>New password</span><input type="password" style={input} value={pw} onChange={e => setPw(e.target.value)} /></label>
      <label style={{ display: 'block', marginBottom: 18 }}><span style={label}>Confirm new password</span><input type="password" style={input} value={confirm} onChange={e => setConfirm(e.target.value)} /></label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button style={btn()} onClick={save} disabled={busy}>{busy ? 'Updating…' : 'Update password'}</button>
        {msg && <span style={{ fontSize: 13, color: msg.includes('✓') ? '#059669' : '#DC2626' }}>{msg}</span>}
      </div>
    </div>
  )
}
