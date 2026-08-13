import React, { useEffect, useState } from 'react'
import { AdminLayout, Table, Btn, SearchInput, Badge, StatCard, StatGrid } from '../components/AdminLayout'
import { useAdminCountry } from '../context/AdminCountryContext'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'
interface Country { id: string; name: string; code: string; isActive: boolean; createdAt: string }

const COLS = [
  { key: 'code',      label: 'Code',    width: 80  },
  { key: 'name',      label: 'Country Name' },
  { key: 'isActive',  label: 'Status',  width: 100 },
  { key: 'createdAt', label: 'Created', width: 120 },
  { key: 'actions',   label: '',        width: 120 },
]

function Modal({ country, companyId, onClose, onSave }: { country: Partial<Country> | null; companyId: string; onClose: () => void; onSave: () => void }) {
  const [name, setName]   = useState(country?.name ?? '')
  const [code, setCode]   = useState(country?.code ?? '')
  const [loading, setLoading] = useState(false)
  const [err, setErr]     = useState('')
  if (country === null) return null

  const save = async () => {
    if (!name.trim() || !code.trim()) return setErr('Name and code are required')
    if (!/^[A-Z]{2}$/.test(code)) return setErr('Code must be 2 uppercase letters (e.g. AE)')
    if (!companyId) return setErr('Company not loaded yet, please wait and try again')
    setLoading(true)
    try {
      if (country.id) await api.patch(`/countries/${country.id}`, { name, code })
      else            await api.post('/countries', { name, code, companyId })
      onSave(); onClose()
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Error') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 420, fontFamily: FONT, maxWidth: "calc(100vw - 32px)", boxSizing: "border-box" as const }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: DARK }}>{country.id ? 'Edit Country' : 'New Country'}</h2>
        <label style={{ display: 'block', marginBottom: 14 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Country Name *</span>
          <input value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }} />
        </label>
        <label style={{ display: 'block', marginBottom: 20 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>ISO Code * (2 uppercase letters)</span>
          <input value={code} onChange={e => setCode(e.target.value.toUpperCase().slice(0,2))} maxLength={2} style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }} />
        </label>
        {err && <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 12 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn label="Cancel" variant="secondary" onClick={onClose} />
          <Btn label={loading ? 'Saving…' : 'Save'} onClick={save} />
        </div>
      </div>
    </div>
  )
}

export function CountriesPage() {
  const { country: activeCountry, setCountry: setActiveCountry } = useAdminCountry()
  const [data, setData]       = useState<Country[]>([])
  const [companyId, setCompanyId] = useState('')
  const [loading, setLoading] = useState(true)
  const [q, setQ]             = useState('')
  const [modal, setModal]     = useState<Partial<Country> | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [cr, co] = await Promise.all([
        api.get<{ data: Country[] }>('/countries?pageSize=200'),
        api.get<{ data: { id: string }[] }>('/companies?pageSize=1'),
      ])
      setData(cr.data)
      if (co.data[0]) setCompanyId(co.data[0].id)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const remove = async (c: Country) => {
    if (!window.confirm(`Permanently delete "${c.name}"? This cannot be undone.`)) return
    try { await api.delete(`/countries/${c.id}`); load() }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Delete failed') }
  }

  const toggleStatus = async (c: Country) => {
    try { await api.patch(`/countries/${c.id}`, { isActive: !c.isActive }); load() }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Update failed') }
  }

  const filtered = data.filter(c =>
    c.name.toLowerCase().includes(q.toLowerCase()) || c.code.toLowerCase().includes(q.toLowerCase())
  )

  const btnBase: React.CSSProperties = { fontSize: 12, padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: FONT }

  const rows = filtered.map(c => ({
    ...c,
    isActive:  <Badge label={c.isActive ? 'Enabled' : 'Disabled'} color={c.isActive ? '#10B981' : '#64748B'} />,
    createdAt: c.createdAt.slice(0, 10),
    actions: (
      <div style={{ display: 'flex', gap: 6 }}>
        {activeCountry?.id === c.id
          ? <span style={{ ...btnBase, background: '#EFF6FF', color: '#1D4ED8', fontWeight: 600, border: '1px solid #BFDBFE' }}>✓ Active</span>
          : <button onClick={() => setActiveCountry(c)} style={{ ...btnBase, border: '1px solid #BFDBFE', background: '#EFF6FF', color: '#1D4ED8' }}>Set Active</button>
        }
        {c.isActive
          ? <button onClick={() => setModal(c)} style={{ ...btnBase, border: '1px solid #E2E8F0', background: '#fff' }}>Edit</button>
          : <button onClick={() => toggleStatus(c)} style={{ ...btnBase, border: '1px solid #D1FAE5', background: '#ECFDF5', color: '#059669' }}>Enable</button>
        }
        {c.isActive && (
          <button onClick={() => toggleStatus(c)} style={{ ...btnBase, border: '1px solid #FED7AA', background: '#FFF7ED', color: '#EA580C' }}>Disable</button>
        )}
        <button onClick={() => remove(c)} style={{ ...btnBase, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626' }}>Delete</button>
      </div>
    ),
  }))

  return (
    <AdminLayout title="Countries" actions={<div style={{ display: 'flex', gap: 8 }}><SearchInput value={q} onChange={setQ} placeholder="Search countries…" /><Btn label="+ New Country" onClick={() => setModal({})} /></div>}>
      <StatGrid>
        <StatCard label="Total"    value={String(data.length)}                        sub="All countries" />
        <StatCard label="Enabled"  value={String(data.filter(c=>c.isActive).length)}  sub="Enabled countries"  color="#10B981" />
        <StatCard label="Disabled" value={String(data.filter(c=>!c.isActive).length)} sub="Disabled countries" color="#EF4444" />
      </StatGrid>
      {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
               : <Table columns={COLS} rows={rows} />}
      {modal !== null && <Modal country={modal} companyId={companyId} onClose={() => setModal(null)} onSave={load} />}
    </AdminLayout>
  )
}
