import { useEffect, useState } from 'react'
import { AdminLayout, Table, Btn, SearchInput, Badge, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

interface Country { id: string; name: string }
interface Branch {
  id: string; name: string; address: string; contact: string | null
  isActive: boolean; createdAt: string
  country: Country
}

const inp: React.CSSProperties = {
  width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0',
  borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none',
}
const lbl = (t: string) => (
  <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 4, fontFamily: FONT }}>{t}</div>
)

function Modal({ item, countries, onClose, onSaved }: {
  item: Branch | null; countries: Country[]
  onClose: () => void; onSaved: () => void
}) {
  const [name, setName]         = useState(item?.name ?? '')
  const [address, setAddress]   = useState(item?.address ?? '')
  const [contact, setContact]   = useState(item?.contact ?? '')
  const [countryId, setCountry] = useState(item?.country?.id ?? countries[0]?.id ?? '')
  const [isActive, setActive]   = useState(item?.isActive ?? true)
  const [saving, setSaving]     = useState(false)
  const [err, setErr]           = useState('')

  const submit = async () => {
    if (!name.trim())    { setErr('Name is required'); return }
    if (!address.trim()) { setErr('Address is required'); return }
    if (!countryId)      { setErr('Country is required'); return }
    setSaving(true); setErr('')
    try {
      const body = { name: name.trim(), address: address.trim(), contact: contact.trim() || null, countryId, isActive }
      if (item) await api.patch(`/branches/${item.id}`, body)
      else      await api.post('/branches', body)
      onSaved(); onClose()
    } catch (e: any) {
      setErr(e?.response?.data?.error || 'Failed to save')
    } finally { setSaving(false) }
  }

  const ov: React.CSSProperties  = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }
  const box: React.CSSProperties = { background: '#fff', borderRadius: 16, width: 480, padding: 28, fontFamily: FONT }

  return (
    <div style={ov} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={box}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20, color: DARK }}>{item ? 'Edit Branch' : 'Add Branch'}</div>
        {err && <div style={{ background: '#FEF2F2', color: '#B91C1C', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{err}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label><div>{lbl('Branch Name *')}</div><input style={inp} value={name} onChange={e => setName(e.target.value)} placeholder="Dubai Mall Branch" /></label>
          <label><div>{lbl('Address *')}</div><textarea style={{ ...inp, height: 70, resize: 'vertical' }} value={address} onChange={e => setAddress(e.target.value)} placeholder="Unit 12, Dubai Mall, Sheikh Zayed Rd, Dubai" /></label>
          <label><div>{lbl('Contact (phone / email)')}</div><input style={inp} value={contact} onChange={e => setContact(e.target.value)} placeholder="+971 4 123 4567" /></label>
          <label>
            <div>{lbl('Country *')}</div>
            <select style={inp} value={countryId} onChange={e => setCountry(e.target.value)}>
              {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={isActive} onChange={e => setActive(e.target.checked)} />
            <span style={{ fontSize: 13, color: DARK }}>Active</span>
          </label>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
          <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', fontFamily: FONT, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: DARK, color: '#fff', fontFamily: FONT, fontSize: 13, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving…' : item ? 'Save Changes' : 'Add Branch'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function BranchesPage() {
  const [data, setData]         = useState<Branch[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [loading, setLoading]   = useState(true)
  const [q, setQ]               = useState('')
  const [modal, setModal]       = useState<Branch | null | 'new'>( null)

  const load = async () => {
    setLoading(true)
    try {
      const [br, co] = await Promise.all([
        api.get<{ data: Branch[] }>('/branches?pageSize=200'),
        api.get<{ data: Country[] }>('/countries?pageSize=200'),
      ])
      setData(br.data)
      setCountries(co.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = data.filter(r =>
    r.name.toLowerCase().includes(q.toLowerCase()) ||
    r.address.toLowerCase().includes(q.toLowerCase()) ||
    (r.contact ?? '').toLowerCase().includes(q.toLowerCase()) ||
    r.country.name.toLowerCase().includes(q.toLowerCase())
  )

  const rows = filtered.map(r => ({
    name:    r.name,
    country: r.country.name,
    address: r.address.length > 60 ? r.address.slice(0, 57) + '…' : r.address,
    contact: r.contact ?? '—',
    status:  <Badge label={r.isActive ? 'Active' : 'Inactive'} color={r.isActive ? '#10B981' : '#EF4444'} />,
    actions: <button onClick={e => { e.stopPropagation(); setModal(r) }} style={{ padding: '4px 10px', fontSize: 12, fontFamily: FONT, borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer' }}>Edit</button>,
  }))

  const COLS = [
    { key: 'name',    label: 'Branch Name', width: 200 },
    { key: 'country', label: 'Country',     width: 160 },
    { key: 'address', label: 'Address',     width: 300 },
    { key: 'contact', label: 'Contact',     width: 160 },
    { key: 'status',  label: 'Status',      width: 90  },
    { key: 'actions', label: '',            width: 70  },
  ]

  const active = data.filter(r => r.isActive).length

  return (
    <AdminLayout
      title="Branches"
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <SearchInput value={q} onChange={setQ} placeholder="Search name, address…" />
          <Btn label="+ Add Branch" onClick={() => setModal('new')} />
        </div>
      }
    >
      <StatGrid>
        <StatCard label="Total Branches" value={String(data.length)}   sub="All locations" />
        <StatCard label="Active"         value={String(active)}        sub="Currently operating" color="#10B981" />
        <StatCard label="Inactive"       value={String(data.length - active)} sub="Closed / paused" color="#EF4444" />
      </StatGrid>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
      ) : (
        <>
          <div style={{ fontSize: 13, color: '#64748B', marginBottom: 12, fontFamily: FONT }}>{filtered.length} branches</div>
          <Table columns={COLS} rows={rows} />
        </>
      )}

      {modal !== null && (
        <Modal
          item={modal === 'new' ? null : modal}
          countries={countries}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
    </AdminLayout>
  )
}
