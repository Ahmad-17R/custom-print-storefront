import React, { useEffect, useState } from 'react'
import { AdminLayout, Table, Btn, SearchInput, Badge, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'
const BRANCH_ID = '00000000-0000-0000-0000-000000000002'

interface Warehouse { id: string; name: string; branchId: string; isActive: boolean; createdAt: string }

const COLS = [
  { key: 'name',      label: 'Warehouse Name' },
  { key: 'isActive',  label: 'Status',  width: 100 },
  { key: 'createdAt', label: 'Created', width: 120 },
  { key: 'actions',   label: '',        width: 120 },
]

function Modal({ wh, onClose, onSave }: { wh: Partial<Warehouse> | null; onClose: () => void; onSave: () => void }) {
  const [name, setName]   = useState(wh?.name ?? '')
  const [loading, setLoading] = useState(false)
  const [err, setErr]     = useState('')
  if (wh === null) return null

  const save = async () => {
    if (!name.trim()) return setErr('Name is required')
    setLoading(true)
    try {
      if (wh.id) await api.patch(`/warehouses/${wh.id}`, { name })
      else       await api.post('/warehouses', { name, branchId: BRANCH_ID })
      onSave(); onClose()
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Error') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 400, fontFamily: FONT }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: DARK }}>{wh.id ? 'Edit Warehouse' : 'New Warehouse'}</h2>
        <label style={{ display: 'block', marginBottom: 20 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Warehouse Name *</span>
          <input value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }} />
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

  const remove = async (w: Warehouse) => {
    if (!window.confirm(`Permanently delete "${w.name}"? This cannot be undone.`)) return
    try { await api.delete(`/warehouses/${w.id}`); load() }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Delete failed') }
  }

  const toggleStatus = async (w: Warehouse) => {
    try { await api.patch(`/warehouses/${w.id}`, { isActive: !w.isActive }); load() }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Update failed') }
  }

  const filtered = data.filter(w => w.name.toLowerCase().includes(q.toLowerCase()))

  const btnBase: React.CSSProperties = { fontSize: 12, padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: FONT }

  const rows = filtered.map(w => ({
    ...w,
    isActive:  <Badge label={w.isActive ? 'Enabled' : 'Disabled'} color={w.isActive ? '#10B981' : '#64748B'} />,
    createdAt: w.createdAt.slice(0, 10),
    actions: (
      <div style={{ display: 'flex', gap: 6 }}>
        {w.isActive
          ? <button onClick={() => setModal(w)} style={{ ...btnBase, border: '1px solid #E2E8F0', background: '#fff' }}>Edit</button>
          : <button onClick={() => toggleStatus(w)} style={{ ...btnBase, border: '1px solid #D1FAE5', background: '#ECFDF5', color: '#059669' }}>Enable</button>
        }
        {w.isActive && (
          <button onClick={() => toggleStatus(w)} style={{ ...btnBase, border: '1px solid #FED7AA', background: '#FFF7ED', color: '#EA580C' }}>Disable</button>
        )}
        <button onClick={() => remove(w)} style={{ ...btnBase, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626' }}>Delete</button>
      </div>
    ),
  }))

  return (
    <AdminLayout title="Warehouses" actions={<div style={{ display: 'flex', gap: 8 }}><SearchInput value={q} onChange={setQ} placeholder="Search warehouses…" /><Btn label="+ New Warehouse" onClick={() => setModal({})} /></div>}>
      <StatGrid>
        <StatCard label="Total"    value={String(data.length)}                         sub="All warehouses" />
        <StatCard label="Enabled"  value={String(data.filter(w=>w.isActive).length)}   sub="In use"  color="#10B981" />
        <StatCard label="Disabled" value={String(data.filter(w=>!w.isActive).length)}  sub="Disabled" color="#EF4444" />
      </StatGrid>
      {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
               : <Table columns={COLS} rows={rows} />}
      {modal !== null && <Modal wh={modal} onClose={() => setModal(null)} onSave={load} />}
    </AdminLayout>
  )
}
