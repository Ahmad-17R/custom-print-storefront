import React, { useEffect, useState } from 'react'
import { AdminLayout, Table, Btn, SearchInput, Badge, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'
interface Brand { id: string; name: string; companyId: string; isActive: boolean; createdAt: string }

const COLS = [
  { key: 'name',      label: 'Brand Name' },
  { key: 'isActive',  label: 'Status',   width: 100 },
  { key: 'createdAt', label: 'Created',  width: 130 },
  { key: 'actions',   label: '',         width: 80  },
]

function Modal({ brand, companyId, onClose, onSave }: { brand: Partial<Brand> | null; companyId: string; onClose: () => void; onSave: () => void }) {
  const [name, setName]   = useState(brand?.name ?? '')
  const [loading, setLoading] = useState(false)
  const [err, setErr]     = useState('')
  if (brand === null) return null

  const save = async () => {
    if (!name.trim()) return setErr('Name is required')
    setLoading(true)
    try {
      if (brand.id) await api.patch(`/brands/${brand.id}`, { name })
      else          await api.post('/brands', { name, companyId })
      onSave(); onClose()
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Error') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 400, fontFamily: FONT }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: DARK }}>{brand.id ? 'Edit Brand' : 'New Brand'}</h2>
        <label style={{ display: 'block', marginBottom: 20 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Brand Name *</span>
          <input value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }} />
        </label>
        {err && <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 12 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn label="Cancel" variant="secondary" onClick={onClose} />
          <Btn label={loading ? 'Saving…' : 'Save Brand'} onClick={save} />
        </div>
      </div>
    </div>
  )
}

export function BrandsPage() {
  const [data, setData]       = useState<Brand[]>([])
  const [companyId, setCompanyId] = useState('')
  const [loading, setLoading] = useState(true)
  const [q, setQ]             = useState('')
  const [modal, setModal]     = useState<Partial<Brand> | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [br, co] = await Promise.all([
        api.get<{ data: Brand[] }>('/brands?pageSize=100'),
        api.get<{ data: { id: string }[] }>('/companies?pageSize=1'),
      ])
      setData(br.data)
      if (co.data[0]) setCompanyId(co.data[0].id)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const remove = async (b: Brand) => {
    if (!window.confirm(`Permanently delete "${b.name}"? This cannot be undone.`)) return
    try { await api.delete(`/brands/${b.id}`); load() }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Delete failed') }
  }

  const toggleStatus = async (b: Brand) => {
    try { await api.patch(`/brands/${b.id}`, { isActive: !b.isActive }); load() }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Update failed') }
  }

  const filtered = data.filter(b => b.name.toLowerCase().includes(q.toLowerCase()))

  const btnBase: React.CSSProperties = { fontSize: 12, padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: FONT }

  const rows = filtered.map(b => ({
    ...b,
    isActive: <Badge label={b.isActive ? 'Enabled' : 'Disabled'} color={b.isActive ? '#10B981' : '#64748B'} />,
    createdAt: b.createdAt.slice(0, 10),
    actions: (
      <div style={{ display: 'flex', gap: 6 }}>
        {b.isActive
          ? <button onClick={() => setModal(b)} style={{ ...btnBase, border: '1px solid #E2E8F0', background: '#fff' }}>Edit</button>
          : <button onClick={() => toggleStatus(b)} style={{ ...btnBase, border: '1px solid #D1FAE5', background: '#ECFDF5', color: '#059669' }}>Enable</button>
        }
        {b.isActive && (
          <button onClick={() => toggleStatus(b)} style={{ ...btnBase, border: '1px solid #FED7AA', background: '#FFF7ED', color: '#EA580C' }}>Disable</button>
        )}
        <button onClick={() => remove(b)} style={{ ...btnBase, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626' }}>Delete</button>
      </div>
    ),
  }))

  return (
    <AdminLayout title="Brands" actions={<div style={{ display: 'flex', gap: 8 }}><SearchInput value={q} onChange={setQ} placeholder="Search brands…" /><Btn label="+ New Brand" onClick={() => setModal({})} /></div>}>
      <StatGrid>
        <StatCard label="Total Brands"  value={String(data.length)}                         sub="All brands" />
        <StatCard label="Enabled"       value={String(data.filter(b=>b.isActive).length)}   sub="Enabled brands"  color="#10B981" />
        <StatCard label="Disabled"      value={String(data.filter(b=>!b.isActive).length)}  sub="Disabled brands" color="#EF4444" />
      </StatGrid>
      {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
               : <Table columns={COLS} rows={rows} />}
      {modal !== null && <Modal brand={modal} companyId={companyId} onClose={() => setModal(null)} onSave={load} />}
    </AdminLayout>
  )
}
