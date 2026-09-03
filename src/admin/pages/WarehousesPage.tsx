import React, { useEffect, useState } from 'react'
import { AdminLayout, Table, Btn, SearchInput, Badge, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

interface Warehouse {
  id: string; name: string; city: string | null; address: string | null
  contact: string | null; isActive: boolean; createdAt: string
}

const inp: React.CSSProperties = {
  width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0',
  borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none',
}
const lbl = (t: string) => (
  <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 4, fontFamily: FONT }}>{t}</div>
)

function Modal({ wh, onClose, onSave }: { wh: Partial<Warehouse> | null; onClose: () => void; onSave: () => void }) {
  const [name, setName]       = useState(wh?.name ?? '')
  const [city, setCity]       = useState(wh?.city ?? '')
  const [address, setAddress] = useState(wh?.address ?? '')
  const [contact, setContact] = useState(wh?.contact ?? '')
  const [loading, setLoading] = useState(false)
  const [err, setErr]         = useState('')
  if (wh === null) return null

  const save = async () => {
    if (!name.trim()) return setErr('Name is required')
    setLoading(true); setErr('')
    try {
      const body = {
        name: name.trim(),
        city: city.trim() || null,
        address: address.trim() || null,
        contact: contact.trim() || null,
      }
      if (wh.id) await api.patch(`/warehouses/${wh.id}`, body)
      else       await api.post('/warehouses', body)
      onSave(); onClose()
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Error') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 480, fontFamily: FONT }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: DARK }}>{wh.id ? 'Edit Warehouse / Branch' : 'New Warehouse / Branch'}</h2>
        {err && <div style={{ background: '#FEF2F2', color: '#B91C1C', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{err}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label><div>{lbl('Name *')}</div><input style={inp} value={name} onChange={e => setName(e.target.value)} placeholder="Dubai Mall" /></label>
          <label><div>{lbl('City')}</div><input style={inp} value={city} onChange={e => setCity(e.target.value)} placeholder="Dubai" /></label>
          <label><div>{lbl('Address')}</div><textarea style={{ ...inp, height: 60, resize: 'vertical' }} value={address} onChange={e => setAddress(e.target.value)} placeholder="Unit 12, Dubai Mall, Sheikh Zayed Rd" /></label>
          <label><div>{lbl('Contact (phone / email)')}</div><input style={inp} value={contact} onChange={e => setContact(e.target.value)} placeholder="+971 4 123 4567" /></label>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
          <Btn label="Cancel" variant="secondary" onClick={onClose} />
          <Btn label={loading ? 'Saving…' : 'Save'} onClick={save} />
        </div>
      </div>
    </div>
  )
}

export function WarehousesPage() {
  const [data, setData]   = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ]         = useState('')
  const [modal, setModal] = useState<Partial<Warehouse> | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get<{ data: Warehouse[] }>('/warehouses?pageSize=100')
      setData(res.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const toggleStatus = async (w: Warehouse) => {
    try { await api.patch(`/warehouses/${w.id}`, { isActive: !w.isActive }); load() }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Update failed') }
  }

  const filtered = data.filter(w =>
    w.name.toLowerCase().includes(q.toLowerCase()) ||
    (w.city ?? '').toLowerCase().includes(q.toLowerCase()) ||
    (w.address ?? '').toLowerCase().includes(q.toLowerCase())
  )

  const btnBase: React.CSSProperties = { fontSize: 12, padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: FONT }

  const COLS = [
    { key: 'name',    label: 'Name',    width: 200 },
    { key: 'city',    label: 'City',    width: 130 },
    { key: 'address', label: 'Address', width: 260 },
    { key: 'contact', label: 'Contact', width: 150 },
    { key: 'status',  label: 'Status',  width: 90  },
    { key: 'actions', label: '',        width: 140 },
  ]

  const rows = filtered.map(w => ({
    name:    w.name,
    city:    w.city ?? '—',
    address: w.address ? (w.address.length > 45 ? w.address.slice(0, 42) + '…' : w.address) : '—',
    contact: w.contact ?? '—',
    status:  <Badge label={w.isActive ? 'Active' : 'Inactive'} color={w.isActive ? '#10B981' : '#64748B'} />,
    actions: (
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => setModal(w)} style={{ ...btnBase, border: '1px solid #E2E8F0', background: '#fff' }}>Edit</button>
        <button onClick={() => toggleStatus(w)} style={{ ...btnBase, border: '1px solid #FED7AA', background: '#FFF7ED', color: '#EA580C' }}>
          {w.isActive ? 'Disable' : 'Enable'}
        </button>
      </div>
    ),
  }))

  return (
    <AdminLayout
      title="Warehouses / Branches"
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <SearchInput value={q} onChange={setQ} placeholder="Search name, city…" />
          <Btn label="+ New Location" onClick={() => setModal({})} />
        </div>
      }
    >
      <StatGrid>
        <StatCard label="Total Locations" value={String(data.length)}                        sub="All warehouses / branches" />
        <StatCard label="Active"          value={String(data.filter(w => w.isActive).length)} sub="Currently operating" color="#10B981" />
        <StatCard label="Inactive"        value={String(data.filter(w => !w.isActive).length)} sub="Disabled" color="#EF4444" />
      </StatGrid>
      {loading
        ? <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
        : <Table columns={COLS} rows={rows} />
      }
      {modal !== null && <Modal wh={modal} onClose={() => setModal(null)} onSave={load} />}
    </AdminLayout>
  )
}
