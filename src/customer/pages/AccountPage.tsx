import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import {
  fetchCustomerProfile, updateCustomerProfile,
  addCustomerAddress, updateCustomerAddress, deleteCustomerAddress,
  type CustomerProfile, type CustomerAddress, type AddressInput,
} from '../../lib/api'

const BLUE = '#1D4ED8'
const EMIRATES = ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah']

const input: React.CSSProperties = { width: '100%', padding: '9px 11px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', outline: 'none', fontFamily: 'system-ui' }
const label: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }
const card: React.CSSProperties = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 22 }
const btn = (primary = true): React.CSSProperties => ({ padding: '9px 18px', borderRadius: 8, border: primary ? 'none' : '1px solid #E2E8F0', background: primary ? BLUE : '#fff', color: primary ? '#fff' : '#334155', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'system-ui' })

type Tab = 'profile' | 'addresses' | 'password'

export function AccountPage() {
  const { session, user } = useAuth()
  const token = session?.access_token
  const [tab, setTab] = useState<Tab>('profile')
  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) { setLoading(false); return }
    fetchCustomerProfile(token).then(setProfile).catch(e => setError(e instanceof Error ? e.message : 'Could not load')).finally(() => setLoading(false))
  }, [token])

  if (!session) return (
    <div className="storefront-order-flow" style={{ minHeight: '65vh', display: 'grid', placeItems: 'center', fontFamily: 'system-ui' }}>
      <Link to="/login" state={{ from: '/account' }}>Sign in to manage your account</Link>
    </div>
  )

  return (
    <div className="storefront-order-flow" style={{ minHeight: '100vh', background: '#F8FAFC', padding: '36px 20px', fontFamily: 'system-ui' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <h1 style={{ fontSize: 27, margin: '0 0 4px' }}>My Account</h1>
        <p style={{ color: '#64748B', margin: '0 0 22px', fontSize: 14 }}>{user?.email}</p>

        <div style={{ display: 'flex', gap: 7, marginBottom: 22, flexWrap: 'wrap' }}>
          {(['profile', 'addresses', 'password'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 16px', borderRadius: 20, border: '1px solid #E2E8F0', background: tab === t ? BLUE : '#fff', color: tab === t ? '#fff' : '#475569', textTransform: 'capitalize', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              {t === 'addresses' ? 'Addresses' : t}
            </button>
          ))}
        </div>

        {loading && <div style={{ color: '#64748B' }}>Loading…</div>}
        {error && <div style={{ color: '#B91C1C', marginBottom: 16 }}>{error}</div>}

        {!loading && profile && tab === 'profile'   && <ProfileTab token={token!} profile={profile} onSaved={setProfile} />}
        {!loading && profile && tab === 'addresses' && <AddressesTab token={token!} profile={profile} onChange={setProfile} />}
        {tab === 'password' && <PasswordTab />}
      </div>
    </div>
  )
}

function ProfileTab({ token, profile, onSaved }: { token: string; profile: CustomerProfile; onSaved: (p: CustomerProfile) => void }) {
  const [fullName, setFullName] = useState(profile.fullName ?? '')
  const [phone, setPhone] = useState(profile.phone ?? '')
  const [companyName, setCompanyName] = useState(profile.companyName ?? '')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const save = async () => {
    setSaving(true); setMsg('')
    try { onSaved(await updateCustomerProfile(token, { fullName, phone, companyName })); setMsg('Saved ✓') }
    catch (e: unknown) { setMsg(e instanceof Error ? e.message : 'Save failed') }
    finally { setSaving(false) }
  }

  return (
    <div style={card}>
      <label style={{ display: 'block', marginBottom: 14 }}><span style={label}>Full name</span><input style={input} value={fullName} onChange={e => setFullName(e.target.value)} /></label>
      <label style={{ display: 'block', marginBottom: 14 }}><span style={label}>Email</span><input style={{ ...input, background: '#F8FAFC', color: '#94A3B8' }} value={profile.email} disabled /></label>
      <label style={{ display: 'block', marginBottom: 14 }}><span style={label}>Phone</span><input style={input} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+971 5X XXX XXXX" /></label>
      <label style={{ display: 'block', marginBottom: 18 }}><span style={label}>Company (optional)</span><input style={input} value={companyName} onChange={e => setCompanyName(e.target.value)} /></label>
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
